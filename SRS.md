# Software Requirements Specification (SRS)

## for

# Umma Directory Platform

**Version:** 1.0  
**Status:** DRAFT  
**Date:** July 2026  
**Prepared for:** Umma Directory Development Team  

---

## Table of Contents

1. Introduction  
   1.1 Purpose  
   1.2 Document Conventions  
   1.3 Intended Audience and Reading Suggestions  
   1.4 Product Scope  
   1.5 References  

2. Overall Description  
   2.1 Product Perspective  
   2.2 Product Functions  
   2.3 User Classes and Characteristics  
   2.4 Operating Environment  
   2.5 Design and Implementation Constraints  
   2.6 User Documentation  
   2.7 Assumptions and Dependencies  

3. External Interface Requirements  
   3.1 User Interfaces  
   3.2 Hardware Interfaces  
   3.3 Software Interfaces  
   3.4 Communications Interfaces  

4. System Features  
   4.1 User Authentication and Account Management  
   4.2 Organization Listings (Businesses, Mosques, Charities, Education)  
   4.3 Search and Discovery  
   4.4 Reviews and Ratings  
   4.5 Favorites and Collections  
   4.6 Donations and Payments  
   4.7 Events Management  
   4.8 Organization Posts and Social Features  
   4.9 Advertisements and Ad Campaigns  
   4.10 Analytics and Reporting  
   4.11 Notification System  
   4.12 Content Management System  
   4.13 Admin Panel  
   4.14 Multi-Factor Authentication  
   4.15 Premier Subscriptions  
   4.16 Prayer Times  
    4.17 Reports and Moderation  
    4.18 Notification Types and Delivery  
    4.19 (Reserved)  
    4.20 File and Media Management  
    4.21 Geo-Spatial Search  
    4.22 Multi-Language Support

5. Non-Functional Requirements  
   5.1 Performance Requirements  
   5.2 Safety Requirements  
   5.3 Security Requirements  
   5.4 Software Quality Attributes  
   5.5 Business Rules  

6. Other Requirements  
   6.1 Database Requirements  
   6.2 API Standards  
   6.3 Deployment Requirements  

Appendices  
   Appendix A: Glossary  
   Appendix B: Data Model Overview  
   Appendix C: Permission Matrix  

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a comprehensive description of the Umma Directory platform. It defines the complete set of functional and non-functional requirements for the system, serving as a definitive reference for the development team, stakeholders, and quality assurance personnel. The document describes the system's purpose, features, interfaces, constraints, and behaviour in sufficient detail to guide the design, implementation, and testing phases of the software development lifecycle.

Umma Directory is a web-based community directory platform designed to serve Muslim communities by providing a centralised directory of Islamic businesses, mosques, charitable organisations, and educational institutions. The platform enables users to discover, review, donate to, and engage with organisations within their community while providing organisation owners with powerful tools to manage their online presence, run advertising campaigns, and track performance analytics.

### 1.2 Document Conventions

Throughout this document, the following conventions are observed:

- **SHALL**, **MUST**, **REQUIRED** indicate a mandatory requirement
- **SHOULD**, **RECOMMENDED** indicate a preferred requirement
- **MAY**, **OPTIONAL** indicate an optional requirement
- Terms defined in the glossary (Appendix A) appear in *italics* on first use
- References to API endpoints follow the pattern `HTTP_METHOD /path`
- Database model names appear in `monospace`
- Priority levels are indicated as: [HIGH], [MEDIUM], [LOW]

### 1.3 Intended Audience and Reading Suggestions

This document is intended for the following audiences:

- **Development Team**: To understand the complete feature scope, data models, business logic, and integration points required for implementation
- **Project Managers**: To track project scope, estimate effort, and plan development sprints
- **Quality Assurance Engineers**: To derive test cases, understand expected behaviour, and validate system compliance
- **Stakeholders and Product Owners**: To review and approve the proposed system functionality
- **DevOps Engineers**: To understand deployment requirements, infrastructure needs, and operational constraints
- **Documentation Writers**: To understand the system for creating user-facing documentation

### 1.4 Product Scope

Umma Directory is a comprehensive community directory platform that serves as a single source of truth for discovering and engaging with Islamic organisations. The system is positioned as the digital backbone of the Muslim community's organisational ecosystem, addressing the fragmented nature of existing community directories.

**Key Problem Statement**: Muslim communities globally lack a centralised, trusted platform to discover businesses, mosques, charities, and educational institutions that serve their needs. Existing solutions are fragmented, lack verification mechanisms, and rarely provide integrated tools for community engagement such as reviews, donations, events, and advertising.

**Product Vision**: To become the most trusted and comprehensive directory of Islamic organisations worldwide, empowering communities to connect, support, and grow together through technology.

**Strategic Goals**:
1. **Community Empowerment**: Provide a single platform where community members can discover, evaluate, and engage with all types of Islamic organisations in their area and beyond
2. **Trust and Transparency**: Build a trusted ecosystem through verified listings, authentic reviews, transparent donation processing, and accountable moderation
3. **Organisation Growth**: Equip organisation owners with digital tools to manage their online presence, reach new customers through advertising, and measure their performance through analytics
4. **Financial Inclusion**: Enable seamless donations and payments through multiple gateways including mobile money (M-Pesa) which serves users who may not have access to traditional banking
5. **Global Reach with Local Relevance**: Support multiple languages and localised content while maintaining a global directory of organisations serving Muslim communities worldwide

**Key Performance Indicators (KPIs)**:
- Number of registered organisations listed on the platform
- Number of monthly active users (MAU)
- Donation volume and conversion rate
- User engagement metrics (reviews written, events registered, favourites saved)
- Advertising revenue and campaign performance
- Platform response time and uptime percentage
- User satisfaction ratings and repeat usage rates

**Competitive Landscape**:
Umma Directory differentiates itself from generic business directories and community platforms through several unique value propositions:
- **Faith-Aligned Focus**: Every organisation on the platform is relevant to the Muslim community, eliminating noise from unrelated listings
- **Holistic Solution**: Unlike platforms that only offer listings or only offer donations, Umma Directory provides an integrated ecosystem of discovery, reviews, donations, events, and advertising
- **Verification System**: The document-based verification process adds a layer of trust that generic directories lack
- **Multi-Gateway Payments**: Support for M-Pesa (mobile money) alongside traditional card payments ensures accessibility across different economic contexts
- **Community Moderation**: A combination of algorithmic filtering (spam/profanity detection) and human moderation (moderator review team) ensures content quality
- **Multi-Language Support**: Serving English, Swahili, and Arabic speakers ensures accessibility across diverse Muslim communities

**Scope Boundaries**:
- **In Scope**: Web application (responsive design), RESTful API backend, PostgreSQL database, Redis caching layer, payment processing (Stripe, PayPal, M-Pesa), file storage (S3-compatible), email notifications (Mailgun), SMS notifications (Twilio/Africa's Talking), admin panel, analytics dashboard
- **Out of Scope**: Native mobile applications (iOS/Android), real-time chat/messaging, video streaming, marketplace/e-commerce functionality, job board, third-party directory imports

**Key Benefits**:
- Centralised discovery of verified Islamic organisations
- Trust-building through verified reviews and ratings
- Seamless donation processing with multiple payment gateways
- Powerful advertising platform for organisations to reach their community
- Comprehensive analytics for organisation owners
- Multi-language support (English, Swahili, Arabic)
- Mobile-responsive design for access on any device

### 1.5 References

The following documents and resources were used as references in the creation of this SRS:

| Reference | Description |
|-----------|-------------|
| IEEE Std 830-1998 | IEEE Recommended Practice for Software Requirements Specifications |
| FastAPI Documentation | https://fastapi.tiangolo.com/ |
| SQLAlchemy 2.0 Documentation | https://docs.sqlalchemy.org/ |
| Stripe API Reference | https://stripe.com/docs/api |
| PayPal Developer Docs | https://developer.paypal.com/docs/ |
| M-Pesa Daraja API Docs | https://developer.safaricom.co.ke/ |
| pyproject.toml | Project dependencies and tool configuration |
| BACKEND_API.md | Complete API endpoint reference |
| docker-compose.yml | Development and production deployment configuration |

---

## 2. Overall Description

### 2.1 Product Perspective

Umma Directory is a new, self-contained system built from the ground up as a modern web application. It does not replace any existing system but rather introduces a new platform to serve the Muslim community's organisational directory needs.

**System Architecture Overview**:

The platform follows a three-tier architecture pattern:

1. **Presentation Tier**: A React 19 single-page application built with TypeScript, Vite, and Tailwind CSS. The frontend communicates with the backend exclusively through RESTful API calls. Client-side routing is handled by React Router 7, state management by TanStack Query 5, and internationalisation by i18next.

2. **Application Tier**: A Python 3.13 FastAPI application that exposes a RESTful API. The application layer handles all business logic, authentication, authorisation, data validation, and orchestration. It leverages SQLAlchemy 2.x as its ORM for database interactions and integrates with external services for payments, email, SMS, and file storage.

3. **Data Tier**: PostgreSQL 17 with PostGIS extension serves as the primary database. Redis 7 provides caching, session management, rate limiting, and token blacklisting. The database schema is managed through Alembic migrations.

**Frontend Architecture**:

The frontend is a React 19 single-page application with the following architecture:

- **Routing**: React Router 7 manages client-side routing with lazy-loaded route components for code splitting. Public routes, authenticated routes, and admin routes are separated into distinct route groups with appropriate guards.
- **State Management**: TanStack Query 5 handles all server state (API data fetching, caching, mutations, optimistic updates). Local UI state is managed with React hooks (useState, useReducer, useContext).
- **Internationalisation**: i18next provides translation infrastructure with JSON-based translation files for English, Swahili, and Arabic. The library handles language detection, fallback resolution, and RTL layout switching.
- **Styling**: Tailwind CSS 3.x provides utility-first styling with a custom design system configuration defining colours, typography, spacing, and breakpoints. A dark mode variant is supported via CSS class toggling.
- **HTTP Client**: Axios is configured with interceptors for automatic JWT token injection, token refresh on 401 responses, and global error handling.
- **Map Integration**: Leaflet with React-Leaflet wrappers provides interactive maps for organisation location display and nearby search.
- **Forms**: React Hook Form with Zod validation schemas provides performant form handling with real-time validation.
- **Build Tool**: Vite handles bundling, hot module replacement (HMR) during development, and production builds with code splitting and tree shaking.

**Key Frontend Directory Structure**:
```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Generic UI primitives (buttons, inputs, cards, modals)
│   │   ├── layout/       # Layout components (header, footer, sidebar)
│   │   └── shared/       # Domain-specific shared components (review card, org card)
│   ├── pages/            # Route-level page components
│   ├── hooks/            # Custom React hooks (useAuth, useNotifications, etc.)
│   ├── services/         # API service layer (Axios instances, endpoint functions)
│   ├── i18n/             # Translation files and i18next configuration
│   ├── utils/            # Utility functions and helpers
│   ├── types/            # TypeScript type definitions
│   └── routes/           # Route configuration and guards
├── public/               # Static assets
└── vite.config.ts        # Vite build configuration
```

**External System Integrations**:

| External System | Purpose | Communication |
|----------------|---------|---------------|
| Stripe | Payment processing (credit/debit cards) | REST API + Webhooks |
| PayPal | Payment processing | REST API + Webhooks |
| M-Pesa (Daraja API) | Mobile money payments | REST API + Callbacks |
| Mailgun | Transactional email sending | REST API |
| Twilio / Africa's Talking | SMS notifications | REST API |
| S3-Compatible Storage | File and image hosting | boto3 SDK |
| Sentry | Error tracking and monitoring | SDK |
| Prometheus | System metrics and monitoring | HTTP endpoint |

### 2.2 Product Functions

The Umma Directory platform provides the following major functional areas:

**For Unauthenticated Users (Visitors)**:
- Browse and search organisations (businesses, mosques, charities, educational institutions)
- View organisation details, reviews, and ratings
- View events and blog posts
- Browse categories and browse by location
- View CMS pages and banners
- Register for a new account

**For Registered Users**:
- All visitor functionality
- Create and manage organisations (subject to permissions)
- Write and manage reviews
- Save favourites and organise into collections
- Donate to charities and campaigns
- Register for events and save events
- Receive notifications
- Manage profile and preferences
- Submit reports on inappropriate content
- Create ad campaigns for owned organisations

**For Organisation Owners/Managers**:
- All user functionality
- Update organisation profile and media
- Assign managers and staff
- Respond to reviews
- Create organisation posts
- View analytics dashboards
- Manage premier subscriptions
- Upload verification documents
- Create and manage ad campaigns
- Track advertising performance

**For Administrators (Moderators/Super Admins)**:
- All above functionality
- Approve/reject/suspend organisations
- Manage user accounts and roles
- Review and moderate content (reviews, reports)
- Manage categories, CMS pages, and banners
- Process ownership claims
- Approve verification documents
- Manage ad campaigns and advertisements
- View platform-wide analytics
- View audit logs
- Configure payment providers

### 2.3 User Classes and Characteristics

| User Class | Description | Technical Proficiency | Platform Access | Typical Frequency |
|------------|-------------|----------------------|-----------------|-------------------|
| **Visitor** | Unauthenticated user browsing the directory | Low to High | Read-only, public pages | Occasional |
| **Registered User** | Authenticated user with a personal account | Low to Medium | Full user features | Weekly to Daily |
| **Organisation Owner** | User who owns one or more organisation listings | Medium | Owner dashboard features | Daily |
| **Organisation Manager** | User delegated to manage an organisation | Medium | Limited management features | Daily |
| **Advertiser** | User who runs ad campaigns | Medium | Campaign management features | Weekly |
| **Donor** | User who makes donations | Low | Donation features only | Occasional |
| **Moderator** | Staff role for content moderation | High | Admin panel (limited) | Daily |
| **Super Admin** | Full system administrator | High | Complete admin panel | Daily |

### 2.4 Operating Environment

**Production Environment**:
- **Container Orchestration**: Docker Compose with Traefik reverse proxy
- **Application Server**: Python 3.13, Uvicorn ASGI server, 4 workers
- **Database**: PostgreSQL 17 with PostGIS extension
- **Caching Layer**: Redis 7 (Alpine)
- **Task Queue**: Celery with Redis broker
- **Frontend Serving**: Nginx (static files)
- **Operating System**: Linux (Debian/Ubuntu-based)

**Development Environment**:
- Docker Compose with hot-reload for both backend and frontend
- Mailpit for email testing (development SMTP server with web UI)
- Environment variables managed through `.env` files
- Hot-reload enabled via Uvicorn `--reload` flag

**Supported Browsers**:
- Google Chrome (last 2 major versions)
- Mozilla Firefox (last 2 major versions)
- Apple Safari (last 2 major versions)
- Microsoft Edge (last 2 major versions)
- Mobile browsers (Chrome Android, Safari iOS)

**System Requirements**:
- Minimum 2 CPU cores, 4GB RAM (production)
- Recommended 4 CPU cores, 8GB RAM (production)
- PostgreSQL 17+ with PostGIS
- Redis 7+
- S3-compatible object storage

### 2.5 Design and Implementation Constraints

**Technology Constraints**:
- Backend MUST be implemented in Python 3.13+ using FastAPI framework
- Frontend MUST be implemented using React 19 with TypeScript
- Database MUST be PostgreSQL 17+ with PostGIS extension
- All API responses MUST follow RESTful conventions
- JWT tokens MUST be used for authentication
- Passwords MUST be hashed using Argon2 algorithm
- All database access MUST be asynchronous (async/await)
- File storage MUST use S3-compatible object storage

**Security Constraints**:
- All API endpoints (except public ones) MUST require authentication
- Rate limiting MUST be applied to authentication endpoints
- CORS MUST be properly configured for the frontend origin
- All passwords MUST meet minimum strength requirements (12+ chars, mixed case, digits, special chars)
- JWT tokens MUST have configurable expiry (15 min access, 7 day refresh)
- Refresh tokens MUST be rotatable (each use generates new pair)
- MFA MUST be enforced for all users with admin/moderator roles
- XSS, CSRF, SQL injection protections MUST be implemented

**Regulatory Constraints**:
- The system MUST comply with applicable data protection regulations
- User personal data MUST be stored securely and not exposed unnecessarily
- Donation records MUST maintain audit trails for financial compliance
- GDPR right to deletion MUST be supported through account deactivation

**Deployment Constraints**:
- The system MUST be deployable via Docker Compose
- Database migrations MUST be automated via Alembic
- CI/CD pipeline MUST run linting, type checking, and tests
- Zero-downtime deployments SHOULD be supported

### 2.6 User Documentation

The following user documentation SHALL be provided:

1. **API Documentation**: Auto-generated OpenAPI/Swagger documentation at `/api/docs` (development only)
2. **Test Accounts Documentation**: Pre-seeded test accounts for development and QA
3. **Deployment Guide**: Instructions for production deployment
4. **Admin Guide**: Documentation for moderator and super admin features (in-app tooltips)

### 2.7 Assumptions and Dependencies

**Assumptions**:
- Users have access to a modern web browser with JavaScript enabled
- Users have an active email address for account registration and verification
- Users have an active phone number for optional phone verification
- Internet connectivity is available for accessing the platform
- Payment gateway accounts (Stripe, PayPal, M-Pesa) are configured by the platform operator
- Email sending service (Mailgun) is configured by the platform operator
- SMS sending service (Twilio or Africa's Talking) is configured by the platform operator
- S3-compatible storage is available for file uploads

**Dependencies**:
- Python 3.13+ runtime environment
- PostgreSQL 17+ database with PostGIS extension
- Redis 7+ for caching and task queue
- Docker and Docker Compose for containerised deployment
- External payment gateway APIs (Stripe, PayPal, M-Pesa Daraja)
- External email delivery service (Mailgun)
- External SMS delivery service (Twilio or Africa's Talking)
- S3-compatible object storage service
- Traefik reverse proxy (production deployment)

---

## 3. External Interface Requirements

### 3.1 User Interfaces

The user interface SHALL be a responsive web application accessible through modern web browsers. The following interface requirements apply:

**3.1.1 Responsive Design**: The UI SHALL adapt to four breakpoints:
- Mobile: 320px to 767px (single column, bottom navigation bar)
- Tablet: 768px to 1023px (two columns, sidebar navigation)
- Desktop: 1024px to 1439px (three columns, full sidebar)
- Wide Desktop: 1440px+ (max-width container, comfortable reading)

**3.1.2 Design System**: The UI SHALL follow a consistent design system defined in Tailwind CSS configuration:
- Primary colour: Emerald green (`#10B981`)
- Secondary colour: Sky blue (`#0EA5E9`)
- Surface colour: Slate (`#64748B`)
- Accent colour: Amber/gold (`#F59E0B`)
- Typography: Inter font family
- Dark mode support via CSS class toggling

**3.1.3 Page Layout**: The UI SHALL follow a consistent layout:
- Public pages: Header with logo and navigation, main content area, footer
- Authenticated pages: Sidebar navigation (desktop), bottom navigation (mobile), main content area, optional right sidebar
- Admin pages: Dedicated admin layout with left sidebar navigation

**3.1.4 Internationalisation**: The UI SHALL support three languages:
- English (default, LTR)
- Swahili (LTR)
- Arabic (RTL)
- Language selection SHALL be persisted in user preferences
- RTL layout SHALL be supported for Arabic language

**3.1.5 Key Pages**:

| Page | Route | Description |
|------|-------|-------------|
| Landing/Home | `/` | Hero section, featured listings, statistics, testimonials, FAQ |
| Business List | `/businesses` | Filterable, paginated list of businesses with map |
| Business Detail | `/businesses/{slug}` | Full business profile with reviews, posts, map, contact |
| Mosque List | `/mosques` | Filterable, paginated list of mosques |
| Mosque Detail | `/mosques/{slug}` | Full mosque profile with prayer times, facilities |
| Charity List | `/charities` | Filterable, paginated list of charities |
| Charity Detail | `/charities/{slug}` | Full charity profile with campaigns |
| Education List | `/education` | Filterable, paginated list of institutions |
| Education Detail | `/education/{slug}` | Full institution profile |
| Events | `/events` | Calendar/list view of upcoming events |
| Event Detail | `/events/{slug}` | Full event details with RSVP |
| Search Results | `/search?q=...` | Cross-entity search results |
| Category | `/categories/{slug}` | Organisations in a specific category |
| Register | `/register` | User registration form |
| Login | `/login` | User login form |
| User Dashboard | `/dashboard` | Aggregated user stats and activity |
| User Profile | `/profile` | Profile editing |
| Notifications | `/notifications` | Notification list and preferences |
| Favorites | `/favorites` | Saved organisations with collections |
| Donations | `/donations` | Donation history |
| Admin Dashboard | `/admin` | Platform management dashboard |

**3.1.6 Component Library**: Reusable UI components SHALL include:
- Button variants (primary, secondary, outline, ghost, danger)
- Input fields with validation states
- Cards with multiple layout variants
- Modal dialogs and bottom sheets (mobile)
- Skeleton loading states
- Star rating display and input
- Media gallery with lightbox
- Interactive map using Leaflet
- Pagination controls
- Tab navigation
- Badge and tag components

**3.1.7 Form Validation Requirements**:
All forms in the user interface SHALL implement the following validation patterns:
- **Inline validation**: Error messages SHALL appear next to the relevant field immediately after the user finishes typing (on blur)
- **Form-level validation**: On form submission, all fields SHALL be re-validated and all errors shown simultaneously
- **Password strength indicator**: A visual indicator SHALL show password strength (weak, medium, strong) in real-time as the user types
- **Character counters**: Text fields with maximum lengths SHALL show remaining character counts
- **Debounced input**: Search and autocomplete inputs SHALL use 300ms debounce before triggering API calls
- **Loading states**: Submit buttons SHALL show a spinner and become disabled during form submission
- **Success feedback**: Successful form submissions SHALL show a brief success toast notification

**3.1.8 Accessibility Requirements**:
- All interactive elements SHALL be keyboard accessible
- All images SHALL have appropriate alt text
- Forms SHALL have proper label associations
- Colour SHALL NOT be the sole means of conveying information
- Focus indicators SHALL be visible (focus ring styling)
- ARIA landmarks SHALL be used for page structure
- Screen reader announcements SHALL be used for dynamic content changes
- Colour contrast ratios SHALL meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text)

**3.1.9 Error and Empty State Handling**:
- **404 Pages**: Custom 404 page with navigation options
- **Empty Lists**: Informative empty state illustrations with suggestions for next actions
- **Network Errors**: Retry prompts with automatic retry for background operations
- **API Errors**: Toast notifications showing error messages from API responses
- **Loading States**: Skeleton loading components for all list and detail views
- **Partial Data**: Graceful handling of missing optional fields in display components

### 3.2 Hardware Interfaces

The Umma Directory platform does not interact directly with any hardware devices. All hardware interactions are mediated through the operating system and containerisation layer:

- **Storage**: S3-compatible object storage is accessed via HTTP API (boto3 SDK), abstracting the underlying storage hardware
- **Network**: Standard TCP/IP networking for all external communications
- **Compute**: CPU and memory resources are managed by the Docker container runtime and operating system

### 3.3 Software Interfaces

**3.3.1 Database Interface (PostgreSQL)**:
- Connection: Asynchronous via `asyncpg` driver through SQLAlchemy 2.x
- ORM: SQLAlchemy declarative models with `async_sessionmaker`
- Migrations: Alembic for schema versioning
- Connection pooling: Configurable pool size (default 10), overflow (default 20)

**3.3.2 Cache Interface (Redis)**:
- Connection: Asynchronous via `redis` library with `decode_responses=True`
- Usage: Token blacklisting, session storage, rate limiting, caching, idempotency keys, phone verification codes
- Pool: Singleton connection with configurable timeouts

**3.3.3 Task Queue (Celery)**:
- Broker: Redis
- Tasks: Email sending, cleanup operations, scheduled maintenance
- Scheduling: Celery Beat for periodic tasks

**3.3.4 Payment Gateway Interfaces**:

*Stripe*:
- Integration: Stripe Python SDK
- Methods: Payment Intents API, Webhook verification
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

*PayPal*:
- Integration: PayPal Orders API v2 via HTTP requests
- Methods: Create order, capture order, webhook verification
- Authentication: OAuth 2.0 client credentials

*M-Pesa (Daraja API)*:
- Integration: HTTP REST API with OAuth 2.0 bearer token
- Method: STK Push (Simulate/LNM Online)
- Authentication: Consumer key/secret for access token
- Callback: POST endpoint for payment confirmation

**3.3.5 Email Interface (Mailgun)**:
- Integration: Mailgun HTTP API
- Templates: Jinja2 HTML email templates
- Template types: Verify email, password reset, donation receipt, notification

**3.3.6 SMS Interface**:
- Twilio: REST API for SMS sending
- Africa's Talking: REST API for SMS sending
- Configurable provider selection via environment variable

**3.3.7 File Storage Interface**:
- Protocol: S3-compatible API via boto3 SDK
- Operations: Put object, generate URL
- Bucket: Configurable bucket name and region
- Endpoint: Configurable S3 endpoint URL (supports non-AWS providers)

**3.3.8 Error Monitoring (Sentry)**:
- Integration: Sentry Python SDK
- Initialisation: Conditional on `SENTRY_DSN` being configured
- Environment tagging: Based on `APP_ENV` setting

### 3.4 Communications Interfaces

**3.4.1 API Protocol**:
- Protocol: HTTPS (production), HTTP (development)
- Method: RESTful over HTTP/1.1
- Content-Type: `application/json` for requests and responses
- Character Encoding: UTF-8

**3.4.2 API Request/Response Format**:
- All request bodies: JSON object
- All response bodies: JSON object
- Success responses: Include requested data directly
- Error responses: `{"detail": "Error message"}` or `{"detail": {"field": ["validation error"]}}`
- List responses: `{"items": [...], "total": N, "page": N, "size": N, "pages": N}`
- HTTP status codes follow REST conventions (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Validation Error, 429 Rate Limited, 500 Server Error)

**3.4.3 Authentication Header**:
- Format: `Authorization: Bearer <jwt_token>`
- Scheme: Bearer token
- Token type: JWT (JSON Web Token)

**3.4.4 CORS Configuration**:
- Allowed origins: Configurable via `CORS_ORIGINS` environment variable
- Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Allowed headers: Authorization, Content-Type, Accept, X-Requested-With, X-Idempotency-Key
- Credentials: Allowed

**3.4.5 Webhook Interfaces**:

Payment gateway webhooks SHALL:
- Accept POST requests with raw body
- Verify signature/authenticity using gateway-specific methods
- Use Redis for idempotency (7-day deduplication window)
- Respond with `200 OK` for processed events, `202 Accepted` for ignored events
- Support Stripe webhooks, PayPal webhooks, M-Pesa callbacks

**3.4.6 Security Headers**:

All HTTP responses SHALL include:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'`

---

## 4. System Features

### 4.1 User Authentication and Account Management

**Priority**: [HIGH]

**4.1.1 Description**:
The authentication system provides secure user registration, login, and account management. It uses JWT-based authentication with access and refresh tokens, Argon2 password hashing, and supports email verification, phone verification, password reset, and multi-factor authentication.

**4.1.2 Functional Requirements**:

**REQ-AUTH-01**: User Registration
- The system SHALL allow new users to register with email, password, full name, and optionally phone number
- The system SHALL validate that the email is not already registered
- The system SHALL validate that the phone number (if provided) is not already registered
- The system SHALL validate password strength (minimum 12 characters, at least one uppercase, one lowercase, one digit, one special character)
- The system SHALL assign the `registered_user` role to new accounts
- The system SHALL create a default `NotificationPreference` record for the new user
- The system SHALL send an email verification link to the registered email
- The system SHALL enforce a rate limit of 5 requests per minute
- The system SHALL return a success message (not revealing whether the email exists)

**REQ-AUTH-02**: Email Verification
- The system SHALL verify user email via a signed token sent in the verification email
- The token SHALL expire after 24 hours
- The system SHALL handle expired tokens gracefully with an appropriate error message
- The system SHALL handle invalid/bad signature tokens with an appropriate error message
- The system SHALL mark the user's email as verified upon successful confirmation
- The system SHALL allow resending of verification emails

**REQ-AUTH-03**: User Login
- The system SHALL authenticate users by email and password
- The system SHALL lock the account for 15 minutes after 5 failed login attempts
- The system SHALL return a JWT access token (short-lived, default 15 minutes) and refresh token (long-lived, default 7 days)
- The system SHALL return the user profile (including role and permissions) with the login response
- The system SHALL track active sessions in Redis (max 5 concurrent sessions)
- The system SHALL log login events to the audit log
- The system SHALL enforce a rate limit of 10 requests per minute
- The system SHALL reject login for inactive accounts

**REQ-AUTH-04**: Token Refresh
- The system SHALL accept a valid refresh token and return a new access token and refresh token pair
- The system SHALL validate that the refresh token has not been blacklisted
- The system SHALL validate that the session is still active (not logged out elsewhere)
- The system SHALL blacklist the old refresh token after successful rotation
- The system SHALL enforce a rate limit of 10 requests per minute

**REQ-AUTH-05**: Logout
- The system SHALL blacklist the current access token for its remaining lifetime
- The system SHALL remove the corresponding session from Redis
- The system SHALL log the logout event

**REQ-AUTH-06**: Password Reset
- The system SHALL send a password reset link via email when requested
- The reset token SHALL expire after 1 hour
- The system SHALL NOT reveal whether the email exists in the system
- The system SHALL enforce a rate limit of 3 requests per minute for forgot-password
- The system SHALL enforce a rate limit of 5 requests per minute for reset-password

**REQ-AUTH-07**: Phone Verification
- The system SHALL send a 6-digit verification code via SMS
- The code SHALL be stored in Redis with a 5-minute TTL
- The system SHALL validate the code and phone number match
- The system SHALL enforce a rate limit of 3 requests per minute for sending
- The system SHALL enforce a rate limit of 5 requests per minute for verifying

**REQ-AUTH-08**: Profile Management
- The system SHALL allow users to update their profile (name, phone, email, language, photos, bio, city, country)
- The system SHALL require re-verification if the email is changed
- The system SHALL validate that the new phone/email is not already in use
- The system SHALL allow users to change their password (requires current password verification)
- The system SHALL blacklist the current token after password change

**REQ-AUTH-09**: Account Deactivation
- The system SHALL allow users to soft-deactivate their account (set `is_active = False`)
- Deactivated accounts SHALL NOT be able to log in
- The system SHALL log the deactivation event

**REQ-AUTH-10**: Session Management
- The system SHALL show users their active sessions (IP, user agent, login time)
- The system SHALL allow users to log out all other sessions
- The system SHALL limit concurrent sessions to 5 per user

### 4.2 Organization Listings (Businesses, Mosques, Charities, Education)

**Priority**: [HIGH]

**4.2.1 Description**:
The platform supports four types of organisation listings using a polymorphic inheritance pattern. All organisation types share common fields (name, description, location, contact, media) while each type has specialised fields. Organisations go through a moderation workflow (pending, approved, rejected, suspended).

**4.2.2 Functional Requirements**:

**REQ-ORG-01**: Organization Model
- The system SHALL support a base `Organization` model with common fields: name, slug, description, email, phone, website, address, city, country, coordinates, logo, cover image, verification status, moderation status, view count, ratings, review count, owner
- The system SHALL support polymorphic subtypes: `Business`, `Mosque`, `Charity`, `EducationalInstitution`
- Each subtype SHALL inherit all base fields and add subtype-specific fields
- The system SHALL automatically generate a unique URL slug from the organisation name

**REQ-ORG-02**: Organization Creation
- The system SHALL allow verified email users with the appropriate permission to create organisations
- New organisations SHALL be created in `pending` status
- The system SHALL require the user to have the specific permission for the organisation type (`business.create`, `mosque.create`, `charity.create`, `education.create`)
- The system SHALL enforce a rate limit of 5 creation requests per minute per user
- The system SHALL generate a unique slug by appending a counter if the base slug is taken

**REQ-ORG-03**: Organization Listing (Public)
- The system SHALL list approved organisations only (status = "approved")
- The system SHALL support filtering by: type, city, country, verification status, search query, category (businesses only), halal certification (businesses only), premier status (businesses only)
- The system SHALL support sorting by: newest, oldest, rating, views, premier status
- The system SHALL support pagination with configurable page size (default 20, max 100)
- The system SHALL include an `is_featured` flag for businesses with active featured listing ad campaigns

**REQ-ORG-04**: Organization Detail (Public)
- The system SHALL return full organisation details when accessed by slug
- The system SHALL increment the view counter on each access
- The system SHALL return the organisation type-specific fields based on the polymorphic type

**REQ-ORG-05**: Organization Update
- The system SHALL allow the organisation owner or a manager with editor role to update the organisation
- The system SHALL trigger a pending review for approved businesses when major fields (name, description, contact, address, category, coordinates, operating hours) are changed
- Non-major field changes SHALL be applied immediately
- The system SHALL apply changes immediately for organisations that are not in `approved` status

**REQ-ORG-06**: Organization Deletion
- The system SHALL allow the organisation owner to delete their organisation
- Deletion SHALL be a hard delete (removing from database)

**REQ-ORG-07**: Organization Manager System
- The system SHALL allow organisation owners to assign a single manager by email
- The manager SHALL receive a notification when assigned
- The manager role can be `manager` or `editor`
- The system SHALL allow the owner to remove the manager
- Only one manager SHALL be assignable per organisation at a time

**REQ-ORG-08**: Organization Ownership Claims
- The system SHALL allow users to submit ownership claims for unowned organisations
- The user SHALL have a verified email before submitting a claim
- The system SHALL prevent duplicate pending claims
- Claims SHALL be reviewed by moderators
- The system SHALL prevent the current owner from claiming their own organisation

**REQ-ORG-09**: Business-Specific Features
- The system SHALL support categories (hierarchical, multi-language names)
- The system SHALL support branches (multiple locations under one business)
- The system SHALL track halal certification status
- The system SHALL support operating hours (per day of week with open/close times)
- The system SHALL support social media links
- The system SHALL verify businesses through document submission (business license, tax certificate, ID document)
- The system SHALL support premier subscriptions (paid premium listing status)

**REQ-ORG-10**: Mosque-Specific Features
- The system SHALL track facilities: women's section, parking, children's facilities, wheelchair accessibility
- The system SHALL support prayer times as JSON configuration
- The system SHALL support multiple admins (primary admin + additional admins via OrganizationManager)
- The system SHALL allow users to subscribe to prayer time updates

**REQ-ORG-11**: Charity-Specific Features
- The system SHALL track registration number and mission statement
- The system SHALL support fundraising campaigns with target amount, deadline, category
- Campaigns SHALL track amount raised and have a lifecycle (active, paused, completed)
- Donations SHALL update the campaign's raised amount

**REQ-ORG-12**: Education-Specific Features
- The system SHALL track institution type, curriculum, and programs
- The system SHALL support flags: girls section, boarding, Quran program
- The system SHALL support facilities and programs as JSON configuration

### 4.3 Search and Discovery

**Priority**: [HIGH]

**4.3.1 Description**:
The search system provides full-text search across all organisation types, autocomplete suggestions, and geo-spatial nearby search. Results are cached in Redis for performance.

**4.3.2 Functional Requirements**:

**REQ-SEARCH-01**: Full-Text Search
- The system SHALL search across businesses, mosques, charities, educational institutions, and events
- The system SHALL support filtering by: organisation type, category, city, verification status, premier status, minimum rating
- The system SHALL support pagination
- The system SHALL use ILIKE for case-insensitive partial matching
- The system SHALL search across: name/title, description, mission statement, venue
- The system SHALL cache search results with a 120-second TTL

**REQ-SEARCH-02**: Autocomplete Suggestions
- The system SHALL provide quick suggestions as the user types
- The system SHALL require a minimum of 2 characters before returning suggestions
- The system SHALL search across businesses, mosques, charities, and education institutions
- The system SHALL use ILIKE prefix matching for performance
- The system SHALL return results limited to configurable count (default 8, max 20)

**REQ-SEARCH-03**: Nearby Search
- The system SHALL support geo-spatial search using Haversine distance calculation
- The system SHALL accept latitude, longitude, and radius (in kilometres)
- The system SHALL return results within the specified radius
- The system SHALL support filtering by organisation type
- The system SHALL return distance in kilometres for each result
- The system SHALL cache nearby search results with a 120-second TTL

### 4.4 Reviews and Ratings

**Priority**: [HIGH]

**4.4.1 Description**:
The review system allows registered users to rate and review organisations. Reviews include spam/profanity filtering, edit windows, reply functionality, and automatic rating aggregation.

**4.4.2 Functional Requirements**:

**REQ-REVIEW-01**: Review Creation
- The system SHALL allow verified email users with `review.create` permission to create reviews
- The system SHALL require a rating (1-5) and optional comment and images
- The system SHALL prevent duplicate reviews (one review per user per organisation)
- The system SHALL filter comments for spam and profanity (configurable word lists)
- The system SHALL automatically update the organisation's `avg_rating` and `review_count`
- The system SHALL enforce a rate limit of 10 reviews per minute

**REQ-REVIEW-02**: Review Listing (Public)
- The system SHALL list published reviews for an organisation
- The system SHALL support pagination
- The system SHALL include the review author's name and the organisation's reply (if any)

**REQ-REVIEW-03**: Review Editing
- The system SHALL allow the review author to edit their review within 30 minutes of creation
- The system SHALL mark edited reviews with `is_edited = True`
- The system SHALL track the number of edits

**REQ-REVIEW-04**: Review Deletion
- The system SHALL allow the review author to soft-delete their review within 24 hours of creation

**REQ-REVIEW-05**: Review Replies
- The system SHALL allow the organisation owner to reply to a review
- The system SHALL allow only one reply per review
- The system SHALL require the `review.respond` permission

### 4.5 Favorites and Collections

**Priority**: [MEDIUM]

**4.5.1 Description**:
Users can save organisations to their favourites list and organise them into named collections. A feed feature shows posts from favourited organisations.

**4.5.2 Functional Requirements**:

**REQ-FAV-01**: Favorites Management
- The system SHALL allow authenticated users to add an organisation to their favourites
- The system SHALL prevent duplicate favourites (unique per user-organisation pair)
- The system SHALL allow removal of favourites
- The system SHALL allow searching within favourites by organisation name

**REQ-FAV-02**: Collections
- The system SHALL allow users to create named collections
- The system SHALL allow users to move favourites between collections
- The system SHALL allow users to delete collections

**REQ-FAV-03**: Favorites Feed
- The system SHALL show a feed of posts from the user's favourited organisations
- The feed SHALL be paginated
- The feed SHALL show posts in reverse chronological order
- The feed SHALL only include published posts

### 4.6 Donations and Payments

**Priority**: [HIGH]

**4.6.1 Description**:
The donations system allows users to donate to charities (directly or through campaigns) with support for multiple payment gateways. The payment system is a generic payment intent processor supporting Stripe, PayPal, and M-Pesa.

**4.6.2 Functional Requirements**:

**REQ-DON-01**: Donation Initiation
- The system SHALL allow verified email users with `donation.create` permission to initiate donations
- The system SHALL support donations to a specific campaign or directly to a verified charity
- The system SHALL validate minimum donation amount (configurable, default 10.00)
- The system SHALL support idempotency keys to prevent duplicate donations
- The system SHALL support multiple currencies (configurable, default: KES, USD, EUR, GBP)
- The system SHALL allow anonymous donations
- The system SHALL create a payment intent through the selected payment gateway
- The system SHALL generate a unique receipt number prefixed with "DON-"

**REQ-DON-02**: Donation Confirmation
- The system SHALL confirm the donation upon successful payment
- The system SHALL update the campaign's `amount_raised` if applicable
- The system SHALL send a donation receipt via email
- The system SHALL create an in-app notification
- The system SHALL generate a PDF receipt for download

**REQ-DON-03**: Donation History
- The system SHALL show the user's donation history (paginated)
- The system SHALL include: amount, currency, status, receipt number, anonymous flag, organisation, campaign, date

**REQ-DON-04**: Campaign Donations (Public)
- The system SHALL show anonymised donations for a campaign
- The system SHALL show only completed donations

**REQ-DON-05**: Donation Stats
- The system SHALL show total donation count and sum

**REQ-PAY-01**: Payment Intent Creation
- The system SHALL create payment intents through configured gateways (Stripe, PayPal, M-Pesa)
- The system SHALL support idempotency keys to prevent duplicate charges
- The system SHALL store payment records with gateway reference IDs
- The system SHALL support reference types for payment attribution (premier_subscription, ad_campaign, donation, featured_listing)

**REQ-PAY-02**: Payment Webhooks
- The system SHALL receive webhooks from all supported payment gateways
- The system SHALL verify webhook authenticity using gateway-specific methods
- The system SHALL use Redis for webhook deduplication (7-day window)
- The system SHALL update payment status based on webhook events
- The system SHALL log payment status changes

**REQ-PAY-03**: Payment Refunds
- The system SHALL allow users to refund succeeded payments
- The system SHALL prevent refund of payments linked to completed donations

**REQ-PAY-04**: Payment Invoices
- The system SHALL generate PDF invoices for succeeded payments
- The invoice SHALL include: invoice number, date, payment method, description, amount, currency

**REQ-PAY-05**: Saved Payment Methods
- The system SHALL allow users to save payment methods (Stripe/PayPal)
- The system SHALL support setting a default payment method
- The system SHALL allow removal of saved payment methods

### 4.7 Events Management

**Priority**: [MEDIUM]

**4.7.1 Description**:
The events system allows the creation and management of community events. Events can be created by users or organisations, and include registration tracking and calendar export.

**4.7.2 Functional Requirements**:

**REQ-EVENT-01**: Event Creation
- The system SHALL allow users with `event.create` permission to create events
- Events SHALL include: title, description, date/time, venue, coordinates, registration link, cover image, category
- Events SHALL be immediately published upon creation
- The system SHALL support events linked to an organisation or created by an individual user

**REQ-EVENT-02**: Event Listing (Public)
- The system SHALL list published events
- The system SHALL support filtering by category and organiser
- The system SHALL support sorting by date (upcoming first or past first)
- The system SHALL support pagination

**REQ-EVENT-03**: Event Update and Deletion
- The system SHALL allow the event creator to update events
- The system SHALL allow soft-deletion of events

**REQ-EVENT-04**: Event Registration
- The system SHALL allow users to RSVP for events
- The system SHALL increment the registration count on each RSVP

**REQ-EVENT-05**: Saved Events
- The system SHALL allow users to save/unsave events to their personal list
- The system SHALL show the user's saved events

**REQ-EVENT-06**: Calendar Export
- The system SHALL generate an iCalendar (.ics) file for any event
- The file SHALL be downloadable with proper content-type headers

### 4.8 Organization Posts and Social Features

**Priority**: [MEDIUM]

**4.8.1 Description**:
Organisations can publish posts to share updates with their followers. Posts support likes and are displayed in the favourites feed.

**4.8.2 Functional Requirements**:

**REQ-POST-01**: Post Creation
- The system SHALL allow organisation owners and administrators to create posts
- Posts SHALL include: content (text), optional image URL
- Posts SHALL be published immediately

**REQ-POST-02**: Post Listing
- The system SHALL list published posts for an organisation
- Posts SHALL be ordered by creation date (newest first)
- The system SHALL show whether the current user has liked each post (if authenticated)

**REQ-POST-03**: Post Likes
- The system SHALL allow users to toggle likes on posts
- The system SHALL update the like count in real-time
- The system SHALL track which users liked which posts

**REQ-POST-04**: Post Deletion
- The system SHALL allow the post author or admins to delete posts

### 4.9 Advertisements and Ad Campaigns

**Priority**: [HIGH]

**4.9.1 Description**:
The platform provides two advertising systems: simple advertisements (image/CTA ads) and comprehensive ad campaigns (with budget, targeting, scheduling, and analytics). Ad campaigns support three types: featured listings, feed ads, and category spotlights.

**4.9.2 Functional Requirements**:

**REQ-AD-01**: Advertisement Creation
- The system SHALL allow verified email users to create advertisements
- Advertisements SHALL include: type, title, image, destination URL, placement, optional schedule
- New advertisements SHALL be created in `pending` status
- Advertisements SHALL be moderated by admins before activation

**REQ-AD-02**: Advertisement Tracking
- The system SHALL track impressions and clicks for each advertisement
- Tracking endpoints SHALL NOT require authentication

**REQ-AD-03**: Advertisement Listing (Public)
- The system SHALL list active, approved advertisements
- The system SHALL support filtering by placement

**REQ-AD-04**: Ad Campaign Creation
- The system SHALL allow organisation owners with `campaign.create` permission to create campaigns
- Campaign types: `featured_listing`, `feed_ad`, `category_spotlight`
- The system SHALL validate that start date is before end date
- The system SHALL prevent duplicate `featured_listing` campaigns (only one active/pending per organisation)
- Campaigns SHALL be created in `draft` status

**REQ-AD-05**: Campaign Lifecycle
- Campaign statuses: `draft`, `pending_review`, `active`, `paused`, `completed`, `cancelled`, `rejected`
- The system SHALL support transitions: draft → pending_review (submit), pending_review → active (admin approve), active → paused, paused → active (resume), active/completed/paused → cancelled, any → complete (end date reached)
- Draft campaigns SHALL be editable
- Campaigns SHALL require payment before activation

**REQ-AD-06**: Campaign Targeting
- Campaigns SHALL support targeting by: country, city, categories, languages, location radius
- Feed ads SHALL be served randomly to users on the platform
- Category spotlights SHALL target specific categories

**REQ-AD-07**: Campaign Analytics
- The system SHALL track impressions and clicks per campaign
- Daily analytics SHALL be stored in `AdAnalytics` table (unique per campaign per date)
- Each campaign SHALL show: total impressions, total clicks, CTR, spend

**REQ-AD-08**: Campaign Renewal
- The system SHALL allow renewal of campaigns by extending the end date
- Renewed campaigns that were completed or paused SHALL return to `pending_review`

**REQ-AD-09**: Ad Serving
- Feed ads SHALL be served as random selections from active campaigns of type `feed_ad`
- Spotlight ads SHALL be served as a single random selection from active `category_spotlight` campaigns

### 4.10 Analytics and Reporting

**Priority**: [MEDIUM]

**4.10.1 Description**:
The analytics system tracks user interactions (clicks, searches, directions) and provides dashboards for organisation owners and administrators.

**4.10.2 Functional Requirements**:

**REQ-ANALYTICS-01**: Event Tracking
- The system SHALL track click events (website, phone, WhatsApp, email, direction)
- The system SHALL track direction requests
- The system SHALL track search queries
- All events SHALL be stored in the `AnalyticsEvent` table with event type, resource type, resource ID, user ID, and metadata

**REQ-ANALYTICS-02**: Business Analytics
- The system SHALL show analytics for an owned business: total views, reviews, average rating, favourite count, click breakdown, search impressions

**REQ-ANALYTICS-03**: Resource Analytics
- The system SHALL show analytics for any owned resource (business, mosque, charity, education)
- The system SHALL include 30-day historical interaction data

**REQ-ANALYTICS-04**: Owner Dashboard
- The system SHALL provide an aggregated dashboard for owners with multiple businesses
- The system SHALL show: total businesses by status, total views, total reviews, average rating

**REQ-ANALYTICS-05**: Admin Overview
- The system SHALL show platform-wide analytics: total searches, total clicks, top viewed businesses
- This SHALL require super_admin role

### 4.11 Notification System

**Priority**: [MEDIUM]

**4.11.1 Description**:
The notification system delivers in-app notifications to users for various events (review responses, donation confirmations, approval notifications, etc.).

**4.11.2 Functional Requirements**:

**REQ-NOTIF-01**: Notification Creation
- The system SHALL create notifications for key events: organisation approval/rejection, review replies, donation confirmations, verification updates, campaign status changes, claim outcomes, manager assignments
- Each notification SHALL include: type, title, message, optional data payload

**REQ-NOTIF-02**: Notification Listing
- The system SHALL list the user's notifications (paginated, newest first)
- The system SHALL exclude soft-deleted notifications

**REQ-NOTIF-03**: Notification Management
- The system SHALL allow marking individual notifications as read
- The system SHALL allow marking all notifications as read
- The system SHALL allow soft-deleting notifications

**REQ-NOTIF-04**: Notification Preferences
- The system SHALL allow users to configure notification preferences
- Preferences SHALL include: email notifications, in-app notifications, listing updates, donation updates, review updates, promotional messages, security alerts
- Default settings SHALL enable all except promotional messages

### 4.12 Content Management System

**Priority**: [LOW]

**4.12.1 Description**:
The CMS provides management of static pages, banners, and blog posts. This is a lightweight CMS for platform content.

**4.12.2 Functional Requirements**:

**REQ-CMS-01**: CMS Pages
- The system SHALL serve published CMS pages by slug
- Pages SHALL include: title, content (HTML), meta title, meta description

**REQ-CMS-02**: Banners
- The system SHALL serve active banners ordered by sort order
- Banners SHALL be filterable by placement
- Each banner SHALL include: title, optional subtitle, image URL, optional link URL

**REQ-CMS-03**: Blog Posts
- The system SHALL list published blog posts (newest first)
- The system SHALL serve individual blog posts by slug
- Posts SHALL include: title, excerpt, content, cover image, publish date

### 4.13 Admin Panel

**Priority**: [HIGH]

**4.13.1 Description**:
The admin panel provides moderation and administration capabilities for platform operators. It enforces MFA for all admin users and role-based access control.

**4.13.2 Functional Requirements**:

**REQ-ADMIN-01**: Admin Dashboard
- The system SHALL show aggregated platform counts: total users, businesses, mosques, charities, education institutions
- The system SHALL show pending counts for each organisation type
- The system SHALL show pending reports and pending claims counts

**REQ-ADMIN-02**: User Management (Super Admin)
- The system SHALL list all users with pagination
- The system SHALL allow suspending/unsuspending users
- The system SHALL allow changing user roles

**REQ-ADMIN-03**: Organization Management (Moderator)
- The system SHALL list all organisations (filterable by status)
- The system SHALL list pending organisations for approval
- The system SHALL allow approving organisations (sends notification to owner)
- The system SHALL allow rejecting organisations with a reason
- The system SHALL allow suspending organisations
- The system SHALL allow restoring suspended organisations

**REQ-ADMIN-04**: Business Edit Moderation (Moderator)
- The system SHALL list businesses with pending edits
- The system SHALL allow approving pending edits (applies changes to business)
- The system SHALL allow rejecting pending edits with a reason

**REQ-ADMIN-05**: Verification Document Moderation (Moderator)
- The system SHALL list pending verification documents with organisation and user info
- The system SHALL allow approving documents (marks organisation as verified)
- The system SHALL allow rejecting documents with a reason (sends notification)

**REQ-ADMIN-06**: Review Moderation (Moderator)
- The system SHALL list all reviews
- The system SHALL allow removing reviews (sets status to `removed`)
- The system SHALL allow restoring removed reviews

**REQ-ADMIN-07**: Claim Moderation (Moderator)
- The system SHALL list pending ownership claims
- The system SHALL allow approving claims (transfers ownership)
- The system SHALL allow rejecting claims with a reason

**REQ-ADMIN-08**: Report Moderation (Moderator)
- The system SHALL list pending reports
- The system SHALL allow resolving reports with action taken: dismissed, warning, content_removed, user_suspended, escalated

**REQ-ADMIN-09**: Audit Logs (Super Admin)
- The system SHALL list audit logs (paginated)
- Each log entry SHALL show: action, resource type, resource ID, user, IP address, user agent, timestamp, details

**REQ-ADMIN-10**: Category Management (Moderator/Super Admin)
- The system SHALL allow listing all categories
- The system SHALL allow creating categories
- The system SHALL allow updating categories
- The system SHALL allow soft-deleting categories (Super Admin only)

**REQ-ADMIN-11**: CMS Page Management (Moderator/Super Admin)
- The system SHALL allow listing all CMS pages
- The system SHALL allow creating CMS pages
- The system SHALL allow updating CMS pages
- The system SHALL allow soft-deleting CMS pages (Super Admin only)

**REQ-ADMIN-12**: Ad Moderation (Moderator)
- The system SHALL list pending advertisements
- The system SHALL allow approving/rejecting advertisements

**REQ-ADMIN-13**: Campaign Moderation (Moderator)
- The system SHALL list all ad campaigns (filterable by status, paginated)
- The system SHALL allow approving campaigns (`pending_review` → `active`)
- The system SHALL allow rejecting campaigns with a reason

**REQ-ADMIN-14**: Payment Provider Management (Super Admin)
- The system SHALL list all payment providers
- The system SHALL allow creating/updating payment providers (name, active status, credentials)

### 4.14 Multi-Factor Authentication

**Priority**: [HIGH]

**4.14.1 Description**:
MFA provides an additional layer of security using TOTP (Time-based One-Time Password) via authenticator apps. MFA is enforced for all users with admin or moderator roles.

**4.14.2 Functional Requirements**:

**REQ-MFA-01**: MFA Setup
- The system SHALL generate a TOTP secret key and provisioning URI
- The system SHALL require password confirmation before setup
- The system SHALL display the secret and a QR-compatible URI for scanning

**REQ-MFA-02**: MFA Verification
- The system SHALL verify a TOTP code to enable MFA
- The system SHALL require password confirmation
- The system SHALL persist the enabled state

**REQ-MFA-03**: MFA Disable
- The system SHALL require password and valid TOTP code to disable MFA

**REQ-MFA-04**: MFA Enforcement
- The system SHALL check MFA status for users with admin/moderator roles on every request to protected endpoints
- Users without MFA enabled SHALL be blocked from accessing admin endpoints

### 4.15 Premier Subscriptions

**Priority**: [LOW]

**4.15.1 Description**:
Premier subscriptions allow businesses to upgrade their listing to a premium status for 30 days, gaining additional visibility and features.

**4.15.2 Functional Requirements**:

**REQ-PREMIER-01**: Premier Purchase
- The system SHALL allow verified email users with `subscription.manage` permission to purchase premier subscriptions
- The price SHALL be KES 999 (configurable)
- The business MUST be approved before purchasing premier
- The system SHALL prevent duplicate pending subscriptions
- The system SHALL create a payment intent through the selected gateway

**REQ-PREMIER-02**: Premier Confirmation
- The system SHALL activate the premier subscription upon successful payment
- The subscription SHALL last 30 days from activation
- The business SHALL be marked as `is_premier = True` with an expiration date

### 4.16 Prayer Times

**Priority**: [LOW]

**4.16.1 Description**:
Users can configure their personal prayer time calculation preferences, and mosques can publish their prayer time schedules.

**4.16.2 Functional Requirements**:

**REQ-PRAYER-01**: Personal Prayer Settings
- The system SHALL allow users to save personal prayer time calculation preferences
- Settings SHALL include: calculation method, coordinates, timezone, madhab, high latitude rule, manual adjustments

**REQ-PRAYER-02**: Mosque Prayer Times
- The system SHALL store prayer times as JSON on the Mosque model
- The system SHALL allow mosque admins to update prayer times
- The system SHALL allow users to subscribe to prayer time updates from a mosque
- Subscribers SHALL be notified when prayer times are updated

### 4.17 Reports and Moderation

**Priority**: [MEDIUM]

**4.17.1 Description**:
Users can report inappropriate content (organisations, reviews, events) for moderator review.

**4.17.2 Functional Requirements**:

**REQ-REPORT-01**: Report Submission
- The system SHALL allow verified email users with `report.create` permission to submit reports
- Supported resource types: business, mosque, charity, education, event, review
- Supported categories: spam, offensive, incorrect, duplicate, fraud, closed, scam, other
- The system SHALL require description text (sanitised and truncated to 1000 characters)

**REQ-REPORT-02**: Report Moderation Flow
- Moderators SHALL be able to view all pending reports in a dedicated queue
- Each report SHALL show: reporter, resource being reported, reason category, description, timestamp
- Moderators SHALL resolve reports with one of the following actions: dismissed, warning issued, content removed, user suspended, or escalated to super admin
- Resolved reports SHALL include the moderator's resolution note
- The moderation action SHALL trigger appropriate notifications to affected users

### 4.18 Notification Types and Delivery

**Priority**: [MEDIUM]

**4.18.1 Description**:
The notification system delivers messages for over 15 distinct event types. Each type triggers a specific notification with appropriate title, message, and data payload. Delivery occurs both in-app and optionally via email based on user preferences.

**4.18.2 Notification Type Catalog**:

| Notification Type | Trigger | Title Template | In-App | Email |
|-------------------|---------|----------------|--------|-------|
| `org_approved` | Organisation approved by moderator | "Your listing has been approved" | Yes | Yes |
| `org_rejected` | Organisation rejected by moderator | "Your listing was not approved" | Yes | Yes |
| `org_suspended` | Organisation suspended by moderator | "Your listing has been suspended" | Yes | Yes |
| `org_edit_approved` | Business edit approved | "Your edit has been approved" | Yes | No |
| `org_edit_rejected` | Business edit rejected | "Your edit was not approved" | Yes | No |
| `org_verified` | Verification document approved | "Your listing is now verified" | Yes | Yes |
| `org_verification_rejected` | Verification document rejected | "Verification document rejected" | Yes | Yes |
| `review_reply` | Owner replied to review | "A new reply to your review" | Yes | Yes |
| `donation_receipt` | Donation completed | "Donation receipt" | Yes | Yes |
| `campaign_status_change` | Campaign status changed | "Campaign status updated" | Yes | Yes |
| `claim_approved` | Ownership claim approved | "Ownership claim approved" | Yes | Yes |
| `claim_rejected` | Ownership claim rejected | "Ownership claim not approved" | Yes | Yes |
| `manager_assigned` | User assigned as manager | "You have been assigned as manager" | Yes | Yes |
| `manager_removed` | User removed as manager | "You have been removed as manager" | Yes | Yes |
| `prayer_time_update` | Mosque prayer times updated | "Prayer times updated" | Yes | Yes |
| `event_reminder` | Event starting soon | "Event starting soon" | Yes | No |

**4.18.3 Notification Data Payload**:
Each notification SHALL include a JSON data payload structure that enables the frontend to navigate to the relevant context:
- Organisation related: `{ org_id, org_slug, org_type }`
- Review related: `{ review_id, org_id, org_slug }`
- Donation related: `{ donation_id, receipt_number }`
- Campaign related: `{ campaign_id, status }`
- Claim related: `{ claim_id, org_id }`
- General: `{ url }` for custom navigation

### 4.20 File and Media Management

**Priority**: [MEDIUM]

**4.18.1 Description**:
The file system handles uploads to S3-compatible storage with validation, image optimisation, and thumbnail generation.

**4.18.2 Functional Requirements**:

**REQ-FILE-01**: File Upload
- The system SHALL accept file uploads via multipart form
- The system SHALL validate file type (allowed: JPEG, PNG, WEBP, PDF)
- The system SHALL validate file size (max 10MB)
- The system SHALL validate file content using magic bytes detection
- The system SHALL validate resource type (allowed: business, mosque, charity, education, profile, general, verification)

**REQ-FILE-02**: Image Processing
- The system SHALL limit image resolution to 50 megapixels
- The system SHALL resize images to a maximum dimension of 2048px
- The system SHALL optimise images (JPEG quality 85, WEBP quality 80, PNG optimised)
- The system SHALL generate square thumbnails (400x400) for images in JPEG format

**REQ-FILE-03**: Storage
- The system SHALL upload files to S3-compatible storage
- The system SHALL generate unique file paths using UUIDs
- The system SHALL store file metadata in the `MediaFile` table

### 4.21 Geo-Spatial Search

**Priority**: [MEDIUM]

**4.19.1 Description**:
The platform uses Haversine distance calculation for nearby search without requiring PostGIS extensions (though the database supports it).

**4.19.2 Functional Requirements**:

**REQ-GEO-01**: Distance Calculation
- The system SHALL calculate distance using the Haversine formula
- The calculation SHALL be performed in SQL using SQLAlchemy `func` expressions
- The system SHALL support searching organisations within a configurable radius (0.1km to 100km)

**REQ-GEO-02**: Distance-Aware Results
- The system SHALL return the distance in kilometres for each result
- Results SHALL be sorted by distance (nearest first)
- For businesses, the system SHALL consider both the main location and branch locations, using the closest one

### 4.22 Multi-Language Support

**Priority**: [MEDIUM]

**4.20.1 Description**:
The platform supports three languages: English, Swahili, and Arabic. The frontend manages translation through i18next, while the backend provides multi-language fields where appropriate.

**4.20.2 Functional Requirements**:

**REQ-LANG-01**: Frontend Translations
- The UI SHALL support English (default), Swahili, and Arabic
- Language selection SHALL be persisted in user preferences
- RTL layout SHALL be applied for Arabic language selection

**REQ-LANG-02**: Multi-Language Database Fields
- Category names SHALL be stored in three languages (name, name_ar, name_sw)
- The API SHALL return all language variants for categories

**REQ-LANG-03**: Content Language
- User-generated content (reviews, posts, descriptions) MAY be in any language
- The system SHALL NOT enforce language restrictions on user content

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

**REQ-PERF-01**: API Response Time
- 95% of API responses SHALL complete within 500ms for read operations
- 95% of API responses SHALL complete within 1000ms for write operations
- Search responses SHALL complete within 2000ms for complex queries

**REQ-PERF-02**: Concurrency
- The system SHALL support at least 200 concurrent API requests
- The system SHALL scale horizontally by adding more application instances behind the reverse proxy

**REQ-PERF-03**: Database Performance
- Database queries SHALL use appropriate indexes for all filtered and sorted columns
- Slow queries (execution > 100ms) SHALL be identified and optimised
- Connection pooling SHALL be configured to handle peak load

**REQ-PERF-04**: Caching
- Search results SHALL be cached in Redis with 120-second TTL
- Nearby search results SHALL be cached with 120-second TTL
- Category trees SHALL be cacheable
- Token blacklist entries SHALL use Redis TTL matching token expiry

**REQ-PERF-05**: Page Load
- Initial page load SHALL complete within 3 seconds on standard broadband
- Subsequent page navigations SHALL complete within 1 second
- The frontend SHALL implement lazy loading for route-based code splitting

### 5.2 Safety Requirements

**REQ-SAFE-01**: Data Backup
- The database SHALL be backed up daily (automated via backup script)
- Backups SHALL be retained for 30 days
- Backup files SHALL be compressed and stored securely

**REQ-SAFE-02**: Failure Recovery
- The system SHALL recover gracefully from database connection failures
- The system SHALL recover gracefully from Redis connection failures
- The system SHALL recover gracefully from external service failures (payment gateways, email, SMS)
- Failed payment operations SHALL NOT result in lost data

**REQ-SAFE-03**: Data Integrity
- Database transactions SHALL be used for operations that modify multiple records
- The soft-delete pattern SHALL be used for most data (except audit logs which are immutable)
- Idempotency keys SHALL prevent duplicate payment processing

**REQ-SAFE-04**: Error Handling
- The system SHALL return appropriate HTTP status codes for all error conditions
- The system SHALL log all unhandled exceptions to Sentry (if configured)
- The system SHALL NOT expose internal error details in API responses
- A global exception handler SHALL catch all unhandled exceptions and return a generic 500 response

### 5.3 Security Requirements

**REQ-SEC-01**: Authentication
- All API endpoints except public ones SHALL require JWT authentication
- JWT tokens SHALL be signed with a strong secret key (HS256)
- Access tokens SHALL expire after 15 minutes (configurable)
- Refresh tokens SHALL expire after 7 days (configurable)
- Tokens SHALL include a unique JTI (JWT ID) for blacklisting

**REQ-SEC-02**: Password Security
- Passwords SHALL be hashed using Argon2 with time cost 3, memory cost 65536, parallelism 4
- Passwords SHALL meet minimum strength requirements (12+ chars, mixed case, digits, special)
- Plain text passwords SHALL NEVER be stored or logged

**REQ-SEC-03**: Rate Limiting
- Authentication endpoints SHALL be rate limited (5/min register, 10/min login, 3/min password reset)
- Creation endpoints SHALL be rate limited (5/min for organisation creation)
- Review creation SHALL be rate limited (10/min)

**REQ-SEC-04**: Input Validation
- All user input SHALL be validated on the server side using Pydantic schemas
- HTML content in user-submitted text SHALL be sanitised to prevent XSS
- File uploads SHALL be validated by MIME type, magic bytes, and size

**REQ-SEC-05**: Access Control
- The system SHALL implement role-based access control (RBAC)
- The system SHALL enforce permissions at the endpoint level
- Super admin role SHALL bypass all permission checks
- MFA SHALL be enforced for admin/moderator role access

**REQ-SEC-06**: Data Protection
- The system SHALL NOT expose sensitive user data in API responses
- The system SHALL support soft-deletion of user accounts (GDPR compliance)
- The system SHALL maintain immutable audit logs for compliance

**REQ-SEC-07**: Token Blacklisting
- Logged-out tokens SHALL be blacklisted in Redis
- Blacklisted tokens SHALL be rejected on subsequent requests
- Password changes SHALL blacklist the current token

**REQ-SEC-08**: API Security Hardening
- All API responses SHALL include security headers as specified in section 3.4.6
- CORS SHALL be strictly configured to allow only the frontend origin(s)
- Content Security Policy headers SHALL be applied to all HTML responses
- XSS protection SHALL be implemented through input sanitisation, output encoding, and CSP headers
- CSRF protection SHALL be implemented through SameSite cookie attributes and custom request headers
- SQL injection prevention SHALL be achieved through parameterised queries via SQLAlchemy ORM
- Uploaded files SHALL be scanned for malicious content through file type validation and magic byte detection
- Rate limiting SHALL be applied to all auth endpoints and creation endpoints as specified in the functional requirements

**REQ-SEC-09**: Audit and Compliance
- All administrative actions SHALL be logged in the AuditLog table
- Audit log entries SHALL be immutable (never soft-deleted or modified)
- Security-relevant events (login failures, password changes, MFA changes, role changes) SHALL always be logged
- Audit logs SHALL include: actor ID, action, resource type, resource ID, IP address, user agent, timestamp, and metadata
- Audit log retention SHALL follow the configured retention policy

**REQ-SEC-10**: Session Security
- Session tokens (JWT) SHALL have a maximum lifetime of 15 minutes for access tokens
- Refresh tokens SHALL be rotatable and revocable
- Concurrent session limit SHALL be enforced (max 5 sessions per user)
- Sessions SHALL be invalidated on password change
- Session information SHALL be tracked in Redis including IP address and user agent
- Users SHALL be able to view and terminate their active sessions

### 5.4 Software Quality Attributes

**REQ-QUAL-01**: Maintainability
- The codebase SHALL follow consistent coding standards defined in ruff configuration
- Type hints SHALL be used throughout the Python backend
- Models, schemas, and endpoints SHALL follow consistent patterns
- Database migrations SHALL be version-controlled using Alembic

**REQ-QUAL-02**: Testability
- The system SHALL have automated tests for critical business logic
- Test coverage SHALL be tracked and reported in CI pipeline
- Tests SHALL use an isolated test database
- Test fixtures SHALL be provided for common scenarios

**Testing Strategy**:
- **Unit Tests**: Pytest-based tests for individual functions, services, and utility modules. Mock external dependencies (database, Redis, external APIs) to isolate the unit under test.
- **Integration Tests**: Test API endpoints with a live test database using pytest-asyncio for async support. Test fixtures create and clean up test data for each test case. Verify request/response contracts, authentication flows, permission enforcement, and business logic end-to-end.
- **API Client Tests**: Dedicated test files for each endpoint router validate HTTP status codes, response schemas, error handling, pagination, filtering, sorting, and edge cases.
- **Conftest Fixtures**: Shared fixtures in `conftest.py` provide: async test client, test database session, authenticated user tokens (multiple roles), sample organisation data, sample review data, and Redis mock.
- **Backend Test Directory Structure**:
  ```
  backend/tests/
  ├── conftest.py                # Shared fixtures and configuration
  ├── test_auth.py               # Authentication endpoint tests
  ├── test_businesses.py         # Business endpoint tests
  ├── test_mosques.py            # Mosque endpoint tests
  ├── test_charities.py          # Charity endpoint tests
  ├── test_education.py          # Education endpoint tests
  ├── test_reviews.py            # Review endpoint tests
  ├── test_favorites.py          # Favorites endpoint tests
  ├── test_donations.py          # Donation endpoint tests
  ├── test_events.py             # Event endpoint tests
  ├── test_campaigns.py          # Campaign endpoint tests
  ├── test_search.py             # Search endpoint tests
  ├── test_admin.py              # Admin endpoint tests
  └── test_notifications.py      # Notification endpoint tests
  ```
- **Frontend Testing** (planned): Vitest for unit testing React components, React Testing Library for component integration tests, and Playwright for end-to-end browser tests.

**REQ-QUAL-03**: Scalability
- The system SHALL support horizontal scaling of the application tier
- The system SHALL use connection pooling for database access
- The system SHALL use Redis for distributed caching
- The system SHALL support read replicas for database scaling (future)

**REQ-QUAL-04**: Reliability
- The system SHALL implement graceful degradation for external service failures
- The system SHALL implement retry logic with exponential backoff for transient failures
- The system SHALL maintain session persistence across application restarts

**REQ-QUAL-05**: Usability
- The system SHALL provide a responsive interface that works on mobile, tablet, and desktop
- The system SHALL follow consistent design patterns throughout
- The system SHALL provide clear feedback for user actions (success, error, loading)
- The system SHALL support keyboard navigation for accessibility
- The system SHALL support screen readers with appropriate ARIA labels

**REQ-QUAL-06**: Interoperability
- The system SHALL expose a well-documented RESTful API
- The system SHALL use standard JSON formats for data exchange
- The system SHALL support CORS for cross-origin requests
- The system SHALL follow OpenAPI 3.0 specification for API documentation

### 5.5 Business Rules

**REQ-BR-01**: Organisation Moderation
- New organisations SHALL be created in `pending` status
- Only moderators SHALL approve or reject organisations
- Rejected organisations SHALL include a reason
- Approved organisations SHALL be publicly visible
- Organisations can be suspended by moderators

**REQ-BR-02**: Verification
- Organisations SHALL be marked as verified upon successful document review
- Verification documents SHALL be reviewed by moderators
- Verification confers trust but does not change listing behaviour

**REQ-BR-03**: Review Rules
- One review per user per organisation
- 30-minute edit window
- 24-hour deletion window
- Organisation owner can reply once per review

**REQ-BR-04**: Premier Subscriptions
- Only approved businesses can purchase premier status
- Premier status lasts 30 days
- Premier price is KES 999 (configurable)
- Premier status provides visual distinction in listings

**REQ-BR-05**: Donations
- Minimum donation amount: 10.00 (configurable)
- Donations can be made to campaigns or directly to charities
- Campaigns must be active status to accept donations
- Charities must be verified to receive direct donations

**REQ-BR-06**: Ownership Claims
- Only users with verified email can submit claims
- Only one pending claim per user per organisation
- Claims are reviewed by moderators
- Approved claims transfer ownership to the claimant

**REQ-BR-07**: Concurrent Sessions
- Users SHALL be limited to 5 concurrent active sessions
- New logins beyond the limit SHALL not be prevented (oldest session is not removed but tracked in Redis)

**REQ-BR-08**: Financial Accounting Rules
- All payment transactions SHALL have a unique reference number generated by the system
- Refunds SHALL only be processed against the original payment method where possible
- Donation receipts SHALL include all required information for tax purposes (org name, amount, date, receipt number)
- Campaign funds SHALL be tracked at the campaign level with running totals
- Payment gateway fees and settlement periods SHALL be documented for each supported gateway
- Currency conversion rates SHALL be determined at the time of payment initiation

**REQ-BR-10**: Password Policy
- Users SHALL be required to set passwords of at least 12 characters in length
- Passwords SHALL require at least one uppercase letter, one lowercase letter, one digit, and one special character
- Previously used passwords MAY be reused (no historical password blacklist enforcement)
- Password reset links SHALL expire after 1 hour and SHALL be single-use only
- Account lockout SHALL occur after 5 consecutive failed login attempts, lasting 15 minutes

**REQ-BR-11**: Content Moderation Rules
- All new organisations SHALL be moderated before becoming publicly visible
- Business edits affecting major fields SHALL trigger moderation review
- User-submitted content (reviews, descriptions) SHALL be filtered for spam and profanity
- Reported content SHALL be reviewed by a moderator within 48 hours during business hours
- Users who repeatedly violate content policies MAY be suspended by super admins
- Moderator decisions SHALL be logged and auditable

---

## 6. Other Requirements

### 6.1 Database Requirements

**REQ-DB-01**: Database Technology
- The system SHALL use PostgreSQL 17+ with PostGIS extension
- All database access SHALL be asynchronous

**REQ-DB-02**: Schema Management
- Schema changes SHALL be managed through Alembic migrations
- Migrations SHALL be forward-only (no destructive rollbacks in production)
- Migration files SHALL be committed to version control

**REQ-DB-03**: Data Integrity
- All tables SHALL have a UUID primary key
- All tables SHALL have `created_at` and `updated_at` timestamps
- Soft-deletable tables SHALL have a `deleted_at` timestamp
- Foreign keys SHALL be used for referential integrity
- Unique constraints SHALL be enforced at the database level

**REQ-DB-04**: Indexing
- All foreign key columns SHALL be indexed
- All columns used in WHERE, ORDER BY, and JOIN clauses SHALL be indexed
- Full-text search SHALL use ILIKE with appropriate indexes
- Polymorphic discriminator columns SHALL be indexed

**REQ-DB-05**: Connection Management
- Connection pooling SHALL be configured with configurable pool size
- Connections SHALL be recycled after 3600 seconds
- Connection pre-ping SHALL be enabled

### 6.2 API Standards

**REQ-API-01**: Versioning
- The API SHALL be versioned from the start using URL prefix `/api/v1/`

**REQ-API-02**: Naming Conventions
- Endpoints SHALL use plural nouns for resources (`/users`, `/businesses`)
- Nested resources SHALL use `/parent/{parent_id}/child`
- Snake_case SHALL be used for JSON field names

**REQ-API-03**: Pagination
- List endpoints SHALL support pagination with `page` and `size` query parameters
- Responses SHALL include `items`, `total`, `page`, `size`, `pages`

**REQ-API-04**: Error Responses
- Errors SHALL use consistent format: `{"detail": "message"}` or `{"detail": {"field": ["error"]}}` for validation errors
- HTTP status codes SHALL follow REST conventions

**REQ-DB-06**: Data Retention and Cleanup
- Soft-deleted records SHALL be retained in the database for audit purposes
- Payment records SHALL be retained indefinitely for financial compliance
- Audit logs SHALL be retained for a minimum of 1 year
- Notification records older than 90 days MAY be archived or purged
- Temporary data (password reset tokens, verification codes, idempotency keys) SHALL be automatically expired via Redis TTL
- Session data SHALL be cleaned up on logout or token expiry
- Analytics events SHALL be retained for a minimum of 30 days for reporting purposes

### 6.3 Deployment Requirements

**REQ-DEPLOY-01**: Containerisation
- The system SHALL be deployable using Docker Compose
- Separate configurations SHALL be provided for development and production

**REQ-DEPLOY-02**: Environment Configuration
- All configuration SHALL be managed through environment variables
- Sensitive values SHALL NOT be hardcoded or committed to version control
- A `.env.example` file SHALL be provided with all required variables documented

**REQ-DEPLOY-03**: CI/CD
- The CI pipeline SHALL run: linting (ruff), formatting check (ruff), type checking (mypy), and tests (pytest)
- The CI pipeline SHALL run on push and pull request to the main branch

**REQ-DEPLOY-04**: Reverse Proxy
- Production deployment SHALL use Traefik as reverse proxy with automatic Let's Encrypt TLS
- HTTP traffic SHALL be redirected to HTTPS

**REQ-DEPLOY-05**: Environment Configuration Variables
- The system SHALL manage the following configuration categories via environment variables:
- **Application**: `APP_ENV`, `APP_DEBUG`, `APP_SECRET_KEY`, `APP_NAME`, `CORS_ORIGINS`, `API_PREFIX`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `RATE_LIMIT_ENABLED`
- **Database**: `DATABASE_URL`, `DATABASE_POOL_SIZE`, `DATABASE_MAX_OVERFLOW`, `DATABASE_ECHO_SQL`
- **Redis**: `REDIS_URL`, `REDIS_SOCKET_TIMEOUT`, `REDIS_RETRY_ON_TIMEOUT`
- **Storage**: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`, `S3_REGION`
- **Email**: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`, `MAILGUN_BASE_URL`
- **SMS**: `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `AFRICASTALKING_API_KEY`, `AFRICASTALKING_USERNAME`
- **Payment**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`
- **Monitoring**: `SENTRY_DSN`, `PROMETHEUS_ENABLED`
- **Celery**: `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`

**REQ-DEPLOY-06**: Logging and Monitoring
- Application logs SHALL be written to stdout in JSON format for containerised environments
- Log levels SHALL be configurable via environment variable (default: INFO in production, DEBUG in development)
- Error tracking SHALL be integrated with Sentry when `SENTRY_DSN` is configured
- Health check endpoint (`/api/v1/health`) SHALL be available for load balancer monitoring
- Prometheus metrics endpoint SHALL be available for performance monitoring

---



## Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Access Token** | Short-lived JWT used to authenticate API requests |
| **Argon2** | Password hashing algorithm used for secure password storage |
| **ASGI** | Asynchronous Server Gateway Interface (FastAPI uses this) |
| **Celery** | Distributed task queue for asynchronous task processing |
| **CORS** | Cross-Origin Resource Sharing - security mechanism for browser-based API access |
| **Daraja API** | Safaricom's M-Pesa API for mobile money integration |
| **Haversine Formula** | Formula for calculating great-circle distance between two points on a sphere |
| **Idempotency Key** | Unique identifier that ensures an operation is performed only once |
| **JTI** | JWT ID - unique identifier for each token |
| **JWT** | JSON Web Token - standard for securely transmitting information between parties |
| **MFA** | Multi-Factor Authentication - additional security layer using TOTP |
| **Polymorphic Inheritance** | SQLAlchemy pattern where multiple model types share a base table with common fields |
| **PostGIS** | Spatial database extension for PostgreSQL |
| **RBAC** | Role-Based Access Control - permission system based on user roles |
| **Refresh Token** | Long-lived JWT used to obtain new access tokens |
| **STK Push** | M-Pesa API method that initiates a payment prompt on the user's phone |
| **SlowAPI** | Rate limiting library for FastAPI |
| **Soft Delete** | Data deletion pattern where records are marked as deleted rather than removed |
| **TOTP** | Time-based One-Time Password - algorithm used by authenticator apps |
| **Traefik** | Cloud-native reverse proxy and load balancer |
| **Alembic** | Database migration tool for SQLAlchemy |
| **Asyncpg** | Asynchronous PostgreSQL database driver for Python |
| **Boto3** | Amazon Web Services SDK for Python (S3 interaction) |
| **Celery Beat** | Scheduler component of Celery for periodic tasks |
| **CTR** | Click-Through Rate - ratio of clicks to impressions in advertising |
| **ES256** | ECDSA using P-256 and SHA-256 - JWT signing algorithm |
| **FastAPI** | Modern Python web framework for building APIs with async support |
| **HS256** | HMAC with SHA-256 - JWT signing algorithm (used for token signing) |
| **iCalendar** | Standard format for calendar data exchange (.ics files) |
| **i18next** | Internationalisation framework for JavaScript/React applications |
| **ILIKE** | PostgreSQL case-insensitive pattern matching operator |
| **Jinja2** | Template engine for Python (used for HTML email templates) |
| **Leaflet** | Open-source JavaScript library for interactive maps |
| **Mailpit** | Email testing tool for development environments |
| **M-Pesa** | Mobile money service by Safaricom (Kenya) |
| **Mypy** | Static type checker for Python |
| **PDF** | Portable Document Format (used for receipts and invoices) |
| **Pydantic** | Data validation and settings management library for Python |
| **Pytest** | Testing framework for Python |
| **REST** | Representational State Transfer - API architectural style |
| **RSVP** | Répondez s'il vous plaît - event registration confirmation |
| **RTL** | Right-to-Left - text direction for Arabic and similar scripts |
| **Ruff** | Fast Python linter and formatter |
| **SQLAlchemy** | SQL toolkit and ORM for Python |
| **STK Push** | M-Pesa API method that initiates a payment prompt on the user's mobile phone |
| **Tailwind CSS** | Utility-first CSS framework |
| **TanStack Query** | Data fetching and state management library for React |
| **TOTP** | Time-based One-Time Password algorithm used by authenticator apps (e.g., Google Authenticator, Authy) |
| **TTL** | Time-To-Live - expiry duration for cached data or tokens |
| **TypeScript** | Typed superset of JavaScript |
| **UUID** | Universally Unique Identifier - 128-bit unique identifier |
| **Uvicorn** | ASGI server for running Python web applications |
| **Vite** | Frontend build tool and development server |
| **Webhook** | HTTP callback for real-time event notification between systems |

### Appendix B: Data Model Overview

The system uses 30+ SQLAlchemy models organised into the following logical groups:

**Core Models**:
- `User` (users) - Central user account with role-based permissions
- `Role` (roles) - Named roles with associated permissions
- `Permission` (permissions) - Individual permission codenames

**Organization Models** (polymorphic):
- `Organization` (base) - Common fields: name, slug, location, contact, status, ratings
- `Business` (subtype) - Categories, branches, halal cert, premier, operating hours
- `Mosque` (subtype) - Prayer times, facilities, imam, accessibility
- `Charity` (subtype) - Registration number, mission, campaigns
- `EducationalInstitution` (subtype) - Type, curriculum, programs

**Social Models**:
- `OrganizationPost` - Posts published by organisations
- `PostLike` - User likes on posts
- `Review` - User reviews with ratings
- `ReviewReply` - Organisation owner replies to reviews
- `Favorite` - User's saved organisations
- `FavoriteCollection` - Organised groups of favourites
- `SavedEvent` - User's saved events

**Financial Models**:
- `Donation` - Donation records linked to campaigns or charities
- `Payment` - Generic payment records with gateway references
- `PremierSubscription` - Premier listing subscription records
- `SavedPaymentMethod` - User's saved payment methods
- `PaymentProvider` - Configured payment gateway credentials

**Advertisement Models**:
- `Advertisement` - Simple ad placements (legacy)
- `AdCampaign` - Full ad campaign with budget and targeting
- `AdAnalytics` - Daily campaign performance metrics

**Communication Models**:
- `Notification` - In-app user notifications
- `NotificationPreference` - User notification settings

**Analytics Models**:
- `AnalyticsEvent` - Tracked user interactions
- `AuditLog` - Immutable audit trail of system actions

**Content Models**:
- `CMSPage` - Static content pages
- `CMSBanner` - Promotional banners
- `BlogPost` - Blog articles
- `Category` - Hierarchical business categories (multi-language)

**Security Models**:
- `MFAConfig` - TOTP configuration per user
- `VerificationDocument` - Business verification documents
- `OwnershipClaim` - Organisation ownership transfer requests

**Other Models**:
- `MediaFile` - Uploaded file metadata
- `Report` - User-submitted content reports
- `MosquePrayerSubscription` - Prayer time update subscriptions
- `BusinessBranch` - Multi-location business branches
- `CharityCampaign` - Fundraising campaigns
- `OrganizationManager` - Delegated organisation management
- `OrganizationInvitation` - Invitations to manage organisations
- `Event` - Community events

### Appendix C: Permission Matrix

| Permission | Registered User | Organization Owner | Moderator | Super Admin |
|------------|-----------------|-------------------|-----------|-------------|
| `staff.invite` | — | ✓ | ✓ | ✓ |
| `staff.remove` | — | ✓ | ✓ | ✓ |
| `campaign.create` | — | ✓ | — | ✓ |
| `business.create` | ✓ | ✓ | ✓ | ✓ |
| `business.edit` | — | ✓ | — | ✓ |
| `business.delete` | — | ✓ | — | ✓ |
| `mosque.create` | ✓ | ✓ | ✓ | ✓ |
| `mosque.edit` | — | ✓ | — | ✓ |
| `mosque.delete` | — | ✓ | — | ✓ |
| `charity.create` | ✓ | ✓ | ✓ | ✓ |
| `charity.edit` | — | ✓ | — | ✓ |
| `charity.delete` | — | ✓ | — | ✓ |
| `education.create` | ✓ | ✓ | ✓ | ✓ |
| `education.edit` | — | ✓ | — | ✓ |
| `education.delete` | — | ✓ | — | ✓ |
| `event.create` | ✓ | ✓ | — | ✓ |
| `event.edit` | — | ✓ | — | ✓ |
| `event.delete` | — | ✓ | — | ✓ |
| `review.create` | ✓ | ✓ | ✓ | ✓ |
| `review.edit` | ✓ | ✓ | — | ✓ |
| `review.respond` | — | ✓ | — | ✓ |
| `favorite.create` | ✓ | ✓ | ✓ | ✓ |
| `favorite.delete` | ✓ | ✓ | ✓ | ✓ |
| `report.create` | ✓ | ✓ | ✓ | ✓ |
| `donation.create` | ✓ | ✓ | ✓ | ✓ |
| `verification.submit` | — | ✓ | — | ✓ |
| `subscription.manage` | — | ✓ | — | ✓ |
| `analytics.view_own` | — | ✓ | — | ✓ |

**Notes**:
- The `super_admin` permission codename grants bypass of all permission checks
- `require_role("moderator")` requires the user to have moderator or super_admin role
- `require_role("super_admin")` requires the user to have super_admin role only
- MFA is enforced for all users with moderator or super_admin roles via `require_mfa_if_admin` dependency

### Appendix D: API Endpoint Summary

The Umma Directory platform exposes approximately 160+ RESTful API endpoints organised into 26 routers. Below is a summary of each router group:

**Authentication and User Management**:
- `/api/v1/auth/register` - POST: User registration with email, password, and profile data
- `/api/v1/auth/verify-email/{token}` - GET: Email verification via signed token
- `/api/v1/auth/resend-verification` - POST: Resend verification email
- `/api/v1/auth/login` - POST: User login returning JWT token pair
- `/api/v1/auth/refresh` - POST: Refresh access token using valid refresh token
- `/api/v1/auth/logout` - POST: Invalidate current session and blacklist tokens
- `/api/v1/auth/forgot-password` - POST: Request password reset email
- `/api/v1/auth/reset-password` - POST: Reset password with token
- `/api/v1/auth/change-password` - PATCH: Change password with current password verification
- `/api/v1/auth/send-phone-otp` - POST: Send SMS verification code
- `/api/v1/auth/verify-phone-otp` - POST: Verify SMS code
- `/api/v1/users/me` - GET: Current user profile
- `/api/v1/users/me` - PATCH: Update current user profile
- `/api/v1/users/me/deactivate` - PATCH: Soft-deactivate account
- `/api/v1/users/me/sessions` - GET: List active sessions
- `/api/v1/users/me/sessions` - DELETE: Terminate all other sessions
- `/api/v1/users` - GET: List all users (super admin)
- `/api/v1/users/{id}` - PATCH: Update user role/status (super admin)

**Multi-Factor Authentication**:
- `/api/v1/mfa/setup` - POST: Generate TOTP secret and provisioning URI
- `/api/v1/mfa/verify` - POST: Verify TOTP code to enable MFA
- `/api/v1/mfa/disable` - POST: Disable MFA with password and TOTP code

**Organizations**:
- `/api/v1/organizations` - GET: List approved organisations with filtering, sorting, pagination
- `/api/v1/organizations/{slug}` - GET: Organisation detail by slug
- `/api/v1/organizations` - POST: Create new organisation
- `/api/v1/organizations/{slug}` - PUT: Update organisation
- `/api/v1/organizations/{slug}` - DELETE: Delete organisation
- `/api/v1/organizations/{slug}/managers` - POST: Assign manager to organisation
- `/api/v1/organizations/{slug}/managers` - DELETE: Remove manager from organisation
- `/api/v1/organizations/claims` - POST: Submit ownership claim
- `/api/v1/organizations/{slug}/analytics` - GET: Organisation analytics
- `/api/v1/organizations/owner/dashboard` - GET: Owner aggregated dashboard
- `/api/v1/organizations/my` - GET: Current user's organisations

**Business-Specific**:
- `/api/v1/businesses` - GET: List approved businesses
- `/api/v1/businesses/{slug}` - GET: Business detail
- `/api/v1/businesses` - POST: Create business
- `/api/v1/businesses/{slug}` - PUT: Update business
- `/api/v1/businesses/{slug}` - DELETE: Delete business
- `/api/v1/businesses/{slug}/branches` - GET: List business branches
- `/api/v1/businesses/{slug}/branches` - POST: Create branch
- `/api/v1/businesses/{slug}/branches/{branch_id}` - PUT: Update branch
- `/api/v1/businesses/{slug}/branches/{branch_id}` - DELETE: Delete branch

**Mosque-Specific**:
- `/api/v1/mosques` - GET: List approved mosques
- `/api/v1/mosques/{slug}` - GET: Mosque detail
- `/api/v1/mosques` - POST: Create mosque
- `/api/v1/mosques/{slug}` - PUT: Update mosque
- `/api/v1/mosques/{slug}` - DELETE: Delete mosque
- `/api/v1/mosques/{slug}/prayer-subscribe` - POST: Subscribe to prayer time updates

**Charity-Specific**:
- `/api/v1/charities` - GET: List approved charities
- `/api/v1/charities/{slug}` - GET: Charity detail
- `/api/v1/charities` - POST: Create charity
- `/api/v1/charities/{slug}` - PUT: Update charity
- `/api/v1/charities/{slug}` - DELETE: Delete charity
- `/api/v1/charities/{slug}/campaigns` - GET: List charity campaigns
- `/api/v1/charities/{slug}/campaigns` - POST: Create campaign
- `/api/v1/charities/{slug}/campaigns/{campaign_id}` - PATCH: Update campaign
- `/api/v1/charities/campaigns/{campaign_id}` - GET: Campaign donations (public)

**Education-Specific**:
- `/api/v1/education` - GET: List approved institutions
- `/api/v1/education/{slug}` - GET: Institution detail
- `/api/v1/education` - POST: Create institution
- `/api/v1/education/{slug}` - PUT: Update institution
- `/api/v1/education/{slug}` - DELETE: Delete institution

**Search**:
- `/api/v1/search` - GET: Full-text search across all entities
- `/api/v1/search/autocomplete` - GET: Autocomplete suggestions
- `/api/v1/search/nearby` - GET: Geo-spatial nearby search
- `/api/v1/categories` - GET: List categories (with language support)

**Reviews**:
- `/api/v1/reviews` - POST: Create review
- `/api/v1/reviews/{review_id}` - PUT: Edit review (within 30-min window)
- `/api/v1/reviews/{review_id}` - DELETE: Delete review (within 24-hour window)
- `/api/v1/reviews/{review_id}/reply` - POST: Reply to review (owner only)
- `/api/v1/reviews/{review_id}/reply` - DELETE: Remove reply

**Favorites**:
- `/api/v1/favorites` - GET: List user's favourites
- `/api/v1/favorites` - POST: Add favourite
- `/api/v1/favorites/{favorite_id}` - DELETE: Remove favourite
- `/api/v1/favorites/collections` - GET: List collections
- `/api/v1/favorites/collections` - POST: Create collection
- `/api/v1/favorites/collections/{collection_id}` - PUT: Update collection
- `/api/v1/favorites/collections/{collection_id}` - DELETE: Delete collection
- `/api/v1/favorites/feed` - GET: Feed from favourited organisations

**Donations and Payments**:
- `/api/v1/donations` - POST: Initiate donation
- `/api/v1/donations` - GET: User's donation history
- `/api/v1/donations/stats` - GET: Donation statistics
- `/api/v1/donations/{id}/receipt` - GET: Download donation receipt PDF
- `/api/v1/payments/intent` - POST: Create payment intent
- `/api/v1/payments/intent/{id}/confirm` - POST: Confirm payment for M-Pesa
- `/api/v1/payments/webhook/stripe` - POST: Stripe webhook endpoint
- `/api/v1/payments/webhook/paypal` - POST: PayPal webhook endpoint
- `/api/v1/payments/webhook/mpesa` - POST: M-Pesa callback endpoint
- `/api/v1/payments/invoice/{payment_id}` - GET: Download invoice PDF
- `/api/v1/payments/methods` - GET: List saved payment methods
- `/api/v1/payments/methods` - POST: Save payment method
- `/api/v1/payments/methods/{id}` - DELETE: Remove payment method
- `/api/v1/payments/refund/{payment_id}` - POST: Refund payment

**Events**:
- `/api/v1/events` - GET: List events
- `/api/v1/events` - POST: Create event
- `/api/v1/events/{slug}` - GET: Event detail
- `/api/v1/events/{slug}` - PATCH: Update event
- `/api/v1/events/{slug}` - DELETE: Delete event
- `/api/v1/events/{slug}/register` - POST: RSVP for event
- `/api/v1/events/{slug}/ics` - GET: Download iCalendar file
- `/api/v1/events/saved` - GET: User's saved events
- `/api/v1/events/saved/{slug}` - POST: Save event
- `/api/v1/events/saved/{slug}` - DELETE: Unsave event

**Organization Posts**:
- `/api/v1/posts` - POST: Create post
- `/api/v1/posts/organization/{org_slug}` - GET: List organisation posts
- `/api/v1/posts/{post_id}` - DELETE: Delete post
- `/api/v1/posts/{post_id}/like` - POST: Toggle like

**Advertisements and Campaigns**:
- `/api/v1/advertisements` - GET: List active advertisements
- `/api/v1/advertisements` - POST: Create advertisement
- `/api/v1/advertisements/track/{ad_id}/impression` - GET: Track impression
- `/api/v1/advertisements/track/{ad_id}/click` - GET: Track click
- `/api/v1/campaigns` - GET: List campaigns (owner view)
- `/api/v1/campaigns` - POST: Create campaign
- `/api/v1/campaigns/{id}` - GET: Campaign detail
- `/api/v1/campaigns/{id}` - PUT: Update draft campaign
- `/api/v1/campaigns/{id}/submit` - POST: Submit campaign for review
- `/api/v1/campaigns/{id}/pause` - POST: Pause campaign
- `/api/v1/campaigns/{id}/resume` - POST: Resume campaign
- `/api/v1/campaigns/{id}/cancel` - POST: Cancel campaign
- `/api/v1/campaigns/{id}/renew` - POST: Renew campaign
- `/api/v1/campaigns/{id}/analytics` - GET: Campaign analytics
- `/api/v1/campaigns/ad-feed` - GET: Serve feed ad
- `/api/v1/campaigns/spotlight` - GET: Serve category spotlight ad

**Reports**:
- `/api/v1/reports` - POST: Submit report
- `/api/v1/reports` - GET: List reports (moderator)

**Notifications**:
- `/api/v1/notifications` - GET: List user's notifications
- `/api/v1/notifications/{id}/read` - PATCH: Mark notification as read
- `/api/v1/notifications/read-all` - POST: Mark all as read
- `/api/v1/notifications/{id}` - DELETE: Delete notification
- `/api/v1/notifications/preferences` - GET: Get notification preferences
- `/api/v1/notifications/preferences` - PUT: Update notification preferences

**Content Management**:
- `/api/v1/cms/pages` - GET: List CMS pages
- `/api/v1/cms/pages/{slug}` - GET: CMS page detail
- `/api/v1/cms/pages` - POST: Create CMS page
- `/api/v1/cms/pages/{slug}` - PUT: Update CMS page
- `/api/v1/cms/pages/{slug}` - DELETE: Delete CMS page
- `/api/v1/cms/banners` - GET: List active banners
- `/api/v1/cms/banners` - POST: Create banner
- `/api/v1/cms/banners/{id}` - PUT: Update banner
- `/api/v1/cms/banners/{id}` - DELETE: Delete banner
- `/api/v1/cms/blog` - GET: List blog posts
- `/api/v1/cms/blog/{slug}` - GET: Blog post detail
- `/api/v1/cms/blog` - POST: Create blog post
- `/api/v1/cms/blog/{slug}` - PUT: Update blog post
- `/api/v1/cms/blog/{slug}` - DELETE: Delete blog post

**Admin Panel**:
- `/api/v1/admin/dashboard` - GET: Dashboard counts
- `/api/v1/admin/users` - GET: List all users (super admin)
- `/api/v1/admin/users/{id}/suspend` - PATCH: Suspend user
- `/api/v1/admin/users/{id}/unsuspend` - PATCH: Unsuspend user
- `/api/v1/admin/users/{id}/role` - PATCH: Change user role
- `/api/v1/admin/organizations` - GET: List all organisations
- `/api/v1/admin/organizations/{id}/approve` - PATCH: Approve organisation
- `/api/v1/admin/organizations/{id}/reject` - PATCH: Reject organisation
- `/api/v1/admin/organizations/{id}/suspend` - PATCH: Suspend organisation
- `/api/v1/admin/organizations/{id}/restore` - PATCH: Restore suspended organisation
- `/api/v1/admin/business-edits` - GET: List pending business edits
- `/api/v1/admin/business-edits/{id}/approve` - PATCH: Approve edit
- `/api/v1/admin/business-edits/{id}/reject` - PATCH: Reject edit
- `/api/v1/admin/verifications` - GET: List pending verification documents
- `/api/v1/admin/verifications/{id}/approve` - PATCH: Approve verification
- `/api/v1/admin/verifications/{id}/reject` - PATCH: Reject verification
- `/api/v1/admin/reviews` - GET: List all reviews
- `/api/v1/admin/reviews/{id}/remove` - PATCH: Remove review
- `/api/v1/admin/reviews/{id}/restore` - PATCH: Restore review
- `/api/v1/admin/claims` - GET: List pending claims
- `/api/v1/admin/claims/{id}/approve` - PATCH: Approve claim
- `/api/v1/admin/claims/{id}/reject` - PATCH: Reject claim
- `/api/v1/admin/reports` - GET: List pending reports
- `/api/v1/admin/reports/{id}/resolve` - PATCH: Resolve report
- `/api/v1/admin/audit-logs` - GET: List audit logs
- `/api/v1/admin/campaigns` - GET: List all campaigns
- `/api/v1/admin/campaigns/{id}/approve` - PATCH: Approve campaign
- `/api/v1/admin/campaigns/{id}/reject` - PATCH: Reject campaign
- `/api/v1/admin/payment-providers` - GET: List payment providers
- `/api/v1/admin/payment-providers` - POST: Create payment provider
- `/api/v1/admin/payment-providers/{id}` - PATCH: Update payment provider

**Files**:
- `/api/v1/files/upload` - POST: Upload file
- `/api/v1/files/{id}` - GET: Get file metadata

**Health and Utility**:
- `/api/v1/health` - GET: Health check endpoint

---

**End of Document — Umma Directory SRS v1.0**
