import { PrismaClient } from "@prisma/client";
import type { User, UserResponse, UserPreferences, UserProgress, BookMark } from "../types/user.js";

const prisma = new PrismaClient();

export const createUser = async (user: User, id: string): Promise<Partial<User> | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const newUser = await prisma.user.create({
                data: {
                    ...user,
                    id
                },
            });
            return newUser;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create user';
    }
};

export const getMe = async (userId: string): Promise<any | string> => {
    console.log("Entered getMe");
    console.log("userId", userId);
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userPreferences: true,
                userProgress: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    }
                },
                BookMark: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return 'User not found';
        }
        // Convert userPreferences array to single object since it's a one-to-one relation
        const { BookMark, userPreferences, ...rest } = user;
        return {
            ...rest,
            userPreferences: userPreferences[0] || null,
            bookMarks: BookMark,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get me';
    }
}

export const updateUser = async (id: string, user: Partial<User>): Promise<Partial<User> | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const updatedUser = await prisma.user.update({
                where: { id: id },
                data: user,
            });
            return updatedUser;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to update user';
    }
};

export const getUserById = async (id: string): Promise<any | string> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: id },
            include: {
                userPreferences: true,
                userProgress: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    }
                },
                BookMark: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return 'User not found';
        }
        // Convert userPreferences array to single object since it's a one-to-one relation
        const { BookMark, userPreferences, ...rest } = user;
        return {
            ...rest,
            userPreferences: userPreferences[0] || null,
            bookmarks: BookMark,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get user';
    }
};

export const getUserByEmail = async (email: string): Promise<any | string> => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: email },
            include: {
                userPreferences: true,
                userProgress: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    }
                },
                BookMark: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return 'User not found';
        }
        // Convert userPreferences array to single object since it's a one-to-one relation
        const { BookMark, userPreferences, ...rest } = user;
        return {
            ...rest,
            userPreferences: userPreferences[0] || null,
            bookmarks: BookMark,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get user by email';
    }
};

export const getUsers = async (page: string): Promise<{ users: any[], page: number, limit: number, total: number } | string> => {
    try {
        const pageNumber = parseInt(page) || 1;
        const limit = 10;
        const skip = (pageNumber - 1) * limit;
        const total = await prisma.user.count();

        const users = await prisma.user.findMany({
            skip,
            take: limit,
            include: {
                userPreferences: true,
                userProgress: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    }
                },
                BookMark: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Convert userPreferences array to single object for each user
        const usersWithPreferences = users.map((user: any) => {
            const { BookMark, userPreferences, ...rest } = user;
            return {
                ...rest,
                userPreferences: userPreferences[0] || null,
                bookmarks: BookMark,
            };
        });

        return {
            users: usersWithPreferences,
            page: pageNumber,
            limit,
            total: total,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get users';
    }
};

export const deleteUser = async (id: string): Promise<string> => {
    try {
        await prisma.$transaction(async (prisma) => {
            // Delete related data first due to foreign key constraints
            await prisma.bookMark.deleteMany({
                where: { userId: id }
            });
            await prisma.userProgress.deleteMany({
                where: { userId: id }
            });
            await prisma.userPreferences.deleteMany({
                where: { userId: id }
            });
            await prisma.user.delete({
                where: { id: id }
            });
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return 'User deleted successfully';
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to delete user';
    }
};

// User Preferences methods
export const createUserPreferences = async (preferences: Omit<UserPreferences, 'id'>, userId: string): Promise<UserPreferences | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            // Check if preferences already exist for this user
            const existingPreferences = await prisma.userPreferences.findUnique({
                where: { userId: userId },
            });

            if (existingPreferences) {
                // Update existing preferences
                const updatedPreferences = await prisma.userPreferences.update({
                    where: { userId: userId },
                    data: preferences,
                });
                return updatedPreferences;
            } else {
                // Create new preferences
                const newPreferences = await prisma.userPreferences.create({
                    data: { ...preferences, userId: userId },
                });
                return newPreferences;
            }
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create or update user preferences';
    }
};

export const updateUserPreferences = async (id: string, preferences: Partial<UserPreferences>): Promise<UserPreferences | string> => {
    try {
        console.log("Entered updateUserPreferences");
        console.log("preferences", preferences);
        console.log("id", id);
        const result = await prisma.$transaction(async (prisma) => {
            const updatedPreferences = await prisma.userPreferences.update({
                where: { userId: id },
                data: preferences,
            });
            return updatedPreferences;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to update user preferences';
    }
};

// User Progress methods
export const createUserProgress = async (progress: any, userId: string): Promise<any | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            let Progress;
            if (progress.type === 'book') {
                const checkExisting = await prisma.userProgress.findFirst({
                where: {
                    userId: userId,
                    bookId: progress.bookId
                }
            });
            if (checkExisting) {
                Progress = await prisma.userProgress.update({
                    where: {
                        bookId_userId: {
                            bookId: progress.bookId,
                            userId: userId
                        }
                    },
                    data: {
                        bookId: progress.bookId,
                        lastChapter: progress.lastChapter,
                        completed: progress.completed,
                        userId: userId
                    },
                });
                return Progress;
            } else {
                Progress = await prisma.userProgress.create({
                    data: { 
                        bookId: progress.bookId,
                        lastChapter: progress.lastChapter,
                        completed: progress.completed,
                        userId: userId
                    },
                });
                return Progress;
            }
            }else {
                const checkExisting = await prisma.podcastProgress.findFirst({
                    where: {
                        userId: userId,
                        podcastId: progress.podcastId,
                    }
                });
                if (checkExisting) {
                    Progress = await prisma.podcastProgress.update({
                        where: {
                            podcastId_userId: {
                                podcastId: progress.podcastId,
                                userId: userId
                            }
                        },
                        data: { 
                            podcastId: progress.podcastId,
                            lastMinute: progress.lastMinute,
                            completed: progress.completed,
                            userId: userId
                         },
                    });
                    return Progress;
                } else {
                    Progress = await prisma.podcastProgress.create({
                        data: { 
                            podcastId: progress.podcastId,
                            lastMinute: progress.lastMinute,
                            completed: progress.completed,
                            userId: userId
                         },
                    });
                    return Progress;
                }
            }
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create user progress';
    }
};

export const updateUserProgress = async (bookId: string, userId: string, progress: Partial<UserProgress>): Promise<any | string> => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const updatedProgress = await tx.userProgress.update({
                where: {
                    bookId_userId: {
                        bookId: bookId,
                        userId: userId
                    }
                },
                data: progress,
            });
            return updatedProgress;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to update user progress';
    }
};

export const getIncompleteUserProgress = async (userId: string, page: string, language: string) => {
    try {
        const pageNumber = parseInt(page) || 1;
        const limit = 10;
        const skip = (pageNumber - 1) * limit;

        const result = await prisma.userProgress.findMany({
            skip,
            take: limit,
            where: {
                userId: userId,
                completed: false
            },
            select:{
                completed:true,
                lastChapter:true,
                book: {
                    select:{
                        translations:{
                            where:{
                                language: language
                            },
                            select:{
                               title:true,
                                bookId:true,
                               coverUrl:true
                            }

                        }
                    }
                }
            }
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get incomplete user progress';
    }
};

export const getCompletedUserProgress = async (userId: string, page: string, language: string) => {
    try {
        const pageNumber = parseInt(page) || 1;
        const limit = 10;
        const skip = (pageNumber - 1) * limit;

        const result = await prisma.userProgress.findMany({
            skip,
            take: limit,
            where: {
                userId: userId,
                completed: true
            },
            select:{
                completed:true,
                lastChapter:true,
                book: {
                    select:{
                        translations:{
                            where:{
                                language: language
                            },
                            select:{
                                bookId:true,
                                title:true,
                                coverUrl:true
                            }

                        }
                    }
                }
            }
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get completed user progress';
    }
};

// Bookmark methods
export const createBookmark = async (bookmark: Omit<BookMark, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<any | string> => {
    try {
        console.log("Entered createBookmark");
        console.log("bookmark", bookmark);
        console.log("userId", userId);
        const result = await prisma.$transaction(async (prisma) => {
            const newBookmark = await prisma.bookMark.create({
                data: { ...bookmark, userId: userId },
            });
            return newBookmark;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create bookmark';
    }
};

export const deleteBookmark = async (id: string, userId: string): Promise<string> => {
    try {
        await prisma.$transaction(async (tx) => {
            await tx.bookMark.deleteMany({
                where: { bookId: id, userId: userId }
            });
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return 'Bookmark deleted successfully';
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to delete bookmark';
    }
};

export const getUserBookmarks = async (userId: string, page: string, language: string) => {
    try {
        const pageNumber = parseInt(page) || 1;
        const limit = 10;
        const skip = (pageNumber - 1) * limit;

        const total = await prisma.bookMark.count({
            where: { userId: userId }
        });

        const bookmarks = await prisma.bookMark.findMany({
            where: { userId: userId },
            skip,
            take: limit,
            select: {
                book: {
                    select:{
                        translations:{
                            where:{
                                language: language
                            },
                            select:{
                                bookId:true,
                                title:true,
                                coverUrl:true
                            }

                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return {
            bookmarks: bookmarks,
            page: pageNumber,
            limit,
            total: total,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get user bookmarks';
    }
};

// Token Generation for Development/Testing
export const generateTestToken = async (email: string): Promise<{ customToken: string; uid: string; email: string } | string> => {
    try {
        // Lazy import to avoid blocking server startup
        const { auth } = await import("../utils/firebase-admin.js");
        
        // Get Firebase Auth user by email
        const firebaseUser = await auth.getUserByEmail(email);
        
        if (!firebaseUser) {
            return 'User not found with this email';
        }

        // Create a custom token (development only)
        const customToken = await auth.createCustomToken(firebaseUser.uid);

        return {
            customToken,
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
        };
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return 'User not found with this email. Please create the user in Firebase Auth first.';
        }
        console.error('Error generating token:', error);
        return 'Failed to generate token';
    }
};

export const isBookmarked = async (userId: string, bookId: string): Promise<boolean | string> => {
    try {
        console.log("Entered isBookmarked");
        console.log("userId", userId);
        console.log("bookId", bookId);
        const bookmark = await prisma.bookMark.findFirst({
            where: { userId: userId, bookId: bookId }
        });
        return bookmark ? true : false;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to check bookmark status';
    }
}