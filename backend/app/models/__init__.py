from __future__ import annotations

from app.core.database import Base
from app.models.ad_campaign import AdCampaign
from app.models.ad_analytics import AdAnalytics
from app.models.advertisement import Advertisement
from app.models.analytics import AnalyticsEvent
from app.models.audit import AuditLog
from app.models.base import BaseModelMixin
from app.models.organization import Organization, OrganizationManager, OrganizationInvitation
from app.models.business import Business, BusinessBranch, Category, OwnershipClaim
from app.models.charity import Charity, CharityCampaign, CharityReport
from app.models.permission import Permission, role_permissions
from app.models.cms import BlogPost, CMSBanner, CMSPage
from app.models.donation import Donation
from app.models.education import EducationalInstitution
from app.models.event import Event
from app.models.favorite import Favorite, FavoriteCollection
from app.models.mfa import MFAConfig
from app.models.media import MediaFile

from app.models.mosque import Mosque
from app.models.notification import Notification, NotificationPreference
from app.models.prayer_subscription import MosquePrayerSubscription
from app.models.payment import Payment
from app.models.premier import PremierSubscription
from app.models.report import Report
from app.models.review import Review, ReviewReply
from app.models.saved_payment_method import SavedPaymentMethod
from app.models.user import Role, User
from app.models.verification import VerificationDocument
from app.models.post import OrganizationPost, PostLike

# Ensure all models are loaded
