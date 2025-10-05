import type { FastifyInstance } from "fastify";
import { createCategoryHandler, getCategoriesHandler, getCategoryByIdHandler, searchCategoriesHandler, getCategoriesByIdsHandler, deleteCategoryByIdHandler, updateCategoryHandler } from "../controllers/categories.controller.js";

export const CategoryRoutes = async (fastify: FastifyInstance) => {
    fastify.post('/categories', {
        schema: {
            tags: ['categories'],
            summary: 'Create a new category',
            consumes: ['multipart/form-data'],
            body: {
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    categorySVG: { type: 'string', format: 'binary' },
                    categoryImage: { type: 'string', format: 'binary' },
                },
            },
        },
    }, createCategoryHandler);

    fastify.get('/categories', {
        schema: {
            tags: ['categories'],
            summary: 'Get all categories',
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'string' },
                    language: { type: 'string' },
                },
            },
        },
    }, getCategoriesHandler);

    fastify.get('/categories/:id', {
        schema: {
            tags: ['categories'],
            summary: 'Get a category by id',
            querystring:{
                type: 'object',
                properties: {
                    language: { type: 'string' },
                },
            }
        },
    }, getCategoryByIdHandler);


    fastify.get('/categories/search', {
        schema: {
            tags: ['categories'],
            summary: 'Search categories',
            querystring: {
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    language: { type: 'string' },
                },
            },
        },
    }, searchCategoriesHandler);

    fastify.post('/categories/by-ids', {
        schema: {
            tags: ['categories'],
            summary: 'Get categories by ids',
            body: {
                type: 'object',
                properties: {
                    ids: { type: 'array', items: { type: 'string' } },
                },
                required: ['ids'],
            },
        },
    }, getCategoriesByIdsHandler);

    fastify.delete('/categories/:id', {
        schema: {
            tags: ['categories'],
            summary: 'Delete a category',
        },
    }, deleteCategoryByIdHandler);

    fastify.put('/categories/:id', {
        schema: {
            tags: ['categories'],
            summary: 'Update a category',
            consumes: ['multipart/form-data'],
        },
    }, updateCategoryHandler);

};