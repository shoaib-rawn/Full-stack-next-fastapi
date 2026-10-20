from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    service: str = Field(examples=["ledgerlite-api"])


class ReadinessResponse(HealthResponse):
    checks: dict[str, str] = Field(
        examples=[
            {
                "database": "ok",
                "redis": "ok",
            }
        ]
    )
