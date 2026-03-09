import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import db from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Simple health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ExamWise Server is running' });
});

// Root route
app.get('/', (req, res) => {
  res.send('ExamWise Server is Running!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  // Verify Gemini API Key configuration
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    console.log('✅ GEMINI_API_KEY is configured.');
  } else {
    console.log('❌ GEMINI_API_KEY is MISSING or set to the default placeholder. Please check your .env file.');
  }
});
