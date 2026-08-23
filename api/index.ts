import type { Request, Response } from 'express';
import app from '../server';

export default function handler(req: Request, res: Response) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel serverless execution error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Serverless Execution Error'
    });
  }
}
