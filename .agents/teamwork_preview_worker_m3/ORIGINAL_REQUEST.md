## 2026-07-30T21:03:00Z

Objective: Fix backend polymorphic model attributes, `OrganizationManager` unique constraint, `log_action` UUID/string handling, `main.py` slowapi rate limiter exception handler, and ensure `mypy app` passes cleanly.
Working Directory: /home/muhammad-mussa/projects/ummah-directory/.agents/teamwork_preview_worker_m3
Project Root: /home/muhammad-mussa/projects/ummah-directory/backend

Explorer Handoff Report Location:
/home/muhammad-mussa/projects/ummah-directory/.agents/teamwork_preview_explorer_m3/handoff.md

Tasks to execute:
1. Update `backend/app/models/organization.py`:
   - Update `OrganizationManager.__table_args__` unique constraint to `UniqueConstraint("organization_id", "user_id", name="uq_organization_user_manager")`.
2. Update `backend/app/services/audit_service.py`:
   - Update `log_action` parameter type signatures to accept `user_id: uuid.UUID | str | None` and `resource_id: uuid.UUID | str | int | None`. Convert `user_id` and `resource_id` cleanly to UUID/str inside `log_action`.
3. Fix attribute and type mismatches across endpoints in `backend/app/api/v1/endpoints/`:
   - `businesses.py`: replace `VerificationDocument.business_id` -> `VerificationDocument.organization_id`; replace `PremierSubscription.business_id` -> `PremierSubscription.organization_id`; update `business.is_active` check to `business.status != "suspended"`.
   - `analytics.py`: replace `AnalyticsEvent.business_id` -> `AnalyticsEvent.organization_id`; replace `Favorite.resource_type`/`resource_id` -> `Favorite.organization_id`; replace `primary_admin_id` -> `owner_id`.
   - `admin.py`: update `admin_approve_campaign` / `admin_reject_campaign` `id: int` -> `id: UUID`; update `campaign.approved_at`/`approved_by` -> `campaign.reviewed_at`/`reviewed_by`.
   - Fix remaining endpoint attribute/type mismatches identified by mypy.
4. Update `backend/app/main.py`:
   - Fix `slowapi` rate limit exception handler registration typing (`# type: ignore[arg-type]` or custom handler wrapper).
5. Fix forward references and type annotations across `backend/app/` models/endpoints so that `./.venv/bin/python -m mypy app` passes with 0 errors.
6. Verification:
   - Run `./.venv/bin/python -m mypy app` in `/home/muhammad-mussa/projects/ummah-directory/backend` and confirm 0 errors.
