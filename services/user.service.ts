import { PrismaClient } from "@prisma/client";
import type { User, UserResponse, UserPreferences, UserProgress, BookMark } from "../types/user.js";

const prisma = new PrismaClient();

export const createUser = async (user: User): Promise<Partial<User> | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const newUser = await prisma.user.create({
                data: user,
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
        return user;
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
        return user;
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
        return user;
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

        return {
            users: users,
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
            const newPreferences = await prisma.userPreferences.create({
                data: { ...preferences, userId: userId },
            });
            return newPreferences;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create user preferences';
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
export const createUserProgress = async (progress: Omit<UserProgress, 'createdAt' | 'updatedAt'>, userId: string): Promise<any | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const newProgress = await prisma.userProgress.create({
                data: { ...progress, userId: userId },
            });
            return newProgress;
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
        const result = await prisma.$transaction(async (prisma) => {
            const updatedProgress = await prisma.userProgress.update({
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

// Bookmark methods
export const createBookmark = async (bookmark: Omit<BookMark, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<any | string> => {
    try {
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

export const deleteBookmark = async (id: string): Promise<string> => {
    try {
        await prisma.$transaction(async (prisma) => {
            await prisma.bookMark.delete({
                where: { id: id }
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

export const getUserBookmarks = async (userId: string, page: string): Promise<{ bookmarks: any[], page: number, limit: number, total: number } | string> => {
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
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
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
