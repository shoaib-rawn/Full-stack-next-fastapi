from typing import Annotated

from fastapi import Path

from app.core.limits import DB_ID_MAX


DbId = Annotated[
    int,
    Path(gt=0, le=DB_ID_MAX, description="Record id."),
]
