import dotenv from 'dotenv';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });
export const config = {
    node: {
        env: process.env.NODE_ENV ?? 'development',
        port: parseInt(process.env.PORT ?? '5000', 10),
    },
    mongodb: {
        uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/trackalorie',
    },
    singleTenant: {
        userId: process.env.SINGLE_TENANT_USER_ID ?? '00000000-0000-0000-0000-000000000001',
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY ?? '',
    },
    cors: {
        clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    },
    jwt: {
        secret: process.env.JWT_SECRET ?? 'change_me_before_production',
        expiresIn: process.env.JWT_EXPIRES_IN ?? '30m',
    },
};
export function validateConfig() {
    if (!config.openai.apiKey && config.node.env === 'production') {
        throw new Error('OPENAI_API_KEY is required in production');
    }
    if (!config.mongodb.uri) {
        throw new Error('MONGODB_URI is required');
    }
}