import dotenv from 'dotenv';
import type { FastifyRequest, FastifyReply } from "fastify";
import { asyncHandle, successHandle, errorHandle } from "../utils/handler.js";
import { uploadFile, isFirebaseConfigured } from "../utils/firebase-storage.js";
import type { Book, bookCollectionMetadataFields, BookCollection, Summary, TranslatedSummary } from "../types/books.js";
import { createBook , getBooks, getBookById, searchBooks, createBookCollection, getBookCollectionById, getBookCollections, updateBook, getBookBySlug, getBooksByAuthorId, getBooksByCategoryIds, getBooksByCategorySlug, updateBookCollection, getBookCollectionsByIds, createSummary, editSummary, getSummariesByBookId } from "../services/book.service.js";
dotenv.config();

export const createBookHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isFirebaseConfigured()) {
        return errorHandle('Firebase Storage is not configured. Please check your environment variables.', reply, 500);
    }

    const parts = request.parts();
    let metadata: Record<string, any> = {};
    let files: Record<string, string> = {}; // file field → firebase URL
    let summaryAudioFiles: Record<string, string> = {}; // summary audio files
    let languageImages: Record<string, string> = {}; // language image files
    console.log("files", files);

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
                let folder = 'uploads/books';
                
                // Determine the folder based on file type
                if (part.fieldname === 'coverUrl') {
                    folder = 'uploads/book-covers';
                } else if (part.fieldname.startsWith('audioFile') && !part.fieldname.includes('summary')) {
                    // Main audio files go to book-audio folder
                    const language = part.fieldname.replace('audioFile', '').toLowerCase();
                    folder = `uploads/book-audio/${language}`;
                } else if (part.fieldname.includes('summaryAudio')) {
                    // Summary audio files
                    const match = part.fieldname.match(/summaryAudio_(\w+)_(\d+)/);
                    if (match) {
                        const [, language, partIndex] = match;
                        folder = `uploads/summary-audio/${language}/${partIndex}`;
                    } else {
                        folder = 'uploads/summary-audio';
                    }
                } else if (part.fieldname.startsWith('image')) {
                    // Language image files
                    const language = part.fieldname.replace('image', '').toLowerCase();
                    folder = `uploads/book-images/${language}`;
                }

                const uploadResult = await uploadFile({
                    buffer: bodyBuffer,
                    fileName: part.filename,
                    contentType: part.mimetype || 'application/octet-stream',
                    folder,
                });

                if (part.fieldname.includes('summaryAudio')) {
                    summaryAudioFiles[part.fieldname] = uploadResult.publicUrl;
                } else if (part.fieldname.startsWith('image')) {
                    languageImages[part.fieldname] = uploadResult.publicUrl;
                } else {
                    files[part.fieldname] = uploadResult.publicUrl;
                }
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

    console.log("metadata", metadata);
    console.log("summaryData", metadata.summaryData);
    console.log("languageImages", languageImages);

    // Cover URL is no longer required since we removed it from frontend
    // const coverUrl = files.coverUrl;
    // console.log("coverUrl", coverUrl);
    // if (!coverUrl) {
    //     return errorHandle('Cover image is required', reply, 400);
    // }


    // Validate required fields
    if (!metadata.english || !metadata.english.title) {
        return errorHandle('English title is required', reply, 400);
    }
    if (!metadata.authors) {
        return errorHandle('Authors are required', reply, 400);
    }
    if (!metadata.slug) {
        return errorHandle('Slug is required', reply, 400);
    }
    if (!metadata.totalDuration) {
        return errorHandle('Total duration is required', reply, 400);
    }
    
    // Validate and convert totalDuration
    const totalDuration = Number(metadata.totalDuration);
    if (isNaN(totalDuration) || totalDuration <= 0) {
        return errorHandle('Total duration must be a valid positive number', reply, 400);
    }
    
    if (!metadata.categories || !Array.isArray(metadata.categories) || metadata.categories.length === 0) {
        return errorHandle('At least one category is required', reply, 400);
    }

    const book: Book = {
        title: metadata.english.title,
        // coverUrl: coverUrl, // Removed since cover image is no longer used
        authors: metadata.authors,
        slug: metadata.slug,
        totalDuration: totalDuration,
        categories: metadata.categories,
    }

    // Map language codes to their respective data including images
    let translatedBook;
    try {
        translatedBook = Object.entries(metadata)
            .filter(([key]) => ['english', 'hindi', 'arabic', 'bahasa'].includes(key))
            .map(([lang, value]) => {
                // Validate that each language object has required fields
                if (!value || typeof value !== 'object') {
                    throw new Error(`Invalid data for language: ${lang}`);
                }
                if (!value.title || !value.description || !value.language) {
                    throw new Error(`Missing required fields for language: ${lang}`);
                }

                // Get the corresponding language image
                const imageFieldName = `image${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
                const imageUrl = languageImages[imageFieldName] || null;

                // Get the corresponding audio fil

                return {
                    language: value.language,
                    title: value.title,
                    description: value.description,
                    published: Boolean(value.published),
                    audioEnabled: Boolean(value.audioEnabled),
                    imageUrl: imageUrl, // Add language-specific image
                };
            });
    } catch (error) {
        console.error("Language data validation error:", error);
        return errorHandle(error instanceof Error ? error.message : 'Invalid language data', reply, 400);
    }

    console.log("translatedBook", translatedBook);

    // Process summary data if provided
  
     
    const newBook = await createBook(book, translatedBook);
    if(typeof newBook === 'string'){
        return errorHandle(newBook, reply, 500);
    }
    
    return successHandle({
        message: 'Book created successfully',
        bookId: (newBook as any).id,
        languageImages: languageImages, // Include language images in response
    }, reply, 201);
});
export const EditBookHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isFirebaseConfigured()) {
        return errorHandle('Firebase Storage is not configured. Please check your environment variables.', reply, 500);
    }
    const { id } = request.params as { id: string };
    const parts = request.parts();
    let metadata: Record<string, any> = {};
    let files: Record<string, string> = {}; // file field → firebase URL
    
    console.log("=== PROCESSING MULTIPART DATA ===");
    
    for await (const part of parts) {
        if ('file' in part && part.file && 'filename' in part && part.filename) {
            // Handle file upload
            console.log("Processing file:", part.fieldname, part.filename);
            
            if ((part.file as any)?.truncated) {
                const maxSize = process.env.MAX_FILE_SIZE_MB || '100';
                return errorHandle(`Uploaded file too large. Maximum file size is ${maxSize}MB. Please compress your file or contact support.`, reply, 413);
            }
            
            const bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
                const chunks: Buffer[] = [];
                (part.file as any).on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
                (part.file as any).on('end', () => resolve(Buffer.concat(chunks)));
                (part.file as any).on('error', reject);
            });
            
            try {
                let folder = 'uploads/books';
                
                // Determine the folder based on file type for better organization
                if (part.fieldname.includes('coverImage')) {
                    folder = 'uploads/book-covers';
                }
                
                const uploadResult = await uploadFile({
                    buffer: bodyBuffer,
                    fileName: part.filename,
                    contentType: part.mimetype || 'application/octet-stream',
                    folder,
                });
                
                // Store the public URL from Firebase, not the local path
                files[part.fieldname] = uploadResult.publicUrl;
                console.log("Upload result:", uploadResult);
            } catch (error) {
                console.error("Error buffering file stream:", error);
                return errorHandle('Failed to process file upload', reply, 500);
            }
        } else {
            // Handle text fields - THIS WAS MISSING!
            if ('value' in part) {
                console.log("Processing text field:", part.fieldname, "=", part.value);
                metadata[part.fieldname] = part.value;
            }
        }
    }
    
    console.log("=== FINAL RESULTS ===");
    console.log("metadata:", metadata);
    console.log("files:", files);
     
    const metaData = {
        authors: metadata.authors ? JSON.parse(metadata.authors) : [],
        categories: metadata.categories ? JSON.parse(metadata.categories) : [],
        title: metadata.english_title,
        totalDuration: metadata.totalDuration ? parseInt(metadata.totalDuration) : undefined,
    }

    // Process translated book data for each language
    const translatedBookData = [
        {
            language: 'en',
            title: metadata.english_title,
            description: metadata.english_description,
            published: metadata.english_published === 'true',
            audioEnabled: metadata.english_audioEnabled === 'true',
            coverUrl: files.english_coverImage
        },
        {
            language: 'hi',
            title: metadata.hindi_title,
            description: metadata.hindi_description,
            published: metadata.hindi_published === 'true',
            audioEnabled: metadata.hindi_audioEnabled === 'true',
            coverUrl: files.hindi_coverImage
        },
        {
            language: 'ar',
            title: metadata.arabic_title,
            description: metadata.arabic_description,
            published: metadata.arabic_published === 'true',
            audioEnabled: metadata.arabic_audioEnabled === 'true',
            coverUrl: files.arabic_coverImage
        },
        {
            language: 'id',
            title: metadata.bahasa_title,
            description: metadata.bahasa_description,
            published: metadata.bahasa_published === 'true',
            audioEnabled: metadata.bahasa_audioEnabled === 'true',
            coverUrl: files.bahasa_coverImage
        }
    ].filter(item => item.title && item.description); // Only include languages with data

    console.log("Processed book data:", metaData);
    console.log("Processed translations:", translatedBookData);
    
    // Call the update service
    const result = await updateBook(id, metaData, translatedBookData);
    if (typeof result === 'string') {
        return errorHandle(result, reply, 500);
    }
    
    return successHandle({
        message: 'Book updated successfully',
        bookId: id,
        updatedData: result
    }, reply, 200);
});


export const getBooksHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { page, language } = request.query as { page: string; language: string }; 
    const books = await getBooks(page, language);
    if (typeof books === 'string') {
        return errorHandle(books, reply, 500);
    }
    return successHandle(books, reply, 200);
});

export const getBookByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { language } = request.query as { language: string };
    const book = await getBookById(id, language);
    if (typeof book === 'string') {
        return errorHandle(book, reply, 500);
    }
    return successHandle(book, reply, 200);
});

export const searchBooksHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { query, language, page } = request.query as { query: string; language: string; page: string };
    console.log("query", query);
    console.log("language", language);
    console.log("page", page);
    const books = await searchBooks(query, language, page);
    if (typeof books === 'string') {
        return errorHandle(books, reply, 500);
    }
    return successHandle(books, reply, 200);
});

export const createBookCollectionHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isFirebaseConfigured()) {
        return errorHandle('Firebase Storage is not configured. Please check your environment variables.', reply, 500);
    }
    const parts = request.parts();
    let metadata: Record<string, any> = {};
    let files: Record<string, string> = {}; // file field → firebase URL
    console.log("files", files);

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
                let folder = 'uploads/books';
                
                // Determine the folder based on file type
                if (part.fieldname === 'collectionImage') {
                    folder = 'uploads/collection-covers';
                } 

                const uploadResult = await uploadFile({
                    buffer: bodyBuffer,
                    fileName: part.filename,
                    contentType: part.mimetype || 'application/octet-stream',
                    folder,
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

    console.log("metadata", metadata);
    console.log("files", files);

    const metaData: bookCollectionMetadataFields = {
        title: metadata.englishTitle,
        imageUrl: files.collectionImage,
        slug: metadata.slug,
        books: metadata.bookIds || [],
    }
    console.log("metaData", metaData);
    const translatedCollection: BookCollection[] = Object.entries(metadata)
    .map(([_lang, value]) => ({
      language: value.language,
      title: value.title,
      description: value.description,
    })).filter((item) => item.language && item.title && item.description);;
    console.log("translatedCollection", translatedCollection);
    const newCollection = await createBookCollection(metaData, translatedCollection);
    if(typeof newCollection === 'string'){
        return errorHandle(newCollection, reply, 500);
    }
    return successHandle({
        message: 'Book collection created successfully',
        collectionId: (newCollection as any).id,
    }, reply, 201);
   
});

export const updateBookCollectionHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    if (!isFirebaseConfigured()) {
        return errorHandle('Firebase Storage is not configured. Please check your environment variables.', reply, 500);
    }
    const parts = request.parts();
    let metadata: Record<string, any> = {};
    let files: Record<string, string> = {}; // file field → firebase URL
    console.log("files", files);

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
                let folder = 'uploads/books';
                
                // Determine the folder based on file type
                if (part.fieldname === 'collectionImage') {
                    folder = 'uploads/collection-covers';
                } 

                const uploadResult = await uploadFile({
                    buffer: bodyBuffer,
                    fileName: part.filename,
                    contentType: part.mimetype || 'application/octet-stream',
                    folder,
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


    const metaData: bookCollectionMetadataFields = {
        title: metadata.englishTitle,
        imageUrl: files.collectionImage,
        books: metadata.bookIds || [],
        slug: metadata.slug,
    }
    const translatedCollection: BookCollection[] = Object.entries(metadata)
    .map(([_lang, value]) => ({
      language: value.language,
      title: value.title,
      description: value.description,
    })).filter((item) => item.language && item.title && item.description);


    console.log("metaData", metaData);
    console.log("translatedCollection", translatedCollection);

    const updatedCollection = await updateBookCollection(id, metaData, translatedCollection);
    if(typeof updatedCollection === 'string'){
        return errorHandle(updatedCollection, reply, 500);
    }
    return successHandle(updatedCollection, reply, 200);
});

export const getBookCollectionsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { page, language } = request.query as { page: string; language: string }; 
    const collections = await getBookCollections(page, language);
    if (typeof collections === 'string') {
        return errorHandle(collections, reply, 500);
    }
    return successHandle(collections, reply, 200);
});


export const getBookCollectionByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { language, includeBooks } = request.query as { language: string; includeBooks: boolean };
    const bookCollection = await getBookCollectionById(id, language, includeBooks);
    if (typeof bookCollection === 'string') {
        return errorHandle(bookCollection, reply, 500);
    }
    return successHandle(bookCollection, reply, 200);
});

export const getBookBySlugHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    const { language } = request.query as { language: string };
    const book = await getBookBySlug(slug, language);
    if (typeof book === 'string') {
        return errorHandle(book, reply, 500);
    }
    return successHandle(book, reply, 200);
});

export const getBooksByAuthorIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { authorId } = request.params as { authorId: string };
    const { language, page } = request.query as { language: string; page: string };
    const books = await getBooksByAuthorId(authorId, language, page);
    if (typeof books === 'string') {
        return errorHandle(books, reply, 500);
    }
    return successHandle(books, reply, 200);
});

export const getBooksByCategoryIdsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { categoryIds } = request.body as { categoryIds: string[] };
    const { language, page } = request.query as { language: string; page: string };
    console.log("categoryIds", categoryIds);
    const books = await getBooksByCategoryIds(categoryIds, language, page);
    if (typeof books === 'string') {
        return errorHandle(books, reply, 500);
    }
    return successHandle(books, reply, 200);
});

export const getBooksByCategorySlugHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { categorySlug } = request.params as { categorySlug: string };
    const { language, page } = request.query as { language: string; page: string };
    const books = await getBooksByCategorySlug(categorySlug, language, page);
    if (typeof books === 'string') {
        return errorHandle(books, reply, 500);
    }
    return successHandle(books, reply, 200);
});

export const getBookCollectionsByIdsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { ids } = request.body as { ids: string[] };
    const collections = await getBookCollectionsByIds(ids);
    if (typeof collections === 'string') {
        return errorHandle(collections, reply, 500);
    }
    return successHandle(collections, reply, 200);
});

export const createBookSummaryHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const data = request.body as { summary: Summary, translatedSummary: TranslatedSummary[] };
    const summary = await createSummary(data.summary, data.translatedSummary, id);
    if (typeof summary === 'string') {
        return errorHandle(summary, reply, 500);
    }
    return successHandle(summary, reply, 200);
});

export const editBookSummaryHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, summaryId } = request.params as { id: string; summaryId: string };
    const data = request.body as { summary: Summary, translatedSummary: TranslatedSummary[] };
    const summary = await editSummary(id, data.summary, data.translatedSummary, summaryId);
    if (typeof summary === 'string') {
        return errorHandle(summary, reply, 500);
    }
    return successHandle(summary, reply, 200);
});

export const getBookSummariesByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { language } = request.query as { language: string };
    const summaries = await getSummariesByBookId(id, language);
    if (typeof summaries === 'string') {
        return errorHandle(summaries, reply, 500);
    }
    return successHandle(summaries, reply, 200);
});
