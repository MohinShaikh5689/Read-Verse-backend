# Nosis Admin API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Common Response Format](#common-response-format)
5. [Endpoints](#endpoints)
   - [Users](#users)
   - [User Preferences](#user-preferences)
   - [User Progress](#user-progress)
   - [Bookmarks](#bookmarks)
   - [Books](#books)
   - [Book Collections](#book-collections)
   - [Book Summaries](#book-summaries)
   - [Authors](#authors)
   - [Categories](#categories)
   - [Podcasts](#podcasts)
   - [Podcast Collections](#podcast-collections)

---

## Overview

The Nosis Admin API is a RESTful API built with Fastify and TypeScript. It provides endpoints for managing books, podcasts, authors, categories, users, and their related data. The API supports multi-language content and uses Firebase for authentication and file storage.

### Technology Stack
- **Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Firebase Admin SDK
- **File Storage**: Firebase Storage
- **Language**: TypeScript

---

## Authentication

Most endpoints require Firebase authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

### Getting a Test Token (Development Only)
```http
POST /api/v1/users/token
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

## Base URL

```
Development: http://localhost:3000/api/v1
Production: <your-production-url>/api/v1
```

---

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Error description"
}
```

### Pagination Response
```json
{
  "items": [ /* array of items */ ],
  "page": 1,
  "limit": 10,
  "total": 100
}
```

---

## Endpoints

## Users

### Get Current User (Me)
Retrieves the authenticated user's profile with preferences, progress, and bookmarks.

```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "gender": "male",
  "profilePicture": "https://...",
  "dob": "1990-01-01",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "userPreferences": {
    "id": "pref_id",
    "allowReminders": true,
    "appLanguage": "en",
    "authorPreferences": ["author_id"],
    "categoryPreferences": ["category_id"],
    "bookPreferences": ["book_id"]
  },
  "userProgress": [],
  "bookmarks": []
}
```

### Create User
```http
POST /api/v1/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "gender": "male",
  "profilePicture": "https://...",
  "dob": "1990-01-01"
}
```

### Update User
```http
PATCH /api/v1/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "gender": "female"
}
```

### Get User by ID
```http
GET /api/v1/users/:id
Authorization: Bearer <token>
```

### Get User by Email
```http
GET /api/v1/users/email/:email
Authorization: Bearer <token>
```

### Get All Users (Paginated)
```http
GET /api/v1/users?page=1
Authorization: Bearer <token>
```

### Delete User
```http
DELETE /api/v1/users
Authorization: Bearer <token>
```

---

## User Preferences

### Create/Update User Preferences
Creates new preferences or updates existing ones if they already exist.

```http
POST /api/v1/users/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "allowReminders": true,
  "appLanguage": "en",
  "authorPreferences": ["author_id"],
  "categoryPreferences": ["category_id"],
  "bookPreferences": ["book_id"]
}
```

### Update User Preferences
```http
PATCH /api/v1/users/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "allowReminders": false,
  "appLanguage": "hi"
}
```

---

## User Progress

### Create User Progress
```http
POST /api/v1/users/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "book_id",
  "completed": false,
  "lastChapter": 5
}
```

### Update User Progress
```http
PATCH /api/v1/users/progress/:bookId
Authorization: Bearer <token>
Content-Type: application/json

{
  "completed": true,
  "lastChapter": 10
}
```

---

## Bookmarks

### Create Bookmark
```http
POST /api/v1/users/bookmarks/:bookId
Authorization: Bearer <token>
```

### Delete Bookmark
```http
DELETE /api/v1/users/bookmarks/:id
Authorization: Bearer <token>
```

### Get User Bookmarks (Paginated)
```http
GET /api/v1/users/bookmarks?page=1
Authorization: Bearer <token>
```

---

## Books

### Get All Books (Paginated)
```http
GET /api/v1/books?page=1&language=en
```

**Query Parameters:**
- `page` (required): Page number
- `language` (required): Language code (en, hi, ar, bn) or "all"

**Response:**
```json
{
  "books": [
    {
      "bookId": "book_id",
      "title": "Book Title",
      "description": "Book description",
      "published": true,
      "audioEnabled": true,
      "coverUrl": "https://...",
      "book": {
        "slug": "book-slug",
        "authors": [{"id": "author_id"}],
        "totalDuration": 120
      }
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 100
}
```

### Get Book by ID
```http
GET /api/v1/books/:id?language=en
```

**Query Parameters:**
- `language` (required): Language code (en, hi, ar, bn) or "all"

**Response (language-specific):**
```json
{
  "bookId": "book_id",
  "title": "Book Title",
  "description": "Book description",
  "published": true,
  "audioEnabled": true,
  "book": {
    "slug": "book-slug",
    "authors": [{"id": "author_id"}],
    "totalDuration": 120,
    "categories": [{"id": "category_id"}],
    "summaries": [
      {
        "id": "summary_id",
        "order": 1,
        "translatedSummary": [
          {
            "title": "Summary Title",
            "language": "en"
          }
        ]
      }
    ]
  }
}
```

### Get Book by Slug
```http
GET /api/v1/books/slug/:slug?language=en
```

### Search Books
```http
GET /api/v1/books/search?query=mindfulness&language=en&page=1
```

### Create Book (Multipart)
```http
POST /api/v1/books
Content-Type: multipart/form-data

{
  "english": {
    "title": "Book Title",
    "description": "Description",
    "published": true,
    "audioEnabled": true,
    "language": "en"
  },
  "slug": "book-slug",
  "authors": ["author_id"],
  "totalDuration": 120,
  "categories": ["category_id"],
  "imageFile": <file>
}
```

### Update Book (Multipart)
```http
PUT /api/v1/books/:id
Content-Type: multipart/form-data
```

### Delete Book
```http
DELETE /api/v1/books/:id
```

### Get Books by Author ID
```http
GET /api/v1/authors/:authorId/books?language=en&page=1
```

### Get Books by Category Slug
```http
GET /api/v1/categories/:slug/books?language=en&page=1
```

### Get Books by Category IDs
```http
POST /api/v1/books/by-category-ids?language=en&page=1
Content-Type: application/json

{
  "categoryIds": ["category_id_1", "category_id_2"]
}
```

### Get Books by Author IDs
```http
POST /api/v1/books/by-author-ids?language=en&page=1
Content-Type: application/json

{
  "authorIds": ["author_id_1", "author_id_2"]
}
```

---

## Book Collections

### Get All Book Collections (Paginated)
```http
GET /api/v1/book-collections?page=1&language=en
```

**Response:**
```json
{
  "collections": [
    {
      "id": "collection_id",
      "title": "Collection Title",
      "description": "Collection description",
      "imageUrl": "https://...",
      "books": 10
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 20
}
```

### Get Book Collection by ID
```http
GET /api/v1/book-collections/:id?language=en&includeBooks=true
```

**Query Parameters:**
- `language` (required): Language code (en, hi, ar, bn) or "all"
- `includeBooks` (required): Boolean to include books in the collection

### Get Book Collections by IDs
```http
POST /api/v1/book-collections/by-ids
Content-Type: application/json

{
  "ids": ["collection_id_1", "collection_id_2"]
}
```

**Response:**
```json
[
  {
    "id": "collection_id",
    "title": "Collection Title",
    "imageUrl": "https://...",
    "slug": "collection-slug",
    "books": ["book_id_1", "book_id_2"],
    "translatedBookCollection": [
      {
        "title": "Collection Title",
        "description": "Collection description",
        "language": "en"
      }
    ]
  }
]
```

### Create Book Collection (Multipart)
```http
POST /api/v1/book-collections
Content-Type: multipart/form-data

{
  "english": {
    "title": "Collection Title",
    "description": "Description",
    "language": "en"
  },
  "slug": "collection-slug",
  "books": ["book_id_1", "book_id_2"],
  "imageFile": <file>
}
```

### Update Book Collection (Multipart)
```http
PATCH /api/v1/book-collections/:id
Content-Type: multipart/form-data
```

### Delete Book Collection
```http
DELETE /api/v1/book-collections/:id
```

---

## Book Summaries

### Create Book Summary
```http
POST /api/v1/books/:id/summary
Content-Type: multipart/form-data

{
  "title": "Summary Title",
  "order": 1,
  "english": {
    "title": "Summary Title",
    "content": "Summary content",
    "keyTakeaways": ["Key point 1", "Key point 2"],
    "language": "en"
  },
  "audioFile_en": <file>
}
```

### Update Book Summary
```http
PUT /api/v1/books/:id/summary/:summaryId
Content-Type: multipart/form-data
```

### Get Book Summaries
```http
GET /api/v1/books/:id/summaries?language=en
```

**Response:**
```json
[
  {
    "id": "summary_id",
    "title": "Summary Title",
    "order": 1,
    "translatedSummary": [
      {
        "title": "Summary Title",
        "content": "Summary content",
        "keyTakeaways": ["Key point 1", "Key point 2"],
        "language": "en"
      }
    ]
  }
]
```

### Get Summary by ID
```http
GET /api/v1/summaries/:id?language=en
```

**Response:**
```json
{
  "title": "Summary Title",
  "content": "Summary content",
  "keyTakeaways": ["Key point 1", "Key point 2"],
  "language": "en",
  "audioUrl": "https://..."
}
```

### Delete Book Summary
```http
DELETE /api/v1/books/:bookId/summaries/:summaryId
```

---

## Free Books

### Create Free Books
```http
POST /api/v1/books/free
Content-Type: application/json

[
  {
    "BookId": "book_id_1",
    "order": 1
  },
  {
    "BookId": "book_id_2",
    "order": 2
  }
]
```

### Get Free Books
```http
GET /api/v1/books/free?language=en
```

### Delete Free Book
```http
DELETE /api/v1/books/free/:id
```

---

## Authors

### Get All Authors (Paginated)
```http
GET /api/v1/authors?page=1&language=en
```

**Response:**
```json
{
  "authors": [
    {
      "id": "author_id",
      "name": "Author Name",
      "imageUrl": "https://...",
      "translations": [
        {
          "name": "Author Name",
          "description": "Author description",
          "language": "en"
        }
      ]
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 50
}
```

### Get Author by ID
```http
GET /api/v1/authors/:id?language=en
```

### Search Authors
```http
GET /api/v1/authors/search?query=john&language=en&page=1
```

### Create Author (Multipart)
```http
POST /api/v1/authors
Content-Type: multipart/form-data

{
  "name": "Author Name",
  "english": {
    "name": "Author Name",
    "description": "Author description",
    "language": "en"
  },
  "imageFile": <file>
}
```

### Update Author (Multipart)
```http
PUT /api/v1/authors/:id
Content-Type: multipart/form-data
```

### Delete Author
```http
DELETE /api/v1/authors/:id
```

### Get Authors by IDs
```http
POST /api/v1/authors/by-ids
Content-Type: application/json

{
  "ids": ["author_id_1", "author_id_2"]
}
```

---

## Categories

### Get All Categories (Paginated)
```http
GET /api/v1/categories?page=1&language=en
```

**Response:**
```json
{
  "categories": [
    {
      "id": "category_id",
      "name": "Category Name",
      "categorySVG": "https://...",
      "categoryImage": "https://...",
      "midImage": "https://...",
      "slug": "category-slug",
      "translations": [
        {
          "name": "Category Name",
          "description": "Category description",
          "language": "en"
        }
      ]
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 30
}
```

### Get Category by ID
```http
GET /api/v1/categories/:id?language=en
```

### Get Category by Slug
```http
GET /api/v1/categories/slug/:slug?language=en
```

### Search Categories
```http
GET /api/v1/categories/search?query=meditation&language=en&page=1
```

### Create Category (Multipart)
```http
POST /api/v1/categories
Content-Type: multipart/form-data

{
  "name": "Category Name",
  "slug": "category-slug",
  "english": {
    "name": "Category Name",
    "description": "Category description",
    "language": "en"
  },
  "svgFile": <file>,
  "imageFile": <file>,
  "midImageFile": <file>
}
```

### Update Category (Multipart)
```http
PUT /api/v1/categories/:id
Content-Type: multipart/form-data
```

### Delete Category
```http
DELETE /api/v1/categories/:id
```

### Get Categories by IDs
```http
POST /api/v1/categories/by-ids?language=en
Content-Type: application/json

{
  "ids": ["category_id_1", "category_id_2"]
}
```

---

## Podcasts

### Get All Podcasts (Paginated)
```http
GET /api/v1/podcasts?page=1&language=en
```

**Response:**
```json
{
  "podcasts": [
    {
      "podcastId": "podcast_id",
      "title": "Podcast Title",
      "imageUrl": "https://...",
      "podcast": {
        "imageUrl": "https://...",
        "totalDuration": 60
      }
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 100
}
```

### Get Podcast by ID
```http
GET /api/v1/podcasts/:id?language=en
```

**Response:**
```json
{
  "podcastId": "podcast_id",
  "title": "Podcast Title",
  "description": "Podcast description",
  "imageUrl": "https://...",
  "audioUrl": "https://...",
  "summary": "Podcast summary",
  "keyTakeaways": ["Key point 1", "Key point 2"],
  "podcast": {
    "imageUrl": "https://...",
    "totalDuration": 60,
    "speakers": [{"id": "author_id"}],
    "guests": [{"id": "author_id"}],
    "categories": [{"id": "category_id"}]
  }
}
```

### Get Podcast Summary
```http
GET /api/v1/podcasts/:id/summary?language=en
```

**Response:**
```json
{
  "summary": "Podcast summary",
  "keyTakeaways": ["Key point 1", "Key point 2"]
}
```

### Search Podcasts
```http
GET /api/v1/podcasts/search?query=meditation&language=en&page=1
```

### Create Podcast (Multipart)
```http
POST /api/v1/podcasts
Content-Type: multipart/form-data

{
  "english": {
    "title": "Podcast Title",
    "summary": "Summary",
    "description": "Description",
    "keyTakeaways": ["Key 1", "Key 2"],
    "language": "en"
  },
  "slug": "podcast-slug",
  "authors": ["author_id"],
  "guests": ["author_id"],
  "categories": ["category_id"],
  "totalDuration": 60,
  "published": true,
  "imageFile": <file>,
  "audioFile_en": <file>
}
```

### Update Podcast (Multipart)
```http
PUT /api/v1/podcasts/:id
Content-Type: multipart/form-data
```

### Delete Podcast
```http
DELETE /api/v1/podcasts/:id
```

### Get Podcasts by Category Slug
```http
GET /api/v1/categories/:slug/podcasts?language=en&page=1
```

### Get Podcasts by Category IDs
```http
POST /api/v1/podcasts/by-category-ids?language=en&page=1
Content-Type: application/json

{
  "categoryIds": ["category_id_1", "category_id_2"]
}
```

---

## Podcast Collections

### Get All Podcast Collections (Paginated)
```http
GET /api/v1/podcast-collections?page=1&language=en
```

**Response:**
```json
{
  "podcastsCollections": [
    {
      "podcastCollectionId": "collection_id",
      "name": "Collection Name",
      "description": "Collection description",
      "podcastCollection": {
        "imageUrl": "https://...",
        "slug": "collection-slug",
        "podcastsIds": ["podcast_id_1", "podcast_id_2"]
      }
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 20
}
```

### Get Podcast Collection by ID
```http
GET /api/v1/podcast-collections/:id?language=en&includePodcasts=true
```

**Query Parameters:**
- `language` (required): Language code (en, hi, ar, bn) or "all"
- `includePodcasts` (required): Boolean to include podcasts in the collection

### Get Podcast Collections by IDs
```http
POST /api/v1/podcast-collections/by-ids
Content-Type: application/json

{
  "ids": ["collection_id_1", "collection_id_2"]
}
```

### Create Podcast Collection (Multipart)
```http
POST /api/v1/podcast-collections
Content-Type: multipart/form-data

{
  "englishName": "Collection Name",
  "slug": "collection-slug",
  "podcastIds": ["podcast_id_1", "podcast_id_2"],
  "en": {
    "name": "Collection Name",
    "description": "Description",
    "language": "en"
  },
  "imageUrl": <file>
}
```

### Update Podcast Collection (Multipart)
```http
PATCH /api/v1/podcast-collections/:id
Content-Type: multipart/form-data
```

### Delete Podcast Collection
```http
DELETE /api/v1/podcast-collections/:id
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 413 | Payload Too Large (file size > 100MB) |
| 500 | Internal Server Error |

---

## Language Codes

Supported language codes:
- `en` - English
- `hi` - Hindi
- `ar` - Arabic
- `bn` - Bahasa (Indonesian)
- `all` - All languages

---

## File Upload

### Supported File Types
- Images: JPEG, PNG, WebP
- Audio: MP3, WAV
- SVG: For category icons

### Maximum File Size
100MB per file

### Upload Format
Use `multipart/form-data` content type with the following field names:
- `imageFile` - For book/podcast covers
- `imageUrl` - Alternative name for image files
- `audioFile_<language>` - For audio files (e.g., `audioFile_en`, `audioFile_hi`)
- `svgFile` - For category SVG icons
- `midImageFile` - For category mid-size images

---

## Pagination

Most list endpoints support pagination:
- Default limit: 10 items per page
- Page numbering starts at 1
- Response includes: `page`, `limit`, `total`

---

## Multi-language Support

Most content supports multiple languages. When creating or updating:
1. Provide language-specific data in separate objects (e.g., `english`, `hindi`, `arabic`, `bahasa`)
2. Each language object should include:
   - `language`: Language code
   - Language-specific fields (title, description, etc.)

Example:
```json
{
  "english": {
    "title": "Book Title",
    "description": "Description",
    "language": "en"
  },
  "hindi": {
    "title": "किताब का शीर्षक",
    "description": "विवरण",
    "language": "hi"
  }
}
```

---

## Firebase Storage URLs

All uploaded files are stored in Firebase Storage. URLs follow this pattern:
```
https://storage.googleapis.com/<bucket>/uploads/<type>/<filename>
```

Storage folders:
- `uploads/book-covers` - Book cover images
- `uploads/book-audio` - Book audio files
- `uploads/podcast-covers` - Podcast cover images
- `uploads/podcast-audio` - Podcast audio files
- `uploads/podcast-channels` - Podcast collection images
- `uploads/category-images` - Category images
- `uploads/category-svg` - Category SVG icons
- `uploads/authors` - Author images
- `uploads/summaries` - Summary audio files

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

---

## CORS

The API supports CORS for the following origins:
- `http://localhost:3001` (Development)
- `http://localhost:3000` (Development)
- Add production URLs as needed

---

## Database

### Database Schema
The API uses PostgreSQL with Prisma ORM. Key tables:
- `User` - User accounts
- `userPreferences` - User preferences
- `userProgress` - Reading/listening progress
- `BookMark` - User bookmarks
- `Book` - Books
- `TranslatedBook` - Book translations
- `Summary` - Book summaries
- `TranslatedSummary` - Summary translations
- `BookCollection` - Book collections
- `TranslatedBookCollection` - Collection translations
- `Author` - Authors
- `TranslatedAuthor` - Author translations
- `Category` - Categories
- `TranslatedCategory` - Category translations
- `Podcast` - Podcasts
- `TranslatedPodcast` - Podcast translations
- `PodcastCollection` - Podcast collections
- `TranslatedPodcastCollection` - Collection translations
- `FreeBooks` - Free books list

### Transactions
All create and update operations use database transactions with a 30-second timeout.

---

## Development

### Environment Variables
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
FIREBASE_PROJECT_ID="..."
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_STORAGE_BUCKET="..."
MAX_FILE_SIZE_MB="100"
PORT="3000"
```

### Running the Server
```bash
pnpm install
pnpm run dev
```

### Database Migrations
```bash
pnpm prisma migrate dev --name migration_name
pnpm prisma generate
```

### Prisma Studio
```bash
pnpm prisma studio
```

---

## Best Practices

1. **Always include authentication** for protected endpoints
2. **Use proper content types** (multipart/form-data for file uploads)
3. **Include language parameter** for all content retrieval
4. **Handle pagination** for large datasets
5. **Validate input data** before submission
6. **Check file sizes** before uploading
7. **Use proper error handling** in client applications
8. **Test with different languages** to ensure multi-language support

---

## Support

For issues or questions, please contact the development team or create an issue in the repository.

---

## License

[Your License Here]

---

*Last Updated: October 8, 2025*
