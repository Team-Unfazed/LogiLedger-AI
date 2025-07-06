from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import uuid
import os
from bson import ObjectId
from db import get_jobs_collection, get_bids_collection, get_consignments_collection, get_users_collection
from routers.auth import decode_token

router = APIRouter()
security = HTTPBearer()

# Pydantic models
class JobStatusUpdate(BaseModel):
    status: str

class InvoiceUpload(BaseModel):
    invoiceData: dict

class JobResponse(BaseModel):
    id: str
    consignmentId: str
    consignmentTitle: str
    companyId: str
    companyName: str
    transporterId: str
    transporterName: str
    origin: str
    destination: str
    amount: float
    deadline: str
    status: str
    awardedDate: str
    completedDate: Optional[str] = None
    invoiceUploaded: bool
    invoiceData: Optional[dict] = None
    invoiceUploadedAt: Optional[str] = None
    createdAt: str
    updatedAt: Optional[str] = None

class JobListResponse(BaseModel):
    success: bool
    jobs: List[JobResponse]
    message: Optional[str] = None

class JobUpdateResponse(BaseModel):
    success: bool
    job: JobResponse
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

@router.get("/awarded", response_model=JobListResponse)
async def get_awarded_jobs(current_user: dict = Depends(get_current_user)):
    """Get awarded jobs for MSMEs"""
    if current_user["userType"] != "msme":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only MSMEs can view their awarded jobs"
        )
    
    jobs_collection = get_jobs_collection()
    bids_collection = get_bids_collection()
    consignments_collection = get_consignments_collection()
    
    # Get all awarded bids for this user
    cursor = bids_collection.find({
        "bidderId": current_user["id"],
        "status": "awarded"
    })
    awarded_bids = await cursor.to_list(length=None)
    
    user_jobs = []
    for bid in awarded_bids:
        consignment = await consignments_collection.find_one({"_id": ObjectId(bid["consignmentId"])})
        if not consignment:
            continue
        
        # Check if job already exists
        existing_job = await jobs_collection.find_one({
            "consignmentId": bid["consignmentId"],
            "transporterId": current_user["id"]
        })
        
        if existing_job:
            job_data = {k: v for k, v in existing_job.items() if k != "_id"}
            job_data["id"] = str(existing_job["_id"])
            user_jobs.append(JobResponse(**job_data))
        else:
            # Create new job
            job = {
                "consignmentId": bid["consignmentId"],
                "consignmentTitle": consignment["title"],
                "companyId": consignment["companyId"],
                "companyName": consignment["companyName"],
                "transporterId": current_user["id"],
                "transporterName": current_user["name"],
                "origin": consignment["origin"],
                "destination": consignment["destination"],
                "amount": bid["bidAmount"],
                "deadline": consignment["deadline"],
                "status": "awarded" if consignment["status"] == "awarded" else consignment["status"],
                "awardedDate": bid.get("awardedAt", datetime.now().isoformat()),
                "completedDate": None,
                "invoiceUploaded": False,
                "invoiceData": None,
                "invoiceUploadedAt": None,
                "createdAt": datetime.now().isoformat(),
                "updatedAt": None
            }
            
            result = await jobs_collection.insert_one(job)
            job["id"] = str(result.inserted_id)
            user_jobs.append(JobResponse(**job))
    
    return JobListResponse(
        success=True,
        jobs=user_jobs
    )

@router.get("/company", response_model=JobListResponse)
async def get_company_jobs(current_user: dict = Depends(get_current_user)):
    """Get jobs for companies"""
    if current_user["userType"] != "company":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only companies can view their jobs"
        )
    
    jobs_collection = get_jobs_collection()
    
    # Get all jobs for consignments created by this company
    cursor = jobs_collection.find({"companyId": current_user["id"]})
    jobs = await cursor.to_list(length=None)
    
    # Convert MongoDB documents to response format
    company_jobs = []
    for job in jobs:
        job_data = {k: v for k, v in job.items() if k != "_id"}
        job_data["id"] = str(job["_id"])
        company_jobs.append(JobResponse(**job_data))
    
    return JobListResponse(
        success=True,
        jobs=company_jobs
    )

@router.put("/{job_id}/status", response_model=JobUpdateResponse)
async def update_job_status(
    job_id: str,
    status_update: JobStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update job status"""
    jobs_db = get_jobs_db()
    consignments_db = get_consignments_db()
    
    if job_id not in jobs_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job = jobs_db[job_id]
    
    # Check if user owns this job
    if job["transporterId"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Validate status
    valid_statuses = ["awarded", "in_progress", "completed"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    # Validate status transitions
    if job["status"] == "awarded" and status_update.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Awarded jobs can only be moved to in_progress"
        )
    
    if job["status"] == "in_progress" and status_update.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="In progress jobs can only be completed"
        )
    
    # Update job status
    job["status"] = status_update.status
    job["updatedAt"] = datetime.now().isoformat()
    
    if status_update.status == "completed":
        job["completedDate"] = datetime.now().isoformat()
    
    # Update consignment status as well
    if job["consignmentId"] in consignments_db:
        consignment = consignments_db[job["consignmentId"]]
        consignment["status"] = status_update.status
        consignment["updatedAt"] = datetime.now().isoformat()
    
    return JobUpdateResponse(
        success=True,
        job=JobResponse(**job),
        message=f"Job status updated to {status_update.status}"
    )

@router.post("/{job_id}/invoice", response_model=JobUpdateResponse)
async def upload_invoice(
    job_id: str,
    invoice_data: InvoiceUpload,
    current_user: dict = Depends(get_current_user)
):
    """Upload invoice for a job"""
    jobs_db = get_jobs_db()
    
    if job_id not in jobs_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job = jobs_db[job_id]
    
    # Check if user owns this job
    if job["transporterId"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update job with invoice data
    job["invoiceUploaded"] = True
    job["invoiceData"] = invoice_data.invoiceData
    job["invoiceUploadedAt"] = datetime.now().isoformat()
    job["updatedAt"] = datetime.now().isoformat()
    
    return JobUpdateResponse(
        success=True,
        job=JobResponse(**job),
        message="Invoice uploaded successfully"
    ) 