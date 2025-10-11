# Firebase Firestore Database Schema Documentation

## Overview
This document provides the complete database schema and relationships for the current Firebase Firestore collections. The schema supports multilingual content with separate translation collections.

## Firebase Collections Schema

### 1. Collection: `users`
```javascript
{
  id: "string", // Document ID
  email: "string",
  name: "string",
  avatarUrl: "string",
  role: "string", // Default: "user"
  isActive: "boolean", // Default: true
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 2. Collection: `authors`
```javascript
{
  id: "string", // Document ID
  name: {
    "en": "string", // English name
    "es": "string", // Spanish name (optional)
    "fr": "string"  // French name (optional)
    // ... other languages
  },
  about: {
    "en": "string", // English bio
    "es": "string", // Spanish bio (optional)
    "fr": "string"  // French bio (optional)
    // ... other languages
  },
  avatarUrl: "string",
  socialLinks: {
    "twitter": "string",
    "linkedin": "string"
    // ... other social platforms
  },
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 3. Collection: `categories`
```javascript
{
  id: "string", // Document ID
  name: {
    "en": "string", // English name
    "es": "string", // Spanish name (optional)
    // ... other languages
  },
  description: {
    "en": "string", // English description
    "es": "string", // Spanish description (optional)
    // ... other languages
  },
  slug: "string", // Unique slug
  icon: "string", // Icon identifier
  featuredImage: "string", // Image URL
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 4. Collection: `books`
```javascript
{
  id: "string", // Document ID
  type: "string", // "book" | "podcast" (legacy field, default: "book")
  coverUrl: "string", // English cover URL
  title: "string", // English title
  description: "string", // English description
  slug: "string", // Unique slug
  categories: ["string"], // Array of category IDs
  authors: ["string"], // Array of author IDs
  totalDuration: "number", // Total duration in minutes (default: 0)
  availableLanguages: ["string"], // Array of language codes: ["es", "fr", "de"]
  languageStatus: {
    "en": {
      "published": "boolean",
      "audioEnabled": "boolean"
    },
    "es": {
      "published": "boolean", 
      "audioEnabled": "boolean"
    }
    // ... other languages
  },
  status: "string", // "draft" | "review" | "published" | "archived" | "pending" (default: "draft")
  aiGenerated: "boolean", // Default: false
  originalPdfUrl: "string", // Original PDF URL for AI-generated books
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 5. Collection: `book_lang` (Book Translations)
```javascript
{
  id: "string", // Document ID
  bookId: "string", // References books collection document ID
  language: "string", // Language code: "es", "fr", "de", etc.
  coverUrl: "string", // Translated cover URL
  title: "string", // Translated title
  description: "string", // Translated description
  slug: "string", // Same slug as main book
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```
**Note**: Each document represents a translation of a book. One book can have multiple translations.

### 6. Collection: `podcasts`
```javascript
{
  id: "string", // Document ID
  coverUrl: "string", // English cover URL
  title: "string", // English title
  description: "string", // English description
  slug: "string", // Unique slug
  categories: ["string"], // Array of category IDs
  hosts: ["string"], // Array of author IDs (podcast hosts)
  speakers: ["string"], // Array of author IDs (speakers for multi-speaker podcasts)
  totalDuration: "number", // Total duration in minutes (default: 0)
  availableLanguages: ["string"], // Array of language codes: ["es", "fr", "de"]
  languageStatus: {
    "en": {
      "published": "boolean",
      "audioEnabled": "boolean"
    },
    "es": {
      "published": "boolean",
      "audioEnabled": "boolean"
    }
    // ... other languages
  },
  status: "string", // "draft" | "review" | "published" | "archived" | "pending" (default: "draft")
  aiGenerated: "boolean", // Default: false
  originalPdfUrl: "string", // Original PDF URL for AI-generated podcasts
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 7. Collection: `podcast_lang` (Podcast Translations)
```javascript
{
  id: "string", // Document ID
  podcastId: "string", // References podcasts collection document ID
  language: "string", // Language code: "es", "fr", "de", etc.
  coverUrl: "string", // Translated cover URL
  title: "string", // Translated title
  description: "string", // Translated description
  slug: "string", // Same slug as main podcast
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```
**Note**: Each document represents a translation of a podcast. One podcast can have multiple translations.

### 8. Collection: `summaries` (Book Chapters/Podcast Parts)
```javascript
{
  id: "string", // Document ID
  contentType: "string", // "book" | "podcast" (default: "book")
  contentId: "string", // References books or podcasts collection document ID
  // Legacy fields for backward compatibility
  bookId: "string", // References books collection (legacy)
  podcastId: "string", // References podcasts collection (legacy)
  chapterNumber: "number", // Chapter/Part number
  chapterTitle: "string", // English title (Chapter for books, Part for podcasts)
  content: "string", // English content/summary
  keyTakeaways: ["string"], // Array of English key takeaways
  audioUrl: "string", // English audio URL
  duration: "number", // Duration in seconds (default: 0)
  slug: "string", // Unique slug within the content item
  availableLanguages: ["string"], // Array of language codes: ["es", "fr", "de"]
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 9. Collection: `summaries_lang` (Summary Translations)
```javascript
{
  id: "string", // Document ID
  summaryId: "string", // References summaries collection document ID
  contentType: "string", // "book" | "podcast"
  contentId: "string", // References books or podcasts collection document ID
  // Legacy fields for backward compatibility
  bookId: "string",
  podcastId: "string",
  language: "string", // Language code: "es", "fr", "de", etc.
  chapterTitle: "string", // Translated title
  content: "string", // Translated content/summary
  keyTakeaways: ["string"], // Array of translated key takeaways
  audioUrl: "string", // Translated audio URL
  slug: "string", // Same slug as main summary
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```
**Note**: Each document represents a translation of a summary. One summary can have multiple translations.

### 10. Collection: `bookCollections`
```javascript
{
  id: "string", // Document ID
  name: {
    "en": "string", // English name
    "es": "string", // Spanish name (optional)
    // ... other languages
  },
  description: {
    "en": "string", // English description
    "es": "string", // Spanish description (optional)
    // ... other languages
  },
  books: ["string"], // Array of book IDs
  featuredImage: "string", // Featured image URL
  slug: "string", // Unique slug
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 11. Collection: `podcastCollections`
```javascript
{
  id: "string", // Document ID
  name: {
    "en": "string", // English name
    "es": "string", // Spanish name (optional)
    // ... other languages
  },
  description: {
    "en": "string", // English description
    "es": "string", // Spanish description (optional)
    // ... other languages
  },
  podcasts: ["string"], // Array of podcast IDs
  featuredImage: "string", // Featured image URL
  slug: "string", // Unique slug
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 12. Collection: `pages` (Dynamic Pages)
```javascript
{
  id: "string", // Document ID
  name: {
    "en": "string", // English page name
    "es": "string", // Spanish page name (optional)
    // ... other languages
  },
  slug: "string", // Unique slug
  sections: [
    // Array of section objects (see Section Schema below)
  ],
  isActive: "boolean", // Default: true
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 13. Collection: `subscriptions`
```javascript
{
  id: "string", // Document ID
  name: "string", // Subscription plan name
  description: "string", // Plan description
  price: "number", // Price (decimal)
  currency: "string", // Currency code (default: "USD")
  billingPeriod: "string", // "monthly" | "yearly"
  features: ["string"], // Array of feature strings
  isActive: "boolean", // Default: true
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 14. Collection: `userSubscriptions`
```javascript
{
  id: "string", // Document ID
  userId: "string", // References users collection document ID
  subscriptionId: "string", // References subscriptions collection document ID
  status: "string", // "active" | "cancelled" | "expired"
  startDate: "timestamp", // Subscription start date
  endDate: "timestamp", // Subscription end date (optional)
  autoRenew: "boolean", // Default: true
  paymentMethodId: "string", // Payment method identifier
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

## Section Schema (for Pages)

The `sections` array in the `pages` collection contains section objects with this structure:

```javascript
{
  type: "string", // "collection" | "collections" | "podcast_collection" | "podcast_collections" | "category" | "categories"
  viewType: "string", // View type in kebab-case (e.g., "basic-collections-carousel-v")
  title: {
    "en": "string", // English section title
    "es": "string", // Spanish section title (optional)
    // ... other languages
  },
  subtitle: {
    "en": "string", // English section subtitle
    "es": "string", // Spanish section subtitle (optional)
    // ... other languages
  },
  tags: ["string"], // Array of tags
  showBackgroundImage: "boolean",
  backgroundImageUrl: "string", // Background image URL
  showMoreButton: "boolean",
  order: "number", // Section order
  // Content IDs based on section type:
  collectionIds: ["string"], // For collection types (references bookCollections)
  podcastCollectionIds: ["string"], // For podcast collection types (references podcastCollections)
  categoryIds: ["string"] // For category types (references categories)
}
```

## Relationships

### Primary Relationships
- `books.authors[]` → `authors.id` (Many-to-Many via array)
- `books.categories[]` → `categories.id` (Many-to-Many via array)
- `podcasts.hosts[]` → `authors.id` (Many-to-Many via array)
- `podcasts.speakers[]` → `authors.id` (Many-to-Many via array)
- `podcasts.categories[]` → `categories.id` (Many-to-Many via array)
- `summaries.contentId` → `books.id` OR `podcasts.id` (Many-to-One)
- `bookCollections.books[]` → `books.id` (Many-to-Many via array)
- `podcastCollections.podcasts[]` → `podcasts.id` (Many-to-Many via array)

### Translation Relationships
- `book_lang.bookId` → `books.id` (One-to-Many)
- `podcast_lang.podcastId` → `podcasts.id` (One-to-Many)
- `summaries_lang.summaryId` → `summaries.id` (One-to-Many)

### User Relationships
- `userSubscriptions.userId` → `users.id` (Many-to-One)
- `userSubscriptions.subscriptionId` → `subscriptions.id` (Many-to-One)

### Dynamic Page Relationships (via IDs in sections)
- `pages.sections[].collectionIds[]` → `bookCollections.id`
- `pages.sections[].podcastCollectionIds[]` → `podcastCollections.id`
- `pages.sections[].categoryIds[]` → `categories.id`

## Constants and Enums

### Book/Podcast Status Values
```javascript
const STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review', 
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  PENDING: 'pending'
}
```

### Content Types
```javascript
const CONTENT_TYPE = {
  BOOK: 'book',
  PODCAST: 'podcast'
}
```

### Section Types
```javascript
const SECTION_TYPES = {
  COLLECTION: 'collection',
  COLLECTIONS: 'collections',
  PODCAST_COLLECTION: 'podcast_collection', 
  PODCAST_COLLECTIONS: 'podcast_collections',
  CATEGORY: 'category',
  CATEGORIES: 'categories'
}
```

### View Types
```javascript
const VIEW_TYPES = {
  TRIPLE_ROW_CHIP_CAROUSEL_V: 'triple-row-chip-carousel-v',
  TWIN_COLUMN_GALLERY_GRID_H: 'twin-column-gallery-grid-h',
  STEP_CAROUSEL_V: 'step-carousel-v',
  LOOPING_STACK_CAROUSEL: 'looping-stack-carousel',
  BASIC_BOOKS_CAROUSEL_V: 'basic-books-carousel-v',
  BASIC_CHANNELS_CAROUSEL_H: 'basic-channels-carousel-h',
  BASIC_EPISODES_CAROUSEL_H: 'basic-episodes-carousel-h',
  BASIC_COLLECTIONS_CAROUSEL_H: 'basic-collections-carousel-h',
  BASIC_COLLECTIONS_CAROUSEL_V: 'basic-collections-carousel-v'
}
```

## Key Notes

### Multilingual Support
- **Main Collections**: Store English content directly
- **Translation Collections**: Store non-English content with language codes
- **Multilingual Objects**: Use language code keys like `{"en": "text", "es": "texto"}`

### Array Relationships
- Firebase uses arrays to store multiple IDs for relationships
- Arrays are used for: `authors[]`, `categories[]`, `books[]`, `podcasts[]`, `hosts[]`, `speakers[]`

### Legacy Support  
- `summaries` collection supports both old (`bookId`, `podcastId`) and new (`contentId`, `contentType`) structures
- Both patterns may exist in the database for backward compatibility

### Unique Constraints
- Slugs are unique globally for main content (books, podcasts, categories, collections, pages)
- Slugs are unique per content item for summaries
- Language combinations are unique per parent document in translation collections

This schema represents the current Firebase Firestore structure with all multilingual capabilities and relationships.
