from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    app_debug: bool = False
    app_secret_key: str = ""
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    database_url: str = ""
    redis_url: str = "redis://redis:6379/0"

    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_recycle: int = 3600
    db_pool_timeout: int = 30
    db_pool_pre_ping: bool = True

    jwt_secret_key: str = ""
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    mailgun_api_key: str = ""
    mailgun_domain: str = ""
    mailgun_from_email: str = "noreply@example.com"

    s3_endpoint: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_bucket_name: str = "umma-directory-uploads"
    s3_region: str = "fsn1"

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_publishable_key: str = ""

    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    paypal_webhook_id: str = ""
    paypal_mode: str = "sandbox"

    mpesa_consumer_key: str = ""
    mpesa_consumer_secret: str = ""
    mpesa_passkey: str = ""
    mpesa_business_shortcode: str = "174379"
    mpesa_callback_url: str = ""
    mpesa_environment: str = "sandbox"
    mpesa_webhook_secret: str = ""

    sms_provider: str = "log"  # log, twilio, africastalking
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    africastalking_username: str = ""
    africastalking_api_key: str = ""

    min_donation_amount: float = 10.0
    donation_currencies: str = "KES,USD,EUR,GBP"

    sentry_dsn: str = ""

    # Web Push (VAPID) — workflows.md #25 push notifications channel.
    # Generate with: `npx web-push generate-vapid-keys` or `py_vapid` .
    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_subject_email: str = ""

    frontend_url: str = "http://localhost:5173"
    allowed_hosts: str = "*"

    @property
    def donation_currency_list(self) -> list[str]:
        return [c.strip() for c in self.donation_currencies.split(",")]

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def allowed_host_list(self) -> list[str]:
        return [h.strip() for h in self.allowed_hosts.split(",")]

    def validate_secrets(self):
        errors = []
        if not self.app_secret_key or self.app_secret_key == "change-me":
            errors.append("APP_SECRET_KEY must be set to a secure random value")
        if not self.jwt_secret_key or self.jwt_secret_key == "change-me":
            errors.append("JWT_SECRET_KEY must be set to a secure random value")
        if not self.database_url:
            errors.append("DATABASE_URL must be set")
        if self.app_env == "production" and (
            "*" in self.allowed_host_list or not self.allowed_host_list
        ):
            errors.append(
                "ALLOWED_HOSTS must be set to explicit host(s) in production "
                "(the wildcard '*' disables TrustedHost validation)"
            )
        if errors:
            raise RuntimeError(
                "Configuration errors:\n  "
                + "\n  ".join(errors)
                + "\n\nSet these values in your .env file or environment."
            )


settings = Settings()
if settings.app_env != "test":
    settings.validate_secrets()
