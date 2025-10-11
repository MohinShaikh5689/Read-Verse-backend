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

interface FirebasePodcastCollection {
  id: string;
  name?: {
    [key: string]: string; // e.g., { "en": "Collection Name", "es": "Nombre de Colección" }
  };
  description?: {
    [key: string]: string;
  };
  podcasts?: string[]; // Array of podcast IDs
  featuredImage?: string;
  slug: string;
  createdAt?: any;
  updatedAt?: any;
}

async function migratePodcastCollections() {
  console.log('🚀 Starting Podcast Collections Migration from Firebase to PostgreSQL...\n');

  try {
    // Step 1: Fetch all podcast collections from Firebase
    console.log('📥 Fetching podcast collections from Firebase...');
    const collectionsSnapshot = await firestore.collection('podcastCollections').get();
    const collections: FirebasePodcastCollection[] = collectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebasePodcastCollection));
    console.log(`   Found ${collections.length} podcast collections\n`);

    let migratedCollections = 0;
    let migratedTranslations = 0;
    let skippedCollections = 0;
    let errors: string[] = [];

    // Step 2: Migrate each collection
    console.log('🔄 Starting podcast collection migration...\n');

    for (const collection of collections) {
      try {
        console.log(`   Processing collection: ${collection.name?.en || collection.slug} (${collection.id})`);

        // Check if collection already exists in PostgreSQL
        const existingCollection = await prisma.podcastCollection.findUnique({
          where: { id: collection.id }
        });

        if (existingCollection) {
          console.log(`      ⏭️  Collection already exists, skipping...`);
          skippedCollections++;
          continue;
        }

        // Get English name or use slug as fallback
        const englishName = collection.name?.en || collection.slug;
        const imageUrl = collection.featuredImage || '';
        const podcastIds = collection.podcasts || [];

        // Validate that referenced podcasts exist
        const validPodcastIds: string[] = [];
        for (const podcastId of podcastIds) {
          const podcastExists = await prisma.podcast.findUnique({ where: { id: podcastId } });
          if (podcastExists) {
            validPodcastIds.push(podcastId);
          } else {
            console.log(`      ⚠️  Podcast ${podcastId} not found, skipping from collection...`);
          }
        }

        // Create podcast collection in PostgreSQL
        await prisma.podcastCollection.create({
          data: {
            id: collection.id,
            name: englishName,
            imageUrl: imageUrl,
            slug: collection.slug,
            podcastsIds: validPodcastIds,
            createdAt: collection.createdAt?.toDate() || new Date(),
            updatedAt: collection.updatedAt?.toDate() || new Date(),
          }
        });

        console.log(`      ✅ Collection migrated with ${validPodcastIds.length} podcasts`);
        migratedCollections++;

        // Migrate translations if name/description are multilingual objects
        if (collection.name && typeof collection.name === 'object') {
          for (const [language, name] of Object.entries(collection.name)) {
            // Skip English as it's already in the main collection
            if (language === 'en') continue;

            try {
              const description = collection.description?.[language] || '';
              
              // Check if translation already exists
              const existingTranslation = await prisma.translatedPodcastCollection.findUnique({
                where: {
                  podcastCollectionId_language: {
                    podcastCollectionId: collection.id,
                    language: language
                  }
                }
              });

              if (existingTranslation) {
                console.log(`      ⏭️  Translation ${language} already exists, skipping...`);
                continue;
              }

              await prisma.translatedPodcastCollection.create({
                data: {
                  name: name as string,
                  description: description as string,
                  language: language,
                  podcastCollectionId: collection.id,
                }
              });
              console.log(`      ✅ Translation migrated: ${language}`);
              migratedTranslations++;
            } catch (transError: any) {
              const errorMsg = `Failed to migrate translation ${language} for collection ${collection.slug}: ${transError.message}`;
              console.log(`      ❌ ${errorMsg}`);
              errors.push(errorMsg);
            }
          }
        }

      } catch (error: any) {
        const errorMsg = `Failed to migrate collection ${collection.slug}: ${error.message}`;
        console.log(`      ❌ ${errorMsg}`);
        errors.push(errorMsg);
        skippedCollections++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Podcast Collections migrated: ${migratedCollections}`);
    console.log(`✅ Translations migrated: ${migratedTranslations}`);
    console.log(`⏭️  Collections skipped (already exist): ${skippedCollections}`);
    
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
migratePodcastCollections()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  });
