import type { FastifyInstance } from "fastify";
import { createBookHandler, getBooksHandler, getBookByIdHandler, searchBooksHandler, createBookCollectionHandler, getBookCollectionByIdHandler, getBookCollectionsHandler, EditBookHandler, getBookBySlugHandler, getBooksByAuthorIdHandler, getBooksByCategoryIdsHandler, getBooksByCategorySlugHandler, getBookCollectionsByIdsHandler, updateBookCollectionHandler, createBookSummaryHandler, editBookSummaryHandler, getBookSummariesByIdHandler, deleteBookSummaryByIdHandler, deleteBookByIdHandler, deleteBookCollectionByIdHandler, getBooksByAuthorIdsHandler } from "../controllers/book.controller.js";

export const BookRoutes = async (fastify: FastifyInstance): Promise<void> => {
    // Create book
    fastify.post('/books', {
        schema: {
            tags: ['books'],
            summary: 'Create a book (multipart)',
            consumes: ['multipart/form-data'],
            body: {
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  coverUrl: { type: 'string', format: 'binary' },
                  authorId: { type: 'string' },
                  totalDuration: { type: 'number' },
                  published: { type: 'boolean' },
                  audioEnabled: { type: 'boolean' },
                  audioUrl: { type: 'string', format: 'binary' }
                }
              }
        }
    }, createBookHandler);

    // Get books
    fastify.get('/books', {
        schema: {
            tags: ['books'],
            summary: 'Get all books',
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'string' },
                    language: { type: 'string' }
                },
                required: ['page', 'language']
            }
        }
    }, getBooksHandler);

    // Get book by id
    fastify.get('/books/:id', {
        schema: {
            tags: ['books'],
            summary: 'Get a book by id',
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
    }, getBookByIdHandler);

    // Search books
    fastify.get('/books/search', {
        schema: {
            tags: ['books'],
            summary: 'Search for books',
            querystring: {
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    language: { type: 'string' },
                    page: { type: 'string' }
                },
                required: ['query', 'language', 'page']
            }
        }
    }, searchBooksHandler);

    // Create book collection
    fastify.post('/book-collections', {
        schema: {
            tags: ['book-collections'],
            summary: 'Create a book collection (multipart)',
            consumes: ['multipart/form-data'],
        }
    }, createBookCollectionHandler);

    // Get book collection by id
    fastify.get('/book-collections/:id', {
        schema: {
            tags: ['book-collections'],
            summary: 'Get a book collection by id',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            }, querystring: {
                type: 'object',
                properties: {
                    language: { type: 'string' },
                    includeBooks: { type: 'boolean' }
                },
                required: ['language', 'includeBooks']
            }
        }
    }, getBookCollectionByIdHandler);

    // Get book collections
    fastify.get('/book-collections', {
        schema: {
            tags: ['book-collections'],
            summary: 'Get all book collections',
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'string' },
                    language: { type: 'string' }
                },
                required: ['page', 'language']
            }
        }
    }, getBookCollectionsHandler);

   
   
    // Edit book
    fastify.put('/books/:id', {
        schema: {
            tags: ['books'],
            summary: 'Edit a book (multipart)',
            consumes: ['multipart/form-data'],
        }
    }, EditBookHandler);
    
    // Get book by slug
    fastify.get('/books/slug/:slug', {
        schema: {
            tags: ['books'],
            summary: 'Get a book by slug',
            params: {
                type: 'object',
                properties: {
                    slug: { type: 'string' }
                },
                required: ['slug']
            },
            querystring: {
                type: 'object',
                properties: {
                    language: { type: 'string' }
                },
                required: ['language']
            }
        }
    }, getBookBySlugHandler);

    // Get books by author id
    fastify.get('/authors/:authorId/books', {
        schema: {
            tags: ['books'],
            summary: 'Get books by author id',
            params: {
                type: 'object',
                properties: {
                    authorId: { type: 'string' }
                },
                required: ['authorId']
            },
            querystring: {
                type: 'object',
                properties: {
                    language: { type: 'string' },
                    page: { type: 'string' }
                },
                required: ['language', 'page']
            }
        }
    }, getBooksByAuthorIdHandler);

    // Get books by category ids
    fastify.post('/books/by-category-ids', {
        schema: {
            tags: ['books'],
            summary: 'Get books by category ids',
            body: {
                type: 'object',
                properties: {
                    categoryIds: { type: 'array', items: { type: 'string' } },
                },
                required: ['categoryIds']
            },
            querystring: {
                type: 'object',
                properties: {
                    language: { type: 'string' },
                    page: { type: 'string' }
                },
                required: ['language', 'page']
            }
        }
    }, getBooksByCategoryIdsHandler);


    // Get books by category slug
    fastify.get('/categories/:slug/books', {
        schema: {
            tags: ['books'],
            summary: 'Get books by category slug',
            params: {
                type: 'object',
                properties: {
                    slug: { type: 'string' }
                },
                required: ['slug']
            },
            querystring: {
                type: 'object',
                properties: {
                    language: { type: 'string' },
                    page: { type: 'string' }
                },
                required: ['language', 'page']
            }
        }
    }, getBooksByCategorySlugHandler);

    // Get book collections by ids
    fastify.post('/book-collections/by-ids', {
        schema: {
            tags: ['book-collections'],
            summary: 'Get book collections by ids',
            body: {
                type: 'object',
                properties: {
                    ids: { type: 'array', items: { type: 'string' } }
                },
                required: ['ids']
            }
        }
    }, getBookCollectionsByIdsHandler);

    // Update book collection
    fastify.patch('/book-collections/:id', {
        schema: {
            tags: ['book-collections'],
            summary: 'Update a book collection (multipart)',
            consumes: ['multipart/form-data'],
        }
    }, updateBookCollectionHandler);

    // Create book summary
    fastify.post('/books/:id/summary', {
        schema: {
            tags: ['books'],
            summary: 'Create a book summary',
        }
    }, createBookSummaryHandler);
    
    // Edit book summary
    fastify.put('/books/:id/summary/:summaryId', {
        schema: {
            tags: ['books'],
            summary: 'Edit a book summary',
        }
    }, editBookSummaryHandler);
    
    // Get book summaries by id
    fastify.get('/books/:id/summaries', {
        schema: {
            tags: ['books'],
            summary: 'Get book summaries by id',
            querystring: {
                type: 'object',
                properties: {
                    language: { type: 'string' }
                },
                required: ['language']
            }
        }
    }, getBookSummariesByIdHandler);

    // Delete book summary by id
    fastify.delete('/books/:bookId/summaries/:summaryId', {
        schema: {
            tags: ['books'],
            summary: 'Delete a book summary by id',
        }
    }, deleteBookSummaryByIdHandler);

    // Delete book by id
    fastify.delete('/books/:id', {
        schema: {
            tags: ['books'],
            summary: 'Delete a book by id',
        }
    }, deleteBookByIdHandler);

    // Delete book collection by id
    fastify.delete('/book-collections/:id', {
        schema: {
            tags: ['book-collections'],
            summary: 'Delete a book collection by id',
        }
    }, deleteBookCollectionByIdHandler);

    // Get books by author ids
    fastify.post('/books/by-author-ids', {
        schema: {
            tags: ['books'],
            summary: 'Get books by author ids',
            body: {
                type: 'object',
                properties: {
                    authorIds: { type: 'array', items: { type: 'string' } },
                },
                required: ['authorIds']
            },
            querystring: {
                type: 'object',
                properties: {
                    language: { type: 'string' },
                    page: { type: 'string' }
                },
                required: ['language', 'page']
            }
        }
    }, getBooksByAuthorIdsHandler);
};

