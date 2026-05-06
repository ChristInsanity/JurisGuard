import json
import shutil
import tempfile
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from app.audit import append_audit
from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import CaseDocument, User, UserRole
from app.ocr_service import extract_suggested_fields, run_ocr_with_meta

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def client_ip(request: Request):
    if request.client:
        return request.client.host
    return None


@router.post("/ocr-upload")
async def ocr_upload(
    request: Request,
    file: UploadFile = File(...),
    doc_type: str = Form("intake"),
    case_id: int | None = Form(None),
    persist: str = Form("true"),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.user, UserRole.admin)),
):
    persist_flag = persist.lower() in ("1", "true", "yes", "on")
    ext = Path(file.filename or "scan").suffix or ".png"
    name = f"{uuid.uuid4().hex}{ext}"

    if persist_flag:
        dest = UPLOAD_DIR / name
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    else:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            shutil.copyfileobj(file.file, tmp)
            dest = Path(tmp.name)

    try:
        ocr_meta = run_ocr_with_meta(dest)
        raw = ocr_meta.get("raw_text", "")
    except Exception as e:
        if persist_flag and dest.exists():
            dest.unlink(missing_ok=True)
        elif not persist_flag and dest.exists():
            dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail=(
                "OCR failed. Install Tesseract (Windows: UB Mannheim build) so tesseract.exe exists, "
                "or set TESSERACT_CMD in backend/.env to its full path. Check GET /api/health for ocr.install_steps. "
                f"Detail: {e}"
            ),
        ) from e
    finally:
        if not persist_flag and dest.exists():
            dest.unlink(missing_ok=True)

    suggested = extract_suggested_fields(raw)
    support_text = (ocr_meta.get("ocr_support_text") or "").strip()
    if support_text:
        merged_for_fields = raw if support_text in raw else (raw + "\n" + support_text)
        suggested = extract_suggested_fields(merged_for_fields)

    if not persist_flag:
        return {
            "document_id": None,
            "raw_text": raw,
            "suggested_fields": suggested,
            "ocr_preview_data_url": ocr_meta.get("ocr_preview_data_url"),
            "document_detected": ocr_meta.get("document_detected"),
            "scan_quality": ocr_meta.get("scan_quality"),
            "scan_warnings": ocr_meta.get("scan_warnings"),
            "ocr_best_variant": ocr_meta.get("ocr_best_variant"),
            "ocr_config": ocr_meta.get("ocr_config"),
            "ocr_lang": ocr_meta.get("ocr_lang"),
            "ocr_engine": ocr_meta.get("ocr_engine"),
            "verification_required": True,
            "persisted": False,
        }

    row = CaseDocument(
        case_id=case_id,
        doc_type=doc_type,
        original_filename=file.filename or name,
        storage_path=str(dest),
        ocr_raw_text=raw,
        extracted_json=json.dumps(suggested),
        verified=False,
        created_by_user_id=user.user_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    append_audit(
        db,
        user_id=user.user_id,
        action="document.ocr",
        module="ocr",
        entity_type="case_document",
        entity_id=str(row.id),
        ip_address=client_ip(request),
    )
    return {
        "document_id": row.id,
        "raw_text": raw,
        "suggested_fields": suggested,
        "ocr_preview_data_url": ocr_meta.get("ocr_preview_data_url"),
        "document_detected": ocr_meta.get("document_detected"),
        "scan_quality": ocr_meta.get("scan_quality"),
        "scan_warnings": ocr_meta.get("scan_warnings"),
        "ocr_best_variant": ocr_meta.get("ocr_best_variant"),
        "ocr_config": ocr_meta.get("ocr_config"),
        "ocr_lang": ocr_meta.get("ocr_lang"),
        "ocr_engine": ocr_meta.get("ocr_engine"),
        "verification_required": True,
        "persisted": True,
    }


@router.post("/{doc_id}/verify")
def verify_document(
    doc_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.user, UserRole.admin)),
):
    row = db.query(CaseDocument).filter(CaseDocument.id == doc_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    from datetime import datetime, timezone

    row.verified = True
    row.verified_by_user_id = user.user_id
    row.verified_at = datetime.now(timezone.utc)
    db.commit()
    append_audit(
        db,
        user_id=user.user_id,
        action="document.verify",
        module="ocr",
        entity_type="case_document",
        entity_id=str(row.id),
        ip_address=client_ip(request),
    )
    return {"ok": True, "document_id": doc_id}
