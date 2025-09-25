import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

dotenv.config();

// Firebase configuration
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID?.trim();
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.trim()?.replace(/\\n/g, '\n');
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET?.trim();

// Initialize Firebase Admin SDK if not already initialized
let firebaseApp: App;
if (!getApps().length) {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    throw new Error('Firebase credentials are not properly configured. Please check your environment variables.');
  }

  firebaseApp = initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      privateKey: FIREBASE_PRIVATE_KEY,
      clientEmail: FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: FIREBASE_STORAGE_BUCKET,
  });
} else {
  firebaseApp = getApps()[0];
}

const storage: Storage = getStorage(firebaseApp);
const bucket: any = storage.bucket();

export interface UploadFileOptions {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  folder?: string;
}

export interface UploadResult {
  publicUrl: string;
  fileName: string;
  fullPath: string;
}

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadResult> {
  const { buffer, fileName, contentType, folder = 'uploads' } = options;
  
  // Create a unique filename with timestamp
  const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const fullPath = folder ? `${folder}/${uniqueKey}-${fileName}` : `${uniqueKey}-${fileName}`;
  
  const file = bucket.file(fullPath);
  
  try {
    // Upload the file with metadata
    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });

    // Try to get public URL first (assumes bucket has public read access)
    let publicUrl = `https://storage.googleapis.com/${FIREBASE_STORAGE_BUCKET}/${fullPath}`;
    
    // If bucket doesn't have public access, you can generate a signed URL
    // that's valid for a long time (e.g., 10 years)
    try {
      // Test if public URL works by checking if we can create a signed URL
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
      });
      
      // If we need signed URLs, use that instead
      // For now, we'll use the public URL format
      // publicUrl = signedUrl;
    } catch (signedUrlError) {
      console.log('Note: Using public URL format. If files are not accessible, configure bucket for public access.');
    }

    return {
      publicUrl,
      fileName,
      fullPath,
    };
  } catch (error) {
    console.error('Error uploading file to Firebase Storage:', error);
    throw new Error('Failed to upload file to Firebase Storage');
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const file = bucket.file(filePath);
    await file.delete();
  } catch (error) {
    console.error('Error deleting file from Firebase Storage:', error);
    throw new Error('Failed to delete file from Firebase Storage');
  }
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(FIREBASE_PROJECT_ID && FIREBASE_PRIVATE_KEY && FIREBASE_CLIENT_EMAIL && FIREBASE_STORAGE_BUCKET);
}

export { bucket, storage };
