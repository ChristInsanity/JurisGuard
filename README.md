# JurisGuard (Capstone)

JurisGuard is a FastAPI-based legal intake and case support app with OCR-assisted form extraction.

## Quick Setup (Windows)

### 1) Clone and open
```powershell
git clone <your-repo-url>
cd Capstone\backend
```

### 2) Create virtual environment
```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If `py -3.14` is not available, run:
```powershell
py -0p
```
and use an installed version.

### 3) Install dependencies
```powershell
pip install -r requirements.txt
pip install -r requirements-ocr.txt
```

### 4) Run the API
```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8010
```

Open:
- API docs: http://127.0.0.1:8010/docs
- Health check: http://127.0.0.1:8010/api/health

## OCR Setup

This project uses Tesseract OCR + Python OCR libraries.

1. Install Tesseract for Windows:
   - https://github.com/UB-Mannheim/tesseract/wiki
2. Restart terminal after install.
3. Verify OCR status in browser at `/api/health`.

Optional:
- Install Filipino language data (`fil` or `tgl`) in Tesseract for better Tagalog recognition.

## First Admin (Optional)

```powershell
python scripts/seed_admin.py admin@local.test SecretPass123
```

## Notes

- Port `8000` may be blocked on some machines; this project is configured to run on `8010`.
- OCR quality depends heavily on image quality. Use bright lighting and stable, in-focus photos.
- Handwriting recognition is best-effort.
