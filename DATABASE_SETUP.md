# MongoDB Database Setup for LogiLedger AI

This guide will help you set up MongoDB for the LogiLedger AI project.

## Prerequisites

1. **MongoDB Community Server** - Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. **Node.js** - Version 16 or higher
3. **npm** - Comes with Node.js

## Installation Steps

### 1. Install MongoDB

#### Windows:
1. Download MongoDB Community Server from the official website
2. Run the installer and follow the setup wizard
3. Install MongoDB as a service (recommended)
4. MongoDB will be available at `mongodb://localhost:27017`

#### macOS (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### Linux (Ubuntu):
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 2. Verify MongoDB Installation

Open a terminal and run:
```bash
mongosh
```

You should see the MongoDB shell. Type `exit` to quit.

### 3. Create Environment Variables

Create a `.env` file in the project root with the following content:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/logiledger_ai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Install Dependencies

The MongoDB dependencies are already installed. If not, run:
```bash
npm install mongoose
```

### 5. Initialize Database

Run the database setup script:
```bash
node server/setup-database.js
```

This will:
- Connect to MongoDB
- Create the database and collections
- Set up indexes for better performance
- Create sample users for testing

### 6. Start the Server

Start the development server:
```bash
npm run dev
```

The server will now connect to MongoDB and use persistent storage instead of in-memory data.

## Database Schema

The application uses the following collections:

### Users
- Authentication and company information
- Supports both company and MSME user types
- Includes Telegram integration fields

### Consignments
- Logistics consignment details
- Links to company that posted the consignment
- Tracks status and awarded bids

### Bids
- Transport partner bids on consignments
- Includes bidder information and bid details
- Tracks bid status and award information

### Jobs
- Awarded jobs and their progress
- Links consignments, bids, and users
- Tracks delivery status and payments

## Testing the Setup

1. Start the server: `npm run dev`
2. Open the application in your browser
3. Try registering a new user
4. Create a consignment
5. Place bids
6. Award jobs

All data will now be persisted in MongoDB.

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB service is running
- Check if the port 27017 is available
- Verify the connection string in `.env`

### Permission Issues
- On Linux/macOS, ensure MongoDB has proper permissions
- On Windows, run as administrator if needed

### Database Not Found
- The database will be created automatically when you first connect
- Run the setup script to initialize collections and indexes

## Production Considerations

For production deployment:

1. Use MongoDB Atlas (cloud) or a dedicated MongoDB server
2. Set up proper authentication and authorization
3. Configure backups and monitoring
4. Use environment-specific connection strings
5. Set up proper indexes for performance
6. Configure connection pooling

## Sample Data

The setup script creates sample users:
- **Company User**: john@company.com / password123
- **MSME User**: sarah@transport.com / password123

You can use these accounts to test the application functionality. 