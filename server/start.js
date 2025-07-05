import { createServer } from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const app = await createServer();
    
    app.listen(PORT, () => {
      console.log(`🚀 LogiLedger AI Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/ping`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 