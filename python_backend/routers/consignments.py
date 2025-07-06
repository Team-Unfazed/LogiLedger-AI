from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import uuid
import os
from bson import ObjectId
from db import get_consignments_collection, get_users_collection
from routers.auth import decode_token

router = APIRouter()
security = HTTPBearer()

# Pydantic models
class ConsignmentCreate(BaseModel):
    title: str
    origin: str
    destination: str
    goodsType: str
    weight: float
    deadline: str
    budget: float
    description: Optional[str] = None

class ConsignmentUpdate(BaseModel):
    status: str

class ConsignmentResponse(BaseModel):
    id: str
    title: str
    origin: str
    destination: str
    goodsType: str
    weight: float
    deadline: str
    budget: float
    description: str
    status: str
    companyId: str
    companyName: str
    bidCount: int
    createdAt: str
    updatedAt: str

class ConsignmentListResponse(BaseModel):
    success: bool
    consignments: List[ConsignmentResponse]
    message: Optional[str] = None

def normalize_location(location: str) -> str:
    """Normalize location format to 'City, State'"""
    # Simple normalization - in production, use a proper geocoding service
    location = location.strip()
    if ',' not in location:
        # Try to add state if not present
        common_cities = {
            "Mumbai": "Mumbai, Maharashtra",
            "Delhi": "Delhi, Delhi",
            "Bangalore": "Bangalore, Karnataka",
            "Chennai": "Chennai, Tamil Nadu",
            "Kolkata": "Kolkata, West Bengal",
            "Hyderabad": "Hyderabad, Telangana",
            "Pune": "Pune, Maharashtra",
            "Ahmedabad": "Ahmedabad, Gujarat",
            "Jaipur": "Jaipur, Rajasthan",
            "Lucknow": "Lucknow, Uttar Pradesh"
        }
        for city, full_location in common_cities.items():
            if city.lower() in location.lower():
                return full_location
        return f"{location}, India"
    return location

def locations_match(location1: str, location2: str) -> bool:
    """Check if two locations match (simple implementation)"""
    loc1 = location1.lower().replace(' ', '')
    loc2 = location2.lower().replace(' ', '')
    
    # Check if one location contains the other
    if loc1 in loc2 or loc2 in loc1:
        return True
    
    # Check for common city names
    cities1 = set(location1.lower().split(','))
    cities2 = set(location2.lower().split(','))
    
    return bool(cities1.intersection(cities2))

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from token"""
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id = payload.get("sub")
        
        users_collection = get_users_collection()
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        user["id"] = str(user["_id"])
        return user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

@router.post("/create", response_model=ConsignmentResponse)
async def create_consignment(
    consignment_data: ConsignmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new consignment"""
    try:
        print(f"[CreateConsignment] Received data: {consignment_data}")
        print(f"[CreateConsignment] Current user: {current_user}")
        
        if current_user["userType"] != "company":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only companies can create consignments"
            )
        
        # Normalize locations
        normalized_origin = normalize_location(consignment_data.origin)
        normalized_destination = normalize_location(consignment_data.destination)
        
        print(f"[CreateConsignment] Normalized origin: {normalized_origin}")
        print(f"[CreateConsignment] Normalized destination: {normalized_destination}")
        
        if not normalized_origin or not normalized_destination:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid location format. Please use 'City, State' format"
            )
        
        consignments_collection = get_consignments_collection()
        
        # Create consignment
        consignment = {
            "title": consignment_data.title,
            "origin": normalized_origin,
            "destination": normalized_destination,
            "goodsType": consignment_data.goodsType or "other",
            "weight": consignment_data.weight,
            "deadline": consignment_data.deadline,
            "budget": consignment_data.budget,
            "description": consignment_data.description or "No description provided",
            "status": "open",
            "companyId": current_user["id"],
            "companyName": current_user.get("companyName") or current_user["name"],
            "bidCount": 0,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        
        result = await consignments_collection.insert_one(consignment)
        consignment["id"] = str(result.inserted_id)
        
        print(f"[CreateConsignment] Consignment created successfully: {consignment}")
        
        return ConsignmentResponse(**consignment)
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"[CreateConsignment] Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create consignment: {str(e)}"
        )

@router.get("/my-consignments", response_model=ConsignmentListResponse)
async def get_my_consignments(current_user: dict = Depends(get_current_user)):
    """Get consignments created by the current user"""
    if current_user["userType"] != "company":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only companies can view their consignments"
        )
    
    consignments_collection = get_consignments_collection()
    
    # Get user's consignments
    cursor = consignments_collection.find({"companyId": current_user["id"]})
    consignments = await cursor.to_list(length=None)
    
    # Convert MongoDB documents to response format
    user_consignments = []
    for consignment in consignments:
        consignment_data = {k: v for k, v in consignment.items() if k != "_id"}
        consignment_data["id"] = str(consignment["_id"])
        user_consignments.append(ConsignmentResponse(**consignment_data))
    
    print(f"[GetMyConsignments] Found {len(user_consignments)} consignments for user {current_user['id']}")
    
    return ConsignmentListResponse(
        success=True,
        consignments=user_consignments
    )

@router.get("/available", response_model=ConsignmentListResponse)
async def get_available_consignments(current_user: dict = Depends(get_current_user)):
    """Get available consignments for MSMEs"""
    if current_user["userType"] != "msme":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only MSMEs can view available consignments"
        )
    
    consignments_collection = get_consignments_collection()
    
    # Get all open consignments
    cursor = consignments_collection.find({"status": "open"})
    all_consignments = await cursor.to_list(length=None)
    
    # Filter by location if user has location
    user_location = current_user.get("location")
    if user_location:
        user_location_normalized = normalize_location(user_location)
        matching_consignments = [
            consignment for consignment in all_consignments
            if (locations_match(user_location_normalized, consignment["origin"]) or
                locations_match(user_location_normalized, consignment["destination"]))
        ]
    else:
        matching_consignments = all_consignments
    
    # Convert MongoDB documents to response format
    response_consignments = []
    for consignment in matching_consignments:
        consignment_data = {k: v for k, v in consignment.items() if k != "_id"}
        consignment_data["id"] = str(consignment["_id"])
        response_consignments.append(ConsignmentResponse(**consignment_data))
    
    print(f"[GetAvailableConsignments] Total: {len(all_consignments)}, Matching: {len(matching_consignments)}")
    
    return ConsignmentListResponse(
        success=True,
        consignments=response_consignments
    )

@router.get("/public", response_model=ConsignmentListResponse)
async def get_public_consignments():
    """Get public consignments (no authentication required)"""
    consignments_collection = get_consignments_collection()
    
    # Get all open consignments
    cursor = consignments_collection.find({"status": "open"})
    public_consignments = await cursor.to_list(length=None)
    
    # Convert MongoDB documents to response format
    response_consignments = []
    for consignment in public_consignments:
        consignment_data = {k: v for k, v in consignment.items() if k != "_id"}
        consignment_data["id"] = str(consignment["_id"])
        response_consignments.append(ConsignmentResponse(**consignment_data))
    
    return ConsignmentListResponse(
        success=True,
        consignments=response_consignments
    )

@router.get("/{consignment_id}", response_model=ConsignmentResponse)
async def get_consignment_by_id(consignment_id: str):
    """Get a specific consignment by ID"""
    consignments_collection = get_consignments_collection()
    
    consignment = await consignments_collection.find_one({"_id": ObjectId(consignment_id)})
    
    if not consignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consignment not found"
        )
    
    # Convert MongoDB document to response format
    consignment_data = {k: v for k, v in consignment.items() if k != "_id"}
    consignment_data["id"] = str(consignment["_id"])
    
    return ConsignmentResponse(**consignment_data)

@router.put("/{consignment_id}/status", response_model=ConsignmentResponse)
async def update_consignment_status(
    consignment_id: str,
    status_update: ConsignmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update consignment status"""
    consignments_collection = get_consignments_collection()
    
    consignment = await consignments_collection.find_one({"_id": ObjectId(consignment_id)})
    
    if not consignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consignment not found"
        )
    
    # Check if user owns the consignment
    if consignment["companyId"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Validate status
    valid_statuses = ["open", "awarded", "in_progress", "completed"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    # Update the consignment
    await consignments_collection.update_one(
        {"_id": ObjectId(consignment_id)},
        {
            "$set": {
                "status": status_update.status,
                "updatedAt": datetime.now().isoformat()
            }
        }
    )
    
    # Get updated consignment
    updated_consignment = await consignments_collection.find_one({"_id": ObjectId(consignment_id)})
    consignment_data = {k: v for k, v in updated_consignment.items() if k != "_id"}
    consignment_data["id"] = str(updated_consignment["_id"])
    
    return ConsignmentResponse(**consignment_data)

@router.post("/seed")
async def seed_consignments():
    """Seed sample consignments (for testing)"""
    consignments_db = get_consignments_db()
    
    # Clear existing consignments
    consignments_db.clear()
    
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
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Machinery Transport",
            "origin": "Chennai, Tamil Nadu",
            "destination": "Bangalore, Karnataka",
            "goodsType": "machinery",
            "weight": 2000,
            "deadline": (datetime.now() + timedelta(days=10)).isoformat(),
            "budget": 25000,
            "description": "Heavy machinery requiring specialized transport",
            "status": "open",
            "companyId": "sample-company-1",
            "companyName": "TechCorp India",
            "bidCount": 0,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
    ]
    
    # Add sample consignments
    for consignment in sample_consignments:
        consignments_db[consignment["id"]] = consignment
    
    return {
        "success": True,
        "message": f"Seeded {len(sample_consignments)} sample consignments",
        "consignments": sample_consignments
    }

@router.get("/location-recommendations")
async def get_location_recommendations(query: str):
    """Get location recommendations based on query"""
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query parameter is required"
        )
    
    # Sample location recommendations
    locations = [
        "Mumbai, Maharashtra",
        "Delhi, Delhi",
        "Bangalore, Karnataka",
        "Chennai, Tamil Nadu",
        "Kolkata, West Bengal",
        "Hyderabad, Telangana",
        "Pune, Maharashtra",
        "Ahmedabad, Gujarat",
        "Jaipur, Rajasthan",
        "Lucknow, Uttar Pradesh"
    ]
    
    filtered_locations = [
        location for location in locations
        if query.lower() in location.lower()
    ]
    
    return {
        "success": True,
        "locations": filtered_locations[:5]  # Limit to 5 results
    } 