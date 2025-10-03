# Firebase to PostgreSQL Migration Script

This script migrates data from your Firebase Firestore database to PostgreSQL using your existing Prisma schema.

## Prerequisites

1. **Firebase Admin SDK Setup**: Ensure your `.env` file contains:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   DATABASE_URL=your-postgresql-connection-string
   DIRECT_URL=your-postgresql-direct-connection-string
   ```

2. **PostgreSQL Database**: Make sure your PostgreSQL database is running and accessible.

3. **Prisma Setup**: Ensure Prisma is properly configured and your database schema is up to date:
   ```bash
   npx prisma db push
   ```

## Running the Migration

```bash
npm run migrate:firebase
```

## What Gets Migrated

### 1. Users
- Firebase `users` collection → PostgreSQL `User` table
- Maps: `avatarUrl` → `profilePicture`
- Sets default values for missing fields (`gender`, `dob`)

### 2. Authors & Translations
- Firebase `authors` collection → PostgreSQL `Author` + `TranslatedAuthor` tables
- Extracts English content for main table
- Creates translation records for other languages
- Maps: `avatarUrl` → `imageUrl`, multilingual `name`/`about` → separate translation records

### 3. Categories & Translations
- Firebase `categories` collection → PostgreSQL `Category` + `TranslatedCategory` tables
- Maps: `icon` → `categorySVG`, `featuredImage` → `categoryImage`
- Handles multilingual `name`/`description`

### 4. Books & Translations
- Firebase `books` + `book_lang` collections → PostgreSQL `Book` + `TranslatedBook` tables
- Handles many-to-many relationships with authors and categories
- Maps translated content from separate collection

### 5. Summaries & Translations
- Firebase `summaries` + `summaries_lang` collections → PostgreSQL `Summary` + `TranslatedSummary` tables
- Only migrates book-related summaries (filters out podcast summaries)
- Maps: `chapterTitle` → `title`, `chapterNumber` → `order`

### 6. Podcasts & Translations
- Firebase `podcasts` + `podcast_lang` collections → PostgreSQL `Podcast` + `TranslatedPodcast` tables
- Handles relationships with speakers, guests, and categories
- Maps: `hosts` → `speakers`, `coverUrl` → `imageUrl`

### 7. Collections & Translations
- Firebase `bookCollections` → PostgreSQL `BookCollection` + `TranslatedBookCollection`
- Firebase `podcastCollections` → PostgreSQL `PodcastCollection` + `TranslatedPodcastCollection`
- Maps: `featuredImage` → `imageUrl`, multilingual content

### 8. Dynamic Pages
- Firebase `pages` collection → PostgreSQL `DynamicPage` + `DynamicPageBlock` tables
- Converts `sections` array to separate `DynamicPageBlock` records
- Preserves section metadata and configuration

## Key Mapping Details

### Timestamp Conversion
- Firebase timestamps are automatically converted to JavaScript Date objects
- Handles various Firebase timestamp formats

### Multilingual Content
- English content goes to main tables
- Other languages create separate translation records
- Fallback to first available language if English not found

### Array Relationships
- Firebase arrays of IDs are converted to Prisma many-to-many relationships
- Uses `connect` operations to establish relationships after record creation

### Missing Fields
- Fields not present in Firebase get sensible defaults
- Optional fields are set to `null`
- Required fields get empty strings or default values

## Error Handling

- Uses `skipDuplicates: true` to handle re-runs
- Continues migration even if some relationships fail to connect
- Logs warnings for failed relationship connections
- Maintains data integrity with proper transaction handling

## Post-Migration Verification

After migration, verify your data:

1. **Check record counts**:
   ```sql
   SELECT 'users' as table_name, COUNT(*) as count FROM "User"
   UNION ALL
   SELECT 'authors', COUNT(*) FROM "Author"
   UNION ALL
   SELECT 'books', COUNT(*) FROM "Book"
   -- ... etc
   ```

2. **Verify relationships**:
   ```sql
   SELECT b.title, COUNT(a.id) as author_count 
   FROM "Book" b 
   LEFT JOIN "_AuthorToBook" ab ON b.id = ab."B"
   LEFT JOIN "Author" a ON ab."A" = a.id 
   GROUP BY b.id, b.title;
   ```

3. **Check translations**:
   ```sql
   SELECT language, COUNT(*) as count 
   FROM "TranslatedBook" 
   GROUP BY language;
   ```

## Troubleshooting

### Common Issues

1. **Duplicate Key Errors**: The script uses `skipDuplicates: true`, so re-running is safe
2. **Foreign Key Violations**: Ensure all referenced records exist before relationships
3. **Timestamp Errors**: Check Firebase timestamp format in your data
4. **Memory Issues**: For large datasets, consider batch processing

### Performance Tips

- Run on a fast network connection to Firebase
- Ensure PostgreSQL has adequate resources
- Consider running during low-traffic periods
- Monitor database connection limits

## Customization

To modify the migration for your specific needs:

1. **Add new field mappings** in the respective migration functions
2. **Modify data transformations** in helper functions
3. **Add custom validation** before record creation
4. **Implement batch processing** for large datasets

The script is designed to be idempotent - you can run it multiple times safely.


