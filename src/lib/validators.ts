import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    mobile: z
        .string()
        .length(10, 'Mobile number must be exactly 10 digits')
        .regex(/^[6-9][0-9]{9}$/, 'Enter a valid Indian mobile number'),
    email: z.string().email('Invalid email address').max(254, 'Email is too long').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password is too long'),
});

export const loginSchema = z.object({
    mobile: z
        .string()
        .length(10, 'Mobile number must be exactly 10 digits')
        .regex(/^[0-9]{10}$/, 'Mobile must contain only digits')
        .optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password is too long'),
}).refine(data => data.mobile || data.email, {
    message: "Either mobile or email is required",
    path: ["mobile"]
});

export const orderSchema = z.object({
    customerName: z.string().min(2, 'Name is required').max(100, 'Name is too long'),
    mobile: z
        .string()
        .length(10, 'Valid 10-digit mobile number is required')
        .regex(/^[6-9][0-9]{9}$/, 'Enter a valid Indian mobile number'),
    email: z.string().email('Invalid email address').max(254).optional().or(z.literal('')),
    address: z.string().min(5, 'Address is required').max(500, 'Address is too long'),
    city: z.string().min(2, 'City is required').max(100, 'City is too long'),
    state: z.string().min(2, 'State is required').max(100, 'State is too long'),
    pincode: z
        .string()
        .length(6, 'Pincode must be exactly 6 digits')
        .regex(/^[1-9][0-9]{5}$/, 'Enter a valid Indian pincode'),
    paymentMethod: z.enum(['RAZORPAY', 'COD', 'WHATSAPP']).default('RAZORPAY'),
    notes: z.string().max(1000, 'Notes are too long').optional(),
});

