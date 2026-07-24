from app.payments.base import PaymentEvent, PaymentGateway, PaymentIntent
from app.payments.mpesa_gateway import MpesaGateway
from app.payments.paypal_gateway import PayPalGateway
from app.payments.stripe_gateway import StripeGateway


def get_gateway(name: str) -> PaymentGateway:
    gateways = {
        "stripe": StripeGateway(),
        "paypal": PayPalGateway(),
        "mpesa": MpesaGateway(),
    }
    if name not in gateways:
        raise ValueError(f"Unknown payment gateway: {name}")
    return gateways[name]
