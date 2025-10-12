import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const isSupabaseConfigured = (): boolean => {
    return !!(supabaseUrl && supabaseServiceKey);
};

interface UploadFileOptions {
    buffer: Buffer;
    fileName: string;
    contentType: string;
    folder: string;
}

interface UploadResult {
    publicUrl: string;
    path: string;
}

/**
 * Upload a file to Supabase Storage
 * @param options - Upload configuration
 * @returns Public URL and storage path
 */
export const uploadFile = async (options: UploadFileOptions): Promise<UploadResult> => {
    const { buffer, fileName, contentType, folder } = options;

    if (!isSupabaseConfigured()) {
        throw new Error('Supabase Storage is not configured. Please check your environment variables.');
    }

    // Create a unique file name to avoid collisions
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = `${folder}/${uniqueFileName}`;

    // Default bucket name - you can make this configurable
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

    try {
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
                contentType,
                upsert: false,
            });

        if (error) {
            console.error('Supabase Storage upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return {
            publicUrl,
            path: filePath,
        };
    } catch (error) {
        console.error('Error uploading to Supabase Storage:', error);
        throw error;
    }
};

/**
 * Delete a file from Supabase Storage
 * @param filePath - Path to the file in storage
 * @returns Success status
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase Storage is not configured.');
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

    try {
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) {
            console.error('Supabase Storage delete error:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }

        return true;
    } catch (error) {
        console.error('Error deleting from Supabase Storage:', error);
        throw error;
    }
};

/**
 * Get a signed URL for a private file (if needed)
 * @param filePath - Path to the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export const getSignedUrl = async (filePath: string, expiresIn: number = 3600): Promise<string> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase Storage is not configured.');
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, expiresIn);

        if (error) {
            console.error('Supabase Storage signed URL error:', error);
            throw new Error(`Failed to create signed URL: ${error.message}`);
        }

        return data.signedUrl;
    } catch (error) {
        console.error('Error creating signed URL:', error);
        throw error;
    }
};
