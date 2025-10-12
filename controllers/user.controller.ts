import type { FastifyRequest, FastifyReply } from "fastify";
import { asyncHandle, successHandle, errorHandle } from "../utils/handler.js";
import type { User } from '../types/user.js';
import {
    createUser,
    updateUser,
    getUserById,
    getUserByEmail,
    getUsers,
    deleteUser,
    createUserPreferences,
    updateUserPreferences,
    createUserProgress,
    updateUserProgress,
    createBookmark,
    deleteBookmark,
    getUserBookmarks,
    getMe,
    generateTestToken,
    isBookmarked,
    getIncompleteUserProgress,
    getCompletedUserProgress,
    getIncompletePodcastProgress
} from '../services/user.service.js';

export const createUserHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const userData = request.body as User;
    const userId = (request as any).user.uid;
    const user = await createUser(userData, userId);
    if (typeof user === 'string') {
        return errorHandle(user, reply, 500);
    }
    return successHandle(user, reply, 201);
});

export const getMeHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user.uid;
    const user = await getMe(userId);
    if (typeof user === 'string') {
        return errorHandle(user, reply, 404);
    }
    return successHandle(user, reply, 200);
});

export const updateUserHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user.uid;
    const userData = request.body as Partial<User>;
    const user = await updateUser(userId, userData);
    if (typeof user === 'string') {
        return errorHandle(user, reply, 500);
    }
    return successHandle(user, reply, 200);
});

export const getUserByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = await getUserById(id);
    if (typeof user === 'string') {
        return errorHandle(user, reply, 404);
    }
    return successHandle(user, reply, 200);
});

export const getUserByEmailHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.params as { email: string };
    const user = await getUserByEmail(email);
    if (typeof user === 'string') {
        return errorHandle(user, reply, 404);
    }
    return successHandle(user, reply, 200);
});

export const getUsersHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { page } = request.query as { page: string };
    const users = await getUsers(page);
    if (typeof users === 'string') {
        return errorHandle(users, reply, 500);
    }
    return successHandle(users, reply, 200);
});

export const deleteUserHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const id = (request as any).user.uid;
    const result = await deleteUser(id);
    if (result !== 'User deleted successfully') {
        return errorHandle(result, reply, 500);
    }
    return successHandle({ message: result }, reply, 200);
});

// User Preferences handlers
export const createUserPreferencesHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const preferencesData = request.body as any;
    const userId = (request as any).user.uid;
    const preferences = await createUserPreferences(preferencesData, userId);
    if (typeof preferences === 'string') {
        return errorHandle(preferences, reply, 500);
    }
    return successHandle(preferences, reply, 201);
});

export const updateUserPreferencesHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user.uid;
    const preferencesData = request.body as any;
    const preferences = await updateUserPreferences(userId, preferencesData);
    if (typeof preferences === 'string') {
        return errorHandle(preferences, reply, 500);
    }
    return successHandle(preferences, reply, 200);
});

// User Progress handlers
export const createUserProgressHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const progressData = request.body as any;
    const userId = (request as any).user.uid;
    console.log("progressData", progressData);
    console.log("userId", userId);
    const progress = await createUserProgress(progressData, userId);
    if (typeof progress === 'string') {
        return errorHandle(progress, reply, 500);
    }
    return successHandle(progress, reply, 201);
});

export const updateUserProgressHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { bookId } = request.params as { bookId: string };
    const userId = (request as any).user.uid;
    const progressData = request.body as any;
    const progress = await updateUserProgress(bookId, userId, progressData);
    if (typeof progress === 'string') {
        return errorHandle(progress, reply, 500);
    }
    return successHandle(progress, reply, 200);
});

// Bookmark handlers
export const createBookmarkHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { bookId } = request.body as { bookId: string };
    const userId = (request as any).user.uid;
    console.log("userId", userId);
    console.log("bookId", bookId);
    const bookmarkData = { bookId, userId };
    const bookmark = await createBookmark(bookmarkData, userId);
    if (typeof bookmark === 'string') {
        return errorHandle(bookmark, reply, 500);
    }
    return successHandle(bookmark, reply, 201);
});

export const deleteBookmarkHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { bookId } = request.body as { bookId: string };
    const userId = (request as any).user.uid;
    console.log("userId", userId);
    console.log("bookId", bookId);
    const result = await deleteBookmark(bookId, userId);
    if (result !== 'Bookmark deleted successfully') {
        return errorHandle(result, reply, 500);
    }
    return successHandle({ message: result }, reply, 200);
});

export const getUserBookmarksHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user.uid;
    const { page, language } = request.query as { page: string, language: string };
    const bookmarks = await getUserBookmarks(userId, page, language);
    if (typeof bookmarks === 'string') {
        return errorHandle(bookmarks, reply, 500);
    }
    return successHandle(bookmarks, reply, 200);
});

// Token Generation for Testing (Development Only)
export const generateTestTokenHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.body as { email: string };
    
    if (!email) {
        return errorHandle('Email is required', reply, 400);
    }

    const result = await generateTestToken(email);
    
    if (typeof result === 'string') {
        return errorHandle(result, reply, 404);
    }

    return successHandle({
        message: '🎫 Token generated successfully for development testing',
        token: result.customToken,
        uid: result.uid,
        email: result.email,
        instructions: {
            swagger: 'Use this token in Swagger UI by clicking "Authorize" button and pasting it in the "Value" field',
            curl: `curl -X GET http://localhost:3000/api/auth/profile -H "Authorization: Bearer ${result.customToken}"`,
            note: '⚠️ This is for DEVELOPMENT testing only. In production, apps get ID tokens after user login.'
        }
    }, reply, 200);
});

export const isBookmarkedHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const { bookId } = request.params as { bookId: string };
    const userId = (request as any).user.uid;

    console.log("userId", userId);
    console.log("bookId", bookId);
    const bookmarked = await isBookmarked(userId, bookId);
    if (typeof bookmarked === 'string') {
        return errorHandle(bookmarked, reply, 500);
    }
    return successHandle(bookmarked, reply, 200);
});
export const getIncompleteUserProgressHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user.uid;
    const { page, language } = request.query as { page: string, language: string };
    const progress = await getIncompleteUserProgress(userId, page, language);
    if (typeof progress === 'string') {
        return errorHandle(progress, reply, 500);
    }
    return successHandle(progress, reply, 200);
});

export const getCompletedUserProgressHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user.uid;
    const { page, language } = request.query as { page: string, language: string };
    const progress = await getCompletedUserProgress(userId, page, language);
    if (typeof progress === 'string') {
        return errorHandle(progress, reply, 500);
    }
    return successHandle(progress, reply, 200);
});

export const getIncompletePodcastProgressHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user.uid;
    const { page, language } = request.query as { page: string, language: string };
    const progress = await getIncompletePodcastProgress(userId, page, language);
    if (typeof progress === 'string') {
        return errorHandle(progress, reply, 500);
    }
    return successHandle(progress, reply, 200);
});
