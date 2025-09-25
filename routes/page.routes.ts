import type { FastifyInstance } from "fastify";
import { createPageHandler, addCollectionsToPageHandler, getPageBySlugHandler, updatePageBlocksHandler, getAllPagesHandler } from "../controllers/page.controller.js";

export const PageRoutes = async (fastify: FastifyInstance) => {
    fastify.post('/pages', {
        schema: {
            tags: ['pages'],
            summary: 'Create a new page',
        },
    }, createPageHandler);

    fastify.post('/pages/collections', {
        schema: {
            tags: ['pages'],
            summary: 'Add collections to a page',
        },
    }, addCollectionsToPageHandler);

    fastify.get('/pages/:slug', {
        schema: {
            tags: ['pages'],
            summary: 'Get a page by slug',
        },
    }, getPageBySlugHandler);

    fastify.put('/pages/collections', {
        schema: {
            tags: ['pages'],
            summary: 'Update page blocks',
        },
    }, updatePageBlocksHandler);

    fastify.get('/pages', {
        schema: {
            tags: ['pages'],
            summary: 'Get all pages',
        },
    }, getAllPagesHandler);
}
