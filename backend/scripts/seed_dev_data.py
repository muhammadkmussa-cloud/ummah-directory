"""Comprehensive development seed data for Umma Directory Platform.

Creates:
- 10 Registered Users
- 5 Moderators
- 1 Super Administrator
- 10 Organizations across all polymorphic types
- Reviews, ratings, favorites, events, notifications, ads, donations
- CMS content, analytics, verification documents

Idempotent - safe to re-run.
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta, UTC

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.user import Role, User
from app.models.permission import Permission, role_permissions
from app.models.business import Business, Category, BusinessBranch
from app.models.mosque import Mosque
from app.models.charity import Charity, CharityCampaign
from app.models.education import EducationalInstitution
from app.models.organization import Organization, OrganizationManager
from app.models.review import Review, ReviewReply
from app.models.favorite import Favorite
from app.models.event import Event
from app.models.notification import Notification, NotificationPreference
from app.models.ad_campaign import AdCampaign
from app.models.advertisement import Advertisement
from app.models.donation import Donation
from app.models.analytics import AnalyticsEvent
from app.models.verification import VerificationDocument
from app.models.media import MediaFile
from app.models.cms import CMSPage, CMSBanner, BlogPost
from app.models.report import Report
from app.models.post import OrganizationPost
from app.models.payment import PaymentProvider
from app.models.premier import PremierSubscription

PERMISSION_DEFINITIONS = [
    ("super_admin", "Super Administrator", "Unrestricted system access"),
    ("users.view", "View Users", "View user profiles"),
    ("users.create", "Create Users", "Create new user accounts"),
    ("users.edit", "Edit Users", "Modify user profiles and roles"),
    ("users.delete", "Delete Users", "Delete user accounts"),
    ("users.suspend", "Suspend Users", "Suspend or activate user accounts"),
    ("user.warn", "Warn Users", "Issue warnings to users"),
    ("content.moderate", "Moderate Content", "Approve, reject, or flag content"),
    ("content.delete", "Delete Content", "Remove inappropriate content"),
    ("content.feature", "Feature Content", "Feature listings on homepage"),
    ("content.restore", "Restore Content", "Restore deleted content"),
    ("business.create", "Create Business", "Create business listings"),
    ("business.edit", "Edit Business", "Edit own business listings"),
    ("business.delete", "Delete Business", "Delete business listings"),
    ("business.verify", "Verify Business", "Mark businesses as verified"),
    ("mosque.create", "Create Mosque", "Create mosque listings"),
    ("mosque.edit", "Edit Mosque", "Edit own mosque listings"),
    ("mosque.delete", "Delete Mosque", "Delete mosque listings"),
    ("mosque.verify", "Verify Mosque", "Mark mosques as verified"),
    ("charity.create", "Create Charity", "Create charity listings"),
    ("charity.edit", "Edit Charity", "Edit own charity listings"),
    ("charity.delete", "Delete Charity", "Delete charity listings"),
    ("charity.verify", "Verify Charity", "Mark charities as verified"),
    ("campaign.create", "Create Campaign", "Create fundraising campaigns"),
    ("campaign.edit", "Edit Campaign", "Edit own campaigns"),
    ("campaign.delete", "Delete Campaign", "Delete campaigns"),
    ("education.create", "Create Institution", "Create educational institution listings"),
    ("education.edit", "Edit Institution", "Edit own institution listings"),
    ("education.delete", "Delete Institution", "Delete institution listings"),
    ("education.verify", "Verify Institution", "Mark institutions as verified"),
    ("event.create", "Create Event", "Create event listings"),
    ("event.edit", "Edit Event", "Edit own event listings"),
    ("event.delete", "Delete Event", "Delete event listings"),
    ("event.manage", "Manage Events", "Manage organization events"),
    ("category.create", "Create Category", "Create business categories"),
    ("category.edit", "Edit Category", "Modify categories"),
    ("category.delete", "Delete Category", "Delete categories"),
    ("ad.create", "Create Ad", "Create advertisements"),
    ("ad.manage", "Manage Ads", "Manage own advertisements"),
    ("ad.approve", "Approve Ad", "Approve or reject advertisements"),
    ("cms.page.edit", "Edit Pages", "Create and edit CMS pages"),
    ("cms.banner.edit", "Edit Banners", "Manage homepage banners"),
    ("cms.blog.edit", "Edit Blog", "Manage blog posts"),
    ("claims.view", "View Claims", "View ownership claims"),
    ("claims.approve", "Approve Claims", "Approve or reject ownership claims"),
    ("claim.create", "Submit Claim", "Submit ownership claim for organization"),
    ("donation.create", "Make Donation", "Donate to charity campaigns"),
    ("donation.view", "View Donations", "View donation records"),
    ("donation.refund", "Refund Donations", "Process donation refunds"),
    ("review.create", "Create Review", "Post reviews for organizations"),
    ("review.edit", "Edit Review", "Edit own reviews"),
    ("review.delete", "Delete Review", "Delete own reviews"),
    ("review.respond", "Respond to Review", "Reply to reviews on own organization"),
    ("favorite.create", "Add Favorite", "Save organizations to favorites"),
    ("favorite.delete", "Remove Favorite", "Remove organizations from favorites"),
    ("report.create", "Report Content", "Report inappropriate content"),
    ("report.view", "View Reports", "View user reports"),
    ("report.resolve", "Resolve Reports", "Resolve reported content"),
    ("staff.invite", "Invite Staff", "Invite staff members to organization"),
    ("staff.remove", "Remove Staff", "Remove staff members from organization"),
    ("analytics.view_own", "View Own Analytics", "View analytics for own organizations"),
    ("subscription.manage", "Manage Subscription", "Manage premier subscription"),
    ("verification.submit", "Submit Verification", "Submit verification documents"),
    ("audit.view", "View Audit Logs", "Access system audit logs"),
]

ROLES_CONFIG = {
    "super_admin": {
        "description": "Full system access with all permissions",
        "permissions": ["super_admin"],
    },
    "moderator": {
        "description": "Content moderation and organization approval",
        "permissions": [
            "users.view", "content.moderate", "content.delete", "content.feature", "content.restore",
            "business.verify", "mosque.verify", "charity.verify", "education.verify",
            "ad.approve", "claims.view", "claims.approve",
            "report.view", "report.resolve", "audit.view",
            "user.warn",
        ],
    },
    "registered_user": {
        "description": "Email-verified registered user with standard platform access",
        "permissions": [
            "business.create", "business.edit", "business.delete",
            "mosque.create", "mosque.edit", "mosque.delete",
            "charity.create", "charity.edit", "charity.delete",
            "education.create", "education.edit", "education.delete",
            "campaign.create", "campaign.edit", "campaign.delete",
            "event.create", "event.edit", "event.delete",
            "review.create", "review.edit", "review.delete",
            "favorite.create", "favorite.delete",
            "donation.create",
            "report.create",
            "claim.create",
            "subscription.manage",
            "analytics.view_own",
            "verification.submit",
            "staff.invite",
            "staff.remove",
        ],
    },
}

ACCOUNTS = [
    {"email": "admin@ummadirectory.test", "password": "Admin@123456",
     "full_name": "Super Administrator", "role": "super_admin",
     "phone": "+254700000001", "city": "Nairobi"},
    {"email": "moderator1@ummadirectory.test", "password": "Moderator@123",
     "full_name": "Aisha Mohammed", "role": "moderator",
     "phone": "+254700000002", "city": "Nairobi"},
    {"email": "moderator2@ummadirectory.test", "password": "Moderator@123",
     "full_name": "Omar Hassan", "role": "moderator",
     "phone": "+254700000003", "city": "Mombasa"},
    {"email": "moderator3@ummadirectory.test", "password": "Moderator@123",
     "full_name": "Fatima Ali", "role": "moderator",
     "phone": "+254700000004", "city": "Kisumu"},
    {"email": "moderator4@ummadirectory.test", "password": "Moderator@123",
     "full_name": "Hassan Ibrahim", "role": "moderator",
     "phone": "+254700000005", "city": "Nakuru"},
    {"email": "moderator5@ummadirectory.test", "password": "Moderator@123",
     "full_name": "Zainab Abdullah", "role": "moderator",
     "phone": "+254700000006", "city": "Eldoret"},
    {"email": "user1@ummadirectory.test", "password": "User@123",
     "full_name": "Khalid Abdi", "role": "registered_user",
     "phone": "+254700000007", "city": "Nairobi"},
    {"email": "user2@ummadirectory.test", "password": "User@123",
     "full_name": "Amina Omar", "role": "registered_user",
     "phone": "+254700000008", "city": "Mombasa"},
    {"email": "user3@ummadirectory.test", "password": "User@123",
     "full_name": "Yusuf Mohamed", "role": "registered_user",
     "phone": "+254700000009", "city": "Nairobi"},
    {"email": "user4@ummadirectory.test", "password": "User@123",
     "full_name": "Maryam Hassan", "role": "registered_user",
     "phone": "+254700000010", "city": "Kisumu"},
    {"email": "user5@ummadirectory.test", "password": "User@123",
     "full_name": "Ibrahim Musa", "role": "registered_user",
     "phone": "+254700000011", "city": "Nairobi"},
    {"email": "user6@ummadirectory.test", "password": "User@123",
     "full_name": "Halima Said", "role": "registered_user",
     "phone": "+254700000012", "city": "Nakuru"},
    {"email": "user7@ummadirectory.test", "password": "User@123",
     "full_name": "Abdul Rahman", "role": "registered_user",
     "phone": "+254700000013", "city": "Mombasa"},
    {"email": "user8@ummadirectory.test", "password": "User@123",
     "full_name": "Safiya Ahmed", "role": "registered_user",
     "phone": "+254700000014", "city": "Nairobi"},
    {"email": "user9@ummadirectory.test", "password": "User@123",
     "full_name": "Musa Kamau", "role": "registered_user",
     "phone": "+254700000015", "city": "Eldoret"},
    {"email": "user10@ummadirectory.test", "password": "User@123",
     "full_name": "Layla Hussein", "role": "registered_user",
     "phone": "+254700000016", "city": "Nairobi"},
]

CATEGORY_DEFS = [
    {"name": "Restaurants", "slug": "restaurants", "icon": "utensils-crossed",
     "children": ["Halal Restaurants", "Cafes", "Bakeries", "Ice Cream"]},
    {"name": "Healthcare", "slug": "healthcare", "icon": "stethoscope",
     "children": ["Hospitals", "Clinics", "Pharmacies", "Dentists"]},
    {"name": "Education", "slug": "education", "icon": "graduation-cap",
     "children": ["Islamic Schools", "Madrasas", "Tutoring", "Daycares", "Universities"]},
    {"name": "Retail", "slug": "retail", "icon": "shopping-bag",
     "children": ["Clothing", "Books & Gifts", "Supermarkets", "Electronics"]},
    {"name": "Professional Services", "slug": "professional-services", "icon": "briefcase",
     "children": ["Lawyers", "Accountants", "IT Services", "Consultants", "Real Estate"]},
    {"name": "Travel & Accommodation", "slug": "travel", "icon": "plane",
     "children": ["Hotels", "Travel Agents", "Transport"]},
    {"name": "Financial Services", "slug": "financial", "icon": "landmark",
     "children": ["Islamic Banks", "Insurance", "Money Transfer"]},
    {"name": "Construction & Trades", "slug": "construction", "icon": "hard-hat",
     "children": ["Contractors", "Electricians", "Plumbers", "Carpenters"]},
]

ORGANIZATIONS = [
    {
        "user_index": 6, "type": "business", "status": "pending",
        "name": "Al-Mina Halal Restaurant & Grill",
        "slug": "al-mina-halal-restaurant-grill",
        "description": "Authentic Somali and Swahili cuisine served in a family-friendly atmosphere. All meat is 100% halal certified. Specializing in grilled meats, fresh seafood, and traditional East African dishes.",
        "email": "info@almina.co.ke", "phone": "+254711100001",
        "website": "https://almina.co.ke",
        "address": "45 River Road, CBD", "city": "Nairobi",
        "latitude": -1.2856, "longitude": 36.8273,
        "category": "Halal Restaurants",
        "is_premier": False, "is_halal_certified": True,
        "operating_hours": {"mon-fri": "08:00-22:00", "sat-sun": "09:00-23:00"},
        "logo_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80",
    },
    {
        "user_index": 7, "type": "mosque", "status": "approved",
        "name": "Jamia Mosque Nairobi",
        "slug": "jamia-mosque-nairobi",
        "description": "The historic central mosque located in Nairobi CBD. Offers daily congregational prayers, Friday Jumuah, Islamic library, educational lectures, and community welfare services.",
        "email": "info@jamiamosque.or.ke", "phone": "+254202243046",
        "website": "https://jamiamosque.or.ke",
        "address": "Banda Street, CBD", "city": "Nairobi",
        "latitude": -1.2842, "longitude": 36.8228,
        "imam_name": "Sheikh Muhammad Juma",
        "has_women_facilities": True,
        "has_parking": True,
        "has_children_facilities": True,
        "is_wheelchair_accessible": True,
        "prayer_times": {
            "fajr": "05:15", "dhuhr": "13:00", "asr": "16:30",
            "maghrib": "18:45", "isha": "20:15", "jumuah": "13:00",
        },
        "facilities": {"wudu_area": True, "library": True, "classrooms": True},
        "community_services": {"marriage_counseling": True, "food_bank": True},
        "logo_url": "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&w=1000&q=80",
    },
    {
        "user_index": 7, "type": "mosque", "status": "approved",
        "name": "Al-Nur Central Mosque",
        "slug": "al-nur-central-mosque",
        "description": "A vibrant community mosque serving the Muslim community with daily prayers, Friday sermons, Quran classes, and community outreach programs. Facilities include separate prayer halls for men and women.",
        "email": "info@alnurmosque.org", "phone": "+254711100002",
        "address": "78 Kenyatta Avenue", "city": "Mombasa",
        "latitude": -4.0435, "longitude": 39.6682,
        "imam_name": "Sheikh Ahmed Khalid",
        "has_women_facilities": True,
        "has_parking": True,
        "has_children_facilities": True,
        "is_wheelchair_accessible": True,
        "prayer_times": {
            "fajr": "05:00", "dhuhr": "12:30", "asr": "15:45",
            "maghrib": "18:30", "isha": "19:45", "jumuah": "13:00",
        },
        "facilities": {"wudu_area": True, "library": True, "classrooms": True},
        "community_services": {"marriage_counseling": True, "food_bank": True},
        "logo_url": "https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1597910039820-3ef814b9a6e0?auto=format&fit=crop&w=1000&q=80",
    },
    {
        "user_index": 8, "type": "educational_institution", "status": "pending",
        "name": "Al-Hikma Islamic Academy",
        "slug": "al-hikma-islamic-academy",
        "description": "A premier Islamic school offering integrated curriculum combining Kenya national curriculum with Islamic studies, Quran memorization, and Arabic language. Serving students from pre-primary to secondary level.",
        "email": "admissions@alhikma.ac.ke", "phone": "+254711100003",
        "website": "https://alhikma.ac.ke",
        "address": "123 Ngong Road", "city": "Nairobi",
        "latitude": -1.3010, "longitude": 36.7750,
        "institution_type": "school",
        "curriculum": "Kenya CBC + Islamic Studies",
        "has_girls_section": True,
        "has_boarding": True,
        "has_quran_program": True,
        "facilities": {"library": True, "science_lab": True, "sports_field": True},
        "programs": {"tahfidh": True, "arabic": True, "stem": True},
        "logo_url": "https://images.unsplash.com/photo-1523050854058-8df90110c7f1?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1000&q=80",
    },
    {
        "user_index": 9, "type": "charity", "status": "approved",
        "name": "Rahma Trust Foundation",
        "slug": "rahma-trust-foundation",
        "description": "A charitable organization dedicated to providing humanitarian aid, orphan sponsorship, clean water projects, and educational support to underprivileged communities across East Africa.",
        "email": "info@rahmafoundation.org", "phone": "+254711100004",
        "website": "https://rahmafoundation.org",
        "address": "56 State House Road", "city": "Nairobi",
        "latitude": -1.2810, "longitude": 36.8130,
        "registration_number": "CHA/2024/78901",
        "mission_statement": "Empowering communities through sustainable development, education, and humanitarian aid.",
        "bank_verified": True,
        "logo_url": "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=80",
    },
    {
        "user_index": 10, "type": "charity", "status": "pending",
        "name": "Ummah Development Network",
        "slug": "ummah-development-network",
        "description": "An NGO focused on community development, vocational training, microfinance initiatives, and youth empowerment programs across Kenya.",
        "email": "contact@ummahdev.org", "phone": "+254711100005",
        "website": "https://ummahdev.org",
        "address": "234 Moi Avenue", "city": "Kisumu",
        "latitude": -0.1022, "longitude": 34.7617,
        "registration_number": "NGO/2025/45678",
        "mission_statement": "Building self-reliant communities through education, enterprise, and empowerment.",
        "bank_verified": False,
        "logo_url": "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=80",
    },
    {
        "user_index": 11, "type": "business", "status": "approved",
        "name": "Al-Shifa Medical Center",
        "slug": "al-shifa-medical-center",
        "description": "A modern medical facility offering comprehensive healthcare services including general medicine, pediatrics, gynecology, radiology, and emergency care. Open 24/7 with qualified medical staff.",
        "email": "info@alshifamedical.co.ke", "phone": "+254711100006",
        "website": "https://alshifamedical.co.ke",
        "address": "89 Hospital Road, Upper Hill", "city": "Nairobi",
        "latitude": -1.2960, "longitude": 36.8150,
        "category": "Hospitals",
        "is_premier": True, "is_halal_certified": False,
        "operating_hours": {"daily": "00:00-24:00"},
        "logo_url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1587351021759-3772687b7e1f?auto=format&fit=crop&w=1000&q=80",
    },
    {
        "user_index": 12, "type": "business", "status": "pending",
        "name": "Qasr Al-Salam Boutique Hotel",
        "slug": "qasr-al-salam-boutique-hotel",
        "description": "A luxurious boutique hotel with stunning ocean views, offering halal dining, swimming pool, spa facilities, and conference rooms. Perfect for business and leisure travelers.",
        "email": "reservations@qasralsalam.com", "phone": "+254711100007",
        "website": "https://qasralsalam.com",
        "address": "12 Beach Road, Nyali", "city": "Mombasa",
        "latitude": -4.0330, "longitude": 39.7200,
        "category": "Hotels",
        "is_premier": False, "is_halal_certified": True,
        "operating_hours": {"daily": "00:00-24:00"},
        "logo_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=80",
    },
    {
        "user_index": 13, "type": "business", "status": "approved",
        "name": "Layali Restaurant & Cafe",
        "slug": "layali-restaurant-cafe",
        "description": "A cozy halal restaurant and cafe serving Middle Eastern cuisine, fresh pastries, and specialty coffees. Popular for family dinners, business meetings, and social gatherings.",
        "email": "hello@layali.co.ke", "phone": "+254711100008",
        "website": "https://layali.co.ke",
        "address": "34 Kimathi Street", "city": "Nairobi",
        "latitude": -1.2840, "longitude": 36.8210,
        "category": "Halal Restaurants",
        "is_premier": False, "is_halal_certified": True,
        "operating_hours": {"mon-thu": "07:00-23:00", "fri-sun": "07:00-00:00"},
        "logo_url": "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
    },
    {
        "user_index": 14, "type": "business", "status": "pending",
        "name": "Al-Barakah Health Clinic",
        "slug": "al-barakah-health-clinic",
        "description": "A community health clinic providing affordable outpatient services including general consultations, maternity care, immunizations, and laboratory services.",
        "email": "info@albarakahclinic.co.ke", "phone": "+254711100009",
        "address": "67 Oginga Odinga Road", "city": "Eldoret",
        "latitude": 0.5143, "longitude": 35.2698,
        "category": "Clinics",
        "is_premier": False, "is_halal_certified": False,
        "operating_hours": {"mon-fri": "07:00-20:00", "sat": "08:00-17:00"},
        "logo_url": "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1000&q=80",
    },
    {
        "user_index": 15, "type": "business", "status": "approved",
        "name": "Pamoja Community Center",
        "slug": "pamoja-community-center",
        "description": "A multi-purpose community center offering sports facilities, event halls, classrooms, and a library. Hosts community events, youth programs, and educational workshops.",
        "email": "info@pamojacenter.co.ke", "phone": "+254711100010",
        "website": "https://pamojacenter.co.ke",
        "address": "90 Community Road, Eastlands", "city": "Nairobi",
        "latitude": -1.2740, "longitude": 36.8500,
        "category": "IT Services",
        "is_premier": True, "is_halal_certified": False,
        "operating_hours": {"mon-sat": "06:00-22:00", "sun": "08:00-20:00"},
        "logo_url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=200&q=80",
        "cover_image_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80",
    },
]

REVIEWS_DATA = [
    {"org_index": 1, "user_index": 6, "rating": 5, "comment": "Beautiful mosque with a welcoming community. The imam's sermons are very inspiring. Women's facilities are well maintained."},
    {"org_index": 1, "user_index": 8, "rating": 4, "comment": "Great atmosphere for prayers. Well organized Friday prayers. Parking can be tight during peak hours."},
    {"org_index": 1, "user_index": 10, "rating": 5, "comment": "Alhamdulillah, this mosque feels like home. Excellent Quran classes for children."},
    {"org_index": 3, "user_index": 6, "rating": 5, "comment": "Transparent charity with real impact. I sponsor an orphan through them and receive regular updates."},
    {"org_index": 3, "user_index": 7, "rating": 4, "comment": "They do great work in the community. The food distribution program during Ramadan was excellent."},
    {"org_index": 3, "user_index": 12, "rating": 5, "comment": "Very professional team. Their water well projects are transforming communities."},
    {"org_index": 5, "user_index": 7, "rating": 5, "comment": "Excellent medical care. The staff are professional and compassionate. Clean facilities."},
    {"org_index": 5, "user_index": 9, "rating": 4, "comment": "Good hospital with modern equipment. Emergency services are prompt. Waiting times could be better."},
    {"org_index": 5, "user_index": 15, "rating": 5, "comment": "Best maternity care in Nairobi. My wife had a wonderful experience here."},
    {"org_index": 7, "user_index": 6, "rating": 4, "comment": "Delicious halal food, great service. Their mandazi and chapati are the best in town."},
    {"org_index": 7, "user_index": 9, "rating": 5, "comment": "Love the family atmosphere. Kids play area is a bonus. The biryani is amazing!"},
    {"org_index": 7, "user_index": 11, "rating": 4, "comment": "Consistently good food. The staff remembers regular customers. Highly recommended."},
    {"org_index": 9, "user_index": 8, "rating": 5, "comment": "Great community space. We held my son's graduation party here. Affordable and well equipped."},
    {"org_index": 9, "user_index": 10, "rating": 4, "comment": "Excellent facilities for community events. The sports programs for youth are fantastic."},
    {"org_index": 9, "user_index": 14, "rating": 5, "comment": "The library is a hidden gem. My children love the weekend Quran classes here."},
]

REPLIES_DATA = [
    {"review_index": 0, "user_index": 7, "content": "Jazakallahukhair for your kind words! We strive to serve our community better every day."},
    {"review_index": 3, "user_index": 9, "content": "Thank you for your support! Your sponsorship is changing lives. We'll send you the latest impact report."},
    {"review_index": 6, "user_index": 11, "content": "Thank you for choosing Al-Shifa. Our team works hard to provide the best care possible."},
    {"review_index": 9, "user_index": 13, "content": "So glad you enjoyed your meal! Our chefs take great pride in every dish."},
]

FAVORITES_MAP = [
    (6, 1), (6, 3), (6, 5), (7, 1), (7, 3), (8, 5), (8, 7),
    (9, 3), (9, 9), (10, 3), (10, 5), (11, 5), (11, 7),
    (12, 1), (12, 9), (13, 7), (13, 9), (14, 5), (14, 7), (15, 9),
]

EVENTS_DATA = [
    {
        "org_index": 5, "title": "Community Health Awareness Workshop",
        "slug": "community-health-awareness-workshop-2026",
        "description": "Free health screening and awareness workshop covering diabetes, hypertension, and nutrition. Free consultations and medications.",
        "event_date": datetime(2026, 9, 15, tzinfo=UTC),
        "event_time": "09:00", "venue": "Al-Shifa Medical Center",
        "latitude": -1.2960, "longitude": 36.8150,
        "category": "Health",
    },
    {
        "org_index": 3, "title": "Ramadan Food Distribution Drive",
        "slug": "ramadan-food-distribution-2026",
        "description": "Annual food distribution drive to support 2000 families during Ramadan. Volunteers needed for packing and distribution.",
        "event_date": datetime(2027, 2, 10, tzinfo=UTC),
        "event_time": "08:00", "venue": "Rahma Trust Headquarters",
        "latitude": -1.2810, "longitude": 36.8130,
        "category": "Community",
    },
    {
        "org_index": 9, "title": "Pamoja Family Fun Day",
        "slug": "pamoja-family-fun-day-2026",
        "description": "A day of family activities including sports tournaments, face painting, bouncy castles, food stalls, and live entertainment.",
        "event_date": datetime(2026, 12, 20, tzinfo=UTC),
        "event_time": "10:00", "venue": "Pamoja Community Center Grounds",
        "latitude": -1.2740, "longitude": 36.8500,
        "category": "Community",
    },
]

NOTIFICATIONS_DATA = [
    {"user_index": 0, "type": "account.welcome", "title": "Welcome to Umma Directory",
     "message": "Your super administrator account has been created. Welcome to the platform!"},
    {"user_index": 0, "type": "system.info", "title": "Platform Setup Complete",
     "message": "The development environment has been fully configured with seed data."},
    {"user_index": 7, "type": "organization.approved", "title": "Organization Approved",
     "message": "Your organization 'Al-Nur Central Mosque' has been approved and is now live."},
    {"user_index": 9, "type": "organization.approved", "title": "Organization Approved",
     "message": "Your organization 'Rahma Trust Foundation' has been approved and is now live."},
    {"user_index": 11, "type": "organization.approved", "title": "Organization Approved",
     "message": "Your organization 'Al-Shifa Medical Center' has been approved and is now live."},
    {"user_index": 13, "type": "organization.approved", "title": "Organization Approved",
     "message": "Your organization 'Layali Restaurant & Cafe' has been approved and is now live."},
    {"user_index": 15, "type": "organization.approved", "title": "Organization Approved",
     "message": "Your organization 'Pamoja Community Center' has been approved and is now live."},
    {"user_index": 10, "type": "organization.pending", "title": "Application Submitted",
     "message": "Your organization application for 'Ummah Development Network' has been submitted for review."},
    {"user_index": 8, "type": "review.received", "title": "New Review",
     "message": "Your organization 'Al-Hikma Islamic Academy' received a new review."},
    {"user_index": 13, "type": "review.received", "title": "New Review",
     "message": "Your organization 'Layali Restaurant & Cafe' received a new review."},
    {"user_index": 0, "type": "moderator.task", "title": "Pending Approvals",
     "message": "There are organizations pending your review in the moderation queue."},
]

DONATIONS_DATA = [
    {"donor_index": 6, "org_index": 3, "amount": 5000, "currency": "KES",
     "receipt": "DON-2026-001", "anonymous": False},
    {"donor_index": 7, "org_index": 3, "amount": 10000, "currency": "KES",
     "receipt": "DON-2026-002", "anonymous": False},
    {"donor_index": 8, "org_index": 3, "amount": 25000, "currency": "KES",
     "receipt": "DON-2026-003", "anonymous": True},
    {"donor_index": 10, "org_index": 3, "amount": 50000, "currency": "KES",
     "receipt": "DON-2026-004", "anonymous": False},
    {"donor_index": 12, "org_index": 3, "amount": 2000, "currency": "KES",
     "receipt": "DON-2026-005", "anonymous": True},
    {"donor_index": 14, "org_index": 3, "amount": 15000, "currency": "KES",
     "receipt": "DON-2026-006", "anonymous": False},
    {"donor_index": 15, "org_index": 3, "amount": 8000, "currency": "KES",
     "receipt": "DON-2026-007", "anonymous": False},
]

ANALYTICS_EVENTS = [
    {"org_index": 0, "event_type": "page_view", "resource_type": "organization"},
    {"org_index": 1, "event_type": "page_view", "resource_type": "organization"},
    {"org_index": 2, "event_type": "page_view", "resource_type": "organization"},
    {"org_index": 3, "event_type": "page_view", "resource_type": "organization"},
    {"org_index": 5, "event_type": "page_view", "resource_type": "organization"},
    {"org_index": 7, "event_type": "page_view", "resource_type": "organization"},
    {"org_index": 9, "event_type": "page_view", "resource_type": "organization"},
    {"org_index": 1, "event_type": "search_appearance", "resource_type": "organization"},
    {"org_index": 3, "event_type": "search_appearance", "resource_type": "organization"},
    {"org_index": 5, "event_type": "search_appearance", "resource_type": "organization"},
    {"org_index": 7, "event_type": "search_appearance", "resource_type": "organization"},
    {"org_index": 9, "event_type": "search_appearance", "resource_type": "organization"},
    {"org_index": 3, "event_type": "donation_received", "resource_type": "organization"},
    {"org_index": 5, "event_type": "click", "resource_type": "organization"},
    {"org_index": 7, "event_type": "click", "resource_type": "organization"},
]

CAMPAIGNS_DATA = [
    {"org_index": 4, "title": "Feed a Family This Ramadan",
     "description": "Help us provide food hampers to 2000 vulnerable families during the holy month of Ramadan.",
     "target": 5000000, "raised": 2150000, "deadline_offset_days": 180},
    {"org_index": 4, "title": "Build a School Well",
     "description": "Fund a clean water well for Al-Nur Primary School in Garissa County serving 500 students.",
     "target": 1200000, "raised": 780000, "deadline_offset_days": 120},
    {"org_index": 4, "title": "Orphan Sponsorship Program",
     "description": "Sponsor 50 orphans with school fees, uniforms, and monthly food supplies.",
     "target": 3000000, "raised": 1650000, "deadline_offset_days": 365},
]

POSTS_DATA = [
    {"org_index": 1, "author_index": 7, "content": "Join us for our weekly Quran study circle every Wednesday after Maghrib prayer. All are welcome!"},
    {"org_index": 3, "author_index": 9, "content": "We have distributed 500 food hampers this week to families in need across Nairobi. Thank you to all our donors!"},
    {"org_index": 5, "author_index": 11, "content": "Free malaria screening camp this Saturday at our clinic from 8 AM to 4 PM. No appointment needed."},
    {"org_index": 9, "author_index": 15, "content": "Registration now open for our youth basketball tournament! Ages 12-18. Sign up at the center reception."},
]

ADS_DATA = [
    {"user_index": 0, "type": "banner", "title": "Al-Shifa Medical Center - 24/7 Emergency Services",
     "placement": "homepage_hero", "status": "approved"},
    {"user_index": 0, "type": "sidebar", "title": "Rahma Trust - Sponsor an Orphan Today",
     "placement": "sidebar", "status": "pending"},
    {"user_index": 0, "type": "banner", "title": "Qasr Al-Salam Hotel - Eid Special Offers",
     "placement": "homepage_hero", "status": "pending"},
]

VERIFICATION_DOCS = [
    {"org_index": 5, "user_index": 11, "doc_type": "business_license", "status": "approved"},
    {"org_index": 3, "user_index": 9, "doc_type": "charity_registration", "status": "approved"},
    {"org_index": 7, "user_index": 13, "doc_type": "food_handling_cert", "status": "pending"},
    {"org_index": 9, "user_index": 15, "doc_type": "community_center_license", "status": "rejected"},
]

MEDIA_FILES = [
    {"org_index": 1, "type": "image", "alt": "Mosque interior during prayers",
     "url": "https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&w=800&q=80"},
    {"org_index": 3, "type": "image", "alt": "Charity food distribution event",
     "url": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80"},
    {"org_index": 5, "type": "image", "alt": "Hospital reception area",
     "url": "https://images.unsplash.com/photo-1587351021759-3772687b7e1f?auto=format&fit=crop&w=800&q=80"},
    {"org_index": 7, "type": "image", "alt": "Restaurant interior dining area",
     "url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"},
    {"org_index": 9, "type": "image", "alt": "Community center sports hall",
     "url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"},
    {"org_index": 5, "type": "image", "alt": "Doctor consulting with patient",
     "url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"},
    {"org_index": 7, "type": "image", "alt": "Grilled food platter",
     "url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"},
    {"org_index": 9, "type": "image", "alt": "Community center library",
     "url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"},
]

REPORTS_DATA = [
    {"user_index": 8, "org_index": 5, "category": "spam", "description": "Suspicious review on this listing.",
     "resource_type": "review"},
    {"user_index": 10, "org_index": 7, "category": "incorrect_info",
     "description": "The opening hours listed are incorrect.", "resource_type": "organization"},
]


async def seed():
    async with async_session_factory() as db:
        existing = await db.execute(Role.__table__.select().limit(1))
        has_data = existing.first() is not None

        force_seed = "--force" in sys.argv
        if has_data and not force_seed:
            print("Database has existing data. Checking for seed data marker...")
            admin_exists = await db.execute(
                User.__table__.select().where(User.email == "admin@ummadirectory.test")
            )
            if admin_exists.first():
                print("Seed data already exists. Skipping... (Use --force to run full seed update)")
                return
            print("Adding additional seed data to existing database...")
        elif force_seed:
            print("=== Force Seeding Enabled ===")

        print("=== Umma Directory - Development Seed Data ===")

        # Step 1: Permissions
        print("\n[1/10] Creating permissions...")
        permissions = {}
        for codename, name, desc in PERMISSION_DEFINITIONS:
            result = await db.execute(Permission.__table__.select().where(Permission.codename == codename))
            perm = result.fetchone()
            if not perm:
                perm_obj = Permission(codename=codename, name=name, description=desc)
                db.add(perm_obj)
                await db.flush()
                permissions[codename] = perm_obj
            else:
                from app.models.base import BaseModelMixin
                from sqlalchemy.orm import class_mapper
                result = await db.execute(Permission.__table__.select().where(Permission.codename == codename))
                row = result.fetchone()
                dummy = Permission(codename=codename, name=name, description=desc)
                dummy.id = row.id
                permissions[codename] = dummy
        await db.commit()
        print(f"  {len(PERMISSION_DEFINITIONS)} permissions ready.")

        # Refresh permission objects with proper ORM instances
        perms = {}
        for codename, _, _ in PERMISSION_DEFINITIONS:
            result = await db.execute(Permission.__table__.select().where(Permission.codename == codename))
            row = result.fetchone()
            if row:
                from sqlalchemy.orm import class_mapper
                p = Permission(codename=codename)
                p.id = row.id
                p.codename = row.codename
                p.name = row.name
                p.description = row.description
                perms[codename] = p

        # Step 2: Roles
        print("\n[2/10] Creating roles...")
        roles = {}
        for name, cfg in ROLES_CONFIG.items():
            result = await db.execute(Role.__table__.select().where(Role.name == name))
            existing_role = result.fetchone()
            if not existing_role:
                role = Role(name=name, description=cfg["description"])
                db.add(role)
                await db.flush()
            else:
                from sqlalchemy import update as sql_update
                stmt = sql_update(Role.__table__).where(Role.__table__.c.name == name).values(
                    description=cfg["description"]
                )
                await db.execute(stmt)
                result = await db.execute(Role.__table__.select().where(Role.name == name))
                existing_role = result.fetchone()
                role = Role(name=name, description=cfg["description"])
                role.id = existing_role.id

            await db.commit()

            result = await db.execute(Role.__table__.select().where(Role.name == name))
            row = result.fetchone()
            role = Role(name=name)
            role.id = row.id

            for codename in cfg["permissions"]:
                if codename in perms:
                    existing_link = await db.execute(
                        role_permissions.select().where(
                            role_permissions.c.role_id == role.id,
                            role_permissions.c.permission_id == perms[codename].id,
                        )
                    )
                    if not existing_link.fetchone():
                        await db.execute(
                            role_permissions.insert().values(
                                role_id=role.id, permission_id=perms[codename].id
                            )
                        )
            roles[name] = role
        await db.commit()
        print(f"  {len(ROLES_CONFIG)} roles ready.")

        # Step 3: Categories
        print("\n[3/10] Creating categories...")
        cat_map = {}
        for cat_def in CATEGORY_DEFS:
            result = await db.execute(
                Category.__table__.select().where(Category.slug == cat_def["slug"])
            )
            existing = result.fetchone()
            if not existing:
                cat = Category(
                    name=cat_def["name"], slug=cat_def["slug"],
                    icon=cat_def.get("icon", ""), is_active=True, sort_order=0,
                )
                db.add(cat)
                await db.flush()
                cat_map[cat_def["name"]] = cat
                for child_name in cat_def.get("children", []):
                    child_slug = child_name.lower().replace(" ", "-")
                    child = Category(
                        name=child_name, slug=child_slug,
                        parent_id=cat.id, icon=cat_def.get("icon", ""),
                        is_active=True, sort_order=0,
                    )
                    db.add(child)
                    await db.flush()
                    cat_map[child_name] = child
            else:
                cat_map[cat_def["name"]] = existing
                for child_name in cat_def.get("children", []):
                    child_slug = child_name.lower().replace(" ", "-")
                    result2 = await db.execute(
                        Category.__table__.select().where(Category.slug == child_slug)
                    )
                    child_row = result2.fetchone()
                    if child_row:
                        cat_map[child_name] = child_row
        await db.commit()
        print(f"  Categories ready.")

        # Create Category helper dict with proper ORM objects
        cats = {}
        for key in cat_map:
            row = cat_map[key]
            if hasattr(row, '_mapping'):
                c = Category(name=row.name)
                c.id = row.id
                cats[key] = c
            else:
                cats[key] = row

        # Re-fetch all categories as ORM objects
        all_cats_result = await db.execute(Category.__table__.select())
        all_cat_rows = all_cats_result.fetchall()
        orm_cats = {}
        for row in all_cat_rows:
            c = Category(name=row.name)
            c.id = row.id
            orm_cats[row.name] = c

        # Step 4: Users
        print("\n[4/10] Creating user accounts (16)...")
        users = {}
        for acct in ACCOUNTS:
            result = await db.execute(User.__table__.select().where(User.email == acct["email"]))
            existing = result.fetchone()
            if not existing:
                user = User(
                    email=acct["email"],
                    full_name=acct["full_name"],
                    phone=acct["phone"],
                    password_hash=hash_password(acct["password"]),
                    role_id=roles[acct["role"]].id,
                    is_active=True,
                    is_email_verified=True,
                    preferred_language="en",
                    profile_photo_url=f"https://i.pravatar.cc/150?u={acct['email']}",
                )
                db.add(user)
                await db.flush()
                users[acct["email"]] = user

                np = NotificationPreference(user_id=user.id)
                db.add(np)
            else:
                from sqlalchemy import update
                stmt = update(User.__table__).where(User.__table__.c.email == acct["email"]).values(
                    role_id=roles[acct["role"]].id,
                    is_active=True,
                    is_email_verified=True,
                    full_name=acct["full_name"],
                    phone=acct["phone"],
                )
                await db.execute(stmt)
                result2 = await db.execute(User.__table__.select().where(User.email == acct["email"]))
                user_row = result2.fetchone()
                u = User(email=acct["email"])
                u.id = user_row.id
                users[acct["email"]] = u

                pref_result = await db.execute(
                    NotificationPreference.__table__.select().where(
                        NotificationPreference.__table__.c.user_id == user_row.id
                    )
                )
                if not pref_result.fetchone():
                    np = NotificationPreference(user_id=user_row.id)
                    db.add(np)

            await db.commit()

        user_map = {}
        for acct in ACCOUNTS:
            result = await db.execute(User.__table__.select().where(User.email == acct["email"]))
            row = result.fetchone()
            if row:
                u = User(email=acct["email"])
                u.id = row.id
                u.full_name = row.full_name
                user_map[acct["email"]] = u
        print(f"  {len(ACCOUNTS)} user accounts ready.")

        # Step 5: Organizations
        print("\n[5/10] Creating organizations (10)...")
        org_list = []
        for org_data in ORGANIZATIONS:
            acct = ACCOUNTS[org_data["user_index"]]
            owner = user_map[acct["email"]]

            result = await db.execute(Organization.__table__.select().where(Organization.slug == org_data["slug"]))
            existing = result.fetchone()
            if existing:
                print(f"  Skipping existing organization: {org_data['name']}")
                o = Organization(name=org_data["name"])
                o.id = existing.id
                o.slug = existing.slug
                o.owner_id = existing.owner_id
                o.status = existing.status
                o.organization_type = existing.organization_type
                org_list.append(o)
                continue

            base_kwargs = dict(
                name=org_data["name"],
                slug=org_data["slug"],
                description=org_data["description"],
                email=org_data["email"],
                phone=org_data["phone"],
                website=org_data.get("website"),
                address=org_data["address"],
                city=org_data["city"],
                country="Kenya",
                latitude=org_data["latitude"],
                longitude=org_data["longitude"],
                logo_url=org_data.get("logo_url"),
                cover_image_url=org_data.get("cover_image_url"),
                is_verified=(org_data["status"] == "approved"),
                status=org_data["status"],
                avg_rating=4.5 if org_data["status"] == "approved" else 0.0,
                review_count=0,
                owner_id=owner.id,
            )

            org_type = org_data["type"]
            org_obj = None

            if org_type == "business":
                cat_name = org_data.get("category", "")
                category = orm_cats.get(cat_name)
                if not category and orm_cats:
                    category = list(orm_cats.values())[0]
                org_obj = Business(
                    **base_kwargs,
                    whatsapp=org_data.get("phone"),
                    operating_hours=org_data.get("operating_hours"),
                    is_halal_certified=org_data.get("is_halal_certified", False),
                    is_premier=org_data.get("is_premier", False),
                    category_id=category.id if category else list(orm_cats.values())[0].id,
                )
            elif org_type == "mosque":
                org_obj = Mosque(
                    **base_kwargs,
                    imam_name=org_data.get("imam_name"),
                    has_women_facilities=org_data.get("has_women_facilities", False),
                    has_parking=org_data.get("has_parking", False),
                    has_children_facilities=org_data.get("has_children_facilities", False),
                    is_wheelchair_accessible=org_data.get("is_wheelchair_accessible", False),
                    prayer_times=org_data.get("prayer_times"),
                    facilities=org_data.get("facilities"),
                    community_services=org_data.get("community_services"),
                )
            elif org_type == "charity":
                org_obj = Charity(
                    **base_kwargs,
                    registration_number=org_data.get("registration_number"),
                    mission_statement=org_data.get("mission_statement"),
                    bank_verified=org_data.get("bank_verified", False),
                )
            elif org_type == "educational_institution":
                org_obj = EducationalInstitution(
                    **base_kwargs,
                    institution_type=org_data.get("institution_type", "school"),
                    curriculum=org_data.get("curriculum"),
                    has_girls_section=org_data.get("has_girls_section", False),
                    has_boarding=org_data.get("has_boarding", False),
                    has_quran_program=org_data.get("has_quran_program", False),
                    facilities=org_data.get("facilities"),
                    programs=org_data.get("programs"),
                )

            if org_obj:
                db.add(org_obj)
                await db.flush()
                result2 = await db.execute(Organization.__table__.select().where(Organization.slug == org_data["slug"]))
                org_row = result2.fetchone()
                if org_row:
                    o = Organization(name=org_data["name"])
                    o.id = org_row.id
                    o.slug = org_row.slug
                    o.owner_id = org_row.owner_id
                    o.status = org_row.status
                    o.organization_type = org_row.organization_type
                    org_list.append(o)
                print(f"  [+] Created {org_type}: {org_data['name']} ({org_data['status']})")

        await db.commit()

        org_objects = []
        for org_row in org_list:
            o = Organization(name=getattr(org_row, 'name', ''))
            o.id = getattr(org_row, 'id', None)
            o.slug = getattr(org_row, 'slug', '')
            o.owner_id = getattr(org_row, 'owner_id', None)
            o.status = getattr(org_row, 'status', '')
            o.organization_type = getattr(org_row, 'organization_type', '')
            org_objects.append(o)

        # Step 6: Organization Managers
        print("\n[6/10] Creating organization managers...")
        manager_assignments = [
            (3, 8),  # Charity -> assign User 3 (index 8) as manager
            (7, 11), # Restaurant -> assign User 6 (index 11) as manager
        ]
        for org_idx, user_idx in manager_assignments:
            org = org_objects[org_idx]
            acct = ACCOUNTS[user_idx]
            manager_user = user_map[acct["email"]]

            existing_manager = await db.execute(
                OrganizationManager.__table__.select().where(
                    OrganizationManager.__table__.c.organization_id == org.id
                )
            )
            if not existing_manager.fetchone():
                om = OrganizationManager(
                    organization_id=org.id,
                    user_id=manager_user.id,
                    role="manager",
                    is_active=True,
                )
                db.add(om)
                print(f"  [+] Added manager {acct['full_name']} to {org.name}")

        await db.commit()

        # Step 7: Reviews and Replies
        print("\n[7/10] Creating reviews, favorites, events...")

        # Reviews
        review_objects = []
        for i, rv in enumerate(REVIEWS_DATA):
            org = org_objects[rv["org_index"]]
            acct = ACCOUNTS[rv["user_index"]]
            reviewer = user_map[acct["email"]]

            existing = await db.execute(
                Review.__table__.select().where(
                    Review.__table__.c.organization_id == org.id,
                    Review.__table__.c.user_id == reviewer.id,
                )
            )
            if not existing.fetchone():
                created = datetime.now(UTC) - timedelta(days=len(REVIEWS_DATA) - i)
                review = Review(
                    rating=rv["rating"],
                    comment=rv["comment"],
                    status="published",
                    user_id=reviewer.id,
                    organization_id=org.id,
                )
                db.add(review)
                await db.flush()
                review_objects.append(review)

        await db.commit()

        for i, rp_data in enumerate(REPLIES_DATA):
            if rp_data["review_index"] < len(review_objects):
                review = review_objects[rp_data["review_index"]]
                acct = ACCOUNTS[rp_data["user_index"]]
                replier = user_map[acct["email"]]

                existing_reply = await db.execute(
                    ReviewReply.__table__.select().where(
                        ReviewReply.__table__.c.review_id == review.id
                    )
                )
                if not existing_reply.fetchone():
                    reply = ReviewReply(
                        content=rp_data["content"],
                        review_id=review.id,
                        user_id=replier.id,
                    )
                    db.add(reply)

        await db.commit()

        # Update review counts on organizations
        from sqlalchemy import func as sql_func
        for org in org_objects:
            count_result = await db.execute(
                sql_func.count().select().where(
                    Review.__table__.c.organization_id == org.id,
                    Review.__table__.c.status == "published",
                )
            )
            cnt = count_result.scalar() or 0

            avg_result = await db.execute(
                Review.__table__.select().where(
                    Review.__table__.c.organization_id == org.id,
                    Review.__table__.c.status == "published",
                )
            )
            rows = avg_result.fetchall()
            avg_rating = 0.0
            if rows:
                total = sum(r.rating for r in rows)
                avg_rating = round(total / len(rows), 1)

            await db.execute(
                Organization.__table__.update().where(Organization.__table__.c.id == org.id).values(
                    review_count=int(cnt),
                    avg_rating=avg_rating,
                )
            )
        await db.commit()

        # Favorites
        for user_idx, org_idx in FAVORITES_MAP:
            acct = ACCOUNTS[user_idx]
            user = user_map[acct["email"]]
            org = org_objects[org_idx]

            existing = await db.execute(
                Favorite.__table__.select().where(
                    Favorite.__table__.c.user_id == user.id,
                    Favorite.__table__.c.organization_id == org.id,
                )
            )
            if not existing.fetchone():
                fav = Favorite(user_id=user.id, organization_id=org.id)
                db.add(fav)
        await db.commit()

        # Events
        for evt_data in EVENTS_DATA:
            org = org_objects[evt_data["org_index"]]

            existing = await db.execute(
                Event.__table__.select().where(Event.__table__.c.slug == evt_data["slug"])
            )
            if not existing.fetchone():
                event = Event(
                    title=evt_data["title"],
                    slug=evt_data["slug"],
                    description=evt_data["description"],
                    event_date=evt_data["event_date"],
                    event_time=evt_data["event_time"],
                    venue=evt_data["venue"],
                    latitude=evt_data["latitude"],
                    longitude=evt_data["longitude"],
                    category=evt_data["category"],
                    status="published",
                    organization_id=org.id,
                )
                db.add(event)
        await db.commit()

        # Step 8: Notifications
        print("\n[8/10] Creating notifications, ads, donations...")
        for notif_data in NOTIFICATIONS_DATA:
            acct = ACCOUNTS[notif_data["user_index"]]
            user = user_map[acct["email"]]

            existing = await db.execute(
                Notification.__table__.select().where(
                    Notification.__table__.c.user_id == user.id,
                    Notification.__table__.c.type == notif_data["type"],
                    Notification.__table__.c.title == notif_data["title"],
                )
            )
            if not existing.fetchone():
                n = Notification(
                    type=notif_data["type"],
                    title=notif_data["title"],
                    message=notif_data["message"],
                    user_id=user.id,
                    is_read=False,
                    delivery_channel="in_app",
                    delivery_status="delivered",
                )
                db.add(n)
        await db.commit()

        # Advertisements
        for ad_data in ADS_DATA:
            acct = ACCOUNTS[ad_data["user_index"]]
            user = user_map[acct["email"]]

            existing = await db.execute(
                Advertisement.__table__.select().where(
                    Advertisement.__table__.c.title == ad_data["title"],
                    Advertisement.__table__.c.advertiser_id == user.id,
                )
            )
            if not existing.fetchone():
                ad = Advertisement(
                    ad_type=ad_data["type"],
                    title=ad_data["title"],
                    placement=ad_data["placement"],
                    status=ad_data["status"],
                    advertiser_id=user.id,
                    is_active=(ad_data["status"] == "approved"),
                    image_url="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
                    start_date=datetime.now(UTC),
                    end_date=datetime.now(UTC) + timedelta(days=30),
                )
                db.add(ad)
        await db.commit()

        # Ad Campaigns
        for i, org in enumerate(org_objects[:3]):
            existing = await db.execute(
                AdCampaign.__table__.select().where(AdCampaign.__table__.c.organization_id == org.id)
            )
            if not existing.fetchone():
                advertiser_id = getattr(org, "user_id", None) or user_map[ACCOUNTS[0]["email"]].id
                db.add(AdCampaign(
                    name=f"{org.name} Promo",
                    campaign_type="featured_listing",
                    status="active",
                    organization_id=org.id,
                    advertiser_id=advertiser_id,
                    headline=f"Visit {org.name} Today!",
                    description="Quality services for the community.",
                    cta_type="visit_profile",
                    budget_type="total",
                    budget_amount=5000,
                    start_date=datetime.now(UTC) - timedelta(days=2),
                    end_date=datetime.now(UTC) + timedelta(days=28),
                    impressions=245 + i * 100,
                    clicks=18 + i * 5,
                    created_at=datetime.now(UTC) - timedelta(days=2),
                ))
        await db.commit()

        # Donations
        for don_data in DONATIONS_DATA:
            donor = user_map[ACCOUNTS[don_data["donor_index"]]["email"]]
            org = org_objects[don_data["org_index"]]

            existing = await db.execute(
                Donation.__table__.select().where(
                    Donation.__table__.c.receipt_number == don_data["receipt"]
                )
            )
            if not existing.fetchone():
                donation = Donation(
                    amount=don_data["amount"],
                    currency=don_data["currency"],
                    is_anonymous=don_data["anonymous"],
                    receipt_number=don_data["receipt"],
                    status="completed",
                    donor_id=donor.id,
                    organization_id=org.id,
                )
                db.add(donation)
        await db.commit()

        # Step 9: Campaigns, posts, analytics, media, verification docs, CMS
        print("\n[9/10] Creating campaigns, posts, analytics, media, docs, CMS...")

        # Campaigns
        for camp_data in CAMPAIGNS_DATA:
            org = org_objects[camp_data["org_index"]]
            existing = await db.execute(
                CharityCampaign.__table__.select().where(
                    CharityCampaign.__table__.c.title == camp_data["title"],
                    CharityCampaign.__table__.c.charity_id == org.id,
                )
            )
            if not existing.fetchone():
                deadline = datetime.now(UTC) + timedelta(days=camp_data["deadline_offset_days"])
                campaign = CharityCampaign(
                    title=camp_data["title"],
                    description=camp_data["description"],
                    target_amount=camp_data["target"],
                    amount_raised=camp_data["raised"],
                    currency="KES",
                    deadline=deadline,
                    status="active",
                    is_featured=(camp_data == CAMPAIGNS_DATA[0]),
                    charity_id=org.id,
                )
                db.add(campaign)
        await db.commit()

        # Posts
        for post_data in POSTS_DATA:
            org = org_objects[post_data["org_index"]]
            author = user_map[ACCOUNTS[post_data["author_index"]]["email"]]

            existing = await db.execute(
                OrganizationPost.__table__.select().where(
                    OrganizationPost.__table__.c.content == post_data["content"],
                    OrganizationPost.__table__.c.organization_id == org.id,
                )
            )
            if not existing.fetchone():
                post = OrganizationPost(
                    organization_id=org.id,
                    author_id=author.id,
                    content=post_data["content"],
                    status="published",
                )
                db.add(post)
        await db.commit()

        # Analytics
        for evt in ANALYTICS_EVENTS:
            org = org_objects[evt["org_index"]]
            existing = await db.execute(
                AnalyticsEvent.__table__.select().where(
                    AnalyticsEvent.__table__.c.event_type == evt["event_type"],
                    AnalyticsEvent.__table__.c.resource_id == str(org.id),
                )
            )
            if not existing.fetchone():
                ae = AnalyticsEvent(
                    event_type=evt["event_type"],
                    resource_type=evt["resource_type"],
                    resource_id=str(org.id),
                    organization_id=org.id,
                )
                db.add(ae)
        await db.commit()

        # Media files
        for mf in MEDIA_FILES:
            org = org_objects[mf["org_index"]]
            existing = await db.execute(
                MediaFile.__table__.select().where(
                    MediaFile.__table__.c.file_url == mf["url"],
                    MediaFile.__table__.c.organization_id == org.id,
                )
            )
            if not existing.fetchone():
                media = MediaFile(
                    file_type=mf["type"],
                    file_url=mf["url"],
                    alt_text=mf["alt"],
                    organization_id=org.id,
                    sort_order=0,
                )
                db.add(media)
        await db.commit()

        # Verification documents
        for vd in VERIFICATION_DOCS:
            org = org_objects[vd["org_index"]]
            user = user_map[ACCOUNTS[vd["user_index"]]["email"]]

            existing = await db.execute(
                VerificationDocument.__table__.select().where(
                    VerificationDocument.__table__.c.document_type == vd["doc_type"],
                    VerificationDocument.__table__.c.organization_id == org.id,
                )
            )
            if not existing.fetchone():
                doc = VerificationDocument(
                    document_type=vd["doc_type"],
                    file_url="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80",
                    status=vd["status"],
                    organization_id=org.id,
                    user_id=user.id,
                )
                db.add(doc)
        await db.commit()

        # Reports
        for rp in REPORTS_DATA:
            user = user_map[ACCOUNTS[rp["user_index"]]["email"]]
            org = org_objects[rp["org_index"]]

            existing = await db.execute(
                Report.__table__.select().where(
                    Report.__table__.c.description == rp["description"],
                    Report.__table__.c.user_id == user.id,
                )
            )
            if not existing.fetchone():
                report = Report(
                    resource_type=rp["resource_type"],
                    resource_id=org.id,
                    category=rp["category"],
                    description=rp["description"],
                    status="pending",
                    user_id=user.id,
                )
                db.add(report)
        await db.commit()

        # CMS: Pages
        cms_pages = [
            {"slug": "about-us", "title": "About Umma Directory",
             "content": "<h1>About Umma Directory</h1><p>Umma Directory is the premier platform for discovering verified halal businesses, mosques, charities, and community organizations across East Africa.</p>",
             "meta_title": "About Us - Umma Directory",
             "is_published": True, "version": 1},
            {"slug": "terms-of-service", "title": "Terms of Service",
             "content": "<h1>Terms of Service</h1><p>By using Umma Directory, you agree to these terms. Please read them carefully.</p>",
             "meta_title": "Terms of Service - Umma Directory",
             "is_published": True, "version": 1},
        ]
        for page_data in cms_pages:
            existing = await db.execute(
                CMSPage.__table__.select().where(CMSPage.__table__.c.slug == page_data["slug"])
            )
            if not existing.fetchone():
                page = CMSPage(**page_data)
                db.add(page)
        await db.commit()

        # CMS: Banner
        existing_banners = await db.execute(CMSBanner.__table__.select().limit(1))
        if not existing_banners.fetchone():
            banner = CMSBanner(
                title="Discover Halal Businesses Near You",
                subtitle="Explore top-rated restaurants, mosques, charities, and services in your community.",
                image_url="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
                link_url="/search",
                is_active=True,
                sort_order=1,
                placement="homepage",
            )
            db.add(banner)
        await db.commit()

        # CMS: Blog post
        existing_blog = await db.execute(BlogPost.__table__.select().limit(1))
        if not existing_blog.fetchone():
            blog = BlogPost(
                slug="welcome-to-umma-directory",
                title="Welcome to Umma Directory - Your Community Hub",
                excerpt="Discover how Umma Directory is connecting the Muslim community with verified halal businesses and services.",
                content="<p>We are excited to launch Umma Directory, the ultimate platform for discovering and connecting with halal businesses, mosques, charities, and community organizations across East Africa.</p><p>Our mission is to make it easy for the Muslim community to find trusted services and businesses that align with their values.</p>",
                cover_image_url="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
                is_published=True,
                published_at=datetime.now(UTC),
            )
            db.add(blog)
        await db.commit()

        # Step 10: Payment providers
        print("\n[10/10] Creating payment providers and finalizing...")
        providers = ["Stripe", "PayPal", "M-Pesa"]
        for prov_name in providers:
            existing = await db.execute(
                PaymentProvider.__table__.select().where(PaymentProvider.name == prov_name)
            )
            if not existing.fetchone():
                pp = PaymentProvider(name=prov_name, is_active=False, credentials={})
                db.add(pp)
        await db.commit()

        print("\n=== Seed data creation complete! ===")
        print(f"  16 user accounts")
        print(f"  10 organizations")
        print(f"  {len(REVIEWS_DATA)} reviews")
        print(f"  {len(FAVORITES_MAP)} favorites")
        print(f"  {len(EVENTS_DATA)} events")
        print(f"  {len(NOTIFICATIONS_DATA)} notifications")
        print(f"  {len(ADS_DATA)} advertisements")
        print(f"  3 ad campaigns")
        print(f"  {len(DONATIONS_DATA)} donations")
        print(f"  {len(CAMPAIGNS_DATA)} charity campaigns")
        print(f"  {len(POSTS_DATA)} posts")
        print(f"  {len(ANALYTICS_EVENTS)} analytics events")
        print(f"  {len(MEDIA_FILES)} media files")
        print(f"  {len(VERIFICATION_DOCS)} verification documents")
        print(f"  {len(REPORTS_DATA)} reports")
        print(f"  2 CMS pages + 1 banner + 1 blog post")
        print(f"  3 payment providers")


if __name__ == "__main__":
    asyncio.run(seed())
