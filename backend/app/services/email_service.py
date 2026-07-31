import httpx

from app.core.config import settings
from app.core.retry import with_retry


@with_retry(max_attempts=3, base_delay=2.0, exceptions=(httpx.RequestError, httpx.TimeoutException))
async def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.mailgun_api_key:
        return False
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.mailgun.net/v3/{settings.mailgun_domain}/messages",
            auth=("api", settings.mailgun_api_key),
            data={
                "from": settings.mailgun_from_email,
                "to": to,
                "subject": subject,
                "html": html,
            },
            timeout=30,
        )
        return resp.is_success


def render_email_template(template_name: str, **kwargs) -> str:
    templates = {
        "verify_email": f"""
            <h2>Welcome to Umma Directory</h2>
            <p>Please verify your email by clicking the link below:</p>
            <p><a href="{kwargs.get("link", "#")}">Verify Email</a></p>
            <p>This link expires in 24 hours.</p>
        """,
        "password_reset": f"""
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <p><a href="{kwargs.get("link", "#")}">Reset Password</a></p>
            <p>This link expires in 1 hour.</p>
        """,
        "donation_receipt": f"""
            <h2>Donation Receipt</h2>
            <p>Amount: {kwargs.get("amount", "")}</p>
            <p>Charity: {kwargs.get("charity", "")}</p>
            <p>Receipt: {kwargs.get("receipt", "")}</p>
        """,
    }
    return templates.get(template_name, "")
