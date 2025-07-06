from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import uuid
import os
from bson import ObjectId
from db import get_bids_collection, get_consignments_collection, get_users_collection
from routers.auth import decode_token

router = APIRouter()
security = HTTPBearer()

# Pydantic models
class BidCreate(BaseModel):
    consignmentId: str
    bidAmount: float
    estimatedDelivery: str
    notes: Optional[str] = None

class BidUpdate(BaseModel):
    status: str

class BidResponse(BaseModel):
    id: str
    consignmentId: str
    consignmentTitle: str
    bidderId: str
    bidderName: str
    bidderCompany: str
    bidAmount: float
    estimatedDelivery: str
    notes: str
    status: str
    createdAt: str
    awardedAt: Optional[str] = None
    updatedAt: Optional[str] = None

class BidListResponse(BaseModel):
    success: bool
    bids: List[BidResponse]
    message: Optional[str] = None

class BidCreateResponse(BaseModel):
    success: bool
    bid: BidResponse
    message: str

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

async def increment_bid_count(consignment_id: str):
    """Increment bid count for a consignment"""
    consignments_collection = get_consignments_collection()
    consignment = await consignments_collection.find_one({"_id": ObjectId(consignment_id)})
    if consignment:
        old_count = consignment.get("bidCount", 0)
        new_count = old_count + 1
        await consignments_collection.update_one(
            {"_id": ObjectId(consignment_id)},
            {
                "$set": {
                    "bidCount": new_count,
                    "updatedAt": datetime.now().isoformat()
                }
            }
        )
        print(f"[incrementBidCount] Updated bid count from {old_count} to {new_count}")

@router.post("/create", response_model=BidCreateResponse)
async def create_bid(
    bid_data: BidCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new bid"""
    print(f"[CreateBid] User: {current_user}")
    print(f"[CreateBid] Bid data: {bid_data}")
    
    if current_user["userType"] != "msme":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only MSMEs can place bids"
        )
    
    consignments_collection = get_consignments_collection()
    bids_collection = get_bids_collection()
    
    # Check if consignment exists and is open
    consignment = await consignments_collection.find_one({"_id": ObjectId(bid_data.consignmentId)})
    if not consignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consignment not found"
        )
    if consignment["status"] != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This consignment is no longer accepting bids"
        )
    
    # Check if user already bid on this consignment
    existing_bid = await bids_collection.find_one({
        "consignmentId": bid_data.consignmentId,
        "bidderId": current_user["id"]
    })
    
    if existing_bid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already placed a bid on this consignment"
        )
    
    # Validate bid amount
    if bid_data.bidAmount > consignment["budget"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bid amount cannot exceed the maximum budget"
        )
    
    # Validate estimated delivery
    try:
        estimated_date = datetime.fromisoformat(bid_data.estimatedDelivery.replace('Z', '+00:00'))
        deadline = datetime.fromisoformat(consignment["deadline"].replace('Z', '+00:00'))
        if estimated_date > deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Estimated delivery cannot be after the deadline"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    
    # Create bid
    bid = {
        "consignmentId": bid_data.consignmentId,
        "consignmentTitle": consignment["title"],
        "bidderId": current_user["id"],
        "bidderName": current_user["name"],
        "bidderCompany": current_user.get("companyName") or current_user["name"],
        "bidAmount": bid_data.bidAmount,
        "estimatedDelivery": bid_data.estimatedDelivery,
        "notes": bid_data.notes or "",
        "status": "pending",
        "createdAt": datetime.now().isoformat()
    }
    
    result = await bids_collection.insert_one(bid)
    bid["id"] = str(result.inserted_id)
    
    # Increment bid count on consignment
    await increment_bid_count(bid_data.consignmentId)
    
    print(f"[CreateBid] Bid created: {bid}")
    print(f"[CreateBid] Updated consignment bid count")
    print(f"[CreateBid] Total bids in database")
    
    return BidCreateResponse(
        success=True,
        bid=BidResponse(**bid),
        message="Bid placed successfully"
    )

@router.get("/my-bids", response_model=BidListResponse)
async def get_my_bids(current_user: dict = Depends(get_current_user)):
    """Get bids placed by the current user"""
    if current_user["userType"] != "msme":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only MSMEs can view their bids"
        )
    
    bids_collection = get_bids_collection()
    
    # Get user's bids
    cursor = bids_collection.find({"bidderId": current_user["id"]})
    bids = await cursor.to_list(length=None)
    
    # Convert MongoDB documents to response format
    user_bids = []
    for bid in bids:
        bid_data = {k: v for k, v in bid.items() if k != "_id"}
        bid_data["id"] = str(bid["_id"])
        user_bids.append(BidResponse(**bid_data))
    
    return BidListResponse(
        success=True,
        bids=user_bids
    )

@router.get("/consignment/{consignment_id}", response_model=BidListResponse)
async def get_consignment_bids(
    consignment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all bids for a specific consignment"""
    print(f"[GetConsignmentBids] User ID: {current_user.get('id')}")
    print(f"[GetConsignmentBids] User Type: {current_user.get('userType')}")
    print(f"[GetConsignmentBids] Consignment ID: {consignment_id}")
    consignments_db = get_consignments_db()
    bids_db = get_bids_db()

    # Check if consignment exists and belongs to the user
    if consignment_id not in consignments_db:
        print(f"[GetConsignmentBids] Consignment not found: {consignment_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consignment not found"
        )

    consignment = consignments_db[consignment_id]
    print(f"[GetConsignmentBids] Consignment companyId: {consignment.get('companyId')}")

    if current_user["userType"] != "company":
        print(f"[GetConsignmentBids] Forbidden: user is not a company")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only companies can view bids for their consignments"
        )

    if consignment["companyId"] != current_user["id"]:
        print(f"[GetConsignmentBids] Forbidden: consignment does not belong to user")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Get all bids for this consignment
    consignment_bids = [
        BidResponse(**bid)
        for bid in bids_db.values()
        if bid["consignmentId"] == consignment_id
    ]

    print(f"[GetConsignmentBids] Found bids for consignment: {len(consignment_bids)}")
    print(f"[GetConsignmentBids] Bids: {consignment_bids}")

    return BidListResponse(
        success=True,
        bids=consignment_bids
    )

@router.post("/{bid_id}/award", response_model=BidCreateResponse)
async def award_bid(
    bid_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Award a bid (company only)"""
    if current_user["userType"] != "company":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only companies can award bids"
        )
    
    bids_db = get_bids_db()
    consignments_db = get_consignments_db()
    
    # Find bid
    if bid_id not in bids_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
        )
    
    bid = bids_db[bid_id]
    
    # Check if consignment belongs to the user
    if bid["consignmentId"] not in consignments_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consignment not found"
        )
    
    consignment = consignments_db[bid["consignmentId"]]
    if consignment["companyId"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check if consignment is still open
    if consignment["status"] != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This consignment is no longer accepting awards"
        )
    
    # Award the bid
    bid["status"] = "awarded"
    bid["awardedAt"] = datetime.now().isoformat()
    bid["updatedAt"] = datetime.now().isoformat()
    
    # Update consignment status
    consignment["status"] = "awarded"
    consignment["awardedBidderId"] = bid["bidderId"]
    consignment["finalAmount"] = bid["bidAmount"]
    consignment["updatedAt"] = datetime.now().isoformat()
    
    # Reject all other bids for this consignment
    for other_bid in bids_db.values():
        if (other_bid["consignmentId"] == bid["consignmentId"] and 
            other_bid["id"] != bid_id):
            other_bid["status"] = "rejected"
            other_bid["updatedAt"] = datetime.now().isoformat()
    
    return BidCreateResponse(
        success=True,
        bid=BidResponse(**bid),
        message="Bid awarded successfully"
    )

@router.put("/{bid_id}/status", response_model=BidCreateResponse)
async def update_bid_status(
    bid_id: str,
    status_update: BidUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update bid status"""
    bids_db = get_bids_db()
    consignments_db = get_consignments_db()
    
    if bid_id not in bids_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
        )
    
    bid = bids_db[bid_id]
    
    # Check permissions
    if bid["consignmentId"] in consignments_db:
        consignment = consignments_db[bid["consignmentId"]]
        if (current_user["userType"] == "company" and 
            consignment["companyId"] != current_user["id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    if (current_user["userType"] == "msme" and 
        bid["bidderId"] != current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Validate status
    valid_statuses = ["pending", "awarded", "rejected"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    bid["status"] = status_update.status
    bid["updatedAt"] = datetime.now().isoformat()
    
    return BidCreateResponse(
        success=True,
        bid=BidResponse(**bid),
        message="Bid status updated successfully"
    ) 