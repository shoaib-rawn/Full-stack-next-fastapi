from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)


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

    # Emails are case-insensitive; store one form so uniqueness holds.
    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str | None) -> str | None:
        return value.lower() if value is not None else None


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

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str | None) -> str | None:
        return value.lower() if value is not None else None

    @model_validator(mode="after")
    def reject_empty_and_null(self) -> "CustomerUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")
        # Only the optional email may be cleared with null.
        if any(
            getattr(self, field) is None
            for field in self.model_fields_set - {"email"}
        ):
            raise ValueError("Only email can be null.")
        return self


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
