# LogiLedger Python Backend

A FastAPI-based backend for the LogiLedger logistics platform, providing APIs for user authentication, consignment management, bidding, job tracking, and Telegram bot integration. Built with MongoDB for scalable data storage.

## Features

- **User Authentication**: JWT-based authentication for MSME and company users
- **Consignment Management**: Create, view, and manage logistics consignments
- **Bidding System**: MSME companies can bid on consignments
- **Job Tracking**: Track job status and progress
- **Telegram Bot Integration**: Webhook handling for Telegram bot interactions
- **Location Matching**: Intelligent location-based matching for consignments and MSMEs

## Setup

### Prerequisites

- Python 3.8+
- pip
- MongoDB (local or cloud instance)

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables (create a `.env` file):
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/logiledger

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

3. Start MongoDB (if running locally):
```bash
# Start MongoDB service
mongod

# Or if using Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

4. Run the development server:
```bash
python start.py
```

The server will start on `http://localhost:8000` and connect to MongoDB automatically.

## API Endpoints

### Authentication (`/auth`)

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Consignments (`/consignments`)

- `GET /consignments` - Get all consignments (filtered by user type)
- `POST /consignments` - Create a new consignment
- `GET /consignments/{consignment_id}` - Get specific consignment
- `PUT /consignments/{consignment_id}` - Update consignment
- `DELETE /consignments/{consignment_id}` - Delete consignment

### Bids (`/bids`)

- `GET /bids` - Get bids (filtered by user)
- `POST /bids` - Place a new bid
- `GET /bids/{bid_id}` - Get specific bid
- `PUT /bids/{bid_id}` - Update bid
- `DELETE /bids/{bid_id}` - Delete bid

### Jobs (`/jobs`)

- `GET /jobs` - Get jobs (filtered by user)
- `POST /jobs` - Create a new job
- `GET /jobs/{job_id}` - Get specific job
- `PUT /jobs/{job_id}` - Update job status
- `DELETE /jobs/{job_id}` - Delete job

### Telegram Bot (`/telegram`)

- `POST /telegram/webhook` - Handle Telegram webhook events

## Database

The application uses MongoDB as the primary database with the following collections:

- **users**: User accounts and authentication data
- **consignments**: Logistics consignment details
- **bids**: Bidding information and status
- **jobs**: Job tracking and status updates

### Data Models

### User
```python
{
    "_id": "ObjectId",
    "email": "string",
    "password": "string (hashed)",
    "companyName": "string",
    "userType": "msme" | "company",
    "location": "string",
    "phone": "string",
    "fleetSize": "int (MSME only)",
    "vehicleTypes": "array (MSME only)",
    "createdAt": "datetime"
}
```

### Consignment
```python
{
    "_id": "ObjectId",
    "title": "string",
    "origin": "string",
    "destination": "string",
    "goodsType": "string",
    "weight": "float",
    "deadline": "datetime",
    "budget": "float",
    "description": "string",
    "status": "open" | "awarded" | "in_progress" | "completed",
    "companyId": "string",
    "companyName": "string",
    "bidCount": "int",
    "createdAt": "datetime",
    "updatedAt": "datetime"
}
```

### Bid
```python
{
    "_id": "ObjectId",
    "consignmentId": "string",
    "consignmentTitle": "string",
    "bidderId": "string",
    "bidderName": "string",
    "bidderCompany": "string",
    "bidAmount": "float",
    "estimatedDelivery": "datetime",
    "notes": "string",
    "status": "pending" | "awarded" | "rejected",
    "createdAt": "datetime",
    "awardedAt": "datetime (optional)",
    "updatedAt": "datetime (optional)"
}
```

### Job
```python
{
    "_id": "ObjectId",
    "consignmentId": "string",
    "consignmentTitle": "string",
    "companyId": "string",
    "companyName": "string",
    "transporterId": "string",
    "transporterName": "string",
    "origin": "string",
    "destination": "string",
    "amount": "float",
    "deadline": "datetime",
    "status": "awarded" | "in_progress" | "completed",
    "awardedDate": "datetime",
    "completedDate": "datetime (optional)",
    "invoiceUploaded": "boolean",
    "invoiceData": "object (optional)",
    "invoiceUploadedAt": "datetime (optional)",
    "createdAt": "datetime",
    "updatedAt": "datetime (optional)"
}
```

## Location Matching

The backend includes intelligent location matching functionality:

- **Distance Calculation**: Uses Haversine formula for accurate distance calculation
- **Location Normalization**: Converts location strings to structured objects
- **MSME Matching**: Finds MSMEs that match consignment origin locations
- **Consignment Filtering**: Filters consignments based on MSME location
- **Recommendations**: Provides location-based recommendations for partnerships

## Development

### Project Structure

```
python_backend/
├── main.py              # FastAPI application entry point
├── start.py             # Development server startup script
├── requirements.txt     # Python dependencies
├── routers/            # API route modules
│   ├── auth.py         # Authentication routes
│   ├── consignments.py # Consignment management
│   ├── bids.py         # Bidding system
│   ├── jobs.py         # Job tracking
│   └── telegram.py     # Telegram bot integration
└── utils/              # Utility functions
    └── location_matcher.py # Location matching utilities
```

### Adding New Features

1. Create new router in `routers/` directory
2. Add router to `main.py`
3. Update data models as needed
4. Add tests for new functionality

## API Documentation

Once the server is running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI) or `http://localhost:8000/redoc` for ReDoc documentation.

## Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Input validation with Pydantic models
- CORS configuration for frontend integration

## Deployment

For production deployment:

1. Set proper environment variables
2. Use a production ASGI server like uvicorn with workers
3. Set up proper logging
4. Configure database (currently using in-memory storage)
5. Set up monitoring and health checks 