import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearPodcasts() {
  console.log('🗑️  Clearing all podcast data from PostgreSQL...\n');

  try {
    // Delete in correct order due to foreign key constraints
    console.log('   Deleting TranslatedPodcast records...');
    const deletedTranslations = await prisma.translatedPodcast.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTranslations.count} translations`);

    console.log('   Deleting Podcast records...');
    const deletedPodcasts = await prisma.podcast.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPodcasts.count} podcasts`);

    console.log('   Deleting PodcastCollection records...');
    const deletedPodcastCollections = await prisma.podcastCollection.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPodcastCollections.count} podcast collections`);

    console.log('\n✅ All podcast data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing podcast data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearPodcasts()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
