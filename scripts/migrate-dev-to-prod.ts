import { PrismaClient } from '@prisma/client';

// Dev database connection
const devPrisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.socvjhoarmuxazykmaze:sZf8409BUIdLG1Ev@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
        }
    }
});

// Production database connection
const prodPrisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.msdttfaosazkhherguze:6dAc&gbPZZ2Dj!G@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
        }
    }
});

async function clearProdDatabase() {
    console.log('🗑️  Clearing production database...\n');

    try {
        // Delete in reverse order to respect foreign key constraints
        console.log('Deleting Dynamic Page Blocks...');
        await prodPrisma.dynamicPageBlock.deleteMany();
        
        console.log('Deleting Dynamic Pages...');
        await prodPrisma.dynamicPage.deleteMany();
        
        console.log('Deleting Free Books...');
        await prodPrisma.freeBooks.deleteMany();
        
        console.log('Deleting Bookmarks...');
        await prodPrisma.bookMark.deleteMany();
        
        console.log('Deleting User Progress...');
        await prodPrisma.userProgress.deleteMany();
        
        console.log('Deleting User Preferences...');
        await prodPrisma.userPreferences.deleteMany();
        
        console.log('Deleting Translated Podcast Collections...');
        await prodPrisma.translatedPodcastCollection.deleteMany();
        
        console.log('Deleting Podcast Collections...');
        await prodPrisma.podcastCollection.deleteMany();
        
        console.log('Deleting Translated Podcasts...');
        await prodPrisma.translatedPodcast.deleteMany();
        
        console.log('Deleting Podcasts...');
        await prodPrisma.podcast.deleteMany();
        
        console.log('Deleting Translated Book Collections...');
        await prodPrisma.translatedBookCollection.deleteMany();
        
        console.log('Deleting Book Collections...');
        await prodPrisma.bookCollection.deleteMany();
        
        console.log('Deleting Translated Summaries...');
        await prodPrisma.translatedSummary.deleteMany();
        
        console.log('Deleting Summaries...');
        await prodPrisma.summary.deleteMany();
        
        console.log('Deleting Translated Books...');
        await prodPrisma.translatedBook.deleteMany();
        
        console.log('Deleting Books...');
        await prodPrisma.book.deleteMany();
        
        console.log('Deleting Translated Categories...');
        await prodPrisma.translatedCategory.deleteMany();
        
        console.log('Deleting Categories...');
        await prodPrisma.category.deleteMany();
        
        console.log('Deleting Translated Authors...');
        await prodPrisma.translatedAuthor.deleteMany();
        
        console.log('Deleting Authors...');
        await prodPrisma.author.deleteMany();
        
        console.log('Deleting Users...');
        await prodPrisma.user.deleteMany();
        
        console.log('✅ Production database cleared successfully!\n');
    } catch (error) {
        console.error('❌ Failed to clear production database:', error);
        throw error;
    }
}

async function migrateData() {
    try {
        console.log('🚀 Starting migration from DEV to PROD...\n');

        // Clear production database first
        await clearProdDatabase();

        // Step 1: Migrate Users
        console.log('👤 Migrating Users...');
        const users = await devPrisma.user.findMany();
        for (const user of users) {
            await prodPrisma.user.upsert({
                where: { id: user.id },
                update: user,
                create: user
            });
        }
        console.log(`✅ Migrated ${users.length} users\n`);

        // Step 2: Migrate Authors
        console.log('✍️ Migrating Authors...');
        const authors = await devPrisma.author.findMany();
        for (const author of authors) {
            await prodPrisma.author.upsert({
                where: { id: author.id },
                update: author,
                create: author
            });
        }
        console.log(`✅ Migrated ${authors.length} authors\n`);

        // Step 3: Migrate Translated Authors
        console.log('🌐 Migrating Translated Authors...');
        const translatedAuthors = await devPrisma.translatedAuthor.findMany();
        for (const ta of translatedAuthors) {
            await prodPrisma.translatedAuthor.upsert({
                where: { id: ta.id },
                update: ta,
                create: ta
            });
        }
        console.log(`✅ Migrated ${translatedAuthors.length} translated authors\n`);

        // Step 4: Migrate Categories
        console.log('📂 Migrating Categories...');
        const categories = await devPrisma.category.findMany();
        for (const category of categories) {
            await prodPrisma.category.upsert({
                where: { id: category.id },
                update: category,
                create: category
            });
        }
        console.log(`✅ Migrated ${categories.length} categories\n`);

        // Step 5: Migrate Translated Categories
        console.log('🌐 Migrating Translated Categories...');
        const translatedCategories = await devPrisma.translatedCategory.findMany();
        for (const tc of translatedCategories) {
            await prodPrisma.translatedCategory.upsert({
                where: { id: tc.id },
                update: tc,
                create: tc
            });
        }
        console.log(`✅ Migrated ${translatedCategories.length} translated categories\n`);

        // Step 6: Migrate Books (without relations first)
        console.log('📚 Migrating Books...');
        const books = await devPrisma.book.findMany({
            include: {
                authors: true,
                categories: true
            }
        });
        
        for (const book of books) {
            const { authors, categories, ...bookData } = book;
            
            await prodPrisma.book.upsert({
                where: { id: book.id },
                update: {
                    ...bookData,
                    authors: {
                        set: authors.map(a => ({ id: a.id }))
                    },
                    categories: {
                        set: categories.map(c => ({ id: c.id }))
                    }
                },
                create: {
                    ...bookData,
                    authors: {
                        connect: authors.map(a => ({ id: a.id }))
                    },
                    categories: {
                        connect: categories.map(c => ({ id: c.id }))
                    }
                }
            });
        }
        console.log(`✅ Migrated ${books.length} books\n`);

        // Step 7: Migrate Translated Books
        console.log('🌐 Migrating Translated Books...');
        const translatedBooks = await devPrisma.translatedBook.findMany();
        for (const tb of translatedBooks) {
            await prodPrisma.translatedBook.upsert({
                where: { id: tb.id },
                update: tb,
                create: tb
            });
        }
        console.log(`✅ Migrated ${translatedBooks.length} translated books\n`);

        // Step 8: Migrate Summaries
        console.log('📝 Migrating Summaries...');
        const summaries = await devPrisma.summary.findMany();
        for (const summary of summaries) {
            await prodPrisma.summary.upsert({
                where: { id: summary.id },
                update: summary,
                create: summary
            });
        }
        console.log(`✅ Migrated ${summaries.length} summaries\n`);

        // Step 9: Migrate Translated Summaries
        console.log('🌐 Migrating Translated Summaries...');
        const translatedSummaries = await devPrisma.translatedSummary.findMany();
        for (const ts of translatedSummaries) {
            await prodPrisma.translatedSummary.upsert({
                where: { id: ts.id },
                update: ts,
                create: ts
            });
        }
        console.log(`✅ Migrated ${translatedSummaries.length} translated summaries\n`);

        // Step 10: Migrate Book Collections
        console.log('📦 Migrating Book Collections...');
        const bookCollections = await devPrisma.bookCollection.findMany();
        for (const bc of bookCollections) {
            await prodPrisma.bookCollection.upsert({
                where: { id: bc.id },
                update: bc,
                create: bc
            });
        }
        console.log(`✅ Migrated ${bookCollections.length} book collections\n`);

        // Step 11: Migrate Translated Book Collections
        console.log('🌐 Migrating Translated Book Collections...');
        const translatedBookCollections = await devPrisma.translatedBookCollection.findMany();
        for (const tbc of translatedBookCollections) {
            await prodPrisma.translatedBookCollection.upsert({
                where: { id: tbc.id },
                update: tbc,
                create: tbc
            });
        }
        console.log(`✅ Migrated ${translatedBookCollections.length} translated book collections\n`);

        // Step 12: Migrate Podcasts
        console.log('🎙️ Migrating Podcasts...');
        const podcasts = await devPrisma.podcast.findMany({
            include: {
                categories: true,
                speakers: true,
                guests: true
            }
        });
        
        for (const podcast of podcasts) {
            const { categories, speakers, guests, ...podcastData } = podcast;
            
            await prodPrisma.podcast.upsert({
                where: { id: podcast.id },
                update: {
                    ...podcastData,
                    categories: {
                        set: categories.map(c => ({ id: c.id }))
                    },
                    speakers: {
                        set: speakers.map(s => ({ id: s.id }))
                    },
                    guests: {
                        set: guests.map(g => ({ id: g.id }))
                    }
                },
                create: {
                    ...podcastData,
                    categories: {
                        connect: categories.map(c => ({ id: c.id }))
                    },
                    speakers: {
                        connect: speakers.map(s => ({ id: s.id }))
                    },
                    guests: {
                        connect: guests.map(g => ({ id: g.id }))
                    }
                }
            });
        }
        console.log(`✅ Migrated ${podcasts.length} podcasts\n`);

        // Step 13: Migrate Translated Podcasts
        console.log('🌐 Migrating Translated Podcasts...');
        const translatedPodcasts = await devPrisma.translatedPodcast.findMany();
        for (const tp of translatedPodcasts) {
            await prodPrisma.translatedPodcast.upsert({
                where: { id: tp.id },
                update: tp,
                create: tp
            });
        }
        console.log(`✅ Migrated ${translatedPodcasts.length} translated podcasts\n`);

        // Step 14: Migrate Podcast Collections
        console.log('🎙️📦 Migrating Podcast Collections...');
        const podcastCollections = await devPrisma.podcastCollection.findMany();
        for (const pc of podcastCollections) {
            await prodPrisma.podcastCollection.upsert({
                where: { id: pc.id },
                update: pc,
                create: pc
            });
        }
        console.log(`✅ Migrated ${podcastCollections.length} podcast collections\n`);

        // Step 15: Migrate Translated Podcast Collections
        console.log('🌐 Migrating Translated Podcast Collections...');
        const translatedPodcastCollections = await devPrisma.translatedPodcastCollection.findMany();
        for (const tpc of translatedPodcastCollections) {
            await prodPrisma.translatedPodcastCollection.upsert({
                where: { id: tpc.id },
                update: tpc,
                create: tpc
            });
        }
        console.log(`✅ Migrated ${translatedPodcastCollections.length} translated podcast collections\n`);

        // Step 16: Migrate User Preferences
        console.log('⚙️ Migrating User Preferences...');
        const userPreferences = await devPrisma.userPreferences.findMany();
        for (const up of userPreferences) {
            await prodPrisma.userPreferences.upsert({
                where: { id: up.id },
                update: up,
                create: up
            });
        }
        console.log(`✅ Migrated ${userPreferences.length} user preferences\n`);

        // Step 17: Migrate User Progress
        console.log('📊 Migrating User Progress...');
        const userProgress = await devPrisma.userProgress.findMany();
        for (const progress of userProgress) {
            await prodPrisma.userProgress.upsert({
                where: {
                    bookId_userId: {
                        bookId: progress.bookId,
                        userId: progress.userId
                    }
                },
                update: progress,
                create: progress
            });
        }
        console.log(`✅ Migrated ${userProgress.length} user progress records\n`);

        // Step 18: Migrate Bookmarks
        console.log('🔖 Migrating Bookmarks...');
        const bookmarks = await devPrisma.bookMark.findMany();
        for (const bookmark of bookmarks) {
            await prodPrisma.bookMark.upsert({
                where: { id: bookmark.id },
                update: bookmark,
                create: bookmark
            });
        }
        console.log(`✅ Migrated ${bookmarks.length} bookmarks\n`);

        // Step 19: Migrate Free Books
        console.log('🆓 Migrating Free Books...');
        const freeBooks = await devPrisma.freeBooks.findMany();
        for (const fb of freeBooks) {
            await prodPrisma.freeBooks.upsert({
                where: { bookId: fb.bookId },
                update: fb,
                create: fb
            });
        }
        console.log(`✅ Migrated ${freeBooks.length} free books\n`);

        // Step 20: Migrate Dynamic Pages
        console.log('📄 Migrating Dynamic Pages...');
        const dynamicPages = await devPrisma.dynamicPage.findMany();
        for (const page of dynamicPages) {
            await prodPrisma.dynamicPage.upsert({
                where: { id: page.id },
                update: page,
                create: page
            });
        }
        console.log(`✅ Migrated ${dynamicPages.length} dynamic pages\n`);

        // Step 21: Migrate Dynamic Page Blocks
        console.log('🧱 Migrating Dynamic Page Blocks...');
        const dynamicPageBlocks = await devPrisma.dynamicPageBlock.findMany();
        for (const block of dynamicPageBlocks) {
            const { id, pageId, type, viewType, imageUrl, order, metadata, data } = block;
            await prodPrisma.dynamicPageBlock.upsert({
                where: { id },
                update: {
                    pageId,
                    type,
                    viewType,
                    imageUrl,
                    order,
                    metadata: metadata as any,
                    data: data as any
                },
                create: {
                    id,
                    pageId,
                    type,
                    viewType,
                    imageUrl,
                    order,
                    metadata: metadata as any,
                    data: data as any
                }
            });
        }
        console.log(`✅ Migrated ${dynamicPageBlocks.length} dynamic page blocks\n`);

        console.log('🎉 Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- Users: ${users.length}`);
        console.log(`- Authors: ${authors.length}`);
        console.log(`- Categories: ${categories.length}`);
        console.log(`- Books: ${books.length}`);
        console.log(`- Podcasts: ${podcasts.length}`);
        console.log(`- Book Collections: ${bookCollections.length}`);
        console.log(`- Podcast Collections: ${podcastCollections.length}`);
        console.log(`- Dynamic Pages: ${dynamicPages.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await devPrisma.$disconnect();
        await prodPrisma.$disconnect();
    }
}

// Run the migration
migrateData()
    .then(() => {
        console.log('\n✅ All data migrated successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
