import { PrismaClient } from "@prisma/client";
import type { AddCollectionsToPage, Page } from "../types/page.js";

const prisma = new PrismaClient();

export const createPage = async (page: Page) => {
    try {
        const newPage = await prisma.dynamicPage.create({
            data: {
                title: page.title,
                slug: page.slug,
            },
        });
        return newPage;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create page';
    }
}

export const addCollectionsToPage = async (collections: AddCollectionsToPage) => {
    try {
        console.log("collections", collections);
        const newPage = await prisma.dynamicPageBlock.create({
            data: {
                type: collections.type,
                viewType: collections.viewType,
                order: collections.order,
                pageId: collections.pageId,
                data: collections.data as any, // Consider stricter typing if possible
                metadata: collections.metadata as any, // Consider stricter typing if possible
                imageUrl: collections.imageUrl,
            },
        });

        return newPage;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to add collections to page';
    }
}

export const addMultipleCollectionsToPage = async (blocks: AddCollectionsToPage[]) => {
    try {
        console.log("adding multiple blocks", blocks);
        const createdBlocks = [];
        
        for (const block of blocks) {
            const newBlock = await prisma.dynamicPageBlock.create({
                data: {
                    type: block.type,
                    viewType: block.viewType,
                    order: block.order,
                    pageId: block.pageId,
                    data: block.data as any,
                    metadata: block.metadata as any,
                    imageUrl: block.imageUrl,
                },
            });
            createdBlocks.push(newBlock);
        }

        return createdBlocks;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to add multiple collections to page';
    }
}

export const createPageWithBlocks = async (pageData: Page, blocks: AddCollectionsToPage[]) => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            // Create page first
            const newPage = await prisma.dynamicPage.create({
                data: {
                    title: pageData.title,
                    slug: pageData.slug,
                },
            });

            // Create blocks for the page
            const createdBlocks = [];
            for (const block of blocks) {
                const newBlock = await prisma.dynamicPageBlock.create({
                    data: {
                        type: block.type,
                        viewType: block.viewType,
                        order: block.order,
                        pageId: newPage.id,
                        data: block.data as any,
                        metadata: block.metadata as any,
                        imageUrl: block.imageUrl,
                    },
                });
                createdBlocks.push(newBlock);
            }

            return {
                ...newPage,
                blocks: createdBlocks
            };
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create page with blocks';
    }
}

export const updatePage = async (id: string, page: Page) => {
    try {
        const updatedPage = await prisma.dynamicPage.update({
            where: { id: id },
            data: page,
        });
        return updatedPage;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to update page';
    }
}

export const updatePageBlocks = async (blocks: AddCollectionsToPage[]) => {
    try {
        console.log("blocks", blocks);
        const result = await prisma.$transaction(async (prisma) => {
            for (const block of blocks) {
                console.log("block id", block.Id);
                await prisma.dynamicPageBlock.update({
                    where: { id: block.Id },
                    data: {
                        type: block.type,
                        viewType: block.viewType,
                        order: block.order,
                        data: block.data as any,
                        imageUrl: block.imageUrl,
                        metadata: block.metadata as any,
                    },
                });
            }
            console.log("blocks updated", blocks);
            return blocks;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to update page blocks';
    }
}

export const getPageBySlug = async (slug: string) => {
    try {
        const page = await prisma.dynamicPage.findUnique({
            where: { slug: slug },
            include:{
                blocks: true,
            }
        });
        return page;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get page by slug';
    }
}

export const getAllPages = async () => {
    try {
        const pages = await prisma.dynamicPage.findMany({
            include: {
                _count:{
                    select:{
                        blocks: true,
                    }
                }
            }
        });
        return pages;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get all pages';
    }
}

export const deletePageById = async (id: string) => {
    try {
        await prisma.dynamicPage.delete({
            where: { id: id },
        });
        return true;
    } catch (error: unknown) {
        console.error(error);
        return false;
    }
}