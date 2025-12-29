import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Registration validation schema
export const registerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    restaurantName: z.string().min(2, 'Restaurant name must be at least 2 characters'),
    phone: z.string().optional(),
});

// Product validation schema
export const productSchema = z.object({
    name: z.object({
        en: z.string().min(1, 'English name is required'),
        ar: z.string().optional(),
    }),
    description: z.object({
        en: z.string().min(1, 'English description is required'),
        ar: z.string().optional(),
    }),
    price: z.number().positive('Price must be positive'),
    category: z.string().min(1, 'Category is required'),
    imageUrl: z.string().url('Invalid image URL').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
});

// Order validation schema
export const orderSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
    })).min(1, 'Order must have at least one item'),
    paymentMode: z.enum(['online', 'counter']),
    specialRequests: z.string().optional(),
});

// Team invitation schema - Fixed
export const inviteSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['manager', 'waiter', 'kitchen']),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type OrderFormData = z.infer<typeof orderSchema>;
export type InviteFormData = z.infer<typeof inviteSchema>;
