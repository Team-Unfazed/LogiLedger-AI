from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import json
import os
from db import get_users_db, get_jobs_db, get_bids_db, get_consignments_db
from routers.auth import decode_token

router = APIRouter()
security = HTTPBearer()

# Pydantic models
class TelegramWebhook(BaseModel):
    update_id: int
    message: Optional[Dict[str, Any]] = None
    callback_query: Optional[Dict[str, Any]] = None

class FinancialUpdate(BaseModel):
    jobId: str
    financialData: Dict[str, Any]

class BotStatusResponse(BaseModel):
    success: bool
    status: str
    message: str

class LinkAccountRequest(BaseModel):
    telegramUserId: str
    telegramUsername: Optional[str] = None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from token"""
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id = payload.get("sub")
        
        users_db = get_users_db()
        if user_id not in users_db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        user = users_db[user_id]
        user["id"] = user_id
        return user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

@router.post("/webhook")
async def handle_telegram_webhook(request: Request):
    """Handle Telegram webhook"""
    try:
        # Get the raw body
        body = await request.body()
        data = json.loads(body)
        
        print(f"[TelegramWebhook] Received webhook: {data}")
        
        # Process the webhook based on type
        if "message" in data:
            await process_telegram_message(data["message"])
        elif "callback_query" in data:
            await process_callback_query(data["callback_query"])
        
        return {"status": "ok"}
        
    except Exception as e:
        print(f"[TelegramWebhook] Error processing webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing webhook"
        )

async def process_telegram_message(message: Dict[str, Any]):
    """Process incoming Telegram message"""
    try:
        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "")
        user = message.get("from", {})
        
        print(f"[TelegramMessage] Chat ID: {chat_id}, Text: {text}, User: {user}")
        
        # Handle different commands
        if text.startswith("/start"):
            await send_welcome_message(chat_id)
        elif text.startswith("/help"):
            await send_help_message(chat_id)
        elif text.startswith("/status"):
            await send_status_message(chat_id, user)
        elif text.startswith("/jobs"):
            await send_jobs_message(chat_id, user)
        else:
            await send_default_response(chat_id)
            
    except Exception as e:
        print(f"[TelegramMessage] Error processing message: {e}")

async def process_callback_query(callback_query: Dict[str, Any]):
    """Process callback query from inline keyboards"""
    try:
        chat_id = callback_query.get("message", {}).get("chat", {}).get("id")
        data = callback_query.get("data", "")
        user = callback_query.get("from", {})
        
        print(f"[TelegramCallback] Chat ID: {chat_id}, Data: {data}, User: {user}")
        
        # Handle different callback data
        if data.startswith("job_"):
            job_id = data.split("_")[1]
            await send_job_details(chat_id, job_id, user)
        elif data.startswith("bid_"):
            bid_id = data.split("_")[1]
            await send_bid_details(chat_id, bid_id, user)
        else:
            await send_default_response(chat_id)
            
    except Exception as e:
        print(f"[TelegramCallback] Error processing callback: {e}")

async def send_welcome_message(chat_id: int):
    """Send welcome message to user"""
    message = """
🚛 Welcome to LogiLedger AI Bot!

I'm here to help you manage your logistics operations.

Available commands:
/start - Show this welcome message
/help - Show help information
/status - Check your account status
/jobs - View your active jobs

For support, contact our team.
    """
    # In a real implementation, you would send this via Telegram Bot API
    print(f"[TelegramBot] Sending welcome message to {chat_id}: {message}")

async def send_help_message(chat_id: int):
    """Send help message to user"""
    message = """
📋 LogiLedger AI Bot Help

Commands:
• /start - Welcome message
• /help - This help message
• /status - Your account status
• /jobs - Active jobs

Features:
• Real-time job updates
• Bid notifications
• Financial tracking
• Invoice management

Need help? Contact support.
    """
    print(f"[TelegramBot] Sending help message to {chat_id}: {message}")

async def send_status_message(chat_id: int, user: Dict[str, Any]):
    """Send status message to user"""
    # Find user in database by Telegram ID
    users_db = get_users_db()
    user_record = None
    
    for user_id, user_data in users_db.items():
        if user_data.get("telegramUserId") == str(user.get("id")):
            user_record = user_data
            break
    
    if user_record:
        message = f"""
📊 Account Status

Name: {user_record['name']}
Type: {user_record['userType'].upper()}
Company: {user_record.get('companyName', 'N/A')}
Location: {user_record.get('location', 'N/A')}
        """
    else:
        message = "❌ Account not linked. Please link your account first."
    
    print(f"[TelegramBot] Sending status message to {chat_id}: {message}")

async def send_jobs_message(chat_id: int, user: Dict[str, Any]):
    """Send jobs message to user"""
    # Find user in database
    users_db = get_users_db()
    user_record = None
    
    for user_id, user_data in users_db.items():
        if user_data.get("telegramUserId") == str(user.get("id")):
            user_record = user_data
            break
    
    if not user_record:
        message = "❌ Account not linked. Please link your account first."
    else:
        jobs_db = get_jobs_db()
        
        if user_record["userType"] == "msme":
            # Get MSME jobs
            user_jobs = [
                job for job in jobs_db.values()
                if job["transporterId"] == user_record["id"]
            ]
        else:
            # Get company jobs
            user_jobs = [
                job for job in jobs_db.values()
                if job["companyId"] == user_record["id"]
            ]
        
        if user_jobs:
            message = f"📋 You have {len(user_jobs)} active job(s):\n\n"
            for i, job in enumerate(user_jobs[:5], 1):  # Show first 5 jobs
                message += f"{i}. {job['consignmentTitle']} - {job['status']}\n"
        else:
            message = "📭 No active jobs found."
    
    print(f"[TelegramBot] Sending jobs message to {chat_id}: {message}")

async def send_job_details(chat_id: int, job_id: str, user: Dict[str, Any]):
    """Send job details to user"""
    jobs_db = get_jobs_db()
    
    if job_id in jobs_db:
        job = jobs_db[job_id]
        message = f"""
📋 Job Details

Title: {job['consignmentTitle']}
Status: {job['status']}
Amount: ₹{job['amount']:,.2f}
Origin: {job['origin']}
Destination: {job['destination']}
Deadline: {job['deadline'][:10]}
        """
    else:
        message = "❌ Job not found."
    
    print(f"[TelegramBot] Sending job details to {chat_id}: {message}")

async def send_bid_details(chat_id: int, bid_id: str, user: Dict[str, Any]):
    """Send bid details to user"""
    bids_db = get_bids_db()
    
    if bid_id in bids_db:
        bid = bids_db[bid_id]
        message = f"""
💰 Bid Details

Consignment: {bid['consignmentTitle']}
Amount: ₹{bid['bidAmount']:,.2f}
Status: {bid['status']}
Estimated Delivery: {bid['estimatedDelivery'][:10]}
        """
    else:
        message = "❌ Bid not found."
    
    print(f"[TelegramBot] Sending bid details to {chat_id}: {message}")

async def send_default_response(chat_id: int):
    """Send default response for unrecognized messages"""
    message = "🤖 I didn't understand that. Type /help for available commands."
    print(f"[TelegramBot] Sending default response to {chat_id}: {message}")

@router.post("/financial-update")
async def send_financial_update(
    financial_data: FinancialUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Send financial update to Telegram"""
    try:
        # In a real implementation, you would send this via Telegram Bot API
        print(f"[FinancialUpdate] Sending financial update for job {financial_data.jobId}")
        print(f"[FinancialUpdate] Data: {financial_data.financialData}")
        
        return {
            "success": True,
            "message": "Financial update sent successfully"
        }
        
    except Exception as e:
        print(f"[FinancialUpdate] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error sending financial update"
        )

@router.get("/bot-status", response_model=BotStatusResponse)
async def get_bot_status(current_user: dict = Depends(get_current_user)):
    """Get Telegram bot status"""
    try:
        # In a real implementation, you would check the bot's actual status
        return BotStatusResponse(
            success=True,
            status="online",
            message="Telegram bot is running"
        )
        
    except Exception as e:
        return BotStatusResponse(
            success=False,
            status="error",
            message=f"Error checking bot status: {str(e)}"
        )

@router.post("/process-financials")
async def process_job_financials(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Process job financials and send to Telegram"""
    try:
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
        
        # Process financials (placeholder)
        financial_data = {
            "jobId": job_id,
            "amount": job["amount"],
            "status": job["status"],
            "processedAt": datetime.now().isoformat()
        }
        
        print(f"[ProcessFinancials] Processed financials for job {job_id}: {financial_data}")
        
        return {
            "success": True,
            "financialData": financial_data,
            "message": "Financials processed successfully"
        }
        
    except Exception as e:
        print(f"[ProcessFinancials] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing financials"
        )

@router.post("/link-account")
async def link_telegram_account(
    link_request: LinkAccountRequest,
    current_user: dict = Depends(get_current_user)
):
    """Link Telegram account to user"""
    try:
        users_db = get_users_db()
        
        # Update user with Telegram information
        if current_user["id"] in users_db:
            users_db[current_user["id"]]["telegramUserId"] = link_request.telegramUserId
            users_db[current_user["id"]]["telegramUsername"] = link_request.telegramUsername
            users_db[current_user["id"]]["telegramLinkedAt"] = datetime.now().isoformat()
            
            print(f"[LinkAccount] Linked Telegram account {link_request.telegramUserId} to user {current_user['id']}")
            
            return {
                "success": True,
                "message": "Telegram account linked successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
    except Exception as e:
        print(f"[LinkAccount] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error linking Telegram account"
        ) 