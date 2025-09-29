import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID?.trim();
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.trim()?.replace(/\\n/g, '\n');
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL?.trim();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: FIREBASE_PROJECT_ID,
            privateKey: FIREBASE_PRIVATE_KEY,
            clientEmail: FIREBASE_CLIENT_EMAIL,
        }),
    });
}

const db = admin.firestore();
const prisma = new PrismaClient();

// Helper function to convert Firebase timestamp to Date
function convertTimestamp(timestamp) {
    if (!timestamp) return new Date();
    if (timestamp._seconds) {
        return new Date(timestamp._seconds * 1000);
    }
    if (timestamp.toDate) {
        return timestamp.toDate();
    }
    return new Date(timestamp);
}

// Helper function to extract English content from multilingual objects
function getEnglishContent(multiLangObj, fallback = '') {
    if (!multiLangObj) return fallback;
    if (typeof multiLangObj === 'string') return multiLangObj;
    return multiLangObj.en || multiLangObj.english || Object.values(multiLangObj)[0] || fallback;
}

// Helper function to get available languages from multilingual objects
function getAvailableLanguages(multiLangObj) {
    if (!multiLangObj || typeof multiLangObj === 'string') return [];
    // Return ALL languages including English for translation tables
    const languages = Object.keys(multiLangObj).filter(lang => lang !== 'english'); // Only exclude 'english', keep 'en'
    return languages;
}

async function migrateUsers() {
    console.log('🔄 Migrating users...');
    
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
        const data = doc.data();
        users.push({
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            gender: null, // Not in Firebase schema
            profilePicture: data.profilePicture || data.avatarUrl || null, // Firebase: profilePicture → Prisma: profilePicture
            dob: null, // Not in Firebase schema
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
        });
    });

    if (users.length > 0) {
        await prisma.user.createMany({
            data: users,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${users.length} users`);
    }
}

async function migrateAuthors() {
    console.log('🔄 Migrating authors...');
    
    const authorsSnapshot = await db.collection('authors').get();
    const authors = [];
    const translatedAuthors = [];
    const validAuthorIds = new Set();
    
    // First pass: collect all main authors
    authorsSnapshot.forEach(doc => {
        const data = doc.data();
        
        const imageUrl = data.profilePicture || data.avatarUrl || '';
        console.log(`👤 Author ${getEnglishContent(data.name, 'Unknown')}: Firebase profilePicture = ${data.profilePicture ? data.profilePicture.substring(0, 80) + '...' : 'EMPTY'}`);
        console.log(`👤 Author ${getEnglishContent(data.name, 'Unknown')}: Final imageUrl = ${imageUrl ? imageUrl.substring(0, 80) + '...' : 'EMPTY'}`);
        
        // Create main author record
        authors.push({
            id: doc.id,
            name: getEnglishContent(data.name, 'Unknown Author'),
            imageUrl: imageUrl, // Firebase: profilePicture → Prisma: imageUrl
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
        });

        validAuthorIds.add(doc.id);
    });

    // Create main authors first
    if (authors.length > 0) {
        await prisma.author.createMany({
            data: authors,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${authors.length} authors`);
        
        // Debug: Check authors with images after creation
        const authorsWithImages = await prisma.author.count({
            where: { imageUrl: { not: '' } }
        });
        console.log(`🖼️  Authors with non-empty imageUrl: ${authorsWithImages}/${authors.length}`);
        
        // Show sample authors with images
        const sampleAuthorsWithImages = await prisma.author.findMany({
            where: { imageUrl: { not: '' } },
            take: 3,
            select: { name: true, imageUrl: true }
        });
        console.log(`✅ Sample authors WITH images:`, sampleAuthorsWithImages);
        
        // Show sample authors without images
        const sampleAuthorsWithoutImages = await prisma.author.findMany({
            where: { imageUrl: '' },
            take: 3,
            select: { name: true, imageUrl: true }
        });
        console.log(`❌ Sample authors WITHOUT images:`, sampleAuthorsWithoutImages);
    }

    // Second pass: collect translated authors only for valid author IDs
    authorsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Create translated author records only if parent author exists
        if (validAuthorIds.has(doc.id)) {
            // Handle multilingual name object
            if (data.name && typeof data.name === 'object') {
                const languages = getAvailableLanguages(data.name);
                console.log(`🌍 Found languages for author ${doc.id}:`, languages);
                
                languages.forEach(lang => {
                    if (data.name[lang]) {
                        translatedAuthors.push({
                            name: data.name[lang],
                            description: data.about?.[lang] || '',
                            language: lang,
                            authorId: doc.id,
                            createdAt: convertTimestamp(data.createdAt),
                            updatedAt: convertTimestamp(data.updatedAt),
                        });
                    }
                });
            }
        }
    });

    if (translatedAuthors.length > 0) {
        try {
            await prisma.translatedAuthor.createMany({
                data: translatedAuthors,
                skipDuplicates: true,
            });
            console.log(`✅ Migrated ${translatedAuthors.length} translated authors`);
        } catch (error) {
            console.warn(`⚠️  Bulk translated authors migration failed, trying individual records:`, error.message);
            
            let successCount = 0;
            for (const record of translatedAuthors) {
                try {
                    await prisma.translatedAuthor.create({
                        data: record,
                    });
                    successCount++;
                } catch (individualError) {
                    console.warn(`⚠️  Failed to migrate translated author for authorId ${record.authorId}, language ${record.language}:`, individualError.message);
                }
            }
            console.log(`✅ Migrated ${successCount} translated authors`);
        }
    } else {
        console.log(`ℹ️  No translated authors found`);
    }
}

async function migrateCategories() {
    console.log('🔄 Migrating categories...');
    
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = [];
    const translatedCategories = [];
    const validCategoryIds = new Set();
    
    // First pass: collect all main categories
    categoriesSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Create main category record
        categories.push({
            id: doc.id,
            name: getEnglishContent(data.name, 'Unknown Category'),
            categorySVG: data.icon || '', // Firebase: icon → Prisma: categorySVG
            categoryImage: data.featuredImage || '', // Firebase: featuredImage → Prisma: categoryImage
            slug: data.slug || doc.id,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
        });

        validCategoryIds.add(doc.id);
    });

    // Create main categories first
    if (categories.length > 0) {
        await prisma.category.createMany({
            data: categories,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${categories.length} categories`);
    }

    // Second pass: collect translated categories only for valid category IDs
    categoriesSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Create translated category records only if parent category exists
        if (validCategoryIds.has(doc.id)) {
            // Handle multilingual name object
            if (data.name && typeof data.name === 'object') {
                const languages = getAvailableLanguages(data.name);
                console.log(`🌍 Found languages for category ${doc.id}:`, languages);
                
                languages.forEach(lang => {
                    if (data.name[lang]) {
                        translatedCategories.push({
                            name: data.name[lang],
                            description: data.description?.[lang] || '',
                            language: lang,
                            categoryId: doc.id,
                            createdAt: convertTimestamp(data.createdAt),
                            updatedAt: convertTimestamp(data.updatedAt),
                        });
                    }
                });
            }
        }
    });

    // Debug translated categories before migration
    console.log(`📋 Attempting to migrate ${translatedCategories.length} translated categories`);
    const referencedCategoryIds = new Set(translatedCategories.map(tc => tc.categoryId));
    console.log(`📋 Translated categories reference ${referencedCategoryIds.size} unique category IDs`);
    
    // Check for missing category references
    const missingCategoryIds = [];
    referencedCategoryIds.forEach(categoryId => {
        if (!validCategoryIds.has(categoryId)) {
            missingCategoryIds.push(categoryId);
        }
    });
    
    if (missingCategoryIds.length > 0) {
        console.warn(`⚠️  Found ${missingCategoryIds.length} translated categories referencing non-existent category IDs:`, missingCategoryIds);
    }

    // Create translated categories in smaller batches to handle any remaining issues
    if (translatedCategories.length > 0) {
        const batchSize = 10;
        let successCount = 0;
        
        for (let i = 0; i < translatedCategories.length; i += batchSize) {
            const batch = translatedCategories.slice(i, i + batchSize);
            try {
                await prisma.translatedCategory.createMany({
                    data: batch,
                    skipDuplicates: true,
                });
                successCount += batch.length;
            } catch (error) {
                console.warn(`⚠️  Failed to migrate batch of translated categories (${i}-${i + batch.length - 1}):`, error.message);
                
                // Try individual records in this batch
                for (const record of batch) {
                    try {
                        await prisma.translatedCategory.create({
                            data: record,
                        });
                        successCount++;
                    } catch (individualError) {
                        console.warn(`⚠️  Failed to migrate translated category "${record.name}" (${record.language}) for categoryId ${record.categoryId}:`, individualError.message);
                    }
                }
            }
        }
        
        console.log(`✅ Migrated ${successCount} translated categories`);
    } else {
        console.log(`ℹ️  No translated categories found`);
    }
}

async function migrateBooks() {
    console.log('🔄 Migrating books...');
    
    const booksSnapshot = await db.collection('books').get();
    const books = [];
    const translatedBooks = [];
    const bookAuthors = [];
    const bookCategories = [];
    
    for (const doc of booksSnapshot.docs) {
        const data = doc.data();
        
        // Create main book record
        books.push({
            id: doc.id,
            title: data.title || 'Unknown Title',
            totalDuration: parseInt(data.totalDuration) || 0,
            slug: data.slug || doc.id,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
        });

        // Handle book-author relationships
        if (data.authors && Array.isArray(data.authors)) {
            data.authors.forEach(authorId => {
                bookAuthors.push({
                    bookId: doc.id,
                    authorId: authorId,
                });
            });
        }

        // Handle book-category relationships
        if (data.categories && Array.isArray(data.categories)) {
            data.categories.forEach(categoryId => {
                bookCategories.push({
                    bookId: doc.id,
                    categoryId: categoryId,
                });
            });
        }
    }

    // Create a set of valid book IDs for reference checking
    const validBookIds = new Set(books.map(book => book.id));
    console.log(`📚 Valid book IDs: ${validBookIds.size}`);

    // FIRST: Create English translations from main books collection
    booksSnapshot.forEach(doc => {
        const data = doc.data();
        translatedBooks.push({
            title: data.title || 'Unknown Title',
            coverUrl: data.coverUrl || null, // Firebase: coverUrl → Prisma: coverUrl
            description: data.description || '',
            language: 'en', // English from main collection
            published: data.status === 'published',
            audioEnabled: data.languageStatus?.en?.audioEnabled || false,
            bookId: doc.id,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
        });
    });

    console.log(`📚 Added ${booksSnapshot.docs.length} English translations from main books collection`);

    // SECOND: Get translated books from book_lang collection (includes ALL languages including English)
    const bookLangSnapshot = await db.collection('book_lang').get();
    console.log(`📚 Found ${bookLangSnapshot.docs.length} documents in book_lang collection`);
    
    bookLangSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Only add translated books if the parent book exists
        if (data.bookId && validBookIds.has(data.bookId)) {
            translatedBooks.push({
                title: data.title || 'Unknown Title',
                coverUrl: data.coverUrl || null, // Firebase: coverUrl → Prisma: coverUrl (correct mapping)
                description: typeof data.description === 'string' ? data.description : (data.description?.en || ''),
                language: data.language || 'en',
                published: true, // Default since it exists in translation
                audioEnabled: false, // Default
                bookId: data.bookId,
                createdAt: convertTimestamp(data.createdAt),
                updatedAt: convertTimestamp(data.updatedAt),
            });
        } else {
            console.warn(`⚠️  Skipping translated book "${data.title}" (${data.language}) for non-existent bookId: ${data.bookId}`);
        }
    });

    // Debug: Show some example book IDs that are being migrated
    console.log(`📚 Sample book IDs being migrated:`, books.slice(0, 5).map(b => b.id));
    
    if (books.length > 0) {
        await prisma.book.createMany({
            data: books,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${books.length} books`);
        
        // Debug: Check if the missing books from the error are in our books array
        const missingFromError = [
            'G11RGAXbbqVpF1JHiWKM', 'JaZit5S0Fic3ArzhL5C3', 'NpHtdMIZTbIXtXXDUQVf', 
            'RMJ8ZnF9rD2CChjr4Q94', 'W0wEd08BrCjDkB8Nx2bu', 'fzWI45NjSsKmzOYlMGbW'
        ];
        const bookIds = new Set(books.map(b => b.id));
        missingFromError.forEach(id => {
            if (!bookIds.has(id)) {
                console.warn(`❌ Missing book ID ${id} not found in Firebase books collection`);
            } else {
                console.log(`✅ Found book ID ${id} in migration data`);
            }
        });
    }

    // Debug translated books before migration
    console.log(`📚 Attempting to migrate ${translatedBooks.length} translated books`);
    const referencedBookIds = new Set(translatedBooks.map(tb => tb.bookId));
    console.log(`📚 Translated books reference ${referencedBookIds.size} unique book IDs`);
    
    // Check for missing book references
    const missingBookIds = [];
    referencedBookIds.forEach(bookId => {
        if (!validBookIds.has(bookId)) {
            missingBookIds.push(bookId);
        }
    });
    
    if (missingBookIds.length > 0) {
        console.warn(`⚠️  Found ${missingBookIds.length} translated books referencing non-existent book IDs:`, missingBookIds.slice(0, 10)); // Show first 10
    }

    // STEP 3: Validate translated books against existing Book records
    const existingBooks = await prisma.book.findMany({ select: { id: true } });
    const existingBookIds = new Set(existingBooks.map(book => book.id));
    console.log(`📚 Found ${existingBookIds.size} valid books for translation validation`);
    
    // Filter translated books to only include those with valid bookIds
    const validTranslatedBooks = translatedBooks.filter(book => {
        if (existingBookIds.has(book.bookId)) {
            return true;
        } else {
            console.warn(`⚠️  Skipping translated book "${book.title}" (${book.language}) - bookId ${book.bookId} not found in Book table`);
            return false;
        }
    });
    
    console.log(`📚 Filtered from ${translatedBooks.length} to ${validTranslatedBooks.length} valid translated books`);

    // Create translated books using upsert to handle unique constraints properly
    if (validTranslatedBooks.length > 0) {
        console.log(`📚 Processing ${validTranslatedBooks.length} translated books...`);
        
        // Debug: Show language distribution
        const languageCounts = {};
        validTranslatedBooks.forEach(book => {
            languageCounts[book.language] = (languageCounts[book.language] || 0) + 1;
        });
        console.log(`📊 Language distribution:`, languageCounts);
        
        let successCount = 0;
        
        // Use individual upserts to handle unique constraint (bookId, language)
        for (const record of validTranslatedBooks) {
            try {
                await prisma.translatedBook.upsert({
                    where: {
                        bookId_language: {
                            bookId: record.bookId,
                            language: record.language
                        }
                    },
                    update: {
                        title: record.title,
                        coverUrl: record.coverUrl,
                        description: record.description,
                        published: record.published,
                        audioEnabled: record.audioEnabled,
                        updatedAt: record.updatedAt,
                    },
                    create: record
                });
                successCount++;
                
                if (successCount % 50 === 0) {
                    console.log(`📚 Processed ${successCount}/${validTranslatedBooks.length} translated books...`);
                }
            } catch (individualError) {
                console.warn(`⚠️  Failed to migrate translated book "${record.title}" (${record.language}) for bookId ${record.bookId}:`, individualError.message);
            }
        }
        
        console.log(`✅ Migrated ${successCount} translated books`);
        
        // Debug: Check English books specifically  
        const englishBookCount = await prisma.translatedBook.count({ where: { language: 'en' } });
        console.log(`📚 English books in database: ${englishBookCount}`);
    } else {
        console.log(`ℹ️  No translated books found`);
    }

    // Handle many-to-many relationships after books are created
    for (const relation of bookAuthors) {
        try {
            await prisma.book.update({
                where: { id: relation.bookId },
                data: {
                    authors: {
                        connect: { id: relation.authorId }
                    }
                }
            });
        } catch (error) {
            console.warn(`⚠️  Failed to connect book ${relation.bookId} to author ${relation.authorId}`);
        }
    }

    for (const relation of bookCategories) {
        try {
            await prisma.book.update({
                where: { id: relation.bookId },
                data: {
                    categories: {
                        connect: { id: relation.categoryId }
                    }
                }
            });
        } catch (error) {
            console.warn(`⚠️  Failed to connect book ${relation.bookId} to category ${relation.categoryId}`);
        }
    }

    console.log(`✅ Connected ${bookAuthors.length} book-author relationships`);
    console.log(`✅ Connected ${bookCategories.length} book-category relationships`);
}

async function migrateSummaries() {
    console.log('🔄 Migrating summaries...');
    
    // First, get all valid book IDs from the Book table
    const validBooks = await prisma.book.findMany({ select: { id: true } });
    const validBookIds = new Set(validBooks.map(book => book.id));
    console.log(`📚 Found ${validBookIds.size} valid books for summary foreign key validation`);
    
    // STEP 1: Migrate main summaries from 'summaries' collection (English data)
    const summariesSnapshot = await db.collection('summaries').get();
    const summaries = [];
    const validSummaryIds = new Set();
    
    console.log(`📄 Found ${summariesSnapshot.docs.length} documents in summaries collection`);
    
    summariesSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Only migrate if it's a book summary (contentType === 'book' or has bookId)
        const bookId = data.bookId || (data.contentType === 'book' ? data.contentId : null);
        if (bookId && validBookIds.has(bookId)) {
            summaries.push({
                id: doc.id,
                title: getEnglishContent(data.chapterTitle || data.title, 'Unknown Chapter'),
                order: parseInt(data.chapterNumber) || parseInt(data.order) || 1, // Map chapterNumber → order
                bookId: bookId,
                createdAt: convertTimestamp(data.createdAt),
                updatedAt: convertTimestamp(data.updatedAt),
            });
            validSummaryIds.add(doc.id);
        } else if (bookId && !validBookIds.has(bookId)) {
            console.warn(`⚠️  Skipping summary ${doc.id} - bookId ${bookId} not found in Book table`);
        }
    });

    // STEP 2: Migrate translated summaries from 'summaries_lang' collection (translated data)
    const summariesLangSnapshot = await db.collection('summaries_lang').get();
    const translatedSummaries = [];
    
    console.log(`📄 Found ${summariesLangSnapshot.docs.length} documents in summaries_lang collection`);
    
    summariesLangSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Only migrate if it's a book summary and references a valid summary ID
        if ((data.bookId || data.contentType === 'book') && data.summaryId && validSummaryIds.has(data.summaryId)) {
            translatedSummaries.push({
                title: getEnglishContent(data.chapterTitle || data.title, 'Unknown Chapter'),
                content: typeof data.content === 'string' ? data.content : (data.content?.en || ''),
                audioUrl: data.audioUrl || null, // Map audioUrl from Firebase
                keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [],
                language: data.language || 'en',
                summaryId: data.summaryId,
                createdAt: convertTimestamp(data.createdAt),
                updatedAt: convertTimestamp(data.updatedAt),
            });
        } else if (data.summaryId && !validSummaryIds.has(data.summaryId)) {
            console.warn(`⚠️  Skipping translated summary ${doc.id} - summaryId ${data.summaryId} not found in Summary table`);
        } else if (data.podcastId || data.contentType === 'podcast') {
            console.log(`📄 Found podcast summary for podcastId: ${data.podcastId || data.contentId} - will be handled in TranslatedPodcast table`);
        }
    });

    // STEP 4: Create English translations from main summaries collection
    console.log(`📄 Creating English translations from main summaries collection...`);
    summariesSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Only create if it's a book summary and we have a valid summaryId
        const bookId = data.bookId || (data.contentType === 'book' ? data.contentId : null);
        if (bookId && validBookIds.has(bookId) && validSummaryIds.has(doc.id)) {
            translatedSummaries.push({
                title: getEnglishContent(data.chapterTitle || data.title, 'Unknown Chapter'),
                content: data.content || '',
                audioUrl: data.audioUrl || null, // Map audioUrl
                keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [],
                language: 'en', // English from main collection
                summaryId: doc.id,
                createdAt: convertTimestamp(data.createdAt),
                updatedAt: convertTimestamp(data.updatedAt),
            });
        }
    });
    console.log(`📚 Added ${summariesSnapshot.docs.length} English summary translations from main summaries collection`);

    console.log(`📊 Summary Migration Statistics:`);
    console.log(`   - Main summaries (English): ${summaries.length}`);
    console.log(`   - Translated summaries: ${translatedSummaries.length}`);
    console.log(`   - Valid summary IDs: ${validSummaryIds.size}`);

    if (summaries.length > 0) {
        await prisma.summary.createMany({
            data: summaries,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${summaries.length} main summaries`);
    } else {
        console.log(`ℹ️  No main summaries found`);
    }

    if (translatedSummaries.length > 0) {
        await prisma.translatedSummary.createMany({
            data: translatedSummaries,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${translatedSummaries.length} translated summaries`);
    } else {
        console.log(`ℹ️  No translated summaries found`);
    }
}

async function migratePodcasts() {
    console.log('🔄 Migrating podcasts...');
    
    const podcastsSnapshot = await db.collection('podcasts').get();
    const podcasts = [];
    const translatedPodcasts = [];
    const podcastSpeakers = [];
    const podcastGuests = [];
    const podcastCategories = [];
    
    for (const doc of podcastsSnapshot.docs) {
        const data = doc.data();
        
        // Create main podcast record
        podcasts.push({
            id: doc.id,
            title: data.title || 'Unknown Podcast',
            imageUrl: data.coverUrl || '', // Firebase: coverUrl → Prisma: imageUrl
            totalDuration: parseInt(data.totalDuration) || 0,
            published: data.status === 'published',
            slug: data.slug || doc.id,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
        });

        // Handle podcast-speaker relationships
        if (data.hosts && Array.isArray(data.hosts)) {
            data.hosts.forEach(hostId => {
                podcastSpeakers.push({
                    podcastId: doc.id,
                    speakerId: hostId,
                });
            });
        }

        if (data.speakers && Array.isArray(data.speakers)) {
            data.speakers.forEach(speakerId => {
                podcastSpeakers.push({
                    podcastId: doc.id,
                    speakerId: speakerId,
                });
            });
        }

        // Handle podcast-guest relationships
        if (data.guests && Array.isArray(data.guests)) {
            data.guests.forEach(guestId => {
                podcastGuests.push({
                    podcastId: doc.id,
                    guestId: guestId,
                });
            });
        }

        // Handle podcast-category relationships
        if (data.categories && Array.isArray(data.categories)) {
            data.categories.forEach(categoryId => {
                podcastCategories.push({
                    podcastId: doc.id,
                    categoryId: categoryId,
                });
            });
        }
    }

    // FIRST: Create English translations from main podcasts collection
    for (const doc of podcastsSnapshot.docs) {
        const data = doc.data();
        translatedPodcasts.push({
            title: data.title || 'Unknown Podcast',
            description: data.description || null,
            summary: data.description || '', // Use description as summary
            audioUrl: null, // Not in Firebase schema
            keyTakeaways: [], // Not in Firebase schema
            language: 'en', // English from main collection
            podcastId: doc.id,
        });
    }

    console.log(`🎙️  Added ${podcastsSnapshot.docs.length} English translations from main podcasts collection`);

    // SECOND: Add podcast summaries from summaries_lang collection to TranslatedPodcast
    const podcastSummariesSnapshot = await db.collection('summaries_lang').get();
    console.log(`📄 Checking ${podcastSummariesSnapshot.docs.length} summary documents for podcast content...`);
    
    podcastSummariesSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Only process podcast summaries
        if (data.podcastId || data.contentType === 'podcast') {
            const podcastId = data.podcastId || data.contentId;
            console.log(`📄 Adding podcast summary for podcastId: ${podcastId}, language: ${data.language}`);
            
            translatedPodcasts.push({
                title: getEnglishContent(data.chapterTitle || data.title, 'Unknown Podcast Part'),
                description: typeof data.content === 'string' ? data.content : (data.content?.en || null),
                summary: typeof data.content === 'string' ? data.content : (data.content?.en || ''),
                audioUrl: data.audioUrl || null,
                keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [],
                language: data.language || 'en',
                podcastId: podcastId,
            });
        }
    });

    // THIRD: Get translated podcasts from podcast_lang collection (includes ALL languages including English)
    const podcastLangSnapshot = await db.collection('podcast_lang').get();
    console.log(`🎙️  Found ${podcastLangSnapshot.docs.length} documents in podcast_lang collection`);
    
    podcastLangSnapshot.forEach(doc => {
        const data = doc.data();
        translatedPodcasts.push({
            title: data.title || 'Unknown Podcast',
            description: typeof data.description === 'string' ? data.description : (data.description?.en || null),
            summary: typeof data.description === 'string' ? data.description : (data.description?.en || ''), // Use description as summary
            audioUrl: null, // Not in Firebase schema
            keyTakeaways: [], // Not in Firebase schema
            language: data.language || 'en',
            podcastId: data.podcastId,
        });
    });

    if (podcasts.length > 0) {
        await prisma.podcast.createMany({
            data: podcasts,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${podcasts.length} podcasts`);
    }

    if (translatedPodcasts.length > 0) {
        await prisma.translatedPodcast.createMany({
            data: translatedPodcasts,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${translatedPodcasts.length} translated podcasts`);
    }

    // Handle many-to-many relationships
    for (const relation of podcastSpeakers) {
        try {
            await prisma.podcast.update({
                where: { id: relation.podcastId },
                data: {
                    speakers: {
                        connect: { id: relation.speakerId }
                    }
                }
            });
        } catch (error) {
            console.warn(`⚠️  Failed to connect podcast ${relation.podcastId} to speaker ${relation.speakerId}`);
        }
    }

    for (const relation of podcastGuests) {
        try {
            await prisma.podcast.update({
                where: { id: relation.podcastId },
                data: {
                    guests: {
                        connect: { id: relation.guestId }
                    }
                }
            });
        } catch (error) {
            console.warn(`⚠️  Failed to connect podcast ${relation.podcastId} to guest ${relation.guestId}`);
        }
    }

    for (const relation of podcastCategories) {
        try {
            await prisma.podcast.update({
                where: { id: relation.podcastId },
                data: {
                    categories: {
                        connect: { id: relation.categoryId }
                    }
                }
            });
        } catch (error) {
            console.warn(`⚠️  Failed to connect podcast ${relation.podcastId} to category ${relation.categoryId}`);
        }
    }

    console.log(`✅ Connected ${podcastSpeakers.length} podcast-speaker relationships`);
    console.log(`✅ Connected ${podcastGuests.length} podcast-guest relationships`);
    console.log(`✅ Connected ${podcastCategories.length} podcast-category relationships`);
}

async function migrateBookCollections() {
    console.log('🔄 Migrating book collections...');
    
    const collectionsSnapshot = await db.collection('bookCollections').get();
    const bookCollections = [];
    const translatedBookCollections = [];
    
    collectionsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Create main book collection record
        bookCollections.push({
            id: doc.id,
            title: getEnglishContent(data.name, 'Unknown Collection'),
            imageUrl: data.featuredImage || '', // Firebase: featuredImage → Prisma: imageUrl
            slug: data.slug || doc.id,
            books: data.books || [],
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
        });

        // Create translated book collection records
        if (data.name && typeof data.name === 'object') {
            const languages = getAvailableLanguages(data.name);
            languages.forEach(lang => {
                if (data.name[lang]) {
                    translatedBookCollections.push({
                        title: data.name[lang],
                        description: data.description?.[lang] || '',
                        language: lang,
                        bookCollectionId: doc.id,
                        createdAt: convertTimestamp(data.createdAt),
                        updatedAt: convertTimestamp(data.updatedAt),
                    });
                }
            });
        }
    });

    if (bookCollections.length > 0) {
        await prisma.bookCollection.createMany({
            data: bookCollections,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${bookCollections.length} book collections`);
    }

    if (translatedBookCollections.length > 0) {
        await prisma.translatedBookCollection.createMany({
            data: translatedBookCollections,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${translatedBookCollections.length} translated book collections`);
    }
}

async function migratePodcastCollections() {
    console.log('🔄 Migrating podcast collections...');
    
    const collectionsSnapshot = await db.collection('podcastCollections').get();
    const podcastCollections = [];
    const translatedPodcastCollections = [];
    
    collectionsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Create main podcast collection record
        podcastCollections.push({
            id: doc.id,
            name: getEnglishContent(data.name, 'Unknown Collection'),
            imageUrl: data.featuredImage || '', // Firebase: featuredImage → Prisma: imageUrl
            slug: data.slug || doc.id,
            podcastsIds: data.podcasts || [],
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
        });

        // Create translated podcast collection records
        if (data.name && typeof data.name === 'object') {
            const languages = getAvailableLanguages(data.name);
            languages.forEach(lang => {
                if (data.name[lang]) {
                    translatedPodcastCollections.push({
                        name: data.name[lang],
                        description: data.description?.[lang] || '',
                        language: lang,
                        podcastCollectionId: doc.id,
                        createdAt: convertTimestamp(data.createdAt),
                        updatedAt: convertTimestamp(data.updatedAt),
                    });
                }
            });
        }
    });

    if (podcastCollections.length > 0) {
        await prisma.podcastCollection.createMany({
            data: podcastCollections,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${podcastCollections.length} podcast collections`);
    }

    if (translatedPodcastCollections.length > 0) {
        await prisma.translatedPodcastCollection.createMany({
            data: translatedPodcastCollections,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${translatedPodcastCollections.length} translated podcast collections`);
    }
}

async function migrateDynamicPages() {
    console.log('🔄 Migrating dynamic pages...');
    
    const pagesSnapshot = await db.collection('pages').get();
    const dynamicPages = [];
    const dynamicPageBlocks = [];
    
    pagesSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Create main dynamic page record
        dynamicPages.push({
            id: doc.id,
            title: getEnglishContent(data.name, 'Unknown Page'),
            slug: data.slug || doc.id,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
        });

        // Create dynamic page blocks from sections
        if (data.sections && Array.isArray(data.sections)) {
            data.sections.forEach((section, index) => {
                // Map Firebase section types to PostgreSQL types
                const type = section.type || 'unknown';
                const viewType = section.viewType || 'default';
                
                // Prepare data based on section type
                let blockData = {};
                if (section.collectionIds) {
                    blockData.collectionIds = section.collectionIds;
                }
                if (section.podcastCollectionIds) {
                    blockData.podcastCollectionIds = section.podcastCollectionIds;
                }
                if (section.categoryIds) {
                    blockData.categoryIds = section.categoryIds;
                }

                // Prepare metadata
                let metadata = {
                    title: section.title || {},
                    subtitle: section.subtitle || {},
                    tags: section.tags || [],
                    showBackgroundImage: section.showBackgroundImage || false,
                    showMoreButton: section.showMoreButton || false,
                };

                dynamicPageBlocks.push({
                    pageId: doc.id,
                    type: type,
                    viewType: viewType,
                    imageUrl: section.backgroundImageUrl || null,
                    metadata: metadata,
                    order: section.order || index,
                    data: blockData,
                });
            });
        }
    });

    if (dynamicPages.length > 0) {
        await prisma.dynamicPage.createMany({
            data: dynamicPages,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${dynamicPages.length} dynamic pages`);
    }

    if (dynamicPageBlocks.length > 0) {
        await prisma.dynamicPageBlock.createMany({
            data: dynamicPageBlocks,
            skipDuplicates: true,
        });
        console.log(`✅ Migrated ${dynamicPageBlocks.length} dynamic page blocks`);
    }
}

async function clearExistingData() {
    console.log('🔄 Clearing existing partial data...');
    
    try {
        // Clear in reverse order to respect foreign key constraints
        await prisma.dynamicPageBlock.deleteMany({});
        await prisma.dynamicPage.deleteMany({});
        await prisma.translatedPodcastCollection.deleteMany({});
        await prisma.podcastCollection.deleteMany({});
        await prisma.translatedBookCollection.deleteMany({});
        await prisma.bookCollection.deleteMany({});
        await prisma.translatedPodcast.deleteMany({});
        await prisma.translatedSummary.deleteMany({});
        await prisma.summary.deleteMany({});
        await prisma.translatedBook.deleteMany({});
        await prisma.userProgress.deleteMany({});
        await prisma.bookMark.deleteMany({});
        await prisma.translatedCategory.deleteMany({});
        await prisma.translatedAuthor.deleteMany({});
        
        // Clear many-to-many relationships
        await prisma.$executeRaw`DELETE FROM "_AuthorToBook"`;
        await prisma.$executeRaw`DELETE FROM "_BookToCategory"`;
        await prisma.$executeRaw`DELETE FROM "_CategoryToPodcast"`;
        await prisma.$executeRaw`DELETE FROM "_Guests"`;
        await prisma.$executeRaw`DELETE FROM "_PodcastToAuthor"`;
        
        // Clear main tables
        await prisma.podcast.deleteMany({});
        await prisma.book.deleteMany({});
        await prisma.category.deleteMany({});
        await prisma.author.deleteMany({});
        await prisma.userPreferences.deleteMany({});
        await prisma.user.deleteMany({});
        
        console.log('✅ Cleared existing data');
    } catch (error) {
        console.warn('⚠️  Some data could not be cleared (this is normal for a fresh database):', error.message);
    }
}

async function runMigration() {
    console.log('🚀 Starting Firebase to PostgreSQL migration...\n');
    
    try {
        // Clear existing data first (optional - comment out if you want to preserve existing data)
        await clearExistingData();
        
        // Run migrations in order (respecting foreign key dependencies)
        await migrateUsers();
        await migrateAuthors();
        await migrateCategories();
        await migrateBooks();
        await migrateSummaries();
        await migratePodcasts();
        await migrateBookCollections();
        await migratePodcastCollections();
        await migrateDynamicPages();
        
        console.log('\n🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
runMigration().catch(console.error);
