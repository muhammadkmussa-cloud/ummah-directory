from __future__ import annotations

import re

from pydantic import BaseModel

PASSWORD_REQUIREMENTS = {
    "min_length": 12,
    "uppercase": True,
    "lowercase": True,
    "digit": True,
    "special": True,
}


def validate_password_strength(password: str) -> str:
    if len(password) < PASSWORD_REQUIREMENTS["min_length"]:
        raise ValueError(
            f"Password must be at least {PASSWORD_REQUIREMENTS['min_length']} characters"
        )
    if PASSWORD_REQUIREMENTS["uppercase"] and not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain an uppercase letter")
    if PASSWORD_REQUIREMENTS["lowercase"] and not re.search(r"[a-z]", password):
        raise ValueError("Password must contain a lowercase letter")
    if PASSWORD_REQUIREMENTS["digit"] and not re.search(r"\d", password):
        raise ValueError("Password must contain a number")
    if PASSWORD_REQUIREMENTS["special"] and not re.search(
        r"[!@#$%^&*(),.?:{}|<>_~`\-=+\[\]\\;'\"\/]", password
    ):
        raise ValueError("Password must contain a special character")
    return password


class MessageResponse(BaseModel):
    message: str


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    size: int
    pages: int
