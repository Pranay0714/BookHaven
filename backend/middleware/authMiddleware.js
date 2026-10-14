import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export const verifyManager = (request, response, next) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;
    next();
  } catch (error) {
    return response.status(401).json({ message: 'Invalid or expired token' });
  }
};
