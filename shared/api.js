// LogiLedger AI API Response Types and Interfaces

// Authentication API responses
export const AuthResponse = {
  success: Boolean,
  token: String,
  user: {
    id: String,
    name: String,
    email: String,
    userType: String, // 'company' | 'msme'
    companyName: String,
    phoneNumber: String,
    location: String,
    gstNumber: String,
    createdAt: Date,
  },
  message: String,
};

// Consignment API responses
export const ConsignmentResponse = {
  success: Boolean,
  consignment: {
    id: String,
    title: String,
    origin: String,
    destination: String,
    goodsType: String,
    weight: Number,
    deadline: Date,
    budget: Number,
    description: String,
    status: String, // 'open' | 'awarded' | 'in_progress' | 'completed' | 'closed'
    companyId: String,
    companyName: String,
    bidCount: Number,
    createdAt: Date,
    updatedAt: Date,
  },
  consignments: Array,
  message: String,
};

// Bid API responses
export const BidResponse = {
  success: Boolean,
  bid: {
    id: String,
    consignmentId: String,
    consignmentTitle: String,
    bidderId: String,
    bidderName: String,
    bidderCompany: String,
    bidAmount: Number,
    estimatedDelivery: Date,
    notes: String,
    status: String, // 'pending' | 'awarded' | 'rejected'
    createdAt: Date,
  },
  bids: Array,
  message: String,
};

// Job API responses
export const JobResponse = {
  success: Boolean,
  job: {
    id: String,
    consignmentId: String,
    consignmentTitle: String,
    companyId: String,
    companyName: String,
    transporterId: String,
    transporterName: String,
    origin: String,
    destination: String,
    amount: Number,
    deadline: Date,
    status: String, // 'awarded' | 'in_progress' | 'completed'
    awardedDate: Date,
    completedDate: Date,
  },
  jobs: Array,
  message: String,
};

// Telegram bot integration
export const TelegramBotResponse = {
  success: Boolean,
  message: String,
  data: Object,
};

// OCR API responses
export const OCRResponse = {
  success: Boolean,
  extractedData: {
    invoiceNumber: String,
    amount: Number,
    date: Date,
    vendor: String,
    description: String,
    lineItems: Array,
  },
  message: String,
};

// AI Accounting API responses
export const AIAccountingResponse = {
  success: Boolean,
  processedData: {
    category: String,
    amount: Number,
    type: String, // 'income' | 'expense'
    gstAmount: Number,
    suggestions: Array,
  },
  message: String,
};

// Dashboard stats
export const DashboardStats = {
  totalConsignments: Number,
  totalBids: Number,
  totalEarnings: Number,
  successRate: Number,
  pendingJobs: Number,
  completedJobs: Number,
};

// Demo API response (existing)
export const DemoResponse = {
  message: String,
};
