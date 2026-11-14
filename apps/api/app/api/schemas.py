"""Standard API request/response schemas."""

from typing import Any

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Any | None = None


class ApiResponse[T](BaseModel):
    success: bool = True
    data: T | None = None
    message: str | None = None
    error: ErrorDetail | None = None


class PaginatedData[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
