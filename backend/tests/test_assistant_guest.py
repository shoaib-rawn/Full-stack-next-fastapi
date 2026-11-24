from uuid import uuid4

from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.db.redis import get_redis_client
from app.db.session import async_session_factory, engine
from app.main import app
from app.models.assistant_guest import AssistantGuest


class FakeRedis:
    def __init__(self) -> None:
        self.counts: dict[str, int] = {}

    async def incr(self, key: str) -> int:
        self.counts[key] = self.counts.get(key, 0) + 1
        return self.counts[key]

    async def expire(self, key: str, seconds: int) -> bool:
        return True

    async def ttl(self, key: str) -> int:
        return 3600


async def test_guest_details_are_saved_and_chat_requires_limited_session() -> None:
    email = f"guest-{uuid4().hex}@example.com"
    fake_redis = FakeRedis()

    async def override_redis():
        yield fake_redis

    app.dependency_overrides[get_redis_client] = override_redis
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            invalid = await client.post(
                "/assistant/guests",
                json={"full_name": "Guest Person", "email": email, "phone": "abc"},
            )
            assert invalid.status_code == 422

            created = await client.post(
                "/assistant/guests",
                json={"full_name": "Guest Person", "email": email, "phone": "+923467201683"},
            )
            assert created.status_code == 201
            token = created.json()["session_token"]
            assert "Guest Person" not in created.text

            async with async_session_factory() as session:
                saved = await session.scalar(select(AssistantGuest).where(AssistantGuest.email == email))
                assert saved is not None
                assert saved.full_name == "Guest Person"
                assert saved.phone == "+923467201683"
                assert saved.session_hash != token

            assert (await client.get("/assistant/guest-session")).status_code == 401
            headers = {"Authorization": f"Bearer {token}"}
            assert (await client.get("/assistant/guest-session", headers=headers)).status_code == 200
            for _ in range(20):
                assert (await client.post("/assistant/guest-session/consume", headers=headers)).status_code == 200
            assert (await client.post("/assistant/guest-session/consume", headers=headers)).status_code == 429
            assert (await client.delete("/assistant/guest-session", headers=headers)).status_code == 204
            assert (await client.get("/assistant/guest-session", headers=headers)).status_code == 401
    finally:
        app.dependency_overrides.pop(get_redis_client, None)
        async with async_session_factory() as session:
            saved = await session.scalar(select(AssistantGuest).where(AssistantGuest.email == email))
            if saved is not None:
                await session.delete(saved)
                await session.commit()
        await engine.dispose()
