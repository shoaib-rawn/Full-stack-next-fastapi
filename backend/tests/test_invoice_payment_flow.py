import asyncio
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.db.redis import get_redis_client
from app.db.session import async_session_factory
from app.main import app
from app.models.organization import Organization


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, int | str] = {}
        self.ttls: dict[str, int] = {}

    async def get(self, key: str) -> str | None:
        value = self.values.get(key)
        return str(value) if value is not None else None

    async def incr(self, key: str) -> int:
        value = int(self.values.get(key, 0)) + 1
        self.values[key] = value
        return value

    async def expire(self, key: str, seconds: int) -> bool:
        self.ttls[key] = seconds
        return True

    async def ttl(self, key: str) -> int:
        return self.ttls.get(key, -1)

    async def delete(self, key: str) -> int:
        existed = int(key in self.values)
        self.values.pop(key, None)
        self.ttls.pop(key, None)
        return existed

    async def set(self, key: str, value: str, ex: int | None = None) -> bool:
        self.values[key] = value
        if ex is not None:
            self.ttls[key] = ex
        return True

    async def ping(self) -> bool:
        return True


@pytest.mark.asyncio
async def test_invoice_number_search_payment_and_reversal_flow() -> None:
    unique = uuid4().hex
    password = "TemporaryPass123!"
    slug_a = f"invoice-flow-a-{unique}"
    slug_b = f"invoice-flow-b-{unique}"
    email_a = f"invoice-owner-a-{unique}@example.com"
    email_b = f"invoice-owner-b-{unique}@example.com"
    member_email = f"invoice-member-{unique}@example.com"
    fake_redis = FakeRedis()

    async def override_redis():
        yield fake_redis

    async def remove_test_organizations() -> None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Organization).where(Organization.slug.in_([slug_a, slug_b]))
            )
            for organization in result.scalars().all():
                await session.delete(organization)
            await session.commit()

    async def signup_and_login(
        client: AsyncClient,
        name: str,
        slug: str,
        email: str,
    ) -> dict[str, str]:
        signup = await client.post(
            "/auth/signup",
            json={
                "organization": {"name": name, "slug": slug},
                "full_name": f"{name} Owner",
                "email": email,
                "password": password,
            },
        )
        assert signup.status_code == 201
        login = await client.post(
            "/auth/login",
            json={"email": email, "password": password},
        )
        assert login.status_code == 200
        return {"Authorization": f"Bearer {login.json()['access_token']}"}

    app.dependency_overrides[get_redis_client] = override_redis

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            headers_a = await signup_and_login(
                client, "Invoice Tenant A", slug_a, email_a
            )
            headers_b = await signup_and_login(
                client, "Invoice Tenant B", slug_b, email_b
            )

            alpha = await client.post(
                "/customers",
                json={"display_name": "Alpha Garden", "email": "alpha@example.com"},
                headers=headers_a,
            )
            beta = await client.post(
                "/customers",
                json={"display_name": "Beta Store", "email": "beta@example.com"},
                headers=headers_a,
            )
            assert alpha.status_code == 201
            assert beta.status_code == 201

            search = await client.get(
                "/customers?search=alpha&page=1&size=100",
                headers=headers_a,
            )
            assert search.status_code == 200
            assert search.json()["total"] == 1
            assert search.json()["items"][0]["display_name"] == "Alpha Garden"

            invoice_payload = {
                "customer_id": alpha.json()["id"],
                "currency": "PKR",
                "tax_rate": "10.00",
                "line_items": [
                    {
                        "description": "Consulting",
                        "quantity": "2.00",
                        "unit_price": "50.00",
                    }
                ],
            }
            first = await client.post(
                "/invoices", json=invoice_payload, headers=headers_a
            )
            second = await client.post(
                "/invoices", json=invoice_payload, headers=headers_a
            )
            assert first.status_code == 201
            assert second.status_code == 201
            assert first.json()["invoice_number"].endswith("-0001")
            assert second.json()["invoice_number"].endswith("-0002")
            assert first.json()["total"] == "110.00"

            summary_a = await client.get("/reports/summary", headers=headers_a)
            assert summary_a.status_code == 200
            assert summary_a.json()["total_customers"] == 2
            assert summary_a.json()["total_invoices"] == 2
            assert summary_a.json()["issued_invoices"] == 2
            assert summary_a.json()["currency_totals"] == [
                {
                    "currency": "PKR",
                    "total_invoiced": "220.00",
                    "total_paid": "0.00",
                    "total_outstanding": "220.00",
                }
            ]

            summary_b = await client.get("/reports/summary", headers=headers_b)
            assert summary_b.status_code == 200
            assert summary_b.json()["total_customers"] == 0
            assert summary_b.json()["total_invoices"] == 0
            assert summary_b.json()["currency_totals"] == []

            customer_filter = await client.get(
                f"/invoices?customer_id={alpha.json()['id']}&page=1&size=10",
                headers=headers_a,
            )
            assert customer_filter.status_code == 200
            assert customer_filter.json()["total"] == 2

            empty_status_filter = await client.get(
                "/invoices?status=paid&page=1&size=10",
                headers=headers_a,
            )
            assert empty_status_filter.status_code == 200
            assert empty_status_filter.json()["total"] == 0

            invoice_id = first.json()["id"]
            hidden_from_tenant_b = await client.get(
                f"/invoices/{invoice_id}", headers=headers_b
            )
            assert hidden_from_tenant_b.status_code == 404

            payment = await client.post(
                f"/invoices/{invoice_id}/payments",
                json={
                    "amount": "25.00",
                    "method": "bank_transfer",
                    "reference": "TEST-001",
                },
                headers=headers_a,
            )
            assert payment.status_code == 201
            assert payment.json()["invoice_status"] == "partially_paid"
            assert payment.json()["balance_due"] == "85.00"

            overpayment = await client.post(
                f"/invoices/{invoice_id}/payments",
                json={"amount": "1000.00", "method": "cash"},
                headers=headers_a,
            )
            assert overpayment.status_code == 409

            member = await client.post(
                "/members",
                json={
                    "full_name": "Invoice Member",
                    "email": member_email,
                    "password": password,
                },
                headers=headers_a,
            )
            assert member.status_code == 201
            member_login = await client.post(
                "/auth/login",
                json={"email": member_email, "password": password},
            )
            member_headers = {
                "Authorization": f"Bearer {member_login.json()['access_token']}"
            }
            payment_id = payment.json()["payment"]["id"]
            member_reverse = await client.post(
                f"/payments/{payment_id}/reverse",
                json={"reason": "Member cannot reverse"},
                headers=member_headers,
            )
            assert member_reverse.status_code == 403

            reversal = await client.post(
                f"/payments/{payment_id}/reverse",
                json={"reason": "Bank transfer returned"},
                headers=headers_a,
            )
            assert reversal.status_code == 200
            assert reversal.json()["invoice_status"] == "issued"
            assert reversal.json()["balance_due"] == "110.00"
            assert reversal.json()["payment"]["reversed_at"] is not None

            duplicate_reversal = await client.post(
                f"/payments/{payment_id}/reverse",
                json={"reason": "Again"},
                headers=headers_a,
            )
            assert duplicate_reversal.status_code == 409

            payment_list = await client.get(
                f"/invoices/{invoice_id}/payments?page=1&size=50",
                headers=headers_a,
            )
            assert payment_list.status_code == 200
            assert payment_list.json()["total"] == 1
            assert payment_list.json()["items"][0]["reversal_reason"] == (
                "Bank transfer returned"
            )

            assert payment_list.json()["items"][0]["reversed_by_user_id"] is not None

            void_without_reason = await client.post(
                f"/invoices/{invoice_id}/void", headers=headers_a
            )
            assert void_without_reason.status_code == 422

            voided = await client.post(
                f"/invoices/{invoice_id}/void",
                headers=headers_a,
                json={"reason": "Issued to the wrong customer"},
            )
            assert voided.status_code == 200
            assert voided.json()["status"] == "void"
            assert voided.json()["balance_due"] == "0.00"
            assert voided.json()["void_reason"] == "Issued to the wrong customer"
            assert voided.json()["voided_at"] is not None
            assert voided.json()["voided_by_user_id"] is not None

            void_again = await client.post(
                f"/invoices/{invoice_id}/void",
                headers=headers_a,
                json={"reason": "Second attempt"},
            )
            assert void_again.status_code == 409

            # A void and a payment sent at the same moment: the invoice row
            # lock lets only one win, so a void invoice never holds money.
            race_id = second.json()["id"]
            race_void, race_payment = await asyncio.gather(
                client.post(
                    f"/invoices/{race_id}/void",
                    headers=headers_a,
                    json={"reason": "Race check"},
                ),
                client.post(
                    f"/invoices/{race_id}/payments",
                    headers=headers_a,
                    json={"amount": "10.00", "method": "cash"},
                ),
            )
            assert sorted([race_void.status_code, race_payment.status_code]) in (
                [200, 409],
                [201, 409],
            )
            race_invoice = (
                await client.get(f"/invoices/{race_id}", headers=headers_a)
            ).json()
            if race_invoice["status"] == "void":
                assert race_invoice["amount_paid"] == "0.00"
            else:
                assert race_invoice["amount_paid"] == "10.00"
    finally:
        app.dependency_overrides.pop(get_redis_client, None)
        await remove_test_organizations()
