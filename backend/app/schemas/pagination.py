from math import ceil
from typing import Generic, TypeVar

from pydantic import BaseModel, Field


ItemT = TypeVar("ItemT")


class Page(BaseModel, Generic[ItemT]):
    items: list[ItemT]
    page: int = Field(ge=1)
    size: int = Field(ge=1)
    total: int = Field(ge=0)
    pages: int = Field(ge=0)

    @classmethod
    def create(
        cls,
        *,
        items: list[ItemT],
        page: int,
        size: int,
        total: int,
    ) -> "Page[ItemT]":
        return cls(
            items=items,
            page=page,
            size=size,
            total=total,
            pages=ceil(total / size) if total else 0,
        )
