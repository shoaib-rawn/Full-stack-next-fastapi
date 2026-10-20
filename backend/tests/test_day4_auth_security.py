from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from httpx import ASGITransport, AsyncClient
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from sqlalchemy import select

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.db.redis import get_redis_client
from app.db.session import async_session_factory, engine
from app.main import app
from app.models.organization import Organization
from app.models.refresh_token import RefreshToken
from app.models.user import User


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, int | str] = {}
        self.ttls: dict[str, int] = {}

    async def get(self, key: str) -> str | None:
        value = self.values.get(key)
        return str(value) if value is not None else None

    async def incr(self, key: str) -> int:
        value = self.values.get(key, 0) + 1
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

    async def set(
        self,
        key: str,
        value: str,
        ex: int | None = None,
    ) -> bool:
        self.values[key] = value
        if ex is not None:
            self.ttls[key] = ex
        return True

    async def ping(self) -> bool:
        return True


@pytest.mark.asyncio
async def test_local_nextjs_origin_is_allowed_by_cors() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.options(
            "/auth/login",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:3000"
    )
    assert "authorization" in response.headers[
        "access-control-allow-headers"
    ].lower()


def test_access_token_has_two_hour_lifetime_and_rejects_tampering() -> None:
    token = create_access_token(
        user_id=42,
        organization_id=7,
        role="owner",
    )
    payload = decode_access_token(token)

    assert payload["exp"] - payload["iat"] == 7200
    assert payload["type"] == "access"

    parts = token.split(".")
    replacement = "A" if parts[2][0] != "A" else "B"
    parts[2] = replacement + parts[2][1:]

    with pytest.raises(InvalidTokenError):
        decode_access_token(".".join(parts))


def test_expired_access_token_is_rejected() -> None:
    issued_at = datetime.now(timezone.utc) - timedelta(hours=2)
    expired_at = datetime.now(timezone.utc) - timedelta(hours=1)
    token = jwt.encode(
        {
            "sub": "42",
            "organization_id": 7,
            "role": "owner",
            "token_version": 0,
            "type": "access",
            "iat": issued_at,
            "exp": expired_at,
            "jti": str(uuid4()),
        },
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )

    with pytest.raises(ExpiredSignatureError):
        decode_access_token(token)


@pytest.mark.asyncio
async def test_auth_tenant_isolation_and_refresh_reuse_protection() -> None:
    unique = uuid4().hex
    password = "TemporaryPass123!"
    slug_a = f"pytest-tenant-a-{unique}"
    slug_b = f"pytest-tenant-b-{unique}"
    email_a = f"pytest-tenant-a-{unique}@example.com"
    email_b = f"pytest-tenant-b-{unique}@example.com"
    member_email = f"pytest-member-{unique}@example.com"

    async def signup_and_login(
        client: AsyncClient,
        name: str,
        slug: str,
        email: str,
    ) -> tuple[dict[str, object], dict[str, object]]:
        signup_response = await client.post(
            "/auth/signup",
            json={
                "organization": {"name": name, "slug": slug},
                "full_name": f"{name} Owner",
                "email": email,
                "password": password,
            },
        )
        login_response = await client.post(
            "/auth/login",
            json={"email": email, "password": password},
        )

        assert signup_response.status_code == 201
        assert login_response.status_code == 200
        return signup_response.json(), login_response.json()

    async def remove_test_organizations() -> None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Organization).where(
                    Organization.slug.in_([slug_a, slug_b])
                )
            )
            for organization in result.scalars().all():
                await session.delete(organization)
            await session.commit()

    transport = ASGITransport(app=app)
    fake_redis = FakeRedis()

    async def override_redis():
        yield fake_redis

    app.dependency_overrides[get_redis_client] = override_redis

    try:
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:
            signup_a, login_a = await signup_and_login(
                client, "Pytest Tenant A", slug_a, email_a
            )
            signup_b, login_b = await signup_and_login(
                client, "Pytest Tenant B", slug_b, email_b
            )

            access_a = login_a["access_token"]
            access_b = login_b["access_token"]
            refresh_a = login_a["refresh_token"]
            refresh_b = login_b["refresh_token"]
            headers_a = {"Authorization": f"Bearer {access_a}"}
            headers_b = {"Authorization": f"Bearer {access_b}"}

            me_response = await client.get("/auth/me", headers=headers_a)
            missing_token_response = await client.get("/auth/me")
            assert me_response.status_code == 200
            assert me_response.json()["email"] == email_a
            assert missing_token_response.status_code == 401
            assert "X-Request-ID" in me_response.headers

            readiness = await client.get("/health/ready")
            assert readiness.status_code == 200
            assert readiness.json()["checks"] == {
                "database": "ok",
                "redis": "ok",
            }

            organization_a = await client.get(
                "/organizations/current",
                headers=headers_a,
            )
            organization_b = await client.get(
                "/organizations/current",
                headers=headers_b,
            )
            organization_missing_token = await client.get(
                "/organizations/current"
            )
            assert organization_a.status_code == 200
            assert organization_b.status_code == 200
            assert (
                organization_a.json()["id"]
                == signup_a["organization_id"]
            )
            assert (
                organization_b.json()["id"]
                == signup_b["organization_id"]
            )
            assert organization_missing_token.status_code == 401

            update_organization = await client.patch(
                "/organizations/current",
                json={"name": "Updated Pytest Tenant A"},
                headers=headers_a,
            )
            duplicate_organization_slug = await client.patch(
                "/organizations/current",
                json={"slug": slug_b},
                headers=headers_a,
            )
            assert update_organization.status_code == 200
            assert update_organization.json()["name"] == "Updated Pytest Tenant A"
            assert duplicate_organization_slug.status_code == 409

            create_member = await client.post(
                "/members",
                json={
                    "full_name": "Pytest Member",
                    "email": member_email,
                    "password": password,
                },
                headers=headers_a,
            )
            assert create_member.status_code == 201
            member = create_member.json()
            assert member["role"] == "member"

            member_login = await client.post(
                "/auth/login",
                json={
                    "email": member_email,
                    "password": password,
                },
            )
            assert member_login.status_code == 200
            member_headers = {
                "Authorization": (
                    f"Bearer {member_login.json()['access_token']}"
                )
            }
            member_list_forbidden = await client.get(
                "/members",
                headers=member_headers,
            )
            member_org_update_forbidden = await client.patch(
                "/organizations/current",
                json={"name": "Forbidden member update"},
                headers=member_headers,
            )
            owner_member_list = await client.get(
                "/members?page=1&size=1",
                headers=headers_a,
            )
            update_member = await client.patch(
                f"/members/{member['id']}",
                json={"full_name": "Updated Pytest Member"},
                headers=headers_a,
            )
            self_demote = await client.patch(
                f"/members/{signup_a['id']}",
                json={"role": "member"},
                headers=headers_a,
            )
            assert member_list_forbidden.status_code == 403
            assert member_org_update_forbidden.status_code == 403
            assert owner_member_list.status_code == 200
            assert owner_member_list.json()["total"] == 2
            assert owner_member_list.json()["size"] == 1
            assert owner_member_list.json()["pages"] == 2
            assert update_member.status_code == 200
            assert update_member.json()["full_name"] == "Updated Pytest Member"
            assert self_demote.status_code == 409

            create_a = await client.post(
                "/customers",
                json={
                    "display_name": "Customer A",
                    "email": f"customer-a-{unique}@example.com",
                },
                headers=headers_a,
            )
            create_b = await client.post(
                "/customers",
                json={
                    "display_name": "Customer B",
                    "email": f"customer-b-{unique}@example.com",
                },
                headers=headers_b,
            )
            assert create_a.status_code == 201
            assert create_b.status_code == 201

            customer_a = create_a.json()
            customer_b = create_b.json()
            assert customer_a["organization_id"] == signup_a["organization_id"]
            assert customer_b["organization_id"] == signup_b["organization_id"]

            member_can_read_customers = await client.get(
                "/customers",
                headers=member_headers,
            )
            member_cannot_delete = await client.delete(
                f"/customers/{customer_a['id']}",
                headers=member_headers,
            )
            assert member_can_read_customers.status_code == 200
            assert member_cannot_delete.status_code == 403

            list_a = await client.get("/customers", headers=headers_a)
            list_b = await client.get("/customers", headers=headers_b)
            assert [item["id"] for item in list_a.json()["items"]] == [customer_a["id"]]
            assert [item["id"] for item in list_b.json()["items"]] == [customer_b["id"]]
            assert list_a.json()["total"] == 1
            assert list_a.json()["pages"] == 1

            cross_get = await client.get(
                f"/customers/{customer_b['id']}", headers=headers_a
            )
            cross_patch = await client.patch(
                f"/customers/{customer_b['id']}",
                json={"display_name": "Cross-tenant update"},
                headers=headers_a,
            )
            cross_delete = await client.delete(
                f"/customers/{customer_b['id']}", headers=headers_a
            )
            assert cross_get.status_code == 404
            assert cross_patch.status_code == 404
            assert cross_delete.status_code == 404

            owner_b_get = await client.get(
                f"/customers/{customer_b['id']}", headers=headers_b
            )
            assert owner_b_get.status_code == 200

            invoice_payload = {
                "customer_id": customer_a["id"],
                "currency": "PKR",
                "tax_rate": "10.00",
                "line_items": [
                    {
                        "description": "Development",
                        "quantity": "2.00",
                        "unit_price": "10.50",
                    },
                    {
                        "description": "Hosting",
                        "quantity": "1.00",
                        "unit_price": "5.00",
                    },
                ],
            }
            create_invoice = await client.post(
                "/invoices",
                json=invoice_payload,
                headers=headers_a,
            )
            assert create_invoice.status_code == 201
            invoice = create_invoice.json()
            assert invoice["invoice_number"].endswith("-0001")
            assert invoice["subtotal"] == "26.00"
            assert invoice["tax_amount"] == "2.60"
            assert invoice["total"] == "28.60"
            assert invoice["balance_due"] == "28.60"
            assert [
                item["line_total"] for item in invoice["line_items"]
            ] == ["21.00", "5.00"]

            update_invoice = await client.patch(
                f"/invoices/{invoice['id']}",
                json={
                    "tax_rate": "20.00",
                    "notes": "Updated before payment.",
                    "line_items": [
                        {
                            "description": "Revised development scope",
                            "quantity": "3.00",
                            "unit_price": "10.00",
                        }
                    ],
                },
                headers=headers_a,
            )
            cross_update_invoice = await client.patch(
                f"/invoices/{invoice['id']}",
                json={"notes": "Cross-tenant update."},
                headers=headers_b,
            )
            assert update_invoice.status_code == 200
            invoice = update_invoice.json()
            assert invoice["subtotal"] == "30.00"
            assert invoice["tax_amount"] == "6.00"
            assert invoice["total"] == "36.00"
            assert invoice["balance_due"] == "36.00"
            assert invoice["notes"] == "Updated before payment."
            assert len(invoice["line_items"]) == 1
            assert invoice["line_items"][0]["line_total"] == "30.00"
            assert cross_update_invoice.status_code == 404

            delete_invoiced_customer = await client.delete(
                f"/customers/{customer_a['id']}",
                headers=headers_a,
            )
            assert delete_invoiced_customer.status_code == 409

            second_invoice = await client.post(
                "/invoices",
                json=invoice_payload,
                headers=headers_a,
            )
            wrong_tenant_customer = await client.post(
                "/invoices",
                json={
                    **invoice_payload,
                    "customer_id": customer_b["id"],
                },
                headers=headers_a,
            )
            cross_invoice_get = await client.get(
                f"/invoices/{invoice['id']}",
                headers=headers_b,
            )
            list_invoices_a = await client.get(
                "/invoices",
                headers=headers_a,
            )
            list_invoices_b = await client.get(
                "/invoices",
                headers=headers_b,
            )
            assert second_invoice.status_code == 201
            assert second_invoice.json()["invoice_number"].endswith("-0002")
            assert wrong_tenant_customer.status_code == 404
            assert cross_invoice_get.status_code == 404
            assert [
                item["id"] for item in list_invoices_a.json()["items"]
            ] == [second_invoice.json()["id"], invoice["id"]]
            assert list_invoices_b.json()["items"] == []

            void_candidate = await client.post(
                "/invoices",
                json=invoice_payload,
                headers=headers_a,
            )
            assert void_candidate.status_code == 201
            assert void_candidate.json()["invoice_number"].endswith("-0003")
            member_void_forbidden = await client.post(
                f"/invoices/{void_candidate.json()['id']}/void",
                headers=member_headers,
            )
            voided_invoice = await client.post(
                f"/invoices/{void_candidate.json()['id']}/void",
                headers=headers_a,
            )
            repeat_void = await client.post(
                f"/invoices/{void_candidate.json()['id']}/void",
                headers=headers_a,
            )
            payment_on_void = await client.post(
                f"/invoices/{void_candidate.json()['id']}/payments",
                json={"amount": "1.00", "method": "cash"},
                headers=headers_a,
            )
            assert voided_invoice.status_code == 200
            assert member_void_forbidden.status_code == 403
            assert voided_invoice.json()["status"] == "void"
            assert voided_invoice.json()["balance_due"] == "0.00"
            assert repeat_void.status_code == 409
            assert payment_on_void.status_code == 409

            partial_payment = await client.post(
                f"/invoices/{invoice['id']}/payments",
                json={
                    "amount": "10.00",
                    "method": "bank_transfer",
                    "reference": "TEST-PAY-1",
                },
                headers=headers_a,
            )
            cross_tenant_payment = await client.post(
                f"/invoices/{invoice['id']}/payments",
                json={"amount": "1.00", "method": "cash"},
                headers=headers_b,
            )
            assert partial_payment.status_code == 201
            assert partial_payment.json()["invoice_status"] == "partially_paid"
            assert partial_payment.json()["amount_paid"] == "10.00"
            assert partial_payment.json()["balance_due"] == "26.00"
            assert cross_tenant_payment.status_code == 404

            update_after_payment = await client.patch(
                f"/invoices/{invoice['id']}",
                json={"notes": "Must not update."},
                headers=headers_a,
            )
            void_after_payment = await client.post(
                f"/invoices/{invoice['id']}/void",
                headers=headers_a,
            )
            assert update_after_payment.status_code == 409
            assert void_after_payment.status_code == 409

            final_payment = await client.post(
                f"/invoices/{invoice['id']}/payments",
                json={"amount": "26.00", "method": "cash"},
                headers=headers_a,
            )
            payment_after_paid = await client.post(
                f"/invoices/{invoice['id']}/payments",
                json={"amount": "1.00", "method": "cash"},
                headers=headers_a,
            )
            payment_list = await client.get(
                f"/invoices/{invoice['id']}/payments",
                headers=headers_a,
            )
            assert final_payment.status_code == 201
            assert final_payment.json()["invoice_status"] == "paid"
            assert final_payment.json()["balance_due"] == "0.00"
            assert payment_after_paid.status_code == 409

            final_payment_id = final_payment.json()["payment"]["id"]
            member_reversal_forbidden = await client.post(
                f"/payments/{final_payment_id}/reverse",
                json={"reason": "Member cannot reverse"},
                headers=member_headers,
            )
            cross_tenant_reversal = await client.post(
                f"/payments/{final_payment_id}/reverse",
                json={"reason": "Cross-tenant attempt"},
                headers=headers_b,
            )
            reverse_final_payment = await client.post(
                f"/payments/{final_payment_id}/reverse",
                json={"reason": "Cash entry correction"},
                headers=headers_a,
            )
            repeat_reversal = await client.post(
                f"/payments/{final_payment_id}/reverse",
                json={"reason": "Repeat reversal"},
                headers=headers_a,
            )
            assert cross_tenant_reversal.status_code == 404
            assert member_reversal_forbidden.status_code == 403
            assert reverse_final_payment.status_code == 200
            assert reverse_final_payment.json()["invoice_status"] == "partially_paid"
            assert reverse_final_payment.json()["amount_paid"] == "10.00"
            assert reverse_final_payment.json()["balance_due"] == "26.00"
            assert reverse_final_payment.json()["payment"]["reversed_at"] is not None
            assert (
                reverse_final_payment.json()["payment"]["reversal_reason"]
                == "Cash entry correction"
            )
            assert repeat_reversal.status_code == 409
            assert payment_list.status_code == 200
            assert len(payment_list.json()["items"]) == 2

            payment_list_after_reversal = await client.get(
                f"/invoices/{invoice['id']}/payments",
                headers=headers_a,
            )
            assert payment_list_after_reversal.status_code == 200
            assert payment_list_after_reversal.json()["items"][1]["reversed_at"] is not None

            limited_email = f"rate-limit-{unique}@example.com"
            failed_statuses = []
            for _ in range(settings.login_rate_limit_attempts):
                response = await client.post(
                    "/auth/login",
                    json={
                        "email": limited_email,
                        "password": "WrongPass123!",
                    },
                )
                failed_statuses.append(response.status_code)

            blocked_login = await client.post(
                "/auth/login",
                json={
                    "email": limited_email,
                    "password": "WrongPass123!",
                },
            )
            assert failed_statuses == [401] * settings.login_rate_limit_attempts
            assert blocked_login.status_code == 429
            assert "Retry-After" in blocked_login.headers

            rotate = await client.post(
                "/auth/refresh",
                json={"refresh_token": refresh_a},
            )
            assert rotate.status_code == 200
            new_refresh = rotate.json()["refresh_token"]
            assert new_refresh != refresh_a

            reused_old = await client.post(
                "/auth/refresh",
                json={"refresh_token": refresh_a},
            )
            new_after_reuse = await client.post(
                "/auth/refresh",
                json={"refresh_token": new_refresh},
            )
            assert reused_old.status_code == 401
            assert new_after_reuse.status_code == 401

            async with async_session_factory() as session:
                user_a_id = await session.scalar(
                    select(User.id).where(User.email == email_a)
                )
                result = await session.execute(
                    select(RefreshToken).where(
                        RefreshToken.user_id == user_a_id
                    )
                )
                records = list(result.scalars().all())

            assert len(records) == 2
            assert all(len(record.token_hash) == 64 for record in records)
            assert all(record.revoked_at is not None for record in records)
            assert all(
                record.token_hash not in {refresh_a, new_refresh}
                for record in records
            )

            logout_b = await client.post(
                "/auth/logout",
                json={"refresh_token": refresh_b},
                headers=headers_b,
            )
            access_b_after_logout = await client.get(
                "/auth/me",
                headers=headers_b,
            )
            refresh_b_after_logout = await client.post(
                "/auth/refresh",
                json={"refresh_token": refresh_b},
            )
            assert logout_b.status_code == 204
            assert access_b_after_logout.status_code == 401
            assert refresh_b_after_logout.status_code == 401

            fresh_login_a = await client.post(
                "/auth/login",
                json={"email": email_a, "password": password},
            )
            assert fresh_login_a.status_code == 200
            fresh_access_a = fresh_login_a.json()["access_token"]
            fresh_refresh_a = fresh_login_a.json()["refresh_token"]
            second_device_login_a = await client.post(
                "/auth/login",
                json={"email": email_a, "password": password},
            )
            assert second_device_login_a.status_code == 200
            second_device_headers_a = {
                "Authorization": (
                    "Bearer "
                    f"{second_device_login_a.json()['access_token']}"
                )
            }
            second_device_refresh_a = (
                second_device_login_a.json()["refresh_token"]
            )
            fresh_headers_a = {
                "Authorization": f"Bearer {fresh_access_a}"
            }
            logout_all_a = await client.post(
                "/auth/logout-all",
                headers=fresh_headers_a,
            )
            access_a_after_logout_all = await client.get(
                "/auth/me",
                headers=fresh_headers_a,
            )
            second_device_after_logout_all = await client.get(
                "/auth/me",
                headers=second_device_headers_a,
            )
            refresh_a_after_logout_all = await client.post(
                "/auth/refresh",
                json={"refresh_token": fresh_refresh_a},
            )
            second_refresh_after_logout_all = await client.post(
                "/auth/refresh",
                json={"refresh_token": second_device_refresh_a},
            )
            assert logout_all_a.status_code == 204
            assert access_a_after_logout_all.status_code == 401
            assert second_device_after_logout_all.status_code == 401
            assert refresh_a_after_logout_all.status_code == 401
            assert second_refresh_after_logout_all.status_code == 401
    finally:
        app.dependency_overrides.pop(get_redis_client, None)
        await remove_test_organizations()
        await engine.dispose()
