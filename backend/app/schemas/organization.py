from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class OrganizationCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
        description="Public name of the organization.",
        examples=["Logic Powered"],
    )

    slug: str = Field(
        min_length=2,
        max_length=100,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description="Unique URL-friendly name using lowercase letters, numbers and hyphens.",
        examples=["logic-powered"],
    )


class OrganizationResponse(OrganizationCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class OrganizationUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
        examples=["Logic Powered Solutions"],
    )
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        examples=["logic-powered-solutions"],
    )

    @model_validator(mode="after")
    def require_a_value(self) -> "OrganizationUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")
        if any(
            getattr(self, field) is None
            for field in self.model_fields_set
        ):
            raise ValueError("Organization fields cannot be null.")
        return self
