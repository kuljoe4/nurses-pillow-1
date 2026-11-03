import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name is required').trim(),
  role: z.string().refine(val => val === 'nurse' || val === 'host', {
    message: 'Role must be either nurse or host',
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const bookingSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalPrice: z.number().positive('Total price must be positive'),
});

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: (error as any).issues?.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })) || [],
        });
      }
      return res.status(400).json({ error: 'Invalid request payload' });
    }
  };
};
