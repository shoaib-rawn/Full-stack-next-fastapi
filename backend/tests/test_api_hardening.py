"""Bad input must get a clear 4xx, never a 500 or a misleading error."""

from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.db.redis import get_redis_client
from app.db.session import async_session_factory, engine
from app.main import app
from app.models.organization import Organization


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, int | str] = {}

    async def get(self, key: str) -> str | None:
        value = self.values.get(key)
        return str(value) if value is not None else None

    async def incr(self, key: str) -> int:
        value = int(self.values.get(key, 0)) + 1
        self.values[key] = value
        return value

    async def expire(self, key: str, seconds: int) -> bool:
        return True

    async def ttl(self, key: str) -> int:
        return -1

    async def delete(self, key: str) -> int:
        return int(self.values.pop(key, None) is not None)

    async def set(self, key: str, value: str, ex: int | None = None) -> bool:
        self.values[key] = value
        return True

    async def ping(self) -> bool:
        return True


@pytest.fixture
async def owner():
    """A fresh organization owner; the organization is removed afterwards."""
    unique = uuid4().hex
    slug = f"hardening-{unique}"
    email = f"hardening-{unique}@example.com"
    password = "TemporaryPass123!"
    fake_redis = FakeRedis()

    async def override_redis():
        yield fake_redis

    app.dependency_overrides[get_redis_client] = override_redis

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            signup = await client.post(
                "/auth/signup",
                json={
                    "organization": {"name": "Hardening", "slug": slug},
                    "full_name": "Hardening Owner",
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
            headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
            yield client, headers
    finally:
        app.dependency_overrides.pop(get_redis_client, None)
        async with async_session_factory() as session:
            organization = await session.scalar(
                select(Organization).where(Organization.slug == slug)
            )
            if organization is not None:
                await session.delete(organization)
                await session.commit()
        # Each test runs on its own event loop; drop pooled connections so the
        # next test does not reuse a connection bound to a closed loop.
        await engine.dispose()


INT4_OVERFLOW = 2_147_483_648


async def test_out_of_range_ids_are_rejected_not_500(owner) -> None:
    client, headers = owner

    for path in (
        f"/customers/{INT4_OVERFLOW}",
        f"/invoices/{INT4_OVERFLOW}",
        f"/invoices/{INT4_OVERFLOW}/payments",
    ):
        response = await client.get(path, headers=headers)
        assert response.status_code == 422, path

    # Members have no GET-by-id route; PATCH carries the id.
    member = await client.patch(
        f"/members/{INT4_OVERFLOW}",
        json={"is_active": True},
        headers=headers,
    )
    assert member.status_code == 422

    huge_page = await client.get(
        "/customers?page=99999999999999999999",
        headers=headers,
    )
    assert huge_page.status_code == 422

    invoice = await client.post(
        "/invoices",
        json={
            "customer_id": INT4_OVERFLOW,
            "line_items": [
                {"description": "Item", "quantity": "1.00", "unit_price": "1.00"}
            ],
        },
        headers=headers,
    )
    assert invoice.status_code == 422


async def test_invoice_amount_overflow_is_rejected_not_500(owner) -> None:
    client, headers = owner
    customer = await client.post(
        "/customers",
        json={"display_name": "Big Spender"},
        headers=headers,
    )
    assert customer.status_code == 201

    response = await client.post(
        "/invoices",
        json={
            "customer_id": customer.json()["id"],
            "line_items": [
                {
                    "description": "Too big",
                    "quantity": "9999999999.99",
                    "unit_price": "999999999999.99",
                }
            ],
        },
        headers=headers,
    )
    assert response.status_code == 422
    assert "too large" in response.json()["detail"].lower()

    # Just inside the limit still works.
    fits = await client.post(
        "/invoices",
        json={
            "customer_id": customer.json()["id"],
            "line_items": [
                {
                    "description": "Largest allowed",
                    "quantity": "1.00",
                    "unit_price": "999999999999.99",
                }
            ],
        },
        headers=headers,
    )
    assert fits.status_code == 201
    assert fits.json()["total"] == "999999999999.99"


async def test_customer_update_rejects_null_and_empty_payloads(owner) -> None:
    client, headers = owner
    customer = await client.post(
        "/customers",
        json={"display_name": "Null Guard", "email": "null-guard@example.com"},
        headers=headers,
    )
    customer_id = customer.json()["id"]

    for payload in ({"display_name": None}, {"is_active": None}, {}):
        response = await client.patch(
            f"/customers/{customer_id}",
            json=payload,
            headers=headers,
        )
        assert response.status_code == 422, payload

    # Clearing the optional email is still allowed.
    cleared = await client.patch(
        f"/customers/{customer_id}",
        json={"email": None},
        headers=headers,
    )
    assert cleared.status_code == 200
    assert cleared.json()["email"] is None


async def test_customer_email_is_unique_regardless_of_case(owner) -> None:
    client, headers = owner
    first = await client.post(
        "/customers",
        json={"display_name": "Case One", "email": "Case.Mixed@Example.com"},
        headers=headers,
    )
    assert first.status_code == 201
    assert first.json()["email"] == "case.mixed@example.com"

    duplicate = await client.post(
        "/customers",
        json={"display_name": "Case Two", "email": "CASE.MIXED@example.COM"},
        headers=headers,
    )
    assert duplicate.status_code == 409


async def test_customer_search_treats_wildcards_literally(owner) -> None:
    client, headers = owner
    for name in ("Plain Shop", "Hundred % Deals", "Under_Score Ltd"):
        created = await client.post(
            "/customers",
            json={"display_name": name},
            headers=headers,
        )
        assert created.status_code == 201

    percent = await client.get("/customers?search=%25", headers=headers)
    assert percent.status_code == 200
    assert [c["display_name"] for c in percent.json()["items"]] == [
        "Hundred % Deals"
    ]

    underscore = await client.get("/customers?search=_", headers=headers)
    assert [c["display_name"] for c in underscore.json()["items"]] == [
        "Under_Score Ltd"
    ]
