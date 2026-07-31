from pydantic import BaseModel, Field


class ReasonRequest(BaseModel):
    reason: str = Field(default="")


class UserRoleRequest(BaseModel):
    role_name: str


class ResolveReportRequest(BaseModel):
    action_taken: str = Field(default="dismissed")


class CategoryCreateRequest(BaseModel):
    name: str
    slug: str
    parent_id: str | None = None


class CategoryUpdateRequest(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class CMSPageCreateRequest(BaseModel):
    title: str
    slug: str
    content: str = Field(default="")


class CMSPageUpdateRequest(BaseModel):
    title: str | None = None
    content: str | None = None
    is_published: bool | None = None
