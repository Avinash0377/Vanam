import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits').regex(/^[0-9]+$/, 'Mobile must contain only digits'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.mobile || data.email, {
    message: "Either mobile or email is required",
    path: ["mobile"]
});

export const orderSchema = z.object({
    customerName: z.string().min(2, 'Name is required'),
    mobile: z.string().min(10, 'Valid mobile number is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(6, 'Valid pincode is required'),
    paymentMethod: z.enum(['RAZORPAY', 'COD', 'WHATSAPP']).default('RAZORPAY'),
    notes: z.string().optional(),
});
