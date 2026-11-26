import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    res.status(400).json({
      error: firstIssue?.message || 'Data masukan tidak valid.',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Never log sensitive survivor inputs or leak raw SQL/stack traces to clients
  console.error('[CARE BRIDGE API Error]', err instanceof Error ? err.message : 'Unknown error');
  res.status(500).json({
    error: 'Terjadi gangguan pada server prototipe. Silakan coba beberapa saat lagi.',
  });
}
