import express from 'express';
import { PORT, mongoDBURL } from './config.js';
import mongoose from 'mongoose';
import booksRoute from './routes/booksRoute.js';
import authRoute from './routes/authRoute.js';
import aiRoute from './routes/aiRoute.js';
import cors from 'cors';

const app = express();

// Middleware for parsing request body
app.use(express.json());
app.use(cors());

app.get('/', (request, response) => {
  return response.status(200).send('BookHaven Bookstore Backend API');
});

app.use('/books', booksRoute);
app.use('/auth', authRoute);
app.use('/ai', aiRoute);

// Start server
app.listen(PORT, () => {
  console.log(`App is listening to port: ${PORT}`);
});

// Connect to MongoDB
mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log('App connected to database');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
  });
