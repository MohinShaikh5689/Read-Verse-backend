/*
  Warnings:

  - You are about to drop the column `description` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `coverUrl` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Book` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Book` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authorId,language]` on the table `TranslatedAuthor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookId,language]` on the table `TranslatedBook` will be added. If there are existing duplicate values, this will fail.
  - Made the column `imageUrl` on table `Author` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `slug` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDuration` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `TranslatedAuthor` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `published` to the `TranslatedBook` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `TranslatedBook` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Book" DROP CONSTRAINT "Book_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TranslatedAuthor" DROP CONSTRAINT "TranslatedAuthor_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TranslatedBook" DROP CONSTRAINT "TranslatedBook_bookId_fkey";

-- AlterTable
ALTER TABLE "public"."Author" DROP COLUMN "description",
ALTER COLUMN "imageUrl" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Book" DROP COLUMN "authorId",
DROP COLUMN "coverUrl",
DROP COLUMN "description",
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "totalDuration" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."TranslatedAuthor" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."TranslatedBook" ADD COLUMN     "audioEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT,
    "profilePicture" TEXT,
    "dob" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."userPreferences" (
    "id" TEXT NOT NULL,
    "allowRemainders" BOOLEAN NOT NULL DEFAULT true,
    "appLangauge" TEXT NOT NULL DEFAULT 'en',
    "authorPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bookPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userId" TEXT NOT NULL,

    CONSTRAINT "userPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."userProgress" (
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastChapter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userProgress_pkey" PRIMARY KEY ("bookId","userId")
);

-- CreateTable
CREATE TABLE "public"."BookMark" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Summary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TranslatedSummary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audioUrl" TEXT,
    "keyTakeaways" TEXT[],
    "language" TEXT NOT NULL,
    "summaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslatedSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categorySVG" TEXT NOT NULL,
    "categoryImage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TranslatedCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslatedCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PodcastCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "podcastsIds" TEXT[],

    CONSTRAINT "PodcastCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TranslatedPodcastCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "podcastCollectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslatedPodcastCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Podcast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "totalDuration" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Podcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TranslatedPodcast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "summary" TEXT NOT NULL,
    "audioUrl" TEXT,
    "keyTakeaways" TEXT[],
    "language" TEXT NOT NULL,
    "podcastId" TEXT NOT NULL,

    CONSTRAINT "TranslatedPodcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookCollection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "books" TEXT[],

    CONSTRAINT "BookCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TranslatedBookCollection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "bookCollectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslatedBookCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DynamicPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DynamicPageBlock" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "viewType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "metadata" JSONB,
    "order" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "DynamicPageBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_Guests" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Guests_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_Speakers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Speakers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AuthorToBook" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AuthorToBook_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_BookToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookToCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_CategoryToPodcast" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToPodcast_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "userPreferences_userId_key" ON "public"."userPreferences"("userId");

-- CreateIndex
CREATE INDEX "Summary_bookId_idx" ON "public"."Summary"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Summary_bookId_order_key" ON "public"."Summary"("bookId", "order");

-- CreateIndex
CREATE INDEX "TranslatedSummary_language_idx" ON "public"."TranslatedSummary"("language");

-- CreateIndex
CREATE UNIQUE INDEX "TranslatedSummary_summaryId_language_key" ON "public"."TranslatedSummary"("summaryId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE INDEX "Category_name_slug_id_idx" ON "public"."Category"("name", "slug", "id");

-- CreateIndex
CREATE INDEX "TranslatedCategory_language_idx" ON "public"."TranslatedCategory"("language");

-- CreateIndex
CREATE UNIQUE INDEX "TranslatedCategory_categoryId_language_key" ON "public"."TranslatedCategory"("categoryId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastCollection_slug_key" ON "public"."PodcastCollection"("slug");

-- CreateIndex
CREATE INDEX "PodcastCollection_name_slug_id_idx" ON "public"."PodcastCollection"("name", "slug", "id");

-- CreateIndex
CREATE INDEX "TranslatedPodcastCollection_language_idx" ON "public"."TranslatedPodcastCollection"("language");

-- CreateIndex
CREATE UNIQUE INDEX "TranslatedPodcastCollection_podcastCollectionId_language_key" ON "public"."TranslatedPodcastCollection"("podcastCollectionId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Podcast_slug_key" ON "public"."Podcast"("slug");

-- CreateIndex
CREATE INDEX "Podcast_title_idx" ON "public"."Podcast"("title");

-- CreateIndex
CREATE INDEX "TranslatedPodcast_language_idx" ON "public"."TranslatedPodcast"("language");

-- CreateIndex
CREATE UNIQUE INDEX "TranslatedPodcast_podcastId_language_key" ON "public"."TranslatedPodcast"("podcastId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "BookCollection_slug_key" ON "public"."BookCollection"("slug");

-- CreateIndex
CREATE INDEX "BookCollection_id_idx" ON "public"."BookCollection"("id");

-- CreateIndex
CREATE INDEX "TranslatedBookCollection_language_idx" ON "public"."TranslatedBookCollection"("language");

-- CreateIndex
CREATE UNIQUE INDEX "TranslatedBookCollection_bookCollectionId_language_key" ON "public"."TranslatedBookCollection"("bookCollectionId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicPage_slug_key" ON "public"."DynamicPage"("slug");

-- CreateIndex
CREATE INDEX "DynamicPage_id_slug_idx" ON "public"."DynamicPage"("id", "slug");

-- CreateIndex
CREATE INDEX "_Guests_B_index" ON "public"."_Guests"("B");

-- CreateIndex
CREATE INDEX "_Speakers_B_index" ON "public"."_Speakers"("B");

-- CreateIndex
CREATE INDEX "_AuthorToBook_B_index" ON "public"."_AuthorToBook"("B");

-- CreateIndex
CREATE INDEX "_BookToCategory_B_index" ON "public"."_BookToCategory"("B");

-- CreateIndex
CREATE INDEX "_CategoryToPodcast_B_index" ON "public"."_CategoryToPodcast"("B");

-- CreateIndex
CREATE INDEX "Author_id_name_idx" ON "public"."Author"("id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Book_slug_key" ON "public"."Book"("slug");

-- CreateIndex
CREATE INDEX "Book_id_title_slug_idx" ON "public"."Book"("id", "title", "slug");

-- CreateIndex
CREATE INDEX "TranslatedAuthor_language_idx" ON "public"."TranslatedAuthor"("language");

-- CreateIndex
CREATE UNIQUE INDEX "TranslatedAuthor_authorId_language_key" ON "public"."TranslatedAuthor"("authorId", "language");

-- CreateIndex
CREATE INDEX "TranslatedBook_language_idx" ON "public"."TranslatedBook"("language");

-- CreateIndex
CREATE UNIQUE INDEX "TranslatedBook_bookId_language_key" ON "public"."TranslatedBook"("bookId", "language");

-- AddForeignKey
ALTER TABLE "public"."userPreferences" ADD CONSTRAINT "userPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."userProgress" ADD CONSTRAINT "userProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."userProgress" ADD CONSTRAINT "userProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookMark" ADD CONSTRAINT "BookMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookMark" ADD CONSTRAINT "BookMark_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TranslatedAuthor" ADD CONSTRAINT "TranslatedAuthor_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TranslatedBook" ADD CONSTRAINT "TranslatedBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Summary" ADD CONSTRAINT "Summary_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TranslatedSummary" ADD CONSTRAINT "TranslatedSummary_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "public"."Summary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TranslatedCategory" ADD CONSTRAINT "TranslatedCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TranslatedPodcastCollection" ADD CONSTRAINT "TranslatedPodcastCollection_podcastCollectionId_fkey" FOREIGN KEY ("podcastCollectionId") REFERENCES "public"."PodcastCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TranslatedPodcast" ADD CONSTRAINT "TranslatedPodcast_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "public"."Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TranslatedBookCollection" ADD CONSTRAINT "TranslatedBookCollection_bookCollectionId_fkey" FOREIGN KEY ("bookCollectionId") REFERENCES "public"."BookCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DynamicPageBlock" ADD CONSTRAINT "DynamicPageBlock_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."DynamicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_Guests" ADD CONSTRAINT "_Guests_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_Guests" ADD CONSTRAINT "_Guests_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_Speakers" ADD CONSTRAINT "_Speakers_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_Speakers" ADD CONSTRAINT "_Speakers_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AuthorToBook" ADD CONSTRAINT "_AuthorToBook_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AuthorToBook" ADD CONSTRAINT "_AuthorToBook_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BookToCategory" ADD CONSTRAINT "_BookToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BookToCategory" ADD CONSTRAINT "_BookToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CategoryToPodcast" ADD CONSTRAINT "_CategoryToPodcast_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CategoryToPodcast" ADD CONSTRAINT "_CategoryToPodcast_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
