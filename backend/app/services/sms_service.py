"""
SMS sending abstraction layer.
Supports multiple providers: log (dev), Twilio, Africa's Talking.
"""

import logging
from abc import ABC, abstractmethod

from app.core.config import settings

logger = logging.getLogger("ummah.sms")


class SMSProvider(ABC):
    @abstractmethod
    async def send(self, to: str, message: str) -> bool: ...


class LogSMSProvider(SMSProvider):
    """Log messages to console — used in dev/test environments."""

    async def send(self, to: str, message: str) -> bool:
        logger.info(f"[SMS] To: {to} | Body: {message}")
        return True


class TwilioSMSProvider(SMSProvider):
    async def send(self, to: str, message: str) -> bool:
        try:
            from twilio.rest import Client

            client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
            client.messages.create(
                body=message,
                from_=settings.twilio_phone_number,
                to=to,
            )
            return True
        except Exception as e:
            logger.error(f"Twilio SMS failed to {to}: {e}")
            return False


class AfricaTalkingSMSProvider(SMSProvider):
    async def send(self, to: str, message: str) -> bool:
        try:
            import africastalking

            africastalking.initialize(
                settings.africastalking_username,
                settings.africastalking_api_key,
            )
            sms = africastalking.SMS
            response = sms.send(message, [to])
            logger.info(f"Africa's Talking response: {response}")
            return True
        except Exception as e:
            logger.error(f"Africa's Talking SMS failed to {to}: {e}")
            return False


def get_sms_provider() -> SMSProvider:
    provider_map: dict[str, type[LogSMSProvider | TwilioSMSProvider | AfricaTalkingSMSProvider]] = {
        "log": LogSMSProvider,
        "twilio": TwilioSMSProvider,
        "africastalking": AfricaTalkingSMSProvider,
    }
    cls = provider_map.get(settings.sms_provider, LogSMSProvider)
    return cls()


async def send_sms(to: str, message: str) -> bool:
    provider = get_sms_provider()
    return await provider.send(to, message)
