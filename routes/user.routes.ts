import type { FastifyInstance } from "fastify";
import { authGuard } from "../utils/authGuard.js";
import {
    createUserHandler,
    updateUserHandler,
    getUserByIdHandler,
    getUserByEmailHandler,
    getUsersHandler,
    deleteUserHandler,
    createUserPreferencesHandler,
    updateUserPreferencesHandler,
    createUserProgressHandler,
    updateUserProgressHandler,
    createBookmarkHandler,
    deleteBookmarkHandler,
    getUserBookmarksHandler,
    getMeHandler,
    generateTestTokenHandler
} from "../controllers/user.controller.js";

export const UserRoutes = async (fastify: FastifyInstance): Promise<void> => {
    // Create user
    fastify.post('/users', {
        preHandler: authGuard,
        schema: {
            tags: ['users'],
            summary: 'Create a new user',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    gender: { type: 'string' },
                    profilePicture: { type: 'string' },
                    dob: { type: 'string' }
                },
                required: ['id', 'name', 'email', 'gender', 'profilePicture', 'dob']
            }
        }
    }, createUserHandler);

    // Get me

    fastify.get('/users/me', {
        preHandler: authGuard,
        schema: {
            tags: ['users'],
            summary: 'Get current user profile with related data',
            security: [{ bearerAuth: [] }],
        }
    }, getMeHandler);

    // Update user
    fastify.patch('/users', {
        preHandler: authGuard,
        schema: {
            tags: ['users'],
            summary: 'Update a user',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    gender: { type: 'string' },
                    profilePicture: { type: 'string' },
                    dob: { type: 'string' }
                }
            },
        }
    }, updateUserHandler);

    // Get user by ID
    fastify.get('/users/:id', {
        preHandler: authGuard,
        schema: {
            tags: ['users'],
            summary: 'Get user by ID',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            }
        }
    }, getUserByIdHandler);

    // Get user by email
    fastify.get('/users/email/:email', {
        preHandler: authGuard,
        schema: {
            tags: ['users'],
            summary: 'Get user by email',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' }
                },
                required: ['email']
            }
        }
    }, getUserByEmailHandler);

    // Get users (paginated)
    fastify.get('/users', {
        schema: {
            tags: ['users'],
            summary: 'Get paginated list of users',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'string', default: '1' }
                }
            }
        }
    }, getUsersHandler);

    // Delete user
    fastify.delete('/users/:id', {
        preHandler: authGuard,
        schema: {
            tags: ['users'],
            summary: 'Delete a user',
            security: [{ bearerAuth: [] }],
        }
    }, deleteUserHandler);

    // User Preferences routes
    fastify.post('/users/preferences', {
        preHandler: authGuard,
        schema: {
            tags: ['user-preferences'],
            summary: 'Create user preferences',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                properties: {
                    allowRemainders: { type: 'boolean' },
                    appLangauge: { type: 'string' },
                    authorPreferences: { type: 'array', items: { type: 'string' } },
                    categoryPreferences: { type: 'array', items: { type: 'string' } },
                    bookPreferences: { type: 'array', items: { type: 'string' } }
                },
            }
        }
    }, createUserPreferencesHandler);

    fastify.patch('/users/preferences', {
        preHandler: authGuard,
        schema: {
            tags: ['user-preferences'],
            summary: 'Update user preferences',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                properties: {
                    allowRemainders: { type: 'boolean' },
                    appLangauge: { type: 'string' },
                    authorPreferences: { type: 'array', items: { type: 'string' } },
                    categoryPreferences: { type: 'array', items: { type: 'string' } },
                    bookPreferences: { type: 'array', items: { type: 'string' } }
                }
            }
        }
    }, updateUserPreferencesHandler);

    // User Progress routes
    fastify.post('/users/progress', {
        preHandler: authGuard,
        schema: {
            tags: ['user-progress'],
            summary: 'Create user progress',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                properties: {
                    bookId: { type: 'string' },
                    completed: { type: 'boolean' },
                    lastChapter: { type: 'number' },
                },
                required: ['bookId']
            }
        }
    }, createUserProgressHandler);

    fastify.patch('/users/progress/:bookId', {
        preHandler: authGuard,
        schema: {
            tags: ['user-progress'],
            summary: 'Update user progress',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    bookId: { type: 'string' },
                },
                required: ['bookId']
            },
            body: {
                type: 'object',
                properties: {
                    completed: { type: 'boolean' },
                    lastChapter: { type: 'number' },
                }
            }
        }
    }, updateUserProgressHandler);

    // Bookmark routes
    fastify.post('/users/bookmarks/:id', {
        preHandler: authGuard,
        schema: {
            tags: ['bookmarks'],
            summary: 'Create a bookmark',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    bookId: { type: 'string' }
                },
                required: ['bookId']
            }
        }
    }, createBookmarkHandler);

    fastify.delete('/users/bookmarks/:id', {
        preHandler: authGuard,
        schema: {
            tags: ['bookmarks'],
            summary: 'Delete a bookmark',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            }
        }
    }, deleteBookmarkHandler);

    fastify.get('/users/bookmarks', {
        preHandler: authGuard,
        schema: {
            tags: ['bookmarks'],
            summary: 'Get user bookmarks',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'string', default: '1' }
                }
            }
        }
    }, getUserBookmarksHandler);

    // Generate test token (Development only)
    fastify.post('/users/token', {
        schema: {
            tags: ['users'],
            summary: 'Generate a test token for a user (Development only)',
            body: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' }
                },
                required: ['email']
            }
        }
    }, generateTestTokenHandler);

};

