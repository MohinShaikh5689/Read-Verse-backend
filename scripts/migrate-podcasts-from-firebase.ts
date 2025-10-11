import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Initialize Firebase Admin
let firebaseApp: App;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID?.trim();
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.trim()?.replace(/\\n/g, '\n');
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL?.trim();

if (!getApps().length) {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    throw new Error('Firebase credentials are not properly configured');
  }

  firebaseApp = initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      privateKey: FIREBASE_PRIVATE_KEY,
      clientEmail: FIREBASE_CLIENT_EMAIL,
    }),
  });
} else {
  firebaseApp = getApps()[0];
}

const firestore: Firestore = getFirestore(firebaseApp);

interface FirebasePodcast {
  id: string;
  coverUrl?: string;
  title: string;
  description?: string;
  slug: string;
  categories?: string[];
  hosts?: string[]; // Author IDs
  speakers?: string[]; // Author IDs
  totalDuration?: number;
  availableLanguages?: string[];
  languageStatus?: {
    [key: string]: {
      published: boolean;
      audioEnabled?: boolean;
    };
  };
  status?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface FirebasePodcastLang {
  id: string;
  podcastId: string;
  language: string;
  coverUrl?: string;
  title: string;
  description?: string;
  summary?: string;
  audioUrl?: string;
  keyTakeaways?: string[];
  slug: string;
  createdAt?: any;
  updatedAt?: any;
}

interface FirebaseSummary {
  id: string;
  contentType?: string;
  contentId?: string;
  bookId?: string;
  podcastId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  content?: string;
  keyTakeaways?: string[];
  audioUrl?: string;
  duration?: number;
  slug?: string;
  availableLanguages?: string[];
  createdAt?: any;
  updatedAt?: any;
}

interface FirebaseSummaryLang {
  id: string;
  summaryId: string;
  contentType?: string;
  contentId?: string;
  bookId?: string;
  podcastId?: string;
  language: string;
  chapterTitle?: string;
  content?: string;
  keyTakeaways?: string[];
  audioUrl?: string;
  slug?: string;
  createdAt?: any;
  updatedAt?: any;
}

async function migratePodcasts() {
  console.log('🚀 Starting Podcast Migration from Firebase to PostgreSQL...\n');

  try {
    // Step 1: Fetch all podcasts from Firebase
    console.log('📥 Fetching podcasts from Firebase...');
    const podcastsSnapshot = await firestore.collection('podcasts').get();
    const podcasts: FirebasePodcast[] = podcastsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebasePodcast));
    console.log(`   Found ${podcasts.length} podcasts\n`);

    // Step 2: Fetch all podcast translations
    console.log('📥 Fetching podcast translations from Firebase...');
    const podcastLangSnapshot = await firestore.collection('podcast_lang').get();
    const podcastTranslations: FirebasePodcastLang[] = podcastLangSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebasePodcastLang));
    console.log(`   Found ${podcastTranslations.length} podcast translations\n`);

    // Step 3: Fetch all summaries (filtering for podcasts)
    console.log('📥 Fetching podcast summaries from Firebase...');
    const summariesSnapshot = await firestore.collection('summaries').get();
    const allSummaries: FirebaseSummary[] = summariesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseSummary));
    
    // Filter for podcast summaries (using podcastId or contentType === 'podcast')
    const podcastSummaries = allSummaries.filter(summary => 
      summary.podcastId || 
      (summary.contentType === 'podcast' && summary.contentId) ||
      // Also check if bookId actually refers to a podcast
      (summary.bookId && podcasts.some(p => p.id === summary.bookId))
    );
    console.log(`   Found ${podcastSummaries.length} podcast summaries (out of ${allSummaries.length} total summaries)\n`);

    // Step 4: Fetch summary translations for podcast summaries
    console.log('📥 Fetching podcast summary translations from Firebase...');
    const summaryLangSnapshot = await firestore.collection('summaries_lang').get();
    const allSummaryTranslations: FirebaseSummaryLang[] = summaryLangSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseSummaryLang));
    
    const podcastSummaryIds = new Set(podcastSummaries.map(s => s.id));
    const podcastSummaryTranslations = allSummaryTranslations.filter(trans =>
      podcastSummaryIds.has(trans.summaryId)
    );
    console.log(`   Found ${podcastSummaryTranslations.length} podcast summary translations\n`);

    let migratedPodcasts = 0;
    let migratedTranslations = 0;
    let migratedSummaries = 0;
    let migratedSummaryTranslations = 0;
    let skippedPodcasts = 0;
    let errors: string[] = [];

    // Step 5: Migrate each podcast
    console.log('🔄 Starting podcast migration...\n');

    for (const podcast of podcasts) {
      try {
        console.log(`   Processing podcast: ${podcast.title} (${podcast.id})`);

        // Check if podcast already exists in PostgreSQL
        const existingPodcast = await prisma.podcast.findUnique({
          where: { id: podcast.id }
        });

        if (existingPodcast) {
          console.log(`      ⏭️  Podcast already exists, skipping...`);
          skippedPodcasts++;
          continue;
        }

        // Determine published status from languageStatus or default to false
        const published = podcast.languageStatus?.en?.published ?? false;

        // Get categories, speakers, and guests
        const categoryIds = podcast.categories || [];
        const speakerIds = podcast.speakers || podcast.hosts || [];
        const guestIds = podcast.hosts || [];

        // Validate that referenced categories and authors exist
        const validCategoryIds: string[] = [];
        for (const catId of categoryIds) {
          const categoryExists = await prisma.category.findUnique({ where: { id: catId } });
          if (categoryExists) {
            validCategoryIds.push(catId);
          } else {
            console.log(`      ⚠️  Category ${catId} not found, skipping...`);
          }
        }

        const validSpeakerIds: string[] = [];
        for (const authorId of speakerIds) {
          const authorExists = await prisma.author.findUnique({ where: { id: authorId } });
          if (authorExists) {
            validSpeakerIds.push(authorId);
          } else {
            console.log(`      ⚠️  Speaker ${authorId} not found, skipping...`);
          }
        }

        const validGuestIds: string[] = [];
        for (const authorId of guestIds) {
          const authorExists = await prisma.author.findUnique({ where: { id: authorId } });
          if (authorExists) {
            validGuestIds.push(authorId);
          } else {
            console.log(`      ⚠️  Guest ${authorId} not found, skipping...`);
          }
        }

        // Create podcast in PostgreSQL
        await prisma.podcast.create({
          data: {
            id: podcast.id,
            title: podcast.title,
            imageUrl: podcast.coverUrl || '',
            totalDuration: podcast.totalDuration || 0,
            published: published,
            slug: podcast.slug,
            createdAt: podcast.createdAt?.toDate() || new Date(),
            updatedAt: podcast.updatedAt?.toDate() || new Date(),
            categories: {
              connect: validCategoryIds.map(id => ({ id }))
            },
            speakers: {
              connect: validSpeakerIds.map(id => ({ id }))
            },
            guests: {
              connect: validGuestIds.map(id => ({ id }))
            }
          }
        });

        console.log(`      ✅ Podcast migrated`);
        migratedPodcasts++;

        // Get podcast summaries for this podcast
        const podcastSums = podcastSummaries.filter(s => 
          s.podcastId === podcast.id || 
          s.contentId === podcast.id ||
          s.bookId === podcast.id
        );

        // Build a map of summary data by language
        const summaryDataByLang: { 
          [language: string]: { 
            content: string; 
            keyTakeaways: string[]; 
            audioUrl: string | null;
          } 
        } = {};

        // First, get English summary from the main summaries collection if available
        for (const summary of podcastSums) {
          if (summary.content) {
            summaryDataByLang['en'] = {
              content: summary.content,
              keyTakeaways: summary.keyTakeaways || [],
              audioUrl: summary.audioUrl || null
            };
          }
        }

        // Then, get translated summaries from summaries_lang
        for (const summary of podcastSums) {
          const summaryTrans = podcastSummaryTranslations.filter(t => t.summaryId === summary.id);
          for (const trans of summaryTrans) {
            summaryDataByLang[trans.language] = {
              content: trans.content || '',
              keyTakeaways: trans.keyTakeaways || [],
              audioUrl: trans.audioUrl || null
            };
          }
        }

        // Create English translation from main podcast data
        const englishSummaryData = summaryDataByLang['en'];
        try {
          await prisma.translatedPodcast.create({
            data: {
              title: podcast.title,
              description: podcast.description || '',
              summary: englishSummaryData?.content || '',
              audioUrl: englishSummaryData?.audioUrl || null,
              imageUrl: podcast.coverUrl || null,
              keyTakeaways: englishSummaryData?.keyTakeaways || [],
              language: 'en',
              podcastId: podcast.id,
            }
          });
          console.log(`      ✅ English translation created${englishSummaryData ? ' (with summary)' : ''}`);
          migratedTranslations++;
        } catch (transError: any) {
          const errorMsg = `Failed to create English translation for podcast ${podcast.title}: ${transError.message}`;
          console.log(`      ❌ ${errorMsg}`);
          errors.push(errorMsg);
        }

        // Migrate non-English podcast translations from podcast_lang
        const translations = podcastTranslations.filter(t => t.podcastId === podcast.id);
        for (const translation of translations) {
          try {
            // Get the summary data for this language if it exists
            const summaryData = summaryDataByLang[translation.language];
            
            // Use summary data from summaries collection if available, otherwise from podcast_lang
            const summaryContent = summaryData?.content || translation.summary || '';
            const keyTakeaways = summaryData?.keyTakeaways || translation.keyTakeaways || [];
            const audioUrl = summaryData?.audioUrl || translation.audioUrl || null;

            await prisma.translatedPodcast.create({
              data: {
                id: translation.id,
                title: translation.title,
                description: translation.description || '',
                summary: summaryContent,
                audioUrl: audioUrl,
                imageUrl: translation.coverUrl || null,
                keyTakeaways: keyTakeaways,
                language: translation.language,
                podcastId: podcast.id,
              }
            });
            console.log(`      ✅ Translation migrated: ${translation.language}${summaryData ? ' (with summary)' : ''}`);
            migratedTranslations++;
          } catch (transError: any) {
            const errorMsg = `Failed to migrate translation ${translation.language} for podcast ${podcast.title}: ${transError.message}`;
            console.log(`      ❌ ${errorMsg}`);
            errors.push(errorMsg);
          }
        }

        if (podcastSums.length > 0) {
          console.log(`      ℹ️  Merged ${podcastSums.length} summary records into translations`);
          migratedSummaries += podcastSums.length;
          migratedSummaryTranslations += Object.keys(summaryDataByLang).length;
        }

      } catch (error: any) {
        const errorMsg = `Failed to migrate podcast ${podcast.title}: ${error.message}`;
        console.log(`      ❌ ${errorMsg}`);
        errors.push(errorMsg);
        skippedPodcasts++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Podcasts migrated: ${migratedPodcasts}`);
    console.log(`✅ Translations migrated: ${migratedTranslations}`);
    console.log(`✅ Summaries merged: ${migratedSummaries}`);
    console.log(`✅ Summary translations merged: ${migratedSummaryTranslations}`);
    console.log(`⏭️  Podcasts skipped (already exist): ${skippedPodcasts}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Errors encountered: ${errors.length}`);
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Migration completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

// Run the migration
migratePodcasts()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  });
