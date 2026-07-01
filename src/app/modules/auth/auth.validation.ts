import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

// Password Regex: Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordMessage = "Password must contain uppercase, lowercase, number and special character";

const register = z.object({
    body: z.object({
        name: z.string()
            .trim()
            .min(1, "Full name is required")
            .refine(val => val.length >= 3, "Full name must be at least 3 characters")
            .refine(val => val.length <= 100, "Full name cannot exceed 100 characters")
            .refine(val => !/\d/.test(val), "Numbers are not allowed in full name")
            .refine(val => /^[a-zA-Z\s.]+$/.test(val), "Special characters are not allowed in full name")
            .transform(val => val.replace(/\s+/g, ' ')),
        email: z.string()
            .trim()
            .min(1, "Email address is required")
            .email("Please enter a valid email address")
            .transform(val => val.toLowerCase()),
        password: z.string()
            .min(8, "Password must be at least 8 characters")
            .regex(passwordRegex, passwordMessage),
        companyName: z.string()
            .trim()
            .min(2, "Please enter a valid company name")
            .max(150, "Company name cannot exceed 150 characters"),
        phone: z.string()
            .trim()
            .min(1, "Phone number is required")
            .refine(val => {
                try {
                    return val.startsWith('+') && isValidPhoneNumber(val);
                } catch {
                    return false;
                }
            }, "Phone number does not match the selected country code"),
        address: z.string().max(300, "Address cannot exceed 300 characters").optional(),
    }),
});

const login = z.object({
    body: z.object({
        email: z.string({ error: "Email is required" }).email("Invalid email format"),
        password: z.string({ error: "Password is required" }).min(1, "Password is required"),
    }),
});

const forgotPassword = z.object({
    body: z.object({
        email: z.string({ error: "Email is required" }).email("Invalid email format"),
    }),
});

const resetPassword = z.object({
    body: z.object({
        resetToken: z.string({ error: "Reset token is required" }).min(1, "Reset token is required"),
        newPassword: z.string({ error: "New password is required" }).regex(passwordRegex, passwordMessage),
    }),
});

const changePassword = z.object({
    body: z.object({
        oldPassword: z.string({ error: "Old password is required" }).min(1, "Old password is required"),
        newPassword: z.string({ error: "New password is required" }).regex(passwordRegex, passwordMessage),
    }),
});

const verifyEmail = z.object({
    body: z.object({
        email: z.string({ error: "Email is required" }).email("Invalid email format"),
        otp: z.string({ error: "OTP is required" }).length(6, "OTP must be exactly 6 characters"),
    }),
});

const resendVerificationEmail = z.object({
    body: z.object({
        email: z.string({ error: "Email is required" }).email("Invalid email format"),
    }),
});

export const AuthValidation = {
    register,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerificationEmail,
};
