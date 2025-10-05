import { PrismaClient } from "@prisma/client";
import type { Category, CategoryResponse } from "../types/category.js";
const prisma = new PrismaClient();


export const createCategory = async (category: Category, translatedCategory: any[]): Promise<Partial<Category> | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const newCategory = await prisma.category.create({
                data: category,
            });
            await prisma.translatedCategory.createMany({
                data: translatedCategory.map((item) => ({
                    ...item,
                    categoryId: newCategory.id,
                })),
            });
            return newCategory;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return {
            ...result,
            midImage: result.midImage ?? undefined
        };
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to create category';
    }
}

export const updateCategory = async (id: string, category: Partial<Category>, translatedCategory: any[]): Promise<Partial<Category> | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const updatedCategory = await prisma.category.update({
                where: { id: id },
                data: category,
            });
            for (const translation of translatedCategory) {
                const existingTranslation = await prisma.translatedCategory.findFirst({
                    where: {
                        categoryId: id,
                        language: translation.language
                    }
                });
                if (existingTranslation) {
                    await prisma.translatedCategory.update({
                        where: { id: existingTranslation.id },
                        data: {
                            name: translation.name,
                            description: translation.description,
                        }
                    });
                } else {
                    await prisma.translatedCategory.create({
                        data: {
                            ...translation,
                            categoryId: id,
                        }
                    });
                }
            }
            return updatedCategory;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return {
            ...result,
            midImage: result.midImage ?? undefined
        };
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to update category';
    }
}

export const getCategories = async (page: string, language: string) => {
    try {
        const pageNumber = parseInt(page) || 1;
        const limit = 10;
        const skip = (pageNumber - 1) * limit;
        const total = await prisma.category.count();
        let categories;
        if (language !== 'all') {
            categories = await prisma.translatedCategory.findMany({
                where: {
                    language: language,
                },
                select: {
                    categoryId: true,
                    name: true,
                    description: true,
                    category: {
                        select: {
                            categorySVG: true,
                            categoryImage: true,
                            midImage: true,
                        }
                    }
                },
                skip,
                take: limit,
            });
        } else {
            categories = await prisma.category.findMany({
                include: {
                    translations: true,
                },
                skip,
                take: limit,
            });
        };
        return {
            categories,
            page: pageNumber,
            limit,
            total: total,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get categories';
    }
}

export const getCategoryById = async (id: string, language: string) => {
    try {
        let category;
        if (language !== 'all') {
            category = await prisma.translatedCategory.findFirst({
                where: {
                    language: language,
                    categoryId: id,
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            categorySVG: true,
                            categoryImage: true,
                            midImage: true,
                        }
                    }
                }
            });
        } else {
            category = await prisma.category.findUnique({
                where: { id },
                include: {
                    translations: true,
                }
            });
        }
        return category;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get category';
    }
}

export const searchCategories = async (query: string, language: string) => {
    try {
        const categories = await prisma.translatedCategory.findMany({
            where: {
                language: language,
                name: {
                    contains: query,
                    mode: 'insensitive',
                }
            },
            include: {
                category: {
                    select: {
                        id: true,
                        categorySVG: true,
                        categoryImage: true,
                        midImage: true,
                    }
                }
            }
        });
        return categories;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to search categories';
    }
};

export const getCategoriesByIds = async (ids: string[]) => {
    try {
        const categories = await prisma.category.findMany({
            where: {
                id: { in: ids },
            },
        });
        return categories;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get categories by ids';
    }
}

export const deleteCategoryById = async (id: string) => {
    try {
        await prisma.category.delete({
            where: { id }
        })
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to delete category';
    }

}