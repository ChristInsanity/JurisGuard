from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "JurisGuard"
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8
    database_url: str = "sqlite:///./jurisguard.db"
    # Fernet key for optional field-level encryption (generate with Fernet.generate_key())
    fernet_key: Optional[str] = None
    # If Tesseract is not on PATH (common on Windows), set full path to tesseract.exe
    tesseract_cmd: Optional[str] = None


settings = Settings()
