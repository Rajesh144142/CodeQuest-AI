from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import require_super_admin
from app.models.admin import AdminActivity, AdminStatsResponse, AdminUser, UpdateRoleRequest
from app.models.auth import AuthenticatedUser
from app.services.admin_service import AdminService

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(current_user: AuthenticatedUser = Depends(require_super_admin)) -> AdminStatsResponse:
    _ = current_user
    return AdminService().get_stats()


@router.get("/users", response_model=list[AdminUser])
def get_admin_users(current_user: AuthenticatedUser = Depends(require_super_admin)) -> list[AdminUser]:
    _ = current_user
    return AdminService().list_users()


@router.get("/activity", response_model=list[AdminActivity])
def get_admin_activity(current_user: AuthenticatedUser = Depends(require_super_admin)) -> list[AdminActivity]:
    _ = current_user
    return AdminService().recent_activity()


@router.patch("/users/{user_id}/role", response_model=AdminUser)
def update_user_role(
    user_id: str,
    payload: UpdateRoleRequest,
    current_user: AuthenticatedUser = Depends(require_super_admin),
) -> AdminUser:
    _ = current_user
    try:
        row = AdminService().update_user_role(user_id, payload.role)
        return AdminUser(**row)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
