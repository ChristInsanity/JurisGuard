import hashlib
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AuditLog


def _hash_entry(prev_hash: Optional[str], payload: str) -> str:
    h = hashlib.sha256()
    if prev_hash:
        h.update(prev_hash.encode())
    h.update(payload.encode())
    h.update(datetime.now(timezone.utc).isoformat().encode())
    return h.hexdigest()


def append_audit(
    db: Session,
    *,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[str],
    detail: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    last = db.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(1)).first()
    prev = last.entry_hash if last else None
    payload = f"{user_id}|{action}|{entity_type}|{entity_id}|{detail or ''}"
    entry_hash = _hash_entry(prev, payload)
    row = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        detail=detail,
        prev_hash=prev,
        entry_hash=entry_hash,
        ip_address=ip_address,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
