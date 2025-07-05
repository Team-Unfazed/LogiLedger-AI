# LogiLedger AI

**Digitizing Logistics & Accounting for Indian Fleet Operators**

A full-stack web application that connects big companies with MSMEs for logistics operations, featuring AI-powered accounting, smart bidding, and Telegram bot integration.

## 🚀 Features

### Core Platform

- **Smart Bidding System**: AI-powered matching between companies and transport partners
- **Dual Dashboards**: Separate interfaces for companies (consignment posters) and MSMEs (bidders)
- **Real-time Bidding**: Live bidding platform with status tracking
- **Multi-language Support**: Available in Hindi and English

### AI & Automation

- **AI Accounting Module**: Automated expense tracking and categorization
- **OCR Integration**: Extract data from receipts and invoices automatically
- **Telegram Bot Integration**: Connect with autobook AI for financial management
- **Invoice Generation**: Automated invoice creation and management

### Business Features

- **Consignment Management**: Post, track, and manage logistics consignments
- **Bid Management**: Place, track, and manage competitive bids
- **Job Tracking**: Monitor delivery status and completion
- **Financial Integration**: Connect with Tally, Airtable, and UPI systems

## 🛠 Tech Stack

### Frontend (JavaScript React)

- **React 18** with functional components and hooks
- **React Router 6** for SPA navigation
- **TailwindCSS 3** for modern styling
- **Radix UI** for accessible component library
- **Lucide React** for icons
- **React Hook Form** for form management

### Backend (Node.js)

- **Express.js** with middleware stack
- **JWT Authentication** for secure access
- **bcrypt** for password hashing
- **Rate limiting** and security middleware
- **CORS** configuration for API access

### Development

- **Vite** for fast development and building
- **ES Modules** throughout the stack
- **Hot reload** for both frontend and backend

## 📁 Project Structure

```
LogiLedger AI/
├── client/                     # React frontend
│   ├── components/ui/          # Reusable UI components
│   ├── contexts/              # React contexts (Auth)
│   ├── pages/                 # Route components
│   │   ├── HomePage.jsx       # Landing page
│   │   ├── Login.jsx          # Authentication
│   │   ├── Register.jsx       # User registration
│   │   ├── CompanyDashboard.jsx
│   │   ├── MSMEDashboard.jsx
│   │   └── BiddingPage.jsx    # Public bidding platform
│   ├── App.jsx               # Main app component
│   └── global.css           # TailwindCSS theme
├── server/                   # Express API backend
│   ├── routes/              # API route handlers
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── consignments.js # Consignment management
│   │   ├── bids.js         # Bidding system
│   │   ├── jobs.js         # Job management
│   │   └── telegram.js     # Telegram bot integration
│   └── index.js            # Main server setup
├── shared/                  # Shared types and interfaces
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd logiledger-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:8080
   - API: http://localhost:8080/api

### Build for Production

```bash
npm run build
npm start
```

## 🔐 Authentication

The platform supports two user types:

1. **Companies**: Can post consignments and receive bids
2. **MSMEs**: Can browse opportunities and place bids

### Registration Process

- Choose user type (Company or MSME)
- Provide business details and GST information
- Verify email and complete profile

## 📊 User Flows

### For Companies

1. Register as Company user type
2. Access Company Dashboard
3. Create new consignments with details
4. Review and manage incoming bids
5. Award projects to selected bidders
6. Track delivery status

### For MSMEs

1. Register as MSME user type
2. Browse available consignments
3. Place competitive bids
4. Track bid status
5. Manage awarded jobs
6. Upload invoices and completion proof

## 🤖 Telegram Bot Integration

LogiLedger AI integrates with **autobook AI** Telegram bot for financial management:

- **Automated Expense Tracking**: Send financial data to bot
- **Invoice Processing**: OCR and AI categorization
- **GST Compliance**: Automated tax calculations
- **Financial Alerts**: Real-time notifications

### Connection Process

1. Access Telegram integration in dashboard
2. Provide Telegram username
3. Send verification code to @autobookAI_bot
4. Complete linking process

## 🎨 Design System

### Brand Colors

- **Primary**: Deep Blue (#1e3a8a) - Trust and reliability
- **Secondary**: Orange (#fb923c) - Energy and optimism
- **Accent**: Light Blue (#e0f2fe) - Clean and modern

### UI Components

- Modern card-based layouts
- Consistent spacing and typography
- Responsive design for all screen sizes
- Accessibility-first approach with Radix UI

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Consignments

- `POST /api/consignments/create` - Create consignment
- `GET /api/consignments/my-consignments` - Get user's consignments
- `GET /api/consignments/available` - Get available consignments
- `GET /api/consignments/public` - Public bidding page data

### Bidding

- `POST /api/bids/create` - Place a bid
- `GET /api/bids/my-bids` - Get user's bids
- `POST /api/bids/:bidId/award` - Award a bid

### Jobs

- `GET /api/jobs/awarded` - Get awarded jobs
- `PUT /api/jobs/:jobId/status` - Update job status
- `POST /api/jobs/:jobId/invoice` - Upload invoice

### Telegram Integration

- `POST /api/telegram/link-account` - Link Telegram account
- `POST /api/telegram/process-financials` - Send financial data

## 🌐 Deployment

### Using Netlify (Recommended)

1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist/spa`
4. Configure environment variables

### Environment Variables

```env
JWT_SECRET=your-secret-key
NODE_ENV=production
TELEGRAM_BOT_TOKEN=your-bot-token
```

## 🔮 Future Enhancements

### Phase 2 Features

- **Credit Scoring**: AI-powered risk assessment
- **Voice Input**: Voice commands for mobile users
- **GST Integration**: Direct eWay bill generation
- **Advanced Analytics**: Business intelligence dashboard
- **UPI Payments**: Integrated payment processing

### Technical Improvements

- Database migration (PostgreSQL/MongoDB)
- Real-time notifications (WebSocket)
- Mobile app (React Native)
- Advanced caching (Redis)
- Microservices architecture

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:

- Email: support@logiledger.ai
- Documentation: [docs.logiledger.ai](https://docs.logiledger.ai)
- Issues: GitHub Issues

---

**LogiLedger AI** - Transforming logistics operations across India with AI-powered solutions.
