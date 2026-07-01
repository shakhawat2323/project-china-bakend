import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT || 5000,
    database_url: process.env.DATABASE_URL,
    frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',

    cloudinary: {
        api_secret: process.env.CLOUDINARY_API_SECRET,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY
    },

    emailSender: {
        email: process.env.EMAIL,
        app_pass: process.env.APP_PASS
    },

    jwt: {
        jwt_secret: process.env.JWT_SECRET,
        expires_in: process.env.EXPIRES_IN,
        refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
        refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN,
        reset_pass_secret: process.env.RESET_PASS_TOKEN,
        reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN
    },

    super_admin: {
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD
    },

    salt_round: process.env.SALT_ROUND || '12',

    stripe: {
        secret_key: process.env.STRIPE_SECRET_KEY,
        webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    },

    paypal: {
        client_id: process.env.PAYPAL_CLIENT_ID,
        client_secret: process.env.PAYPAL_CLIENT_SECRET,
        mode: process.env.PAYPAL_MODE || 'sandbox',
    }
};
