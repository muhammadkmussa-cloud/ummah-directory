from __future__ import annotations

import re

import email_validator
from pydantic import BaseModel, field_validator

from app.schemas.common import PASSWORD_REQUIREMENTS, validate_password_strength
from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    phone: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        try:
            email_validator.validate_email(v, test_environment=True)
        except email_validator.EmailNotValidError:
            raise ValueError("Invalid email address")
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        try:
            email_validator.validate_email(v, test_environment=True)
        except email_validator.EmailNotValidError:
            raise ValueError("Invalid email address")
        return v.lower().strip()


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str


class EmailVerificationRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)


class PhoneVerificationRequest(BaseModel):
    phone: str


class PhoneVerificationConfirmRequest(BaseModel):
    phone: str
    code: str
