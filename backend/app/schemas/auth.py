from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
)

from app.schemas.organization import OrganizationCreate


class SignupRequest(BaseModel):
    organization: OrganizationCreate = Field(
        description="The first organization created for this account.",
    )
    full_name: str = Field(
        min_length=2,
        max_length=100,
        description="Full name of the organization owner.",
        examples=["Shoaib Hassan"],
    )
    email: EmailStr = Field(
        description="Unique login email.",
        examples=["shoaib@example.com"],
    )
    password: SecretStr = Field(
        min_length=8,
        max_length=128,
        description="Password with at least 8 characters.",
        examples=["StrongPass123!"],
    )


class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["shoaib@example.com"])
    password: SecretStr = Field(examples=["StrongPass123!"])


class RefreshTokenRequest(BaseModel):
    refresh_token: SecretStr = Field(
        description="Refresh token returned by the login endpoint.",
        examples=["paste-refresh-token-here"],
    )


class LogoutRequest(BaseModel):
    refresh_token: SecretStr = Field(
        description="The current session's refresh token.",
        examples=["paste-refresh-token-here"],
    )


class TokenResponse(BaseModel):
    access_token: str = Field(
        examples=["eyJhbGciOiJIUzI1NiJ9.access-token"]
    )
    refresh_token: str = Field(
        examples=["eyJhbGciOiJIUzI1NiJ9.refresh-token"]
    )
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(
        gt=0,
        description="Access-token lifetime in seconds.",
        examples=[7200],
    )


class CurrentUserResponse(BaseModel):
    id: int = Field(examples=[1])
    organization_id: int = Field(examples=[1])
    full_name: str = Field(examples=["Shoaib Hassan"])
    email: EmailStr = Field(examples=["shoaib@example.com"])
    role: str = Field(examples=["owner"])
    is_active: bool = Field(examples=[True])
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
