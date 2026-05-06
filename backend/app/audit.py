import json
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog


def append_audit(
    db: Session,
    *,
    user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: str | None,
    module: str = "system",
    metadata: dict[str, Any] | None = None,
    detail: str | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    metadata_payload = metadata.copy() if metadata else {}
    if detail:
        metadata_payload["detail"] = detail

    row = AuditLog(
        user_id=user_id,
        action=action,
        module=module,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_json=json.dumps(metadata_payload) if metadata_payload else None,
        ip_address=ip_address,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
