# LogiLedger AI - Logistics Platform

A comprehensive logistics platform connecting MSME (Micro, Small & Medium Enterprises) companies with larger corporations for efficient cargo transportation and logistics management.

## Features

- **User Management**: Separate dashboards for MSME companies and large corporations
- **Consignment Management**: Create and manage logistics consignments
- **Bidding System**: MSME companies can bid on available consignments
- **Job Tracking**: Real-time job status tracking and management
- **Location Matching**: Intelligent location-based matching for optimal logistics
- **Telegram Bot Integration**: Automated notifications and updates
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Router** for navigation
- **React Query** for data fetching

### Backend
- **FastAPI** (Python) for high-performance API
- **JWT** for authentication
- **Pydantic** for data validation
- **Uvicorn** for ASGI server
- **Python 3.8+**

## Quick Start

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.8+ (for backend)
- npm or yarn

### Backend Setup

1. Navigate to the Python backend:
```bash
cd python_backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the `python_backend` directory:
```env
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

4. Start the Python backend:
   ```bash
python start.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:8081`

## Project Structure

```
logiledger-ai/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── utils/             # Utility functions
│   └── main.tsx           # Application entry point
├── python_backend/         # Python FastAPI backend
│   ├── routers/           # API route modules
│   ├── utils/             # Utility functions
│   ├── main.py            # FastAPI application
│   ├── start.py           # Development server
│   └── requirements.txt   # Python dependencies
├── package.json           # Frontend dependencies
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## API Documentation

Once the backend is running, you can access:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## User Types

### MSME Companies
- View available consignments in their area
- Place bids on consignments
- Track their active jobs
- Manage their profile and location

### Large Corporations
- Create and manage consignments
- Review and accept bids from MSMEs
- Track job progress
- Manage their logistics operations

## Key Features

### Location Matching
The platform uses intelligent location matching to:
- Find MSMEs near consignment origins
- Filter consignments by MSME location
- Calculate distances using Haversine formula
- Provide location-based recommendations

### Bidding System
- MSMEs can place competitive bids
- Corporations can review and accept bids
- Automatic bid count tracking
- Bid status management

### Job Tracking
- Real-time job status updates
- Progress tracking from assignment to completion
- Notes and communication features
- Timeline management

## Development

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

### Backend Development
```bash
cd python_backend
python start.py      # Start development server
```

### Environment Variables

#### Backend (.env in python_backend/)
```env
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

## Deployment

### Frontend
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service

### Backend
1. Set up production environment variables
2. Use a production ASGI server like uvicorn with workers
3. Set up proper logging and monitoring
4. Configure database (currently using in-memory storage)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
