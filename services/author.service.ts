import { PrismaClient } from "@prisma/client";
import type { Author, TranslatedAuthor, AuthorResponse } from "../types/author.js"
const prisma = new PrismaClient();

export const createAuthor = async (author: Author, translatedAuthor: TranslatedAuthor[]): Promise<Partial<Author> | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const newAuthor = await prisma.author.create({
                data: author,
            });
            if (newAuthor.id) {
                await prisma.translatedAuthor.createMany({
                    data: translatedAuthor.map(item => ({
                        ...item,
                        authorId: newAuthor.id,
                    })),
                });
            }
            return newAuthor;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create author';
    }
};

export const updateAuthor = async (id: string, author: Author, translatedAuthor: TranslatedAuthor[]): Promise<Partial<Author> | string> => {
    try {
        console.log("Entered updateAuthor");
        console.log("translatedAuthor", translatedAuthor);
        const result = await prisma.$transaction(async (prisma) => {
            const updatedAuthor = await prisma.author.update({
                where: { id: id },
                data: {
                    name: author.name,
                    imageUrl: author.imageUrl,
                },
            });

            // Update each translatedAuthor individually to avoid type errors with updateMany
            for (const item of translatedAuthor) {
                console.log("item", item);
                 const existingTranslation = await prisma.translatedAuthor.findFirst({
                    where: {
                        authorId: id,
                        language: item.language
                    }
                });
                if (existingTranslation) {
                    await prisma.translatedAuthor.update({
                        where: { id: existingTranslation.id },
                        data: {
                            name: item.name,
                            description: item.description,
                        }
                    });
                }else{
                    await prisma.translatedAuthor.create({
                        data: {
                            ...item,
                            authorId: id,
                        }
                    });
                }
            }
            return updatedAuthor;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to update author';
    }
}

export const getAuthors = async (page: string, language: string): Promise<{ authors: AuthorResponse[], page: number, limit: number, total: number } | string> => {
    try {
        const pageNumber = parseInt(page) || 1;
        const limit = 10;
        const skip = (pageNumber - 1) * limit;
        const total = await prisma.author.count();
        let authors;
        if (language !== 'all') {
            authors = await prisma.translatedAuthor.findMany({
            where: {
                language: language,
            },
            select: {
                authorId: true,
                name: true,
                description: true,
                author: {
                    select: {
                        imageUrl: true,
                    }
                }
            },
            skip,
            take: limit,
        });
        } else {
            authors = await prisma.author.findMany({
                select: {
                    id: true,
                    imageUrl: true,
                    translations: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            language: true,
                        }
                    }
                },
                skip,
                take: limit,
            });
        }

        return {
            authors: authors as AuthorResponse[],
            page: pageNumber,
            limit,
            total: total,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get authors';
    }
};

export const getAuthorById = async (id: string, language: string) => {
    try {
        let author;
        if (language !== 'all') {
            author = await prisma.translatedAuthor.findFirst({
                where: {
                    language: language,
                    authorId: id,
                }, select: {
                    name: true,
                    description: true,
                    authorId: true,
                    author: {
                        select: {
                            imageUrl: true,
                        }
                    }
                }
            });
        } else {
            author = await prisma.translatedAuthor.findMany({
                where: { authorId: id },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    authorId: true,
                    language: true,
                    author: {
                        select: {
                            imageUrl: true,
                        }
                    }
                }
            });
        }
        return author;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get author';
    }
}

export const searchAuthors = async (query: string, language: string) => {
    try {
        let authors;
        if (language !== 'all') {
            authors = await prisma.translatedAuthor.findMany({
            where: {
                language: language,
                name: {
                    contains: query,
                    mode: 'insensitive',
                }
            },
            select: {
                authorId: true,
                name: true,
                description: true,
                author: {
                    select: {
                        imageUrl: true,
                    }
                }
            }
        });
    }else {
        authors = await prisma.author.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive',
                }
            },
            include:{
                translations: true
            }
        })
    }
        return authors;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to search authors';
    }
};


export const deleteAuthorById = async (id: string) => {
    try {
        await prisma.author.delete({
            where: { id },
        });
        return { message: 'Author deleted successfully' };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to delete author';
    }
}

export const getAuthorsByIds = async (ids: string[], language: string) => {
    console.log("ids", ids);
    console.log("language", language);
    try {
        const authors = await prisma.translatedAuthor.findMany({
            where: {
                authorId: {
                    in: ids,
                },
                language: language,
            },
            select: {
                authorId: true,
                name: true,
                description: true,
                language: true,
                author: {
                    select: {
                        imageUrl: true,
                    }
                }
            }
        });
        return authors;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get authors by ids';
    }

}