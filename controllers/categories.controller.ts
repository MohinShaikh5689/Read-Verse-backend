import dotenv from 'dotenv';
import type { FastifyRequest, FastifyReply } from "fastify";
import { asyncHandle, successHandle, errorHandle } from "../utils/handler.js";
import { uploadFile, isSupabaseConfigured } from "../utils/supabase-storage.js";
import type { Category } from '../types/category.js';
import { createCategory, getCategories, getCategoryById, searchCategories, getCategoriesByIds, deleteCategoryById, updateCategory } from '../services/categories.service.js';

dotenv.config();

export const createCategoryHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    console.log("entered here");
    
    if (!isSupabaseConfigured()) {
        return errorHandle('Supabase Storage is not configured. Please check your environment variables.', reply, 500);
    }
    
    const parts = request.parts();
    let metadata: Record<string, any> = {};
    let files: Record<string, string> = {}; // file field → public URL

    for await (const part of parts) {
        if ('file' in part && part.file && 'filename' in part && part.filename) {
            // If multipart plugin truncated due to size limits, fail fast with 413
            if ((part.file as any)?.truncated) {
                const maxSize = process.env.MAX_FILE_SIZE_MB || '100';
                return errorHandle(`Uploaded file too large. Maximum file size is ${maxSize}MB. Please compress your file or contact support.`, reply, 413);
            }
            
            // Expect two file fields: categorySVG (an .svg) and categoryImage (any image)
            const isSvgField = part.fieldname === 'categorySVG';
            const subfolder = isSvgField ? 'category-svg' : 'category-image';
            
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
                    folder: `uploads/${subfolder}`,
                });

                files[part.fieldname] = uploadResult.publicUrl;
            } catch (error) {
                console.error('Supabase Storage upload error:', error);
                return errorHandle('Failed to upload file to Supabase Storage', reply, 500);
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
      console.log("files", files);
      const categorySVG = files.categorySVG;
      const categoryImage = files.categoryImage;
      const midImage = files.midImage;
      if (!categorySVG) {
        return errorHandle('categorySVG is required and must be an SVG file', reply, 400);
      }
      if (!categoryImage) {
        return errorHandle('categoryImage is required', reply, 400);
      }
      // Lightweight SVG check by extension in resulting URL
      if (!/\.svg($|\?)/i.test(categorySVG)) {
        return errorHandle('categorySVG must be an .svg file', reply, 400);
      }

      console.log("metadata", metadata);

      const category: Category = {
        name: metadata.english.name,
        categorySVG,
        categoryImage,
        midImage,
        slug: metadata.slug,
      }

      const translatedCategory = Object.entries(metadata)
      .filter(([key]) => ['english', 'hindi', 'arabic', 'bahasa'].includes(key))
        .map(([_lang, value]) => ({
          language: value.language,
          name: value.name,
          description: value.description,
        }));

      console.log("translatedCategory", translatedCategory);

      console.log(category);
      const newCategory = await createCategory(category, translatedCategory);
      if(typeof newCategory === 'string'){
        return errorHandle(newCategory, reply, 500);
      }
      return successHandle({
        message: 'Category created successfully',
      }, reply, 201);
});

export const updateCategoryHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    
    if (!isSupabaseConfigured()) {
        return errorHandle('Supabase Storage is not configured. Please check your environment variables.', reply, 500);
    }
    const { id } = request.params as { id: string };
    const parts = request.parts();
    let metadata: Record<string, any> = {};
    let files: Record<string, string> = {}; // file field → public URL

    for await (const part of parts) {
        if ('file' in part && part.file && 'filename' in part && part.filename) {
            // If multipart plugin truncated due to size limits, fail fast with 413
            if ((part.file as any)?.truncated) {
                const maxSize = process.env.MAX_FILE_SIZE_MB || '100';
                return errorHandle(`Uploaded file too large. Maximum file size is ${maxSize}MB. Please compress your file or contact support.`, reply, 413);
            }
            
            // Expect two file fields: categorySVG (an .svg) and categoryImage (any image)
            const isSvgField = part.fieldname === 'categorySVG';
            const subfolder = isSvgField ? 'category-svg' : 'category-image';
            
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
                    folder: `uploads/${subfolder}`,
                });

                files[part.fieldname] = uploadResult.publicUrl;
            } catch (error) {
                console.error('Supabase Storage upload error:', error);
                return errorHandle('Failed to upload file to Supabase Storage', reply, 500);
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
      console.log("files", files);
      const categorySVG = files.categorySVG;
      const categoryImage = files.categoryImage;
      const midImage = files.midImage;

      console.log("metadata", metadata);

      const category: Category = {
        name: metadata.english.name,
        categorySVG,
        categoryImage,
        midImage,
        slug: metadata.slug,
      }

      const translatedCategory = Object.entries(metadata)
      .filter(([key]) => ['english', 'hindi', 'arabic', 'bahasa'].includes(key))
        .map(([_lang, value]) => ({
          language: value.language,
          name: value.name,
          description: value.description,
        }));

      console.log("translatedCategory", translatedCategory);

      console.log(category);
      const updatedCategory = await updateCategory(id, category, translatedCategory);
      if(typeof updatedCategory === 'string'){
        return errorHandle(updatedCategory, reply, 500);
      }
      return successHandle({
        message: 'Category updated successfully',
      }, reply, 201);
});

export const getCategoriesHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { page } = request.query as { page: string };
  const { language } = request.query as { language: string };
  const categories = await getCategories(page, language);
  if(typeof categories === 'string'){
    return errorHandle(categories, reply, 500);
  }
  return successHandle(categories, reply, 200);
})

export const getCategoryByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { language } = request.query as { language: string };
  console.log("id", id);
  console.log("language", language);
  const category = await getCategoryById(id, language);
  if(typeof category === 'string'){
    return errorHandle(category, reply, 500);
  }
  return successHandle(category, reply, 200);
})

export const searchCategoriesHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { query } = request.query as { query: string };
  const { language } = request.query as { language: string };
  const categories = await searchCategories(query, language);
  if(typeof categories === 'string'){
    return errorHandle(categories, reply, 500);
  }
  return successHandle(categories, reply, 200);
});

export const getCategoriesByIdsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { ids } = request.body as { ids: string[] };
  const { language } = request.query as { language: string };
  const categories = await getCategoriesByIds(ids, language);
  if(typeof categories === 'string'){
    return errorHandle(categories, reply, 500);
  }
  return successHandle(categories, reply, 200);
});

export const deleteCategoryByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const result = await deleteCategoryById(id);
  if(typeof result === 'string'){
    return errorHandle(result, reply, 500);
  }
  return successHandle({
    message: 'Category deleted successfully',
  }, reply, 200);
});