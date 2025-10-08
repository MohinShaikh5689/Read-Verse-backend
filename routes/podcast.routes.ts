import type { FastifyInstance } from "fastify";
import { createPodcastChannelHandler, createPodcastHandler, getPodcastsHandler, searchPodcastsHandler, getPodcastByIdHandler, getPodcastCollectionByIdHandler, getPodcastsCollectionsHandler, getPodcastsByCategoryIdsHandler, getPodcastsByCategorySlugHandler, getPodcastsCollectionsByIdsHandler, updatePodcastChannelHandler, updatePodcastHandler, deletePodcastByIdHandler, deletePodcastCollectionByIdHandler, getPodcastSummaryHandler } from "../controllers/podcast.controller.js";

export const PodcastRoutes = async (fastify: FastifyInstance) => {
    fastify.post('/podcast-collections', {
        schema: {
            tags: ['podcast'],
            summary: 'Create a new podcast channel',
            consumes: ['multipart/form-data'],
        },
    }, createPodcastChannelHandler);

    fastify.post('/podcasts', {
        schema: {
            tags: ['podcast'],
            summary: 'Create a new podcast',
            consumes: ['multipart/form-data'],
        },
    }, createPodcastHandler);

    fastify.get('/podcasts', {
        schema: {
            tags: ['podcast'],
            summary: 'Get a podcast',
            querystring:{
                type: 'object',
                properties: {
                    page: { type: 'string' },
                    language: { type: 'string' },
                },
                required: ['page', 'language'],
            }
        },
    }, getPodcastsHandler);

    fastify.get('/podcasts/search', {
        schema: {
            tags: ['podcast'],
            summary: 'Search podcasts',
            querystring:{
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    language: { type: 'string' },
                    page: { type: 'string' },
                },
                required: ['query', 'language', 'page'],
            }
        },
    }, searchPodcastsHandler);
    fastify.get('/podcasts/:id', {
        schema: {
            tags: ['podcast'],
            summary: 'Get a podcast by ID',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            querystring:{
                type: 'object',
                properties: {
                    language: { type: 'string' },
                },
                required: ['language'],
            }
        },
    }, getPodcastByIdHandler);

    fastify.get('/podcast-collections/:id', {
        schema: {
            tags: ['podcast'],
            summary: 'Get a podcast collection by ID',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            querystring:{
                type: 'object',
                properties: {
                    language: { type: 'string' },
                    includePodcasts: { type: 'boolean' },
                },
                required: ['language', 'includePodcasts'],
            }
        },
    }, getPodcastCollectionByIdHandler);

    fastify.get('/podcast-collections', {
        schema: {
            tags: ['podcast'],
            summary: 'Get podcast collections',
            querystring:{
                type: 'object',
                properties: {
                    page: { type: 'string' },
                    language: { type: 'string' },
                },
                required: ['page', 'language'],
            }
        },
    }, getPodcastsCollectionsHandler);

    fastify.post('/podcasts-by-category-ids', {
        schema: {
            tags: ['podcast'],
            summary: 'Get podcasts by category IDs',
            body: {
                type: 'object',
                properties: {
                    categoryIds: { type: 'array', items: { type: 'string' } },
                },
                required: ['categoryIds'],
            },
            querystring:{
                type: 'object',
                properties: {
                    language: { type: 'string' },
                },
                required: ['language'],
            }
        },
    }, getPodcastsByCategoryIdsHandler);
    fastify.get('/podcasts-by-category-slug/:slug', {
        schema: {
            tags: ['podcast'],  
            summary: 'Get podcasts by category slug',
            params: {
                type: 'object',
                properties: {
                    slug: { type: 'string' },
                },
                required: ['slug'],
            },
            querystring:{
                type: 'object',
                properties: {
                    language: { type: 'string' },
                },
                required: ['language'],
            }
        },
    }, getPodcastsByCategorySlugHandler);

    fastify.post('/podcast-collections/by-ids', {
        schema: {
            tags: ['podcast'],
            summary: 'Get podcast collections by ids',
            body: {
                type: 'object',
                properties: {
                    ids: { type: 'array', items: { type: 'string' } },
                },
                required: ['ids'],
            },
        },
    }, getPodcastsCollectionsByIdsHandler);

    fastify.patch('/podcast-collections/:id', {
        schema: {
            tags: ['podcast'],
            summary: 'Update a podcast collection',
        },
    }, updatePodcastChannelHandler);

    fastify.put('/podcasts/:id', {
        schema: {
            tags: ['podcast'],
            summary: 'Update a podcast',
        },
    }, updatePodcastHandler);

    fastify.delete('/podcasts/:id', {
        schema: {
            tags: ['podcast'],
            summary: 'Delete a podcast',
        },
    }, deletePodcastByIdHandler);

    fastify.delete('/podcast-collections/:id', {
        schema: {
            tags: ['podcast'],
            summary: 'Delete a podcast collection',
        },
    }, deletePodcastCollectionByIdHandler);

    fastify.get('/podcasts/:id/summary', {
        schema: {
            tags: ['podcast'],
            summary: 'Get podcast summary',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
    }, getPodcastSummaryHandler);
};