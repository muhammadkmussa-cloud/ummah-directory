# Ummah Directory

A comprehensive community directory platform connecting the Muslim community with verified halal businesses, mosques, charities, and educational institutions.

## 🌟 Features

- **Directory Discovery** — Browse and search verified organizations by category, location, and type
- **Interactive Maps** — Find nearby businesses, mosques, and charities with geo-spatial search
- **Reviews & Ratings** — Read and write authentic community reviews
- **Donations** — Support charities via Stripe, PayPal, or M-Pesa
- **Events** — Discover and RSVP to community events
- **Organization Management** — Claim, verify, and manage your organization profile
- **Advertising** — Run targeted ad campaigns to reach the community
- **Analytics** — Track profile views, engagement, and campaign performance
- **Multi-language** — English, Swahili, and Arabic support
- **Admin Panel** — Moderate content, approve organizations, manage users

## 🏗️ Architecture

```
ummah-directory/
├── backend/          # Python 3.13 + FastAPI REST API
│   ├── app/
│   │   ├── api/v1/   # API endpoints
│   │   ├── core/     # Config, security, database, caching
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── schemas/  # Pydantic request/response schemas
│   │   ├── services/ # Business logic services
│   │   ├── payments/ # Payment gateway integrations
│   │   └── tasks/    # Celery background tasks
│   └── tests/        # Pytest test suite
├── frontend/         # React 19 + TypeScript SPA
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── features/    # Feature-based page modules
│       ├── contexts/    # React contexts
│       ├── hooks/       # Custom hooks
│       ├── lib/         # Utilities, API client, i18n
│       └── pages/       # Landing + shared pages
├── infrastructure/   # Traefik, Prometheus configs
└── docker-compose*.yml
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/muhammadkmussa-cloud/ummah-directory.git
cd ummah-directory

# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api/docs
# Mailpit (email testing): http://localhost:8025
```

### Production Deployment

```bash
# Set all required environment variables in .env
# Then:
docker compose -f docker-compose.prod.yml up -d
```

## 🔐 Environment Variables

See `.env.example` for all required variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET_KEY` | JWT signing key | ✅ |
| `APP_SECRET_KEY` | Application secret for token signing | ✅ |
| `STRIPE_SECRET_KEY` | Stripe payment gateway | Optional |
| `PAYPAL_CLIENT_ID` | PayPal payment gateway | Optional |
| `MPESA_CONSUMER_KEY` | M-Pesa mobile money | Optional |
| `MAILGUN_API_KEY` | Email delivery | Optional |
| `SENTRY_DSN` | Error tracking | Optional |
| `FRONTEND_URL` | Frontend base URL for emails | ✅ |

## 🧪 Testing

```bash
# Backend tests
cd backend
pip install -e ".[dev]"
pytest tests/ -v

# Frontend type check
cd frontend
npm run typecheck
npm run lint
npm run build
```

## 📡 API Documentation

When running locally, visit:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## 🛡️ Security

- Argon2id password hashing
- JWT with token rotation and blacklisting
- Rate limiting on all sensitive endpoints
- MFA enforcement for admin accounts
- Webhook signature verification (Stripe, PayPal, M-Pesa)
- File upload validation with magic byte checking
- CSP, HSTS, and security headers

## 📄 License

Proprietary — All rights reserved.
