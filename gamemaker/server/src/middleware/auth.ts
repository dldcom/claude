import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthRequest extends Request {
  teacherId?: number;
}

export function generateToken(teacherId: number): string {
  return jwt.sign({ teacherId }, JWT_SECRET, { expiresIn: '24h' });
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { teacherId: number };
    req.teacherId = payload.teacherId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
