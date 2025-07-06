import os
from typing import Dict
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/logiledger")
DATABASE_NAME = "logiledger"

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# MongoDB client
client: AsyncIOMotorClient = None
database = None

# Collection names
USERS_COLLECTION = "users"
CONSIGNMENTS_COLLECTION = "consignments"
BIDS_COLLECTION = "bids"
JOBS_COLLECTION = "jobs"

async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        database = client[DATABASE_NAME]
        
        # Test the connection
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB")
        
        # Create indexes for better performance
        await create_indexes()
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Users collection indexes
        await database[USERS_COLLECTION].create_index("email", unique=True)
        
        # Consignments collection indexes
        await database[CONSIGNMENTS_COLLECTION].create_index("companyId")
        await database[CONSIGNMENTS_COLLECTION].create_index("status")
        await database[CONSIGNMENTS_COLLECTION].create_index("origin")
        await database[CONSIGNMENTS_COLLECTION].create_index("destination")
        
        # Bids collection indexes
        await database[BIDS_COLLECTION].create_index("consignmentId")
        await database[BIDS_COLLECTION].create_index("bidderId")
        await database[BIDS_COLLECTION].create_index([("consignmentId", 1), ("bidderId", 1)], unique=True)
        
        # Jobs collection indexes
        await database[JOBS_COLLECTION].create_index("consignmentId")
        await database[JOBS_COLLECTION].create_index("transporterId")
        await database[JOBS_COLLECTION].create_index("companyId")
        
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"⚠️ Warning: Could not create indexes: {e}")

# Collection getters
def get_users_collection():
    """Get users collection"""
    return database[USERS_COLLECTION]

def get_consignments_collection():
    """Get consignments collection"""
    return database[CONSIGNMENTS_COLLECTION]

def get_bids_collection():
    """Get bids collection"""
    return database[BIDS_COLLECTION]

def get_jobs_collection():
    """Get jobs collection"""
    return database[JOBS_COLLECTION]

# Legacy getter functions for backward compatibility (will be removed after migration)
def get_users_db():
    """Legacy function - returns empty dict for compatibility"""
    return {}

def get_consignments_db():
    """Legacy function - returns empty dict for compatibility"""
    return {}

def get_bids_db():
    """Legacy function - returns empty dict for compatibility"""
    return {}

def get_jobs_db():
    """Legacy function - returns empty dict for compatibility"""
    return {} 