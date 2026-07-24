from pydantic import BaseModel, Field


class PrayerTimeSettingsUpdate(BaseModel):
    calculation_method: int | None = Field(None, description="Calculation method ID (e.g., MWL, ISNA)")
    latitude: float | None = None
    longitude: float | None = None
    timezone: str | None = None
    madhab: int | None = Field(None, description="0 for Shafi/Maliki/Hanbali, 1 for Hanafi")
    high_latitude_rule: int | None = Field(None, description="0 for None, 1 for Middle of the Night, 2 for One Seventh, 3 for Angle Based")
    adjustments: dict[str, int] | None = Field(None, description="Custom minute adjustments for each prayer")


class PrayerTimeSettingsResponse(PrayerTimeSettingsUpdate):
    pass
