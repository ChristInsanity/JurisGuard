"""
OCR-assisted extraction stub. Install Tesseract OCR and `pip install -r requirements-ocr.txt`.
For production, add language packs (eng + fil) and tune image preprocessing.
"""

import os
import re
import shutil
import subprocess
import statistics
import io
import base64
from pathlib import Path
from typing import Any, Optional, cast

_EASYOCR_READER = None


def _easyocr_available() -> bool:
    try:
        import easyocr  # type: ignore[import-not-found]  # noqa: F401
        return True
    except ImportError:
        return False


def _candidate_tesseract_paths() -> list[Path]:
    """Typical install locations when the installer does not add Tesseract to PATH (Windows)."""
    paths: list[Path] = []
    for key in ("PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"):
        base = os.environ.get(key)
        if not base:
            continue
        paths.append(Path(base) / "Tesseract-OCR" / "tesseract.exe")
    paths.extend(
        [
            Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
            Path(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"),
        ]
    )
    seen: set[str] = set()
    out: list[Path] = []
    for p in paths:
        key = str(p.resolve()) if p.exists() else str(p)
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return out


def resolve_tesseract_executable() -> Optional[str]:
    """Return absolute path to tesseract.exe, or None if not found."""
    from app.config import settings

    tesseract_cmd = getattr(settings, "tesseract_cmd", None)
    if tesseract_cmd:
        p = Path(cast(str, tesseract_cmd))
        if p.is_file():
            return str(p.resolve())

    which = shutil.which("tesseract")
    if which:
        return which

    if os.name == "nt":
        for candidate in _candidate_tesseract_paths():
            if candidate.is_file():
                return str(candidate.resolve())

    return None


def _apply_tesseract_cmd() -> None:
    try:
        import pytesseract
    except ImportError:
        return
    resolved = resolve_tesseract_executable()
    if resolved:
        pytesseract.pytesseract.tesseract_cmd = resolved


def _get_installed_tesseract_languages() -> set[str]:
    """Best-effort read of installed language packs from Tesseract."""
    try:
        import pytesseract
    except ImportError:
        return set()

    _apply_tesseract_cmd()

    try:
        langs_raw = pytesseract.get_languages(config="")
        return {str(x).strip().lower() for x in langs_raw if str(x).strip()}
    except Exception:
        # Fallback to CLI output parsing in case pytesseract wrapper fails.
        try:
            cmd = [resolve_tesseract_executable() or "tesseract", "--list-langs"]
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False,
            )
            text_out = (proc.stdout or "") + "\n" + (proc.stderr or "")
            langs: set[str] = set()
            for ln in text_out.splitlines():
                s = ln.strip().lower()
                if not s or "list of available languages" in s:
                    continue
                if re.fullmatch(r"[a-z][a-z0-9_+-]*", s):
                    langs.add(s)
            return langs
        except Exception:
            return set()


def _resolve_ocr_lang() -> str:
    """Prefer Filipino + English when available; otherwise fall back safely."""
    langs = _get_installed_tesseract_languages()
    if "fil" in langs:
        return "eng+fil"
    if "tgl" in langs:
        return "eng+tgl"
    if "eng" in langs:
        return "eng"
    return "eng"


def get_ocr_status() -> dict[str, Any]:
    """Used by /api/health so the UI can show whether OCR will work."""
    out: dict[str, Any] = {
        "ready": False,
        "python_packages": False,
        "tesseract_binary": False,
        "version": None,
        "ocr_lang": None,
        "installed_languages": [],
        "handwriting_engine": "easyocr" if _easyocr_available() else "tesseract-only",
        "message": "",
        "install_steps": [],
    }
    try:
        from PIL import Image  # noqa: F401
        import pytesseract
    except ImportError:
        out["message"] = "Python OCR libraries (Pillow, pytesseract) are not installed."
        out["install_steps"] = [
            "Open a terminal in the backend folder.",
            "Run: pip install -r requirements-ocr.txt",
            "If Pillow fails to build, use Python 3.12 or 3.13, then retry.",
            "Install the Tesseract program (see next steps after pip succeeds).",
        ]
        return out

    out["python_packages"] = True
    _apply_tesseract_cmd()

    try:
        ver = pytesseract.get_tesseract_version()
        installed_langs = sorted(_get_installed_tesseract_languages())
        ocr_lang = _resolve_ocr_lang()
        out["tesseract_binary"] = True
        out["version"] = str(ver)
        out["installed_languages"] = installed_langs
        out["ocr_lang"] = ocr_lang
        out["ready"] = True
        if "fil" in installed_langs or "tgl" in installed_langs:
            out["message"] = f"Tesseract OCR is available (version {ver}) with Filipino language support ({ocr_lang})."
        else:
            out["message"] = (
                f"Tesseract OCR is available (version {ver}) using {ocr_lang}. "
                "Install Filipino language data (fil or tgl) for better Tagalog text recognition."
            )
    except Exception as e:
        out["message"] = f"Tesseract executable not found or failed to run: {e!s}"
        out["install_steps"] = [
            "Install the Tesseract OCR engine (separate from pip): https://github.com/UB-Mannheim/tesseract/wiki",
            "Windows default location is checked automatically: C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
            "If you used a custom folder, set env TESSERACT_CMD to the full path of tesseract.exe, then restart uvicorn.",
            "Restart the terminal and uvicorn after changing PATH or installing Tesseract.",
        ]
    return out


def _otsu_threshold(gray_img) -> int:
    """Compute Otsu threshold for 8-bit grayscale PIL image."""
    hist = gray_img.histogram()[:256]
    total = sum(hist)
    if total <= 0:
        return 160

    sum_total = 0.0
    for i, h in enumerate(hist):
        sum_total += i * h

    sum_b = 0.0
    w_b = 0
    max_var = -1.0
    threshold = 160

    for i, h in enumerate(hist):
        w_b += h
        if w_b == 0:
            continue
        w_f = total - w_b
        if w_f == 0:
            break

        sum_b += i * h
        m_b = sum_b / w_b
        m_f = (sum_total - sum_b) / w_f
        var_between = w_b * w_f * ((m_b - m_f) ** 2)
        if var_between > max_var:
            max_var = var_between
            threshold = i

    return threshold


def _score_ocr_text(text: str) -> float:
    """Heuristic score to prefer cleaner OCR output for form-style text."""
    if not text:
        return -1e9

    cleaned = text.strip()
    if not cleaned:
        return -1e9

    chars = list(cleaned)
    printable_ratio = sum(ch.isprintable() for ch in chars) / max(len(chars), 1)
    alnum_ratio = sum(ch.isalnum() or ch in " .,:-/()" for ch in chars) / max(len(chars), 1)

    lines = [ln.strip() for ln in cleaned.splitlines() if ln.strip()]
    median_len = statistics.median([len(ln) for ln in lines]) if lines else 0

    label_hits = len(
        re.findall(
            r"(?i)\b(petsa|date|control\s*no|pangalan|name|kaso|case|hukuman|court|address|tirahan|contact|status)\b",
            cleaned,
        )
    )

    gibberish_penalty = len(re.findall(r"[^\w\s\.,:/()\-]", cleaned))

    return (
        printable_ratio * 25
        + alnum_ratio * 45
        + min(median_len, 40) * 0.5
        + label_hits * 8
        - gibberish_penalty * 0.45
    )


def _run_easyocr_text(pil_img) -> Optional[str]:
    """Optional handwriting-biased OCR pass using EasyOCR when installed."""
    global _EASYOCR_READER
    try:
        import easyocr  # type: ignore[import-not-found]
        import numpy as np  # type: ignore[import-not-found]
    except ImportError:
        return None

    try:
        if _EASYOCR_READER is None:
            # English + Tagalog/Filipino Latin-script support.
            _EASYOCR_READER = easyocr.Reader(["en", "tl"], gpu=False, verbose=False)
        arr = np.array(pil_img.convert("RGB"))
        chunks = _EASYOCR_READER.readtext(arr, detail=0, paragraph=True)
        if not chunks:
            return None
        text = "\n".join(str(x).strip() for x in chunks if str(x).strip())
        return text or None
    except Exception:
        return None


def _order_quad_points(pts):
    """Return 4 points ordered as top-left, top-right, bottom-right, bottom-left."""
    pts = pts.astype("float32")
    s = pts.sum(axis=1)
    diff = pts[:, 0] - pts[:, 1]
    tl = pts[s.argmin()]
    br = pts[s.argmax()]
    tr = pts[diff.argmax()]
    bl = pts[diff.argmin()]
    return [tl, tr, br, bl]


def _opencv_document_autocrop(path: Path):
    """Detect paper contour and perspective-crop it. Returns PIL image or None."""
    try:
        import cv2  # type: ignore[import-not-found]
        import numpy as np  # type: ignore[import-not-found]
        from PIL import Image
    except ImportError:
        return None

    src = cv2.imread(str(path))
    if src is None:
        return None

    h0, w0 = src.shape[:2]
    max_side = max(h0, w0)
    scale = 1.0
    proc = src
    if max_side > 1600:
        scale = 1600.0 / max_side
        proc = cv2.resize(src, (int(w0 * scale), int(h0 * scale)), interpolation=cv2.INTER_AREA)

    gray = cv2.cvtColor(proc, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(gray, 60, 180)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    img_area = proc.shape[0] * proc.shape[1]
    best_quad = None
    best_area = 0.0

    for c in sorted(contours, key=cv2.contourArea, reverse=True)[:20]:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) != 4:
            continue
        area = cv2.contourArea(approx)
        if area < img_area * 0.15:
            continue
        if area > best_area:
            best_area = area
            best_quad = approx.reshape(4, 2)

    if best_quad is None:
        return None

    quad = np.array(_order_quad_points(best_quad), dtype="float32")
    quad /= max(scale, 1e-6)

    (tl, tr, br, bl) = quad
    width_a = float(np.linalg.norm(br - bl))
    width_b = float(np.linalg.norm(tr - tl))
    max_w = int(max(width_a, width_b))
    height_a = float(np.linalg.norm(tr - br))
    height_b = float(np.linalg.norm(tl - bl))
    max_h = int(max(height_a, height_b))
    if max_w < 10 or max_h < 10:
        return None

    dst = np.array(
        [[0, 0], [max_w - 1, 0], [max_w - 1, max_h - 1], [0, max_h - 1]],
        dtype="float32",
    )
    mat = cv2.getPerspectiveTransform(quad, dst)
    warped = cv2.warpPerspective(src, mat, (max_w, max_h))
    warped = cv2.cvtColor(warped, cv2.COLOR_BGR2RGB)
    return Image.fromarray(warped)


def _pil_to_data_url(img, max_w: int = 920, quality: int = 72) -> str:
    """Encode PIL image as compact JPEG data URL for UI preview."""
    try:
        from PIL import Image
    except ImportError:
        return ""

    out = img.convert("RGB")
    w, h = out.size
    if w > max_w:
        nh = max(1, int(h * (max_w / w)))
        out = out.resize((max_w, nh), Image.Resampling.LANCZOS)

    buf = io.BytesIO()
    out.save(buf, format="JPEG", quality=quality, optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return "data:image/jpeg;base64," + b64


def run_ocr_with_meta(image_path: str | Path) -> dict[str, Any]:
    """Run OCR and return text plus debug metadata for the scan UI."""
    try:
        from PIL import Image, ImageEnhance, ImageFilter, ImageOps
        import pytesseract
    except ImportError as e:
        raise RuntimeError(
            "OCR dependencies missing. Install: pip install -r requirements-ocr.txt "
            "and install Tesseract OCR for your OS."
        ) from e

    _apply_tesseract_cmd()
    lang = _resolve_ocr_lang()

    path = Path(image_path)
    document_detected = False
    img = _opencv_document_autocrop(path)
    if img is not None:
        document_detected = True
    else:
        img = Image.open(path)

    img = ImageOps.exif_transpose(img)
    img = img.convert("RGB")

    quality: dict[str, Any] = {}
    warnings: list[str] = []
    try:
        import cv2  # type: ignore[import-not-found]
        import numpy as np  # type: ignore[import-not-found]

        q_gray = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)
        lap_var = float(cv2.Laplacian(q_gray, cv2.CV_64F).var())
        mean_luma = float(q_gray.mean())
        std_luma = float(q_gray.std())
        quality = {
            "laplacian_var": round(lap_var, 2),
            "mean_luma": round(mean_luma, 2),
            "std_luma": round(std_luma, 2),
        }
        if lap_var < 45:
            warnings.append("Image is blurry. Hold still and refocus before capture.")
        if std_luma < 38:
            warnings.append("Low contrast detected. Increase lighting and avoid shadows.")
        if mean_luma < 70:
            warnings.append("Image is too dark. Add brighter, even light.")
    except Exception:
        quality = {}
    img = img.filter(ImageFilter.MedianFilter(size=3))
    gray = ImageOps.grayscale(ImageOps.autocontrast(img, cutoff=2))

    w, h = gray.size
    min_side = min(w, h)
    if min_side < 1600:
        scale = 1600 / max(min_side, 1)
        gray = gray.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    sharpened = ImageEnhance.Sharpness(gray).enhance(1.9)
    high_contrast = ImageEnhance.Contrast(sharpened).enhance(1.45)
    t = _otsu_threshold(high_contrast)

    variant_gray = high_contrast
    lut_bin = [255 if i > t else 0 for i in range(256)]
    soft_threshold = max(118, t - 14)
    lut_bin_soft = [255 if i > soft_threshold else 0 for i in range(256)]
    variant_bin = high_contrast.point(lut_bin)
    variant_bin_soft = high_contrast.point(lut_bin_soft)

    variants: list[tuple[str, Any]] = [
        ("gray", variant_gray),
        ("bin", variant_bin),
        ("bin_soft", variant_bin_soft),
    ]

    # Add adaptive threshold variant when OpenCV is available.
    try:
        import cv2  # type: ignore[import-not-found]
        import numpy as np  # type: ignore[import-not-found]

        arr = np.array(high_contrast)
        adap = cv2.adaptiveThreshold(
            arr,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,
            11,
        )
        variants.append(("adapt", Image.fromarray(adap)))
    except Exception:
        pass

    configs = [
        "--oem 3 --psm 6 -c preserve_interword_spaces=1 -c user_defined_dpi=300",
        "--oem 3 --psm 11 -c preserve_interword_spaces=1 -c user_defined_dpi=300",
        "--oem 1 --psm 13 -c preserve_interword_spaces=1 -c user_defined_dpi=300",
    ]

    best_text = ""
    best_score = -1e9
    best_variant_name = ""
    best_config = ""
    best_preview = variant_gray
    best_engine = "tesseract"
    scored_outputs: list[tuple[float, str]] = []
    for variant_name, variant in variants:
        for config in configs:
            text = pytesseract.image_to_string(variant, lang=lang, config=config)
            score = _score_ocr_text(text)
            scored_outputs.append((score, text))
            if score > best_score:
                best_score = score
                best_text = text
                best_variant_name = variant_name
                best_config = config
                best_preview = variant

    # Optional second-stage recognizer for handwriting when available.
    easy_text = _run_easyocr_text(best_preview)
    if easy_text:
        easy_score = _score_ocr_text(easy_text)
        scored_outputs.append((easy_score, easy_text))
        # Prefer EasyOCR when it is significantly cleaner, else blend both outputs.
        if easy_score > best_score * 1.05:
            best_text = easy_text
            best_score = easy_score
            best_variant_name = f"{best_variant_name}+easy"
            best_config = "easyocr(paragraph)"
            best_engine = "easyocr"
        elif easy_score > 20:
            merged = (best_text or "").strip()
            merged_easy = easy_text.strip()
            if merged_easy and merged_easy not in merged:
                best_text = (merged + "\n" + merged_easy).strip()
                best_variant_name = f"{best_variant_name}+easy-merge"
                best_config = f"{best_config} + easyocr(paragraph)"
                best_engine = "tesseract+easyocr"

    # Build support text from top-scoring distinct outputs to improve field extraction recall.
    support_chunks: list[str] = []
    seen_norm: set[str] = set()
    for _, txt in sorted(scored_outputs, key=lambda x: x[0], reverse=True):
        cleaned = (txt or "").strip()
        if not cleaned:
            continue
        norm = re.sub(r"\s+", " ", cleaned).lower()
        if norm in seen_norm:
            continue
        seen_norm.add(norm)
        support_chunks.append(cleaned)
        if len(support_chunks) >= 3:
            break
    support_text = "\n".join(support_chunks)

    return {
        "raw_text": best_text,
        "ocr_support_text": support_text,
        "document_detected": document_detected,
        "scan_quality": quality,
        "scan_warnings": warnings,
        "ocr_preview_data_url": _pil_to_data_url(best_preview),
        "ocr_best_variant": best_variant_name,
        "ocr_config": best_config,
        "ocr_lang": lang,
        "ocr_engine": best_engine,
    }


def run_ocr(image_path: str | Path) -> str:
    return run_ocr_with_meta(image_path)["raw_text"]


def _match_after_label(text: str, pattern: str, flags: int = re.I) -> Optional[str]:
    m = re.search(pattern, text, flags)
    if m and m.group(1):
        s = m.group(1).strip()
        return s if s else None
    return None


def extract_suggested_fields(raw_text: str) -> dict:
    """Lightweight PAO / legal intake hints from OCR text; always verify before filing."""
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
    out: dict = {}
    if not lines:
        return out

    joined = "\n".join(lines)
    out["notes"] = "Review all fields; OCR output requires verification per JurisGuard design."
    out["line_count"] = len(lines)
    out["first_lines_preview"] = lines[:8]

    # PAO interview sheet style labels (English + Tagalog, tolerant spacing)
    if v := _match_after_label(
        joined,
        r"(?:Region|Rehiyon)[ \t]*[:.\-]?[ \t]*(.+)",
        re.I,
    ):
        out["region_suggested"] = v.split("\n")[0][:120]
    if v := _match_after_label(
        joined,
        r"(?:District\s*Office|Tanggapan\s*ng\s*Distrito)[ \t]*[:.\-]?[ \t]*(.+)",
        re.I,
    ):
        out["district_office_suggested"] = v.split("\n")[0][:160]
    if v := _match_after_label(
        joined,
        r"(?:Control\s*/?\s*No\.?|Bilang\s*ng\s*Kontrol|Control\s*Number)[ \t]*[:.\-]?[ \t]*(.+)",
        re.I,
    ):
        out["control_number_suggested"] = v.split("\n")[0][:120]
    if v := _match_after_label(
        joined,
        r"(?:^|\n)[ \t]*(?:Name|Pangalan|Buong\s*Pangalan)[ \t]*:?[ \t]*(.+)",
        re.I,
    ):
        out["client_name_suggested"] = v.split("\n")[0][:200]
    if v := _match_after_label(joined, r"(?:Address|Tirahan|Adres)[ \t]*:?[ \t]*(.+)", re.I):
        out["address_suggested"] = v.split("\n")[0][:300]
    if v := _match_after_label(
        joined,
        r"(?:Contact\s*No\.?|Numero\s*ng\s*Kontak|Telepono|Phone\s*No\.?)[ \t]*:?[ \t]*(.+)",
        re.I,
    ):
        out["contact_suggested"] = v.split("\n")[0][:80]
    if v := _match_after_label(
        joined,
        r"(?:Title\s+of\s+(?:the\s+)?Case|Pamagat\s*ng\s*Kaso)[ \t]*:?[ \t]*(.+)",
        re.I,
    ):
        out["title_of_case_suggested"] = v.split("\n")[0][:300]
    if v := _match_after_label(
        joined,
        r"(?:Docket|Case|Kaso)\s*No\.?[ \t]*:?[ \t]*(.+)",
        re.I,
    ):
        out["case_number_suggested"] = v.split("\n")[0][:120]
    if v := _match_after_label(joined, r"(?:Court|Hukuman|Lupon)[ \t]*:?[ \t]*(.+)", re.I):
        out["court_suggested"] = v.split("\n")[0][:200]
    if v := _match_after_label(
        joined,
        r"(?:Party\s*Represented|Kinatawang\s*Partido|Partidong\s*Kinakatawan)[ \t]*:?[ \t]*(.+)",
        re.I,
    ):
        out["party_represented_suggested"] = v.split("\n")[0][:200]
    if v := _match_after_label(
        joined,
        r"(?:Cause\s*of\s*Action|Sanhi\s*ng\s*(?:Pagkilos|Aksyon))[ \t]*:?[ \t]*(.+)",
        re.I,
    ):
        out["cause_of_action_suggested"] = v.split("\n")[0][:200]
    if v := _match_after_label(
        joined,
        r"(?:Status\s*of\s*(?:the\s*)?Case|Kalagayan\s*ng\s*Kaso)[ \t]*:?[ \t]*(.+)",
        re.I,
    ):
        out["status_suggested"] = v.split("\n")[0][:120]
    if v := _match_after_label(
        joined,
        r"(?:Last\s*Action\s*Taken|Huling\s*Aksyon)[ \t]*:?[ \t]*(.+)",
        re.I,
    ):
        out["last_action_taken_suggested"] = v.split("\n")[0][:300]
    if v := _match_after_label(
        joined,
        r"(?:Cause\s*of\s*Termination|Sanhi\s*ng\s*Pagtatapos)[ \t]*:?[ \t]*(.+)",
        re.I,
    ):
        out["cause_of_termination_suggested"] = v.split("\n")[0][:200]
    if v := _match_after_label(
        joined,
        r"(?:Date\s*of\s*Termination|Petsa\s*ng\s*Pagtatapos)[ \t]*:?[ \t]*(.+)",
        re.I,
    ):
        out["date_of_termination_suggested"] = v.split("\n")[0][:80]
    if v := _match_after_label(
        joined,
        r"(?:^|\n)[ \t]*(?:Petsa\s*/\s*Date|Date\s*/\s*Petsa|Petsa|Date)[ \t]*[:.\-]?[ \t]*(.+)",
        re.I,
    ):
        date_value = v.split("\n")[0][:80]
        # Ignore cases where OCR line was actually a Date of Termination label.
        if not re.match(r"(?i)^(?:of\s*termination|ng\s*pagtatapos)\b", date_value):
            out["date_suggested"] = date_value

    if "date_suggested" not in out:
        for ln in lines:
            if not re.match(r"(?i)^\s*(?:Petsa|Date)(?:\s*/\s*(?:Date|Petsa))?\b", ln):
                continue
            candidate = re.sub(
                r"(?i)^\s*(?:Petsa|Date)(?:\s*/\s*(?:Date|Petsa))?\b[ \t]*[:.\-]?[ \t]*",
                "",
                ln,
            ).strip()
            if not candidate:
                continue
            if re.match(r"(?i)^(?:of\s*termination|ng\s*pagtatapos)\b", candidate):
                continue
            out["date_suggested"] = candidate[:80]
            break

    if v := _match_after_label(
        joined,
        r"(?:Mananayam|Interviewer|Tagapanayam|Mananay[ao]m)[ \t]*[:.\-]?[ \t]*(.+)",
        re.I,
    ):
        out["interviewer_name_suggested"] = v.split("\n")[0][:200]

    if v := _match_after_label(
        joined,
        r"(?:Ini[- ]?refer\s*ni|Inirefer\s*ni|Inindorso\s*ng|Inendorso\s*ng)[ \t]*[:.\-]?[ \t]*(.+)",
        re.I,
    ):
        out["referred_by_suggested"] = v.split("\n")[0][:220]

    return out
