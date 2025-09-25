import { PrismaClient } from "@prisma/client";
import type { Category, CategoryResponse } from "../types/category.js";
const prisma = new PrismaClient();


export const createCategory = async (category: Category, translatedCategory:any[]): Promise<Partial<Category> | string> => {
    try{
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
        return result;
    }
    catch(error: unknown){
        console.error(error);
        return 'Failed to create category';
    }
}

export const updateCategory = async (id: string, category: Partial<Category>, translatedCategory: any[]): Promise<Partial<Category> | string> => {
    try{
        const result = await prisma.$transaction(async (prisma) => {
            const updatedCategory = await prisma.category.update({
                where: { id: id },
                data: category,
            });
            for (const translation of translatedCategory) {
                await prisma.translatedCategory.update({
                    where: { categoryId_language: { categoryId: id, language: translation.language } },
                    data: {
                        name: translation.name,
                        description: translation.description,
                    },
                });
            }
            return updatedCategory;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    }
    catch(error: unknown){
        console.error(error);
        return 'Failed to update category';
    }
}

export const getCategories = async (page: string, language: string): Promise<{categories: CategoryResponse[], page: number, limit: number, total: number} | string> => {
    try{
        const pageNumber = parseInt(page) || 1;
        const limit = 10;
        const skip = (pageNumber - 1) * limit;
        const total = await prisma.category.count();
        const categories = await prisma.translatedCategory.findMany({
            where:{
                language: language,
            },
            select:{
                categoryId: true,
                name: true,
                description: true,
                category: {
                    select:{
                        categorySVG: true,
                        categoryImage: true,
                    }
                }
            },
            skip,
            take: limit,
        });
        return {
            categories: categories as CategoryResponse[],
            page: pageNumber,
            limit,  
            total: total,
        };
    }catch(error: unknown){
        console.error(error);
        return 'Failed to get categories';
    }
}

export const getCategoryById = async (id: string, language: string) => {
    try{
        const category = await prisma.translatedCategory.findFirst({
            where:{
                language: language,
                categoryId: id,
            },
            include:{
                category: {
                    select: {
                        id: true,
                        categorySVG: true,
                        categoryImage: true,
                    }
                }
            }
        });
        return category;
    }catch(error: unknown){
        console.error(error);
        return 'Failed to get category';
    }
}   

export const searchCategories = async (query: string, language: string) => {
    try{
        const categories = await prisma.translatedCategory.findMany({
            where:{
                language: language,
                name: {
                    contains: query,
                    mode: 'insensitive',
                }
            },  
            include:{
                category: {
                    select: {
                        id: true,
                        categorySVG: true,
                        categoryImage: true,
                    }
                }
            }
        });
        return categories;
    }catch(error: unknown){
        console.error(error);
        return 'Failed to search categories';
    }
};

export const getCategoriesByIds = async (ids: string[]) => {
    try{
        const categories = await prisma.category.findMany({
            where: {
                id: { in: ids },
            },
        });
        return categories;
    }catch(error: unknown){
        console.error(error);
        return 'Failed to get categories by ids';
    }
}