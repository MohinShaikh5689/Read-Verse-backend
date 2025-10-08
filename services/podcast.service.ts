import { PrismaClient } from "@prisma/client";
import type { Podcast, PodcastChannel, TranslatedPodcast, TranslatedPodcastChannel } from "../types/podcast.js";

const prisma = new PrismaClient();

export const createPodcastChannel = async (podcastChannel: PodcastChannel, translatedPodcast: TranslatedPodcastChannel[]) => {
    try {
        console.log("podcastChannel", podcastChannel);
        console.log("translatedPodcast", translatedPodcast);
        const result = await prisma.$transaction(async (prisma) => {
            const newPodcastChannel = await prisma.podcastCollection.create({
                data: podcastChannel,
            });
            await prisma.translatedPodcastCollection.createMany({
                data: translatedPodcast.map((item) => ({
                    ...item,
                    podcastCollectionId: newPodcastChannel.id,
                })),
            });
            return newPodcastChannel;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create podcast channel';
    }
}

export const updatePodcastChannel = async (id: string, podcastChannel: PodcastChannel, translatedPodcast: TranslatedPodcastChannel[]) => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const updatedPodcastChannel = await prisma.podcastCollection.update({
                where: { id: id },
                data: podcastChannel,
            });

            for (const translation of translatedPodcast) {
                // Check if translation exists for this language
                const existingTranslation = await prisma.translatedPodcastCollection.findUnique({
                    where: {
                        podcastCollectionId_language: {
                            podcastCollectionId: id,
                            language: translation.language
                        }
                    }
                });

                if (existingTranslation) {
                    // Update existing translation
                    await prisma.translatedPodcastCollection.update({
                        where: {
                            podcastCollectionId_language: {
                                podcastCollectionId: id,
                                language: translation.language
                            }
                        },
                        data: {
                            name: translation.name,
                            description: translation.description,
                        },
                    });
                } else {
                    // Create new translation if it doesn't exist
                    await prisma.translatedPodcastCollection.create({
                        data: {
                            ...translation,
                            podcastCollectionId: id,
                        },
                    });
                }
            }
            return updatedPodcastChannel;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to update podcast channel';
    }
}

export const createPodcast = async (podcast: Podcast, translatedPodcast: TranslatedPodcast[]) => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const newPodcast = await prisma.podcast.create({
                data: {
                    ...podcast,
                    categories: {
                        connect: podcast.categories.map((categoryId) => ({ id: categoryId })),
                    },
                    speakers: {
                        connect: podcast.speakers.map((authorId) => ({ id: authorId })),
                    },
                    guests: {
                        connect: podcast.guests.map((guestId) => ({ id: guestId })),
                    },
                },
            });
            await prisma.translatedPodcast.createMany({
                data: translatedPodcast.map((item) => ({
                    ...item,
                    podcastId: newPodcast.id,
                })),
            });
            return newPodcast;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to create podcast';
    }
}

export const updatePodcast = async (id: string, podcast: Podcast, translatedPodcast: TranslatedPodcast[]) => {
    try {
        const result = await prisma.$transaction(async (prisma) => {
            const updatedPodcast = await prisma.podcast.update({
                where: { id: id },
                data: {
                    ...podcast,
                    categories: {
                        connect: podcast.categories.map((categoryId) => ({ id: categoryId })),
                    },
                    speakers: {
                        connect: podcast.speakers.map((authorId) => ({ id: authorId })),
                    },
                    guests: {
                        connect: podcast.guests.map((guestId) => ({ id: guestId })),
                    },
                },
            });

            for (const translation of translatedPodcast) {
                // Check if translation exists for this language
                const existingTranslation = await prisma.translatedPodcast.findUnique({
                    where: {
                        podcastId_language: {
                            podcastId: id,
                            language: translation.language
                        }
                    }
                });

                if (existingTranslation) {
                    // Update existing translation
                    await prisma.translatedPodcast.update({
                        where: {
                            podcastId_language: {
                                podcastId: id,
                                language: translation.language
                            }
                        },
                        data: translation,
                    });
                } else {
                    // Create new translation if it doesn't exist
                    await prisma.translatedPodcast.create({
                        data: {
                            ...translation,
                            podcastId: id,
                        },
                    });
                }
            }
            return updatedPodcast;
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });
        return result;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to update podcast';
    }
}


export const getPodcasts = async (page: string, language: string) => {
    let podcasts;
    const pageNumber = parseInt(page) || 1;
    const limit = 10;
    const skip = (pageNumber - 1) * limit;
    const total = await prisma.podcast.count();
    if (language !== 'all') {
        podcasts = await prisma.translatedPodcast.findMany({
        where: {
            language: language,
        },
        select: {
            podcastId: true,
            title: true,
            imageUrl: true,
            podcast: {
                select: {
                    totalDuration: true,
                }
            }
        },
        skip,
        take: limit,
    });
    } else {
        podcasts = await prisma.podcast.findMany({
            skip,
            take: limit,
            include: {
                translations: {
                    select: {
                        title: true,
                        language: true,
                        imageUrl: true,
                    }
                }
            }
        });
    }
    return {
        podcasts: podcasts,
        page: pageNumber,
        limit,
        total: total,
    };
}

export const getPodcastById = async (id: string, language: string) => {
    try {
        let podcast;
        if (language !== 'all') {
        podcast = await prisma.translatedPodcast.findFirst({
            where: {
                language: language,
                podcastId: id,
            },
             select:{
                podcastId: true,
                title: true,
                description: true,
                imageUrl: true,
                podcast:{
                    select:{
                        totalDuration: true,
                        speakers: {
                            select: {
                                id: true,
                            }
                        },
                        guests: {
                            select: {
                                id: true,
                            }
                        },
                        categories: {
                            select: {
                                id: true,
                            }
                        },
                    }
                }
             }
            });
        } else {
            podcast = await prisma.podcast.findUnique({
                where: { id: id },
                include:{
                    categories: {
                        select: {
                            id: true,
                        }
                    },
                    speakers: {
                        select: {
                            id: true,
                        }
                    },
                    guests: {
                        select: {
                            id: true,
                        }
                    },
                    translations: {
                        select: {
                            title: true,
                            language: true,
                            imageUrl: true,
                            description: true,
                            summary: true,
                            keyTakeaways: true,
                            audioUrl:true
                        }
                    }
                }
            })
        }
        return podcast;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to get podcast by ID';
    }
}

export const getPodcastsCollections = async (page: string, language: string) => {
    const pageNumber = parseInt(page) || 1;
    const limit = 10;
    const skip = (pageNumber - 1) * limit;
    const total = await prisma.podcastCollection.count();
    const podcastsCollections = await prisma.translatedPodcastCollection.findMany({
        where: {
            language: language,
        },
        select: {
            podcastCollectionId: true,
            name: true,
            description: true,
            podcastCollection: {
                select: {
                    imageUrl: true,
                    slug: true,
                    podcastsIds: true,
                }
            },
        },
        skip,
        take: limit,
    });
    return {
        podcastsCollections: podcastsCollections,
        page: pageNumber,
        limit,
        total: total,
    };
}

export const getPodcastCollectionById = async (id: string, language: string, includePodcasts: boolean) => {

    try {
        let podcastCollection
        let podcasts
        if (language !== 'all'){
            podcastCollection = await prisma.translatedPodcastCollection.findFirst({
                where: {
                    language: language,
                    podcastCollectionId: id,
                },
                select: {
                    podcastCollectionId: true,
                    name: true,
                    description: true,
                    language: true,
                    podcastCollection: {
                        select: {
                            imageUrl: true,
                            slug: true,
                            podcastsIds: true,
                        }
                    }
                }
            });
            if (!includePodcasts) {
                return podcastCollection;
            }
            podcasts = await getPodcastsByIds(podcastCollection?.podcastCollection?.podcastsIds || [], language);
        } else {
            podcastCollection = await prisma.podcastCollection.findUnique({
                where: { id: id },
                include: {
                    translations: true,
                }
            });
            if (!includePodcasts) {
                return podcastCollection;
            }
            podcasts = await getPodcastsByIds(podcastCollection?.podcastsIds || [], 'en');
        }
        return {
            podcastCollection,
            podcasts,
        };
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get podcast collection by ID';
    }
}

const getPodcastsByIds = async (ids: string[], language: string) => {
    try {
        const podcasts = await prisma.podcast.findMany({
            where: {
                id: {
                    in: ids,
                },
            },
            select:{
                id: true,
                totalDuration: true,
                published: true,
                translations: {
                    where: { language: language },
                    select: {
                        title: true,
                        imageUrl: true,
                        language: true,
                    }
                },
            }
        });
        return podcasts;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get books by IDs';
    }
}

export const getPodcastsByCategorySlug = async (slug: string, page: string, language: string) => {
    const pageNumber = parseInt(page) || 1;
    const limit = 10;
    const skip = (pageNumber - 1) * limit;

    const total = await prisma.podcast.count({
        where: {
            categories: {
                some: {
                    slug: slug,
                }
            }
        }
    });
    const podcasts = await prisma.podcast.findMany({
        where: {
            categories: {
                some: {
                    slug: slug,
                }
            }
        },
        select: {
            id: true,
            imageUrl: true,
            totalDuration: true,
            translations: {
                where: { language: language },
                select: {
                    title: true,
                }
            },
        },
        skip,
        take: limit,
    });
    return {
        podcasts: podcasts,
        page: pageNumber,
        limit,
        total: total,
    };
}

export const getPodcastsByCategoryIds = async (categoryIds: string[], page: string, language: string) => {
    const pageNumber = parseInt(page) || 1;
    const limit = 10;
    const skip = (pageNumber - 1) * limit;
    const total = await prisma.podcast.count({
        where: {
            categories: {
                some: {
                    id: {
                        in: categoryIds,
                    }
                }
            }
        }
    });
    const podcasts = await prisma.podcast.findMany({
        where: {
            categories: {
                some: {
                    id: {
                        in: categoryIds,
                    }
                }
            }
        },
        select: {
            id: true,
            totalDuration: true,
            translations: {
                where: { language: language },
                select: {
                    title: true,
                    imageUrl: true,
                }
            },
        },
        skip,
        take: limit,
    });
    return {
        podcasts: podcasts,
        page: pageNumber,
        limit,
        total: total,
    };
}

export const searchPodcasts = async (query: string, language: string, page: string) => {
    try {
        const pageNumber = parseInt(page) || 1;
        const limit = 10;
        const skip = (pageNumber - 1) * limit;
        let podcasts;
        if (language !== 'all') {

        podcasts = await prisma.translatedPodcast.findMany({
            where: {
                language: language,
                title: {
                    contains: query,
                    mode: 'insensitive',
                }
            },
            select:{
                podcastId: true,
                title: true,
                imageUrl: true,
                podcast:{
                    select:{
                        totalDuration: true,
                    }
                }
            },
            skip,
            take: limit,
        });
    }   else {
        podcasts = await prisma.podcast.findMany({
            where: {
                title: {
                    contains: query,
                    mode: 'insensitive',
                }
            },
            include: {
                translations: true
            },
           
            skip,
            take: limit,
        });
    }
        return podcasts;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to search podcasts';
    }
}

export const getPodcastsCollectionsByIds = async (ids: string[]) => {
    try {
        const collections = await prisma.podcastCollection.findMany({
            where: {
                id: { in: ids },
            },
        });
        return collections;
    }
    catch (error: unknown) {
        console.error(error);
        return 'Failed to get podcasts collections by IDs';
    }
}

export const deletePodcastById = async (id: string) => {
    try {
        await prisma.podcast.delete({
            where: { id: id },
        });
        return 'Podcast deleted successfully';
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to delete podcast';
    }
}
export const deletePodcastCollectionById = async (id: string) => {
    try {
        await prisma.podcastCollection.delete({
            where: { id: id },
        });
        return 'Podcast collection deleted successfully';
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to delete podcast collection';
    }
}

export const getPodcastSummary = async (podcastId: string, language: string) => {
    try {
        const podcastSummary = await prisma.translatedPodcast.findFirst({
            where: {
                podcastId: podcastId,
                language: language,
            },
            select: {
                summary: true,
                keyTakeaways: true,
            }
        });
        return podcastSummary;
    } catch (error: unknown) {
        console.error(error);
        return 'Failed to get podcast summary';
    }

}