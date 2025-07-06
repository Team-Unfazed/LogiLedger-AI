from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import uuid
import os
from bson import ObjectId
from db import get_users_collection, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()
security = HTTPBearer()

# Pydantic models
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    userType: str  # "company" or "msme"
    companyName: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    fleetSize: Optional[int] = None
    vehicleTypes: Optional[list] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    userType: str
    companyName: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    fleetSize: Optional[int] = None
    vehicleTypes: Optional[list] = None
    createdAt: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse
    message: str

class RegisterResponse(BaseModel):
    token: str
    user: UserResponse
    message: str

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: UserLogin):
    """User login endpoint"""
    users_collection = get_users_collection()
    
    # Find user by email
    user = await users_collection.find_one({"email": user_credentials.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    # Remove password and MongoDB _id from response
    user_response_data = {k: v for k, v in user.items() if k not in ["password", "_id"]}
    user_response_data["id"] = str(user["_id"])
    user_response = UserResponse(**user_response_data)
    
    return LoginResponse(
        token=access_token,
        user=user_response,
        message="Login successful"
    )

@router.post("/register", response_model=RegisterResponse)
async def register(user_data: UserRegister):
    """User registration endpoint"""
    users_collection = get_users_collection()
    
    # Check if email already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate user type
    if user_data.userType not in ["company", "msme"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User type must be 'company' or 'msme'"
        )
    
    # Validate required fields based on user type
    if user_data.userType == "company" and not user_data.companyName:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name is required for company users"
        )
    
    if user_data.userType == "msme":
        if not user_data.companyName:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name is required for MSME users"
            )
        if not user_data.fleetSize:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fleet size is required for MSME users"
            )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    
    new_user = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_password,
        "userType": user_data.userType,
        "companyName": user_data.companyName,
        "location": user_data.location,
        "phone": user_data.phone,
        "fleetSize": user_data.fleetSize,
        "vehicleTypes": user_data.vehicleTypes or [],
        "createdAt": datetime.now().isoformat()
    }
    
    # Add user to database
    result = await users_collection.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    # Remove password from response
    user_response_data = {k: v for k, v in new_user.items() if k != "password"}
    user_response_data["id"] = user_id
    user_response = UserResponse(**user_response_data)
    
    return RegisterResponse(
        token=access_token,
        user=user_response,
        message="Registration successful"
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user information"""
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
        
        # Remove password and MongoDB _id from response
        user_response_data = {k: v for k, v in user.items() if k not in ["password", "_id"]}
        user_response_data["id"] = str(user["_id"])
        return UserResponse(**user_response_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

@router.post("/logout")
async def logout():
    """User logout endpoint (client-side token removal)"""
    return {"message": "Logout successful"} 