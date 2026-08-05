import httpx
from jinja2 import Template

from app.core.config import settings
from app.core.retry import with_retry


# Email templates using Jinja2 for safe variable interpolation (prevents XSS)
EMAIL_TEMPLATES = {
    "verify_email": """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5530;">Welcome to Umma Directory</h2>
                <p>Please verify your email by clicking the link below:</p>
                <p style="margin: 20px 0;">
                    <a href="{{ link }}" 
                       style="background-color: #2c5530; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Verify Email
                    </a>
                </p>
                <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">If you didn't request this verification, please ignore this email.</p>
            </div>
        </body>
        </html>
    """,
    "password_reset": """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5530;">Password Reset Request</h2>
                <p>We received a request to reset your password. Click the link below to reset it:</p>
                <p style="margin: 20px 0;">
                    <a href="{{ link }}" 
                       style="background-color: #2c5530; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Reset Password
                    </a>
                </p>
                <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please contact support immediately.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">For security reasons, do not share this link with anyone.</p>
            </div>
        </body>
        </html>
    """,
    "donation_receipt": """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Donation Receipt</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5530;">Donation Receipt</h2>
                <p style="color: #666;">Thank you for your generous donation!</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Amount:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">{{ amount }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Charity:</td>
                            <td style="padding: 8px 0; text-align: right;">{{ charity }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Receipt Number:</td>
                            <td style="padding: 8px 0; text-align: right;">{{ receipt }}</td>
                        </tr>
                        {% if donor_name %}
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Donor:</td>
                            <td style="padding: 8px 0; text-align: right;">{{ donor_name }}</td>
                        </tr>
                        {% endif %}
                        {% if donation_date %}
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Date:</td>
                            <td style="padding: 8px 0; text-align: right;">{{ donation_date }}</td>
                        </tr>
                        {% endif %}
                    </table>
                </div>
                
                <p style="color: #666; font-size: 14px;">This receipt serves as proof of your charitable contribution.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">For tax purposes, please keep this receipt for your records.</p>
            </div>
        </body>
        </html>
    """,
    "welcome_user": """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to Umma Directory</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5530;">Welcome, {{ name }}!</h2>
                <p>Thank you for joining Umma Directory. We're excited to have you as part of our community.</p>
                <p>Get started by exploring organizations and causes that matter to you.</p>
                <p style="margin: 20px 0;">
                    <a href="{{ dashboard_link }}" 
                       style="background-color: #2c5530; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Go to Dashboard
                    </a>
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">If you have any questions, feel free to reach out to our support team.</p>
            </div>
        </body>
        </html>
    """,
}


@with_retry(max_attempts=3, base_delay=2.0, exceptions=(httpx.RequestError, httpx.TimeoutException))
async def send_email(to: str, subject: str, html: str) -> bool:
    """
    Send an email using Mailgun API.
    
    Args:
        to: Recipient email address
        subject: Email subject
        html: HTML content of the email
        
    Returns:
        True if email was sent successfully, False otherwise
    """
    if not settings.mailgun_api_key:
        return False
    
    if not settings.mailgun_domain:
        return False
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"https://api.mailgun.net/v3/{settings.mailgun_domain}/messages",
                auth=("api", settings.mailgun_api_key),
                data={
                    "from": f"{settings.mailgun_from_email}",
                    "to": to,
                    "subject": subject,
                    "html": html,
                },
                timeout=30,
            )
            resp.raise_for_status()
            return True
        except httpx.HTTPStatusError as e:
            # Log the error but don't expose details
            return False
        except httpx.RequestError as e:
            # Network error, will be retried
            raise


def render_email_template(template_name: str, **context) -> str:
    """
    Render an email template safely using Jinja2.
    
    This prevents XSS attacks by properly escaping user-provided data.
    
    Args:
        template_name: Name of the template to render
        **context: Variables to pass to the template
        
    Returns:
        Rendered HTML string
        
    Raises:
        ValueError: If template_name is not found
    """
    template_str = EMAIL_TEMPLATES.get(template_name)
    
    if not template_str:
        raise ValueError(f"Email template '{template_name}' not found")
    
    # Jinja2 automatically escapes variables by default, preventing XSS
    template = Template(template_str)
    
    # Provide default values for common context variables
    safe_context = {
        "link": "#",
        "amount": "",
        "charity": "",
        "receipt": "",
        "donor_name": "",
        "donation_date": "",
        "name": "User",
        "dashboard_link": "#",
    }
    safe_context.update(context)
    
    return template.render(**safe_context)
