from typing import Annotated

from fastapi import Query


class PaginationParams:
    def __init__(
        self,
        page: Annotated[
            int,
            Query(ge=1, description="One-based page number."),
        ] = 1,
        size: Annotated[
            int,
            Query(
                ge=1,
                le=100,
                description="Records per page.",
            ),
        ] = 20,
    ) -> None:
        self.page = page
        self.size = size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size
