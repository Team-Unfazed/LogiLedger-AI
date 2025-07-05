import { connectDB, disconnectDB } from './config/database.js';
import { User, Consignment, Bid, Job } from './models/index.js';

async function setupDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    console.log('Creating database indexes...');
    
    // Create indexes for better performance
    await User.createIndexes();
    await Consignment.createIndexes();
    await Bid.createIndexes();
    await Job.createIndexes();
    
    console.log('Database setup completed successfully!');
    
    // Create some sample data for testing
    console.log('Creating sample data...');
    
    // Create sample users
    const sampleUsers = [
      {
        name: 'John Company',
        email: 'john@company.com',
        password: 'password123',
        companyName: 'ABC Logistics Ltd',
        companyType: 'company',
        phone: '+91-9876543210',
        address: 'Mumbai, Maharashtra',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        gstNumber: '27AABC1234567890',
        panNumber: 'ABCDE1234F'
      },
      {
        name: 'Sarah Transport',
        email: 'sarah@transport.com',
        password: 'password123',
        companyName: 'Quick Transport Services',
        companyType: 'msme',
        phone: '+91-9876543211',
        address: 'Mumbai, Maharashtra',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002'
        },
        gstNumber: '07QUIC1234567890',
        panNumber: 'QUICK5678G'
      },
      {
        name: 'Delhi Transport Co',
        email: 'delhi@transport.com',
        password: 'password123',
        companyName: 'Delhi Transport Company',
        companyType: 'msme',
        phone: '+91-9876543212',
        address: 'Delhi, NCR',
        location: {
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        gstNumber: '07DELH1234567890',
        panNumber: 'DELHI5678G'
      },
      {
        name: 'Chennai Logistics',
        email: 'chennai@logistics.com',
        password: 'password123',
        companyName: 'Chennai Logistics Solutions',
        companyType: 'msme',
        phone: '+91-9876543213',
        address: 'Chennai, Tamil Nadu',
        location: {
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001'
        },
        gstNumber: '33CHEN1234567890',
        panNumber: 'CHENN5678G'
      }
    ];
    
    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.email}`);
      }
    }
    
    console.log('Sample data created successfully!');
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await disconnectDB();
  }
}

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export default setupDatabase; 