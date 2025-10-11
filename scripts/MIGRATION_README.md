# Migration Scripts

This directory contains scripts for migrating data from Firebase Firestore to PostgreSQL.

## Prerequisites

Before running any migration scripts, ensure you have:

1. **Firebase credentials** configured in your `.env` file:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   ```

2. **PostgreSQL database** configured in your `.env` file:
   ```env
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   ```

3. **Dependencies installed**:
   ```bash
   pnpm install
   ```

4. **Prisma schema generated**:
   ```bash
   pnpm prisma generate
   ```

## Migration Scripts

### 1. Migrate Podcasts from Firebase
Migrates podcast data from Firebase Firestore to PostgreSQL.

```bash
pnpm run migrate:podcasts
```

**What it migrates:**
- ✅ Main podcast data (title, slug, imageUrl, totalDuration, published status)
- ✅ Podcast translations (all languages)
- ✅ Category relationships
- ✅ Speaker relationships (authors)
- ✅ Guest relationships (authors)
- ℹ️ Podcast summaries (logged but not migrated - no schema support yet)

**Important Notes:**
- The script handles the Firebase schema where podcast IDs might be stored under `bookId` in summaries
- It filters summaries to identify podcast-specific summaries using:
  - `podcastId` field
  - `contentType === 'podcast'` and `contentId`
  - Cross-referencing `bookId` with actual podcast IDs
- Categories and authors must already exist in PostgreSQL
- Skips podcasts that already exist (safe to run multiple times)

**Firebase Collections Used:**
- `podcasts` - Main podcast data
- `podcast_lang` - Podcast translations
- `summaries` - Podcast summaries (for reference only)
- `summaries_lang` - Podcast summary translations (for reference only)

### 2. Migrate Podcast Collections from Firebase
Migrates podcast collection data from Firebase Firestore to PostgreSQL.

```bash
pnpm run migrate:podcast-collections
```

**What it migrates:**
- ✅ Podcast collection data (name, slug, imageUrl)
- ✅ Collection translations (all languages)
- ✅ Podcast IDs array (validates that podcasts exist)

**Important Notes:**
- Podcasts must be migrated first (run `migrate:podcasts` before this)
- Handles multilingual Firebase schema where name/description are objects with language keys
- Skips invalid podcast IDs (podcasts that don't exist in PostgreSQL)
- Skips collections that already exist (safe to run multiple times)

**Firebase Collections Used:**
- `podcastCollections` - Main collection data with multilingual fields

### 3. Migrate Cover URLs (Books & Podcasts)
Syncs cover URLs between main tables and translated tables.

```bash
pnpm run migrate:cover-urls
```

**What it migrates:**
- ✅ Copies English TranslatedBook coverUrls to Book table
- ✅ Copies Podcast imageUrls to English TranslatedPodcast records

**Use Case:**
- Ensures consistency between main and translated tables
- Useful after initial data imports

## Migration Order

For a complete migration from Firebase to PostgreSQL, run scripts in this order:

1. **Authors** (if not done already)
2. **Categories** (if not done already)
3. **Podcasts**
   ```bash
   pnpm run migrate:podcasts
   ```
4. **Podcast Collections**
   ```bash
   pnpm run migrate:podcast-collections
   ```
5. **Cover URL Sync** (optional, for consistency)
   ```bash
   pnpm run migrate:cover-urls
   ```

## Troubleshooting

### Firebase Connection Issues
If you get Firebase credential errors:
- Verify your `.env` file has the correct Firebase credentials
- Ensure the private key is properly escaped (newlines as `\n`)
- Check that your Firebase service account has Firestore read permissions

### Missing Related Data
If you see warnings about missing categories or authors:
- Ensure those records exist in PostgreSQL first
- The script will skip invalid references but continue migration

### Duplicate Key Errors
If you get duplicate key errors:
- The scripts check for existing records and skip them
- If you see errors, ensure your database constraints match the Prisma schema

## Schema Differences

### Firebase Podcast Schema
```javascript
{
  id: "string",
  coverUrl: "string",
  title: "string",
  slug: "string",
  categories: ["cat_id1", "cat_id2"],
  hosts: ["author_id1"],
  speakers: ["author_id2"],
  totalDuration: 60,
  languageStatus: {
    en: { published: true, audioEnabled: true },
    es: { published: false, audioEnabled: false }
  }
}
```

### PostgreSQL Podcast Schema
```prisma
model Podcast {
  id            String
  title         String
  imageUrl      String
  totalDuration Int
  published     Boolean  // Derived from languageStatus.en.published
  slug          String   @unique
  categories    Category[]
  speakers      Author[]  @relation("Speakers")
  guests        Author[]  @relation("Guests")
  translations  TranslatedPodcast[]
}
```

## Adding Podcast Summaries Support

If you need to migrate podcast summaries, you'll need to update the Prisma schema first:

1. Add a new model to `schema.prisma`:
```prisma
model PodcastSummary {
  id                String              @id @default(uuid())
  title             String
  order             Int
  podcastId         String
  podcast           Podcast             @relation(fields: [podcastId], references: [id], onDelete: Cascade)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  translations      TranslatedPodcastSummary[]

  @@unique([podcastId, order])
  @@index([podcastId])
}

model TranslatedPodcastSummary {
  id           String   @id @default(uuid())
  title        String
  content      String
  audioUrl     String?
  keyTakeaways String[]
  language     String
  summaryId    String
  summary      PodcastSummary  @relation(fields: [summaryId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([summaryId, language])
  @@index([language])
}
```

2. Run Prisma migration:
```bash
pnpm prisma migrate dev --name add_podcast_summaries
```

3. Update the migration script to include summary migration logic

## Logs and Output

Each migration script provides detailed console output:
- 📥 Fetching data indicators
- ✅ Success messages
- ⚠️ Warning messages for skipped items
- ❌ Error messages with details
- 📊 Final summary with counts

## Safety Features

All migration scripts include:
- ✅ Duplicate checking (won't re-migrate existing data)
- ✅ Validation of foreign key references
- ✅ Error handling with detailed logging
- ✅ Transaction support (where applicable)
- ✅ Graceful database disconnection

## Support

For issues or questions about migrations:
1. Check the console output for detailed error messages
2. Verify your Firebase and PostgreSQL credentials
3. Ensure related data (authors, categories) exists before migrating
4. Review the Firebase schema documentation in `firebase-schema.md`
