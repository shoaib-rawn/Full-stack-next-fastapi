from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreate(BaseModel):
    display_name: str = Field(
        min_length=2,
        max_length=100,
        description="Customer name shown in the application.",
        examples=["Ali Raza"],
    )
    email: EmailStr | None = Field(
        default=None,
        description=(
            "Optional customer email; unique inside "
            "the authenticated organization."
        ),
        examples=["ali@example.com"],
    )


class CustomerUpdate(BaseModel):
    display_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
        examples=["Ali Raza Updated"],
    )
    email: EmailStr | None = Field(
        default=None,
        examples=["ali.updated@example.com"],
    )
    is_active: bool | None = Field(
        default=None,
        examples=[True],
    )


class CustomerResponse(BaseModel):
    id: int = Field(examples=[1])
    organization_id: int = Field(examples=[1])
    display_name: str = Field(examples=["Ali Raza"])
    email: EmailStr | None = Field(examples=["ali@example.com"])
    is_active: bool = Field(examples=[True])
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
