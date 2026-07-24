# Test Accounts - Umma Directory

*Generated: 2026-07-23 22:18:53*

## Account Credentials

| Role | Name | Email | Password | Status |
|------|------|-------|----------|--------|
| Super Admin | Super Administrator | admin@ummadirectory.test | Admin@123456 | Active |
| Moderator | Aisha Mohammed | moderator1@ummadirectory.test | Moderator@123 | Active |
| Moderator | Omar Hassan | moderator2@ummadirectory.test | Moderator@123 | Active |
| Moderator | Fatima Ali | moderator3@ummadirectory.test | Moderator@123 | Active |
| Moderator | Hassan Ibrahim | moderator4@ummadirectory.test | Moderator@123 | Active |
| Moderator | Zainab Abdullah | moderator5@ummadirectory.test | Moderator@123 | Active |
| Registered User | Khalid Abdi | user1@ummadirectory.test | User@123 | Active |
| Registered User | Amina Omar | user2@ummadirectory.test | User@123 | Active |
| Registered User | Yusuf Mohamed | user3@ummadirectory.test | User@123 | Active |
| Registered User | Maryam Hassan | user4@ummadirectory.test | User@123 | Active |
| Registered User | Ibrahim Musa | user5@ummadirectory.test | User@123 | Active |
| Registered User | Halima Said | user6@ummadirectory.test | User@123 | Active |
| Registered User | Abdul Rahman | user7@ummadirectory.test | User@123 | Active |
| Registered User | Safiya Ahmed | user8@ummadirectory.test | User@123 | Active |
| Registered User | Musa Kamau | user9@ummadirectory.test | User@123 | Active |
| Registered User | Layla Hussein | user10@ummadirectory.test | User@123 | Active |

## Organization Ownership

| Organization | Type | Owner | Status |
|-------------|------|-------|--------|
| Al-Mina Halal Restaurant & Grill | Business | Khalid Abdi | Pending |
| Al-Nur Central Mosque | Mosque | Amina Omar | Approved |
| Al-Hikma Islamic Academy | Educational Institution | Yusuf Mohamed | Pending |
| Rahma Trust Foundation | Charity | Maryam Hassan | Approved |
| Ummah Development Network | Charity | Ibrahim Musa | Pending |
| Al-Shifa Medical Center | Business | Halima Said | Approved |
| Qasr Al-Salam Boutique Hotel | Business | Abdul Rahman | Pending |
| Layali Restaurant & Cafe | Business | Safiya Ahmed | Approved |
| Al-Barakah Health Clinic | Business | Musa Kamau | Pending |
| Pamoja Community Center | Business | Layla Hussein | Approved |

## Organization Managers

| Organization | Manager |
|-------------|---------|
| Rahma Trust Foundation | Yusuf Mohamed (user3) |
| Layali Restaurant & Cafe | Abdul Rahman (user7) |

## Role Permissions

### Super Administrator
- Full system access: User Management, Organization Management, Moderator Management
- Payment Settings, CMS, Analytics, Audit Logs, Security
- Categories, Advertisements, System Settings, API Health
- Organization Verification

### Moderator
- CAN: Review/Approve/Reject organizations, Moderate reviews and reports
- CAN: Suspend organizations, View claims, View audit logs
- CANNOT: Promote Super Admins, Change payment settings
- CANNOT: Delete audit logs, Access system security configuration

### Registered User
- Create and manage own business listings
- Create events
- Save favorites, leave reviews, make donations

## Validation Results

| Category | Passed | Failed | Skipped |
|----------|--------|--------|---------|
| **Total** | **108** | **0** | **0** |

## Notes

- All passwords are **development-only** and must not be used in production.
- Accounts are email-verified and active by default.
- Organizations with 'approved' status are verified and publicly visible.
- Organizations with 'pending' status require moderator approval.
- Run `python scripts/validate_seed_data.py` to re-validate.