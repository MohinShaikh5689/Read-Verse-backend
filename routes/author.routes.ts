import type{ FastifyInstance } from "fastify";
import { createAuthorHandler, getAuthorsHandler, getAuthorByIdHandler, searchAuthorsHandler, updateAuthorHandler, deleteAuthorByIdHandler, getAuthorsByIdsHandler } from "../controllers/author.controller.js";

export const AuthorRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // Create author
  fastify.post('/authors', {
    schema: {
      tags: ['authors'],
      summary: 'Create an author (multipart)',
      consumes: ['multipart/form-data'],
      body: {
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          imageUrl: { type: 'string', format: 'binary' }
        }
      }
    }
  }, createAuthorHandler);

  // Update author
  fastify.patch('/authors/:id', {
    schema: {
      tags: ['authors'],
      summary: 'Update an author (multipart)',
      consumes: ['multipart/form-data'],
    }
  }, updateAuthorHandler);

  // Get authors
  fastify.get('/authors', {
    schema: {
      tags: ['authors'],
      summary: 'Get all authors',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string' },
          language: { type: 'string' }
        },
        required: ['page', 'language']
      }
    }
  }, getAuthorsHandler);

  // Get author by id
  fastify.get('/authors/:id', {
    schema: {
      tags: ['authors'],
      summary: 'Get an author by id',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          language: { type: 'string' }
        },
        required: ['language']
      }
    }
  }, getAuthorByIdHandler);

  // Search authors
  fastify.get('/authors/search', {
    schema: {
      tags: ['authors'],
      summary: 'Search authors',
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          language: { type: 'string' }
        },
        required: ['query', 'language']
      }
    }
  }, searchAuthorsHandler);

  // Delete author by id
  fastify.delete('/authors/:id', {
    schema: {
      tags: ['authors'],
      summary: 'Delete an author by id',
    }
  }, deleteAuthorByIdHandler);

  // Get authors by ids
  fastify.post('/authors/by-ids', {
    schema: {
      tags: ['authors'],
      summary: 'Get authors by ids',
      body: {
        type: 'object',
        properties: {
          ids: { type: 'array', items: { type: 'string' } }
        },
        required: ['ids']
      }
    }
  }, getAuthorsByIdsHandler);
};