import type { FastifyRequest, FastifyReply } from "fastify";
import { asyncHandle, successHandle, errorHandle } from "../utils/handler.js";
import type { Page, AddCollectionsToPage } from "../types/page.js";
import { addCollectionsToPage, addMultipleCollectionsToPage, createPage, getPageBySlug, updatePageBlocks, getAllPages, deletePageById } from "../services/page.service.js";
import { isSupabaseConfigured, uploadFile } from "../utils/supabase-storage.js";


export const createPageHandler = asyncHandle(async (req: FastifyRequest, reply: FastifyReply) => {
    const data = req.body as Page;
    const page = await createPage(data);
    if (typeof page === 'string') {
        return errorHandle(page, reply, 500);
    }
    return successHandle(page, reply, 201);
}
)
export const addCollectionsToPageHandler = asyncHandle(async (req: FastifyRequest, reply: FastifyReply) => {
    if (!isSupabaseConfigured()) {
        return errorHandle('Supabase Storage is not configured. Please check your environment variables.', reply, 500);
    }

    const parts = req.parts();
    let metadata: Record<string, any> = {};
    let files: Record<string, string> = {}; // file field → supabase URL

    for await (const part of parts) {
        if ('file' in part && part.file && 'filename' in part && part.filename) {
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
            const uploadResult = await uploadFile({
                buffer: bodyBuffer,
                fileName: part.filename,
                contentType: part.mimetype || 'application/octet-stream',
                folder: 'uploads/pages',
            });
            files[part.fieldname] = uploadResult.publicUrl;
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
            }
        }
    }

    console.log("metadata", metadata);
    const imageUrl = files.imageUrl ?? Object.values(files)[0];
    console.log("imageUrl", imageUrl);

    // Handle single block or multiple blocks
    const blocksData = metadata.blocks;
    if (!blocksData || !Array.isArray(blocksData)) {
        return errorHandle('Invalid blocks data format', reply, 400);
    }

    if (blocksData.length === 1) {
        // Process single block
        const blockData = blocksData[0];
        const data: AddCollectionsToPage = {
            pageId: blockData.pageId,
            type: blockData.type,
            viewType: blockData.viewType,
            order: blockData.order,
            data: blockData.data,
            imageUrl: imageUrl,
            metadata: blockData.metadata || null,
        }
        
        console.log("single block data", data);
        const page = await addCollectionsToPage(data);
        if (typeof page === 'string') {
            return errorHandle(page, reply, 500);
        }
        return successHandle(page, reply, 200);
    } else {
        // Process multiple blocks - filter out blob URLs
        const blocks: AddCollectionsToPage[] = blocksData.map((blockData: any, index: number) => {
            let finalImageUrl = null;
            
            // First priority: newly uploaded files
            if (files[`imageUrl_${index}`] || imageUrl) {
                finalImageUrl = files[`imageUrl_${index}`] || imageUrl;
            }
            // Don't use blob URLs
            else if (blockData.imageUrl && !blockData.imageUrl.startsWith('blob:')) {
                finalImageUrl = blockData.imageUrl;
            }
            
            return {
                pageId: blockData.pageId,
                type: blockData.type,
                viewType: blockData.viewType,
                order: blockData.order,
                data: blockData.data,
                imageUrl: finalImageUrl,
                metadata: blockData.metadata || null,
            };
        });
        
        console.log("multiple blocks data", blocks);
        const pages = await addMultipleCollectionsToPage(blocks);
        if (typeof pages === 'string') {
            return errorHandle(pages, reply, 500);
        }
        return successHandle({ blocks: pages }, reply, 200);
    }
})

export const getPageBySlugHandler = asyncHandle(async (req: FastifyRequest, reply: FastifyReply) => {
    const { slug } = req.params as { slug: string };
    console.log("slug", slug);
    const page = await getPageBySlug(slug);
    if (typeof page === 'string') {
        return errorHandle(page, reply, 500);
    }
    return successHandle(page, reply, 200);
});

export const updatePageBlocksHandler = asyncHandle(async (req: FastifyRequest, reply: FastifyReply) => {
    // Check if this is a multipart request (with files) or JSON request
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
        // Handle multipart form data with potential file uploads
        if (!isSupabaseConfigured()) {
            return errorHandle('Supabase Storage is not configured. Please check your environment variables.', reply, 500);
        }

        const parts = req.parts();
        let metadata: Record<string, any> = {};
        let files: Record<string, string> = {}; // file field → supabase URL

        for await (const part of parts) {
            if ('file' in part && part.file && 'filename' in part && part.filename) {
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
                const uploadResult = await uploadFile({
                    buffer: bodyBuffer,
                    fileName: part.filename,
                    contentType: part.mimetype || 'application/octet-stream',
                    folder: 'uploads/pages',
                });
                files[part.fieldname] = uploadResult.publicUrl;
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
                }
            }
        }

        const blocksData = metadata.blocks;
        if (!blocksData || !Array.isArray(blocksData)) {
            return errorHandle('Invalid blocks data format', reply, 400);
        }

        // Add image URLs to blocks if uploaded, filter out blob URLs
        const blocks = blocksData.map((block: any, index: number) => {
            let finalImageUrl = null;
            
            // First priority: newly uploaded files
            if (files[`imageUrl_${index}`] || files.imageUrl) {
                finalImageUrl = files[`imageUrl_${index}`] || files.imageUrl;
            }
            // Second priority: existing valid Supabase URLs (not blob URLs)
            else if (block.imageUrl && !block.imageUrl.startsWith('blob:')) {
                finalImageUrl = block.imageUrl;
            }
            
            return {
                ...block,
                imageUrl: finalImageUrl
            };
        });

        const page = await updatePageBlocks(blocks);
        if (typeof page === 'string') {
            return errorHandle(page, reply, 500);
        }
        return successHandle(page, reply, 200);
    } else {
        // Handle JSON request - filter out blob URLs
        const data = req.body as { blocks: AddCollectionsToPage[] };
        const cleanedBlocks = data.blocks.map(block => ({
            ...block,
            imageUrl: block.imageUrl && !block.imageUrl.startsWith('blob:') ? block.imageUrl : null
        }));
        
        const page = await updatePageBlocks(cleanedBlocks);
        if (typeof page === 'string') {
            return errorHandle(page, reply, 500);
        }
        return successHandle(page, reply, 200);
    }
});

export const getAllPagesHandler = asyncHandle(async (req: FastifyRequest, reply: FastifyReply) => {
    const pages = await getAllPages();
    if (typeof pages === 'string') {
        return errorHandle(pages, reply, 500);
    }
    return successHandle(pages, reply, 200);
});

export const deletePageByIdHandler = asyncHandle(async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const result = await deletePageById(id);
    if (typeof result === 'string') {
        return errorHandle(result, reply, 500);
    }
    return successHandle({
        message: 'Page deleted successfully',
    }, reply, 200);
});