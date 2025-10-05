import dotenv from 'dotenv';
import type { FastifyRequest, FastifyReply } from "fastify";
import { asyncHandle, successHandle, errorHandle } from "../utils/handler.js";
import { uploadFile, isFirebaseConfigured } from "../utils/firebase-storage.js";
import { createAuthor, getAuthors, getAuthorById, searchAuthors, updateAuthor, deleteAuthorById, getAuthorsByIds } from "../services/author.service.js";
import type { Author, TranslatedAuthor } from '../types/author.js';
dotenv.config();

export const createAuthorHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  if (!isFirebaseConfigured()) {
    return errorHandle('Firebase Storage is not configured. Please check your environment variables.', reply, 500);
  }

  const parts = request.parts();
  let metadata: Record<string, any> = {};
  let files: Record<string, string> = {}; // file field → firebase URL

  for await (const part of parts) {
    if ('file' in part && part.file && 'filename' in part && part.filename) {
      // If multipart plugin truncated due to size limits, fail fast with 413
      if ((part.file as any)?.truncated) {
        const maxSize = process.env.MAX_FILE_SIZE_MB || '100';
        return errorHandle(`Uploaded file too large. Maximum file size is ${maxSize}MB. Please compress your file or contact support.`, reply, 413);
      }
      
      // Buffer the stream
      const bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        (part.file as any).on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        (part.file as any).on('end', () => resolve(Buffer.concat(chunks)));
        (part.file as any).on('error', reject);
      });

      try {
        const uploadResult = await uploadFile({
          buffer: bodyBuffer,
          fileName: part.filename,
          contentType: part.mimetype || 'application/octet-stream',
          folder: 'uploads/author-profile',
        });

        files[part.fieldname] = uploadResult.publicUrl;
      } catch (error) {
        console.error('Firebase upload error:', error);
        return errorHandle('Failed to upload file to Firebase Storage', reply, 500);
      }
    } else if ('value' in part) {
      const rawValue = (part as { value: any }).value as unknown;
      if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            metadata[part.fieldname] = JSON.parse(trimmed);
          } catch {
            // If parsing fails, fall back to the raw string
            metadata[part.fieldname] = rawValue;
          }
        } else {
          metadata[part.fieldname] = rawValue;
        }
      } else {
        metadata[part.fieldname] = rawValue as any;
      }
    }
  }
  if (!metadata.english.name) {
    return errorHandle('name is required', reply, 400);
  }

  const imageUrl = files.imageUrl ?? Object.values(files)[0];

  const author: Author = {
    name: metadata.english.name,
    imageUrl,
  }

  // Assuming metadata is an object with language keys and each value is a translation object
  const translatedAuthor: TranslatedAuthor[] = Object.entries(metadata)
    .map(([_lang, value]) => ({
      language: value.language,
      name: value.name,
      description: value.description,
    }));

    console.log("translatedAuthor", translatedAuthor);

  const newAuthor = await createAuthor(author, translatedAuthor);
  if(typeof newAuthor === 'string'){
    return errorHandle(newAuthor, reply, 500);
  }
 
  return successHandle({
    message: 'Author created Successfully'
  }, reply, 201);
});

export const getAuthorsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { page } = request.query as { page: string }; 
  const { language } = request.query as { language: string };
  const authors = await getAuthors(page, language);
  if (typeof authors === 'string') {
    return errorHandle(authors, reply, 500);
  }
  return successHandle(authors, reply, 200);
});

export const getAuthorByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { language } = request.query as { language: string };
  const author = await getAuthorById(id, language);
  if (typeof author === 'string') {
    return errorHandle(author, reply, 500);
  }
  return successHandle(author, reply, 200);
});

export const searchAuthorsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { query } = request.query as { query: string };
  const { language } = request.query as { language: string };
  const authors = await searchAuthors(query, language);
  if (typeof authors === 'string') {
    return errorHandle(authors, reply, 500);
  }
  return successHandle(authors, reply, 200);
});

export const updateAuthorHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  if (!isFirebaseConfigured()) {
    return errorHandle('Firebase Storage is not configured. Please check your environment variables.', reply, 500);
  }

  const parts = request.parts();
  let metadata: Record<string, any> = {};
  let files: Record<string, string> = {}; // file field → firebase URL

  for await (const part of parts) {
    if ('file' in part && part.file && 'filename' in part && part.filename) {
      // If multipart plugin truncated due to size limits, fail fast with 413
      if ((part.file as any)?.truncated) {
        const maxSize = process.env.MAX_FILE_SIZE_MB || '100';
        return errorHandle(`Uploaded file too large. Maximum file size is ${maxSize}MB. Please compress your file or contact support.`, reply, 413);
      }
      
      // Buffer the stream
      const bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        (part.file as any).on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        (part.file as any).on('end', () => resolve(Buffer.concat(chunks)));
        (part.file as any).on('error', reject);
      });

      try {
        const uploadResult = await uploadFile({
          buffer: bodyBuffer,
          fileName: part.filename,
          contentType: part.mimetype || 'application/octet-stream',
          folder: 'uploads/author-profile',
        });

        files[part.fieldname] = uploadResult.publicUrl;
      } catch (error) {
        console.error('Firebase upload error:', error);
        return errorHandle('Failed to upload file to Firebase Storage', reply, 500);
      }
    } else if ('value' in part) {
      const rawValue = (part as { value: any }).value as unknown;
      if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            metadata[part.fieldname] = JSON.parse(trimmed);
          } catch {
            // If parsing fails, fall back to the raw string
            metadata[part.fieldname] = rawValue;
          }
        } else {
          metadata[part.fieldname] = rawValue;
        }
      } else {
        metadata[part.fieldname] = rawValue as any;
      }
    }
  }
  if (!metadata.english.name) {
    return errorHandle('name is required', reply, 400);
  }

  const imageUrl = files.imageUrl ?? Object.values(files)[0];

  const author: Author = {
    name: metadata.english.name,
    imageUrl,
  }

  // Assuming metadata is an object with language keys and each value is a translation object
  const translatedAuthor: TranslatedAuthor[] = Object.entries(metadata)
    .map(([_lang, value]) => ({
      id: value.id,
      language: value.language,
      name: value.name,
      description: value.description,
    }));

  const updatedAuthor = await updateAuthor(id, author, translatedAuthor);
  if (typeof updatedAuthor === 'string') {
    return errorHandle(updatedAuthor, reply, 500);
  }
  return successHandle(updatedAuthor, reply, 200);
});

export const deleteAuthorByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const result = await deleteAuthorById(id);
    if (typeof result === 'string') {
      return errorHandle(result, reply, 500);
    }
    return successHandle({
      message: 'Author deleted successfully',
    }, reply, 200);
});

export const getAuthorsByIdsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { ids } = request.body as { ids: string[] };
  const authors = await getAuthorsByIds(ids);
  if (typeof authors === 'string') {
    return errorHandle(authors, reply, 500);
  }
  return successHandle(authors, reply, 200);
});