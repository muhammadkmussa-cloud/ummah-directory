"""Migrate existing Advertisement records to AdCampaign.

Run: python -m scripts.migrate_ads_to_campaigns
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from app.core.database import async_session_factory
from app.models.ad_campaign import AdCampaign
from app.models.advertisement import Advertisement
from sqlalchemy import select


async def migrate():
    async with async_session_factory() as db:
        result = await db.execute(select(Advertisement))
        ads = result.scalars().all()

        if not ads:
            print("No advertisements to migrate.")
            return

        print(f"Migrating {len(ads)} advertisements...")
        now = datetime.now(timezone.utc)
        created = 0

        for ad in ads:
            existing = await db.execute(
                select(AdCampaign).where(AdCampaign.legacy_ad_id == ad.id)
            )
            if existing.scalar_one_or_none():
                print(f"  SKIP: ad {ad.id} already migrated")
                continue

            campaign = AdCampaign(
                name=ad.title,
                campaign_type="feed_ad",
                status={
                    "pending": "pending_review",
                    "approved": "active",
                    "rejected": "rejected",
                }.get(ad.status, "pending_review"),
                advertiser_id=ad.advertiser_id,
                headline=ad.title,
                description=ad.content,
                media_url=ad.image_url,
                destination_url=ad.destination_url,
                placement_config={"original_placement": ad.placement, "original_ad_type": ad.ad_type},
                budget_type="total",
                budget_amount=ad.budget or 0,
                start_date=ad.start_date or now,
                end_date=ad.end_date or (now + timedelta(days=30)),
                target_categories=ad.target_categories,
                impressions=ad.impressions,
                clicks=ad.clicks,
                legacy_ad_id=ad.id,
            )
            db.add(campaign)
            created += 1

        await db.commit()
        print(f"  Created {created} campaigns.")
        print("Migration complete.")


def main():
    asyncio.run(migrate())


if __name__ == "__main__":
    main()
