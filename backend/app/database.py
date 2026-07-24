import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("uvicorn")

class Database:
    client: AsyncIOMotorClient = None
    db = None
    is_connected: bool = False
    in_memory_history = []

db_instance = Database()

async def connect_to_mongo():
    try:
        if settings.MONGODB_URI and "mongodb" in settings.MONGODB_URI:
            db_instance.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=3000
            )
            db_instance.db = db_instance.client[settings.DATABASE_NAME]
            # Ping connection
            await db_instance.client.admin.command('ping')
            db_instance.is_connected = True
            logger.info("Successfully connected to MongoDB Atlas!")
        else:
            logger.warning("MongoDB URI not provided. Using in-memory history fallback.")
    except Exception as e:
        logger.warning(f"MongoDB Atlas connection failed: {e}. Fallback to in-memory history.")
        db_instance.is_connected = False

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("Closed MongoDB Atlas connection.")

async def save_extraction_history(doc_data: dict) -> str:
    if db_instance.is_connected and db_instance.db is not None:
        try:
            res = await db_instance.db[settings.COLLECTION_NAME].insert_one(doc_data)
            return str(res.inserted_id)
        except Exception as e:
            logger.error(f"Error saving to MongoDB: {e}")
    
    # In-memory fallback
    db_instance.in_memory_history.insert(0, doc_data)
    if len(db_instance.in_memory_history) > 50:
        db_instance.in_memory_history.pop()
    return doc_data.get("id", "mem_id")

async def get_extraction_history(limit: int = 20) -> list:
    if db_instance.is_connected and db_instance.db is not None:
        try:
            cursor = db_instance.db[settings.COLLECTION_NAME].find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
            return await cursor.to_list(length=limit)
        except Exception as e:
            logger.error(f"Error fetching from MongoDB: {e}")
    
    return db_instance.in_memory_history[:limit]
