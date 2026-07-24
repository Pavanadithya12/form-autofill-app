import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Form Auto-Filler API"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    
    # MongoDB Atlas Connection
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb+srv://localhost:27017/form_autofill")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "form_autofill_db")
    COLLECTION_NAME: str = os.getenv("COLLECTION_NAME", "extractions")
    
    # CORS Origins
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "*"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
