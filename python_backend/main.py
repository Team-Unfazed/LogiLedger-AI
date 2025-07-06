from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from typing import Dict, List, Optional
import uuid
from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv

# Import routers
from routers import auth, consignments, bids, jobs, telegram
# Import shared DBs and config
from db import (
    connect_to_mongo, 
    close_mongo_connection, 
    get_users_collection, 
    get_consignments_collection, 
    get_bids_collection, 
    get_jobs_collection,
    SECRET_KEY, 
    ALGORITHM, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Load environment variables
load_dotenv()

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting LogiLedger AI Backend...")
    print("📊 Connecting to MongoDB...")
    
    # Connect to MongoDB
    await connect_to_mongo()
    
    # Seed some sample data
    await seed_sample_data()
    
    yield
    
    # Shutdown
    print("🛑 Shutting down LogiLedger AI Backend...")
    await close_mongo_connection()

# Create FastAPI app
app = FastAPI(
    title="LogiLedger AI Backend",
    description="AI-powered logistics platform connecting companies with MSMEs across India",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:8081", "http://127.0.0.1:8080", "http://127.0.0.1:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = auth.decode_token(token)
        user_id = payload.get("sub")
        users_collection = get_users_collection()
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = await users_collection.find_one({"id": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(consignments.router, prefix="/api/consignments", tags=["Consignments"])
app.include_router(bids.router, prefix="/api/bids", tags=["Bidding"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(telegram.router, prefix="/api/telegram", tags=["Telegram"])

# Health check endpoint
@app.get("/health")
async def health_check():
    users_collection = get_users_collection()
    consignments_collection = get_consignments_collection()
    bids_collection = get_bids_collection()
    jobs_collection = get_jobs_collection()
    
    # Get document counts
    users_count = await users_collection.count_documents({})
    consignments_count = await consignments_collection.count_documents({})
    bids_count = await bids_collection.count_documents({})
    jobs_count = await jobs_collection.count_documents({})
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "database": "MongoDB",
        "storage": {
            "users": users_count,
            "consignments": consignments_count,
            "bids": bids_count,
            "jobs": jobs_count
        }
    }

# Seed sample data
async def seed_sample_data():
    """Seed the database with sample data for testing"""
    users_collection = get_users_collection()
    consignments_collection = get_consignments_collection()
    
    # Sample users
    sample_users = [
        {
            "id": "sample-company-1",
            "name": "TechCorp India",
            "email": "techcorp@example.com",
            "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i",  # "password123"
            "userType": "company",
            "companyName": "TechCorp India",
            "location": "Mumbai, Maharashtra",
            "phone": "+91-9876543210",
            "createdAt": datetime.now().isoformat()
        },
        {
            "id": "sample-company-2",
            "name": "FashionHub",
            "email": "fashionhub@example.com",
            "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i",  # "password123"
            "userType": "company",
            "companyName": "FashionHub",
            "location": "Ahmedabad, Gujarat",
            "phone": "+91-9876543211",
            "createdAt": datetime.now().isoformat()
        },
        {
            "id": "sample-msme-1",
            "name": "Speed Transport",
            "email": "speedtransport@example.com",
            "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i",  # "password123"
            "userType": "msme",
            "companyName": "Speed Transport",
            "location": "Mumbai, Maharashtra",
            "phone": "+91-9876543212",
            "fleetSize": 5,
            "vehicleTypes": ["truck", "tempo"],
            "createdAt": datetime.now().isoformat()
        },
        {
            "id": "sample-msme-2",
            "name": "Reliable Logistics",
            "email": "reliablelogistics@example.com",
            "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i",  # "password123"
            "userType": "msme",
            "companyName": "Reliable Logistics",
            "location": "Pune, Maharashtra",
            "phone": "+91-9876543213",
            "fleetSize": 3,
            "vehicleTypes": ["truck"],
            "createdAt": datetime.now().isoformat()
        }
    ]
    
    # Sample consignments
    sample_consignments = [
        {
            "id": str(uuid.uuid4()),
            "title": "Electronics Delivery",
            "origin": "Mumbai, Maharashtra",
            "destination": "Pune, Maharashtra",
            "goodsType": "electronics",
            "weight": 500,
            "deadline": (datetime.now() + timedelta(days=7)).isoformat(),
            "budget": 15000,
            "description": "Fragile electronics requiring careful handling",
            "status": "open",
            "companyId": "sample-company-1",
            "companyName": "TechCorp India",
            "bidCount": 0,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Textile Shipment",
            "origin": "Ahmedabad, Gujarat",
            "destination": "Mumbai, Maharashtra",
            "goodsType": "textiles",
            "weight": 1000,
            "deadline": (datetime.now() + timedelta(days=5)).isoformat(),
            "budget": 12000,
            "description": "Bulk textile shipment for retail stores",
            "status": "open",
            "companyId": "sample-company-2",
            "companyName": "FashionHub",
            "bidCount": 0,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
    ]
    
    # Add sample data to MongoDB
    for user in sample_users:
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user["email"]})
        if not existing_user:
            await users_collection.insert_one(user)
            print(f"✅ Added sample user: {user['name']}")
        else:
            print(f"⏭️ Sample user already exists: {user['name']}")
    
    for consignment in sample_consignments:
        # Check if consignment already exists
        existing_consignment = await consignments_collection.find_one({"title": consignment["title"], "companyId": consignment["companyId"]})
        if not existing_consignment:
            await consignments_collection.insert_one(consignment)
            print(f"✅ Added sample consignment: {consignment['title']}")
        else:
            print(f"⏭️ Sample consignment already exists: {consignment['title']}")
    
    print(f"✅ Seeded {len(sample_users)} users and {len(sample_consignments)} consignments")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3000,
        reload=True,
        log_level="info"
    ) 