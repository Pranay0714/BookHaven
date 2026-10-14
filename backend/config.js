import 'dotenv/config';

export const PORT = 5555;

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI must be set in the environment or backend/.env');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in the environment or backend/.env');
}

export const mongoDBURL = process.env.MONGODB_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
