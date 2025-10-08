import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateCoverUrls() {
  console.log("Starting cover URL migration...\n");

  try {
    // Step 1: Migrate Book coverUrls from English TranslatedBook records
    console.log("1. Migrating Book cover URLs from English translations...");
    
    const englishBooks = await prisma.translatedBook.findMany({
      where: {
        language: "en",
        coverUrl: {
          not: null
        }
      },
      select: {
        bookId: true,
        coverUrl: true,
      }
    });

    console.log(`   Found ${englishBooks.length} English book translations with cover URLs`);

    let booksUpdated = 0;
    for (const translatedBook of englishBooks) {
      if (translatedBook.coverUrl) {
        await prisma.book.update({
          where: { id: translatedBook.bookId },
          data: { coverUrl: translatedBook.coverUrl }
        });
        booksUpdated++;
      }
    }

    console.log(`   ✓ Updated ${booksUpdated} books with cover URLs\n`);

    // Step 2: Migrate Podcast imageUrls TO English TranslatedPodcast records
    console.log("2. Migrating Podcast image URLs to English translations...");
    
    const podcasts = await prisma.podcast.findMany({
      select: {
        id: true,
        imageUrl: true,
      }
    });

    console.log(`   Found ${podcasts.length} podcasts with image URLs`);

    let podcastsUpdated = 0;
    for (const podcast of podcasts) {
      if (podcast.imageUrl) {
        // Find English translation for this podcast
        const englishTranslation = await prisma.translatedPodcast.findUnique({
          where: {
            podcastId_language: {
              podcastId: podcast.id,
              language: "en"
            }
          }
        });

        if (englishTranslation) {
          await prisma.translatedPodcast.update({
            where: { id: englishTranslation.id },
            data: { imageUrl: podcast.imageUrl }
          });
          podcastsUpdated++;
        }
      }
    }

    console.log(`   ✓ Updated ${podcastsUpdated} English podcast translations with image URLs\n`);

    console.log("Migration completed successfully! ✓");
    console.log("\nSummary:");
    console.log(`- Books updated: ${booksUpdated}`);
    console.log(`- Podcast translations updated: ${podcastsUpdated}`);

  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateCoverUrls()
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
