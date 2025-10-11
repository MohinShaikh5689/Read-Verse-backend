import { PrismaClient } from "@prisma/client";
import type { Book, BookCollection, bookCollectionMetadataFields, Summary, TranslatedSummary, FreeBooks } from "../types/books.js";
const prisma = new PrismaClient();

export const createBook = async (book: Book, translatedBook: any[]): Promise<Partial<Book> | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const newBook = await prisma.book.create({
                data: {
                    title: book.title,
                    // Fix: authors should be connected as a relation, not assigned as an array of strings
                    authors: {
                        connect: book.authors.map((authorId: string) => ({
                            id: authorId,
                        })),
                    },
                    totalDuration: book.totalDuration,
                    slug: book.slug, // Ensure 'slug' exists on the Book type or generate it here
                    categories: {
                        connect: book.categories.map((category) => ({
                            id: category,
                        })),
                    },
                },
            });
            await prisma.translatedBook.createMany({
                data: translatedBook.map((item) => ({
                    title: item.title,
                    description: item.description,
                    language: item.language,
                    published: Boolean(item.published),
                    audioEnabled: Boolean(item.audioEnabled),
                    bookId: newBook.id,
                    coverUrl: item.imageUrl
                })),
            });
            return newBook;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to create book';
    }
}

export const updateBook = async (id: string, book: Partial<Book>, translatedBook: any): Promise<Partial<Book> | string> => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const updatedBook = await prisma.book.update({
                where: { id: id },
                data: {
                    title: book.title,
                    slug: book.slug,
                    totalDuration: book.totalDuration,
                    authors: {
                        set: book.authors ? book.authors.map((authorId: string) => ({ id: authorId })) : [],
                    },
                    // Handle categories as a relation update
                    categories: {
                        set: book.categories ? book.categories.map((category) => ({ id: category })) : [],
                    },
                },
            });

            // Update each translated book by language
            for (const translation of translatedBook) {
                // Check if translation exists for this language
                const existingTranslation = await prisma.translatedBook.findUnique({
                    where: {
                        bookId_language: {
                            bookId: id,
                            language: translation.language
                        }
                    }
                });

                if (existingTranslation) {
                    // Update existing translation
                    await prisma.translatedBook.update({
                        where: {
                            bookId_language: {
                                bookId: id,
                                language: translation.language
                            }
                        },
                        data: {
                            title: translation.title,
                            description: translation.description,
                            published: Boolean(translation.published),
                            audioEnabled: Boolean(translation.audioEnabled),
                            coverUrl: translation.coverUrl
                        },
                    });
                } else {
                    // Create new translation if it doesn't exist
                    await prisma.translatedBook.create({
                        data: {
                            bookId: id,
                            language: translation.language,
                            title: translation.title,
                            description: translation.description,
                            published: Boolean(translation.published),
                            audioEnabled: Boolean(translation.audioEnabled),
                            coverUrl: translation.coverUrl
                        },
                    });
                }
            }

            // Update summaries if provided

            return updatedBook;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to update book';
    }
}

export const getBooks = async (page: string, language: string) => {
    try {
        const pageNumber = parseInt(page);
        const limit = 10;
        const skip = (pageNumber - 1) * limit;
        const total = await prisma.book.count();
        let books;
        if (language !== 'all') {
            books = await prisma.translatedBook.findMany({
                skip,
                take: limit,
                where: {
                    language: language,
                },
                select: {
                    bookId: true,
                    title: true,
                    description: true,
                    published: true,
                    audioEnabled: true,
                    coverUrl: true,
                    book: {
                        select: {
                            slug: true,
                            authors: {
                                select: {
                                    id: true,
                                },
                            },
                            totalDuration: true
                        }
                    }
                }
            });
        } else {
            books = await prisma.book.findMany({
                skip,
                take: limit,
                include: {
                    translations: {
                        select: {
                            title: true,
                            description: true,
                            published: true,
                            audioEnabled: true,
                            coverUrl: true,
                            language: true,
                        }
                    }
                }
            });
        }

        return {
            books: books,
            page: pageNumber,
            limit,
            total: total,
        };
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to get books';
    }
}

export const getBookById = async (id: string, language: string) => {

    try {
        let book
        if (language != 'all') {
            console.log("language", language);

            const rawBook = await prisma.translatedBook.findFirst({
                where: {
                    bookId: id,
                    language: language,
                },
                select: {
                    bookId: true,
                    title: true,
                    description: true,
                    published: true,
                    audioEnabled: true,
                    coverUrl: true,
                    book: {
                        select: {
                            slug: true,
                            authors: {
                                select: {
                                    id: true,
                                },
                            },
                            totalDuration: true,
                            categories: {
                                select: {
                                    id: true,
                                },
                            },
                            summaries:{
                                where: { TranslatedSummary: { some: { language: language } } },
                                select: {
                                    id: true,
                                    order: true,
                                    TranslatedSummary: {
                                        where: { language: language },
                                        select: {
                                            title: true,
                                            language: true,
                                        }
                                    }
                                },
                                orderBy: {
                                    order: 'asc'
                                }
                            }
                        }
                        
                    },
                }
            });

            if (!rawBook) {
                return 'Book not found';
            }

            // Convert summaries TranslatedSummary to camelCase
            book = {
                ...rawBook,
                book: {
                    ...rawBook.book,
                    summaries: rawBook.book.summaries.map(summary => ({
                        id: summary.id,
                        order: summary.order,
                        translatedSummary: summary.TranslatedSummary
                    }))
                }
            };
        } else {
            const translatedBooks = await prisma.translatedBook.findMany({
                where: {
                    bookId: id,
                },
                select: {
                    bookId: true,
                    title: true,
                    coverUrl: true,
                    description: true,
                    published: true,
                    language: true,
                    audioEnabled: true,
                }
            });
            const bookDetails = await prisma.book.findUnique({
                where: { id: id },
                select: {
                    authors: true,
                    categories: true,
                    totalDuration: true,
                }
            });
            book = {
                translations: translatedBooks,
                book: bookDetails
            };
        }
        if (!book) {
            return 'Book not found';
        }
        return book;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to get book';
    }
}

export const searchBooks = async (query: string, language: string, page: string) => {
    try {
        const pageNumber = parseInt(page);
        const limit = 10;
        const skip = (pageNumber - 1) * limit;
        let books;
        if (language !== 'all') {
            books = await prisma.translatedBook.findMany({
                skip,
                take: limit,
                where: {
                    language: language,
                    title: {
                        contains: query,
                        mode: 'insensitive',
                    }
                }, select: {
                    title: true,
                    description: true,
                    bookId: true,
                    coverUrl: true,

                }
            });
        } else {
            books = await prisma.book.findMany({
                skip,
                take: limit,
                where: {
                    title: {
                        contains: query,
                        mode: 'insensitive',
                    }
                }, include: {
                    translations: {
                        select: {
                            title: true,
                            description: true,
                            coverUrl: true,
                            language: true,
                        }
                    }
                }
            });
        }
        return books;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to search books';
    }
}

export const createBookCollection = async (metadata: bookCollectionMetadataFields, translatedCollection: BookCollection[]) => {

    try {
        const result = await prisma.$transaction(async (prisma) => {
            const collection = await prisma.bookCollection.create({
                data: {
                    title: metadata.title,
                    imageUrl: metadata.imageUrl,
                    books: metadata.books,
                    slug: metadata.slug,
                },
            });
            await prisma.translatedBookCollection.createMany({
                data: translatedCollection.map((item) => ({
                    language: item.language,
                    title: item.title,
                    description: item.description,
                    bookCollectionId: collection.id,
                })),
            });
            return {
                collection,
                translatedCollection
            };
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;

    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create book collection';
    }
}

export const updateBookCollection = async (id: string, metadata: bookCollectionMetadataFields, translatedCollection: BookCollection[]) => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const updatedCollection = await prisma.bookCollection.update({
                where: { id: id },
                data: {
                    title: metadata.title,
                    imageUrl: metadata.imageUrl,
                    books: metadata.books,
                },
            });
            for (const translation of translatedCollection) {
                await prisma.translatedBookCollection.update({
                    where: { bookCollectionId_language: { bookCollectionId: id, language: translation.language } },
                    data: {
                        title: translation.title,
                        description: translation.description,
                    },
                });
            }
            return updatedCollection;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to update book collection';
    }
}

export const getBookCollections = async (page: string, language: string) => {
    try {
        const pageNumber = parseInt(page);
        const limit = 10;
        const skip = (pageNumber - 1) * limit;
        const total = await prisma.bookCollection.count();

        const collections = await prisma.translatedBookCollection.findMany({
            skip,
            take: limit,
            where: {
                language: language
            },
            include: {
                bookCollection: {
                    select: {
                        id: true,
                        imageUrl: true,
                        books: true
                    }
                }
            }
        });
        return {
            page: pageNumber,
            limit,
            total: total,
            collections: collections.map(col => ({
                id: col.bookCollection.id,
                title: col.title,
                description: col.description,
                imageUrl: col.bookCollection.imageUrl,
                books: col.bookCollection.books.length,
            }))
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get book collections';
    }
}

export const getBookCollectionById = async (id: string, language: string, includeBooks: boolean) => {
    console.log("id", id);
    console.log("language", language);
    try {
        let collection
        let books
        if (language !== 'all') {
            collection = await prisma.translatedBookCollection.findFirst({
                where: {
                    bookCollectionId: id,
                    language: language
                },
                select:{
                    bookCollectionId: true,
                    title: true,
                    description: true,
                    language: true,
                    bookCollection: {
                        select: {
                            imageUrl: true,
                            books: true
                        }
                    }
                }
            });
            if (!includeBooks) {
                return collection;
            }
            books = await getBooksByIds(collection?.bookCollection.books || [], language);
        } else {
            collection = await prisma.bookCollection.findUnique({
                where: { id: id },
                include: {
                    TranslatedBookCollection: true,
                }
            });
            if (!includeBooks) {
                return collection;
            }
            books = await getBooksByIds(collection?.books || [], 'en');
        }

        return {
            collection,
            books
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get book collection';
    }
}

const getBooksByIds = async (ids: string[], language: string) => {
    try {
        const books = await prisma.translatedBook.findMany({
            where: {
                bookId: {
                    in: ids,
                },
                language: language,
            },
            select:{
                bookId: true,
                title: true,
                coverUrl: true,
                language: true,
                published: true,
                book:{
                    select: {
                        authors:{
                            select: {
                                id: true,
                            }
                        }
                    }
                }
            }
        });
        return books;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get books by IDs';
    }
}


export const getBooksByAuthorId = async (authorId: string, language: string, page: string) => {
    try {
        const pageNumber = parseInt(page);
        const limit = 10;
        const skip = (pageNumber - 1) * limit;

        const total = await prisma.book.count({
            where: {
                authors: {
                    some: {
                        id: authorId,
                    },
                },
            },
        });

        const books = await prisma.book.findMany({
            where: {
                authors: {
                    some: {
                        id: authorId,
                    },
                },
            },
            include: {
                translations: {
                    where: {
                        language: language
                    },
                    select: {
                        id: true,
                        title: true,
                        coverUrl: true
                    }

                }
            },
            skip,
            take: limit,
        });
        return {
            books: books,
            page: pageNumber,
            limit,
            total: total,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get books by author ID';
    }
}

export const getBooksByCategorySlug = async (categorySlug: string, language: string, page: string) => {
    try {
        const pageNumber = parseInt(page);
        const limit = 10;
        const skip = (pageNumber - 1) * limit;
        const total = await prisma.book.count({
            where: {
                categories: {
                    some: {
                        slug: categorySlug,
                    },
                },
            },
        });
        const books = await prisma.book.findMany({
            where: {
                categories: {
                    some: {
                        slug: categorySlug,
                    },
                },
            },
            include: {
                translations: {
                    where: {
                        language: language
                    },
                    select: {
                        title: true,
                        coverUrl: true
                    }
                }
            },
            skip,
            take: limit,
        });

        return {
            books: books,
            page: pageNumber,
            limit,
            total: total,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get books by category slug';
    }
}

export const getBooksByCategoryIds = async (categoryIds: string[], language: string, page: string) => {
    console.log("entered")
    try {
        const pageNumber = parseInt(page);
        const limit = 10;
        const skip = (pageNumber - 1) * limit;

        const count = await prisma.book.count({
            where: {
                categories: {
                    some: {
                        id: {
                            in: categoryIds,
                        }
                    }
                }
            }
        })

        const books = await prisma.book.findMany({
            where: {
                categories: {
                    some: {
                        id: {
                            in: categoryIds,
                        },
                    },
                },
            },
            include: {
                translations: {
                    where: {
                        language: language
                    },
                    select: {
                        title: true,
                        coverUrl: true
                    }
                }
            },
            skip,
            take: limit,
        });


        return {
            books: books,
            page: pageNumber,
            limit,
            total: count,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get books by category IDs';
    }
}

export const getBookBySlug = async (slug: string, language: string) => {
    try {
        const book = await prisma.book.findUnique({
            where: {
                slug: slug,
            },
        });
        if (!book) {
            return 'Book not found';
        }else {
            return getBookById(book.id, language);
        }
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get book by slug';
    }
}

export const getBookCollectionsByIds = async (ids: string[], language: string) => {
    try {
        console.log("ids", ids);
        console.log("language", language);
        const rawCollections = await prisma.bookCollection.findMany({
            where: {
                id: { in: ids },
            },
            select:{
                id: true,
                title: true,
                imageUrl: true,
                slug: true,
                books: true,
                TranslatedBookCollection: {
                    where: { language: language },
                    select: {
                        title: true,
                        description: true,
                        language: true,
                    }
                }
            }
        });
        
        // Convert TranslatedBookCollection to camelCase translatedBookCollection
        const collections = rawCollections.map(collection => {
            const { TranslatedBookCollection, ...rest } = collection;
            return {
                ...rest,
                translatedBookCollection: TranslatedBookCollection
            };
        });
        
        console.log("collections", collections);
        return collections;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to get book collections by IDs';
    }
}

export const createSummary = async (summary: Summary, translatedSummary: TranslatedSummary[], id: string) => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const newSummary = await prisma.summary.create({
                data: {
                    title: summary.title,
                    order: summary.order,
                    bookId: id,
                },
            });
            await prisma.translatedSummary.createMany({
                data: translatedSummary.map((item) => ({
                    title: item.title,
                    content: item.content,
                    keyTakeaways: item.keyTakeaways,
                    language: item.language,
                    summaryId: newSummary.id,
                })),
            });
            return newSummary;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create summary';
    }
}

export const editSummary = async (id: string, summary: Summary, translatedSummary: TranslatedSummary[], summaryId: string) => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const updatedSummary = await prisma.summary.update({
                where: { id: summaryId },
                data: summary,
            });
            for (const translation of translatedSummary) {
                // Check if translation exists for this language
                const existingTranslation = await prisma.translatedSummary.findUnique({
                    where: {
                        summaryId_language: {
                            summaryId: summaryId,
                            language: translation.language
                        }
                    }
                });

                if (existingTranslation) {
                    // Update existing translation
                    await prisma.translatedSummary.update({
                        where: {
                            summaryId_language: {
                                summaryId: summaryId,
                                language: translation.language
                            }
                        },
                        data: translation,
                    });
                } else {
                    // Create new translation if it doesn't exist
                    await prisma.translatedSummary.create({
                        data: {
                            ...translation,
                            summaryId: summaryId,
                        },
                    });
                }
            }
            return updatedSummary;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to edit summary';
    }
}

export const getSummariesByBookId = async (bookId: string, language: string) => {
    try {
        let summaries
        if (language !== 'all') {
            const rawSummaries = await prisma.summary.findMany({
                where: { bookId: bookId },
                select:{
                    id: true,
                    title: true,
                    order: true,
                     TranslatedSummary: {
                        where: { language: language },
                        select:{
                            title: true,
                            content: true,
                            keyTakeaways: true,
                            language: true,
                            audioUrl: true,
                        }
                    }
                },
                orderBy: {
                    order: 'asc'
                }
            });
            
            // Convert TranslatedSummary to camelCase translatedSummary
            summaries = rawSummaries.map(summary => ({
                id: summary.id,
                title: summary.title,
                order: summary.order,
                translatedSummary: summary.TranslatedSummary
            }));
        } else {
            summaries = await prisma.summary.findMany({
                where: { bookId: bookId },
                include: {
                    TranslatedSummary: true,
                },
                orderBy: {
                    order: 'asc'
                }
            });
        }
        return summaries;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to get summaries by book ID';
    }
}

export const deleteSummaryById = async (id: string) => {
    try {
        const result = await prisma.summary.delete({
            where: { id: id },
        });
        return result;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to delete summary by ID';
    }
}

export const deleteBookById = async (id: string) => {
    try {
        const result = await prisma.book.delete({
            where: { id: id },
        });
        return result;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to delete book by ID';
    }
}

export const deleteBookCollectionById = async (id: string) => {
    try {
        const result = await prisma.bookCollection.delete({
            where: { id: id },
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to delete book collection by ID';
    }
}

export const getBooksByAuthorIds = async (authorIds: string[], language: string, page: string) => {
    try {
        const pageNumber = parseInt(page, 10) || 1;
        const limit = 10;
        const skip = (pageNumber - 1) * limit;

        const books = await prisma.book.findMany({
            where: {
                authors: {
                    some: {
                        id: {
                            in: authorIds,
                        },
                    },
                },
            },
            include: {
                translations: {
                    where: {
                        language: language
                    },
                    select: {
                        title: true,
                        coverUrl: true
                    }
                }
            },
            skip,
            take: limit,
        });
        return books;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get books by author IDs';
    }
}

export const CreateFreeBooks = async (books: FreeBooks[]) => {
    try {
        const result = await prisma.freeBooks.createMany({
            data: books.map(book => ({
                bookId: book.BookId,
                order: book.order
            })),
            skipDuplicates: true,
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create free books';
    }
}

export const deleteFreeBooksById = async (bookId: string) => {
    try {
        const result = await prisma.freeBooks.delete({
            where: { bookId: bookId },
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to delete free books by ID';
    }
}


export const getFreeBooks = async (language: string) => {
    console.log("language", language);
    try {
        const freeBooks = await prisma.freeBooks.findMany({
            include: {
                book: {
                    select:{
                        slug: true, 
                        translations: {
                            where: {
                                language: language
                            },
                            select: {
                                title: true,
                                coverUrl: true

                            }
                        },
                        authors: {
                            select: {
                                id: true,
                            }
                        },
                    }
                }
            }
        });
        return freeBooks;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get free books';
    }
}

export const getSummaryById = async (id: string, language: string) => {
    try {
        const summary = await prisma.translatedSummary.findFirst({
            where: {
                summaryId: id,
                language: language
            },
            select: {
                title: true,
                content: true,
                keyTakeaways: true,
                language: true,
                audioUrl: true,
            }
        });
        return summary;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get summary by ID';
    }
}