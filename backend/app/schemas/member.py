from typing import Literal

from pydantic import BaseModel, EmailStr, Field, SecretStr, model_validator

from app.schemas.auth import CurrentUserResponse
from app.schemas.pagination import Page


class MemberCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100,
        examples=["Ali Raza"],
    )
    email: EmailStr = Field(
        examples=["ali@example.com"],
    )
    password: SecretStr = Field(
        min_length=8,
        max_length=128,
        examples=["StrongPass123!"],
    )


class MemberUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    role: Literal["owner", "member"] | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def require_a_value(self) -> "MemberUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")
        if any(
            getattr(self, field) is None
            for field in self.model_fields_set
        ):
            raise ValueError("Member fields cannot be null.")
        return self


class MemberPage(Page[CurrentUserResponse]):
    pass
