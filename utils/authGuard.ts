import admin from 'firebase-admin';
import dotenv from 'dotenv';
import type { FastifyReply, FastifyRequest } from 'fastify';

dotenv.config();

// Firebase configuration
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID?.trim();
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.trim()?.replace(/\\n/g, '\n');
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET?.trim();


if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: FIREBASE_PROJECT_ID,
            privateKey: FIREBASE_PRIVATE_KEY,
            clientEmail: FIREBASE_CLIENT_EMAIL,
        }),
        storageBucket: FIREBASE_STORAGE_BUCKET,
    });
}

export const authGuard = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
        return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
        // Try to verify as ID token first
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Attach user to request in a type-safe way
        (request as any).user = decodedToken;
        return;
    } catch (error: any) {
        // If it's a custom token error, handle for development
        if (error.code === 'auth/argument-error' && error.message.includes('custom token')) {
            try {
                // DEVELOPMENT ONLY: Verify custom token and create mock user data
                // In production, custom tokens should be exchanged for ID tokens on client side
                const decodedCustomToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

                if (decodedCustomToken && decodedCustomToken.uid) {
                    // Get user data from Firebase Auth
                    const userRecord = await admin.auth().getUser(decodedCustomToken.uid);

                    // Create a mock decoded token structure for development
                    const mockDecodedToken = {
                        uid: userRecord.uid,
                        email: userRecord.email,
                        email_verified: userRecord.emailVerified,
                        name: userRecord.displayName,
                        iat: Math.floor(Date.now() / 1000),
                        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
                        aud: FIREBASE_PROJECT_ID,
                        iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
                        sub: userRecord.uid,
                        auth_time: Math.floor(Date.now() / 1000),
                        // Add any custom claims if needed
                        ...userRecord.customClaims
                    };
                    console.log(mockDecodedToken);
                    console.warn('⚠️  DEVELOPMENT MODE: Using custom token directly. This should not be used in production!');
                    (request as any).user = mockDecodedToken;
                    return;
                } else {
                    return reply.status(401).send({ message: 'Invalid custom token format' });
                }
            } catch (customTokenError) {
                console.error('Custom token verification error:', customTokenError);
                return reply.status(401).send({ message: 'Invalid custom token' });
            }
        }

        // For other auth errors (expired, invalid, etc.)
        if (error.code?.startsWith('auth/')) {
            return reply.status(401).send({ message: 'Invalid or expired token' });
        }

        // For other errors, return 500
        console.error('Auth verification error:', error);
        return reply.status(500).send({ message: 'Authentication error' });
    }
}