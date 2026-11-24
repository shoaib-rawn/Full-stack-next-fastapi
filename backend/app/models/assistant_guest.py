from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class AssistantGuest(TimestampMixin, Base):
    __tablename__ = "assistant_guests"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    session_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    session_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
