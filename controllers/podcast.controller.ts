import dotenv from 'dotenv';
import type { FastifyRequest, FastifyReply } from "fastify";
import { asyncHandle, successHandle, errorHandle } from "../utils/handler.js";
import { uploadFile, isFirebaseConfigured } from "../utils/firebase-storage.js";
import type { PodcastChannel, TranslatedPodcastChannel, Podcast, TranslatedPodcast } from '../types/podcast.js';
import { createPodcastChannel, createPodcast, getPodcasts, getPodcastsCollections, getPodcastCollectionById, getPodcastById, getPodcastsByCategorySlug, getPodcastsByCategoryIds, searchPodcasts, getPodcastsCollectionsByIds, updatePodcastChannel, updatePodcast, deletePodcastById, deletePodcastCollectionById, getPodcastSummary } from '../services/podcast.service.js';
dotenv.config();

export const createPodcastChannelHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  // Validate Firebase configuration
  if (!isFirebaseConfigured()) {
    return errorHandle('Firebase Storage is not configured. Please check your environment variables.', reply, 500);
  }

  const parts = request.parts();
  let metadata: Record<string, any> = {};
  let files: Record<string, string> = {}; // file field → firebase URL

  for await (const part of parts) {
    if ('file' in part && part.file && 'filename' in part && part.filename) {
      // If multipart plugin truncated due to size limits, fail fast with 413
      if ((part.file as any)?.truncated) {
        const maxSize = process.env.MAX_FILE_SIZE_MB || '100';
        return errorHandle(`Uploaded file too large. Maximum file size is ${maxSize}MB. Please compress your file or contact support.`, reply, 413);
      }

      // Buffer the stream
      const bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        (part.file as any).on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        (part.file as any).on('end', () => resolve(Buffer.concat(chunks)));
        (part.file as any).on('error', reject);
      });

      try {
        const uploadResult = await uploadFile({
          buffer: bodyBuffer,
          fileName: part.filename,
          contentType: part.mimetype || 'application/octet-stream',
          folder: 'uploads/podcast-channels',
        });

        files[part.fieldname] = uploadResult.publicUrl;
      } catch (error) {
        console.error('Firebase upload error:', error);
        return errorHandle('Failed to upload file to Firebase Storage', reply, 500);
      }
    } else if ('value' in part) {
      const rawValue = (part as { value: any }).value as unknown;
      if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            metadata[part.fieldname] = JSON.parse(trimmed);
          } catch {
            // If parsing fails, fall back to the raw string
            metadata[part.fieldname] = rawValue;
          }
        } else {
          metadata[part.fieldname] = rawValue;
        }
      } else {
        metadata[part.fieldname] = rawValue as any;
      }
    }
  }
  // Extract the English title from translations array or use englishTitle/englishName
  const englishTranslation = metadata.translations?.find((t: any) => t.language === 'en');
  const englishName = englishTranslation?.name || metadata.englishTitle || metadata.englishName;

  if (!englishName) {
    return errorHandle('English name is required', reply, 400);
  }

  const imageUrl = files.imageUrl ?? Object.values(files)[0];
  console.log(metadata)

  const podcastChannel: PodcastChannel = {
    name: englishName,
    imageUrl: imageUrl,
    slug: metadata.slug,
    podcastsIds: metadata.podcastIds || [],
  }

  // Map translations array to TranslatedPodcastChannel format
  const translatedPodcastChannel: TranslatedPodcastChannel[] = (metadata.translations || [])
    .map((translation: any) => ({
      language: translation.language,
      name: translation.name,
      description: translation.description,
    }));

  const newPodcastChannel = await createPodcastChannel(podcastChannel, translatedPodcastChannel);
  if (typeof newPodcastChannel === 'string') {
    return errorHandle(newPodcastChannel, reply, 500);
  }
  return successHandle(newPodcastChannel, reply, 201);

});

export const updatePodcastChannelHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  if (!isFirebaseConfigured()) {
    return errorHandle('Firebase Storage is not configured. Please check your environment variables.', reply, 500);
  }

  const parts = request.parts();
  let metadata: Record<string, any> = {};
  let files: Record<string, string> = {}; // file field → firebase URL

  for await (const part of parts) {
    if ('file' in part && part.file && 'filename' in part && part.filename) {
      // If multipart plugin truncated due to size limits, fail fast with 413
      if ((part.file as any)?.truncated) {
        const maxSize = process.env.MAX_FILE_SIZE_MB || '100';
        return errorHandle(`Uploaded file too large. Maximum file size is ${maxSize}MB. Please compress your file or contact support.`, reply, 413);
      }

      // Buffer the stream
      const bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        (part.file as any).on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        (part.file as any).on('end', () => resolve(Buffer.concat(chunks)));
        (part.file as any).on('error', reject);
      });

      try {
        const uploadResult = await uploadFile({
          buffer: bodyBuffer,
          fileName: part.filename,
          contentType: part.mimetype || 'application/octet-stream',
          folder: 'uploads/podcast-channels',
        });

        files[part.fieldname] = uploadResult.publicUrl;
      } catch (error) {
        console.error('Firebase upload error:', error);
        return errorHandle('Failed to upload file to Firebase Storage', reply, 500);
      }
    } else if ('value' in part) {
      const rawValue = (part as { value: any }).value as unknown;
      if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            metadata[part.fieldname] = JSON.parse(trimmed);
          } catch {
            // If parsing fails, fall back to the raw string
            metadata[part.fieldname] = rawValue;
          }
        } else {
          metadata[part.fieldname] = rawValue;
        }
      } else {
        metadata[part.fieldname] = rawValue as any;
      }
    }
  }
  // if (!metadata.english.name) {
  //   return errorHandle('name is required', reply, 400);
  // }
  console.log("metadata", metadata);
  console.log("files", files);
  const imageUrl = files.imageUrl ?? Object.values(files)[0];
  console.log("imageUrl", imageUrl);
  console.log(metadata)

  // Extract the English title from translations array or use englishTitle
  const englishTranslation = metadata.translations?.find((t: any) => t.language === 'en');
  const englishName = englishTranslation?.name || metadata.englishTitle || metadata.englishName;

  const podcastChannel: PodcastChannel = {
    name: englishName,
    imageUrl: imageUrl,
    slug: metadata.slug,
    podcastsIds: metadata.podcastIds || [],
  }

  // Map translations array to TranslatedPodcastChannel format
  const translatedPodcastChannel: TranslatedPodcastChannel[] = (metadata.translations || [])
    .map((translation: any) => ({
      language: translation.language,
      name: translation.name,
      description: translation.description,
    }));

  console.log("podcastChannel", podcastChannel);
  console.log("translatedPodcastChannel", translatedPodcastChannel);


  const updatedPodcastChannel = await updatePodcastChannel(id, podcastChannel, translatedPodcastChannel);
  if (typeof updatedPodcastChannel === 'string') {
    return errorHandle(updatedPodcastChannel, reply, 500);
  }
  return successHandle(updatedPodcastChannel, reply, 200);

})

export const createPodcastHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  // Validate Firebase configuration
  if (!isFirebaseConfigured()) {
    return errorHandle('Firebase Storage is not configured. Please check your environment variables.', reply, 500);
  }

  const parts = request.parts();
  const metadata: Record<string, any> = {};
  const files: Record<string, string> = {};

  for await (const part of parts) {
    if ('file' in part && part.file && 'filename' in part && part.filename) {
      if ((part.file as any)?.truncated) {
        const maxSize = process.env.MAX_FILE_SIZE_MB || '100';
        return errorHandle(`Uploaded file too large. Maximum file size is ${maxSize}MB. Please compress your file or contact support.`, reply, 413);
      }

      // Buffer the stream
      const bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        (part.file as any).on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        (part.file as any).on('end', () => resolve(Buffer.concat(chunks)));
        (part.file as any).on('error', reject);
      });

      try {
        let folder = 'uploads/podcasts';

        // Determine the folder based on field name
        if (part.fieldname === 'imageUrl' || part.fieldname === 'imageFile') {
          folder = 'uploads/podcast-covers';
        } else if (part.fieldname === 'audioUrl' || part.fieldname.startsWith('audioFile')) {
          folder = 'uploads/podcast-audio';
        }

        const uploadResult = await uploadFile({
          buffer: bodyBuffer,
          fileName: part.filename,
          contentType: part.mimetype || 'application/octet-stream',
          folder,
        });

        files[part.fieldname] = uploadResult.publicUrl;
      } catch (error) {
        console.error('Firebase upload error:', error);
        return errorHandle('Failed to upload file to Firebase Storage', reply, 500);
      }

    } else if ('value' in part) {
      const rawValue = (part as { value: any }).value as unknown;
      if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            metadata[part.fieldname] = JSON.parse(trimmed);
          } catch {
            // If parsing fails, fall back to the raw string
            metadata[part.fieldname] = rawValue;
          }
        } else {
          metadata[part.fieldname] = rawValue;
        }
      } else {
        metadata[part.fieldname] = rawValue as any;
      }
    }
  }

  console.log("metadata", metadata);
  console.log("files", files);

  if (!metadata.totalDuration) {
    return errorHandle('Total duration is required', reply, 400);
  }
  if (!metadata.categories) {
    return errorHandle('At least one category is required', reply, 400);
  }

  console.log("files", files);
  // Get file URLs
  const imageUrl = files.englishImage;


  if (!imageUrl) {
    return errorHandle('Podcast cover image is required', reply, 400);
  }


  // Create podcast object
  const podcast: Podcast = {
    title: metadata.english.title,
    imageUrl: imageUrl,
    slug: metadata.slug,
    totalDuration: Number(metadata.totalDuration),
    published: String(metadata.published).toLowerCase() === 'true',
    speakers: metadata.authors,
    guests: metadata.guests,
    categories: metadata.categories,
  };

  console.log(podcast)

  const translatedPodcast: TranslatedPodcast[] = Object.entries(metadata)
    .filter(([key]) => ['english', 'hindi', 'arabic', 'bahasa'].includes(key))
    .map(([_lang, value]) => {
      return {
        language: value.language,
        title: value.title,
        summary: value.summary,
        description: value.description,
        imageUrl: files[`${_lang}Image`] || null,
        keyTakeaways: value.keyTakeaways,
      }
    });


  console.log("podcast", podcast);
  console.log("translatedPodcast", translatedPodcast);


  // TODO: Implement createPodcast service function
  const newPodcast = await createPodcast(podcast, translatedPodcast);
  // For now, just return success
  if (typeof newPodcast === 'string') {
    return errorHandle(newPodcast, reply, 500);
  }
  return successHandle(newPodcast, reply, 201);

});

export const updatePodcastHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }; if (!isFirebaseConfigured()) {
    return errorHandle('Firebase Storage is not configured. Please check your environment variables.', reply, 500);
  }

  const parts = request.parts();
  const metadata: Record<string, any> = {};
  const files: Record<string, string> = {};

  for await (const part of parts) {
    if ('file' in part && part.file && 'filename' in part && part.filename) {
      if ((part.file as any)?.truncated) {
        const maxSize = process.env.MAX_FILE_SIZE_MB || '100';
        return errorHandle(`Uploaded file too large. Maximum file size is ${maxSize}MB. Please compress your file or contact support.`, reply, 413);
      }

      // Buffer the stream
      const bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        (part.file as any).on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        (part.file as any).on('end', () => resolve(Buffer.concat(chunks)));
        (part.file as any).on('error', reject);
      });

      try {
        let folder = 'uploads/podcasts';

        // Determine the folder based on field name
        if (part.fieldname === 'imageUrl' || part.fieldname === 'imageFile') {
          folder = 'uploads/podcast-covers';
        } else if (part.fieldname === 'audioUrl' || part.fieldname.startsWith('audioFile')) {
          folder = 'uploads/podcast-audio';
        }

        const uploadResult = await uploadFile({
          buffer: bodyBuffer,
          fileName: part.filename,
          contentType: part.mimetype || 'application/octet-stream',
          folder,
        });

        files[part.fieldname] = uploadResult.publicUrl;
      } catch (error) {
        console.error('Firebase upload error:', error);
        return errorHandle('Failed to upload file to Firebase Storage', reply, 500);
      }

    } else if ('value' in part) {
      const rawValue = (part as { value: any }).value as unknown;
      if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            metadata[part.fieldname] = JSON.parse(trimmed);
          } catch {
            // If parsing fails, fall back to the raw string
            metadata[part.fieldname] = rawValue;
          }
        } else {
          metadata[part.fieldname] = rawValue;
        }
      } else {
        metadata[part.fieldname] = rawValue as any;
      }
    }
  }

  console.log("metadata", metadata);
  console.log("files", files);

  if (!metadata.totalDuration) {
    return errorHandle('Total duration is required', reply, 400);
  }
  if (!metadata.categories) {
    return errorHandle('At least one category is required', reply, 400);
  }

  // Get file URLs
  const imageUrl = files.imageFile;

  // Create podcast object
  const podcast: Podcast = {
    title: metadata.english.title,
    imageUrl: imageUrl,
    slug: metadata.slug,
    totalDuration: Number(metadata.totalDuration),
    published: String(metadata.published).toLowerCase() === 'true',
    speakers: metadata.authors,
    guests: metadata.guests,
    categories: metadata.categories,
  };

  console.log(podcast)

  const translatedPodcast: TranslatedPodcast[] = Object.entries(metadata)
    .filter(([key]) => ['english', 'hindi', 'arabic', 'bahasa'].includes(key))
    .map(([_lang, value]) => {
      return {
        language: value.language,
        title: value.title,
        summary: value.summary,
        description: value.description,
        keyTakeaways: value.keyTakeaways,
        imageUrl: files[`${_lang}Image`] || null,
      }
    });


  console.log("podcast", podcast);
  console.log("translatedPodcast", translatedPodcast);

  const updatedPodcast = await updatePodcast(id, podcast, translatedPodcast);
  if (typeof updatedPodcast === 'string') {
    return errorHandle(updatedPodcast, reply, 500);
  }
  return successHandle(updatedPodcast, reply, 200);

})

export const getPodcastsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { page, language } = request.query as { page: string, language: string };
  const podcasts = await getPodcasts(page, language);
  if (typeof podcasts === 'string') {
    return errorHandle(podcasts, reply, 500);
  }
  return successHandle(podcasts, reply, 200);
})


export const getPodcastsCollectionsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { page, language } = request.query as { page: string, language: string };
  const podcastCollections = await getPodcastsCollections(page, language);
  if (typeof podcastCollections === 'string') {
    return errorHandle(podcastCollections, reply, 500);
  }
  return successHandle(podcastCollections, reply, 200);
});

export const getPodcastCollectionByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { language, includePodcasts } = request.query as { language: string, includePodcasts: boolean };
  const podcastCollection = await getPodcastCollectionById(id, language, includePodcasts);
  if (typeof podcastCollection === 'string') {
    return errorHandle(podcastCollection, reply, 500);
  }
  return successHandle(podcastCollection, reply, 200);
});

export const getPodcastByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { language } = request.query as { language: string };
  const podcast = await getPodcastById(id, language);
  if (typeof podcast === 'string') {
    return errorHandle(podcast, reply, 500);
  }
  return successHandle(podcast, reply, 200);
});

export const getPodcastsByCategorySlugHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { slug } = request.params as { slug: string };
  const { page, language } = request.query as { page: string, language: string };
  const podcasts = await getPodcastsByCategorySlug(slug, page, language);
  if (typeof podcasts === 'string') {
    return errorHandle(podcasts, reply, 500);
  }
  return successHandle(podcasts, reply, 200);
});

export const getPodcastsByCategoryIdsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { categoryIds } = request.body as { categoryIds: string[] };
  const { language, page } = request.query as { language: string, page: string };
  const podcasts = await getPodcastsByCategoryIds(categoryIds, page, language);
  if (typeof podcasts === 'string') {
    return errorHandle(podcasts, reply, 500);
  }
  return successHandle(podcasts, reply, 200);
});

export const searchPodcastsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { query } = request.query as { query: string };
  const { language } = request.query as { language: string };
  const { page } = request.query as { page: string };
  const podcasts = await searchPodcasts(query, language, page);
  if (typeof podcasts === 'string') {
    return errorHandle(podcasts, reply, 500);
  }
  return successHandle(podcasts, reply, 200);
});

export const getPodcastsCollectionsByIdsHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { ids } = request.body as { ids: string[] };
  const { language } = request.query as { language: string };
  const collections = await getPodcastsCollectionsByIds(ids, language);
  if (typeof collections === 'string') {
    return errorHandle(collections, reply, 500);
  }
  return successHandle(collections, reply, 200);
});


export const deletePodcastByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const result = await deletePodcastById(id);
  if (typeof result === 'string') {
    return errorHandle(result, reply, 500);
  }
  return successHandle(result, reply, 200);
}); 

export const deletePodcastCollectionByIdHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const result = await deletePodcastCollectionById(id);
  if (typeof result === 'string') {
    return errorHandle(result, reply, 500);
  }
  return successHandle(result, reply, 200);
});

export const getPodcastSummaryHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { language } = request.query as { language: string };
  const summary = await getPodcastSummary(id, language);
  if (typeof summary === 'string') {
    return errorHandle(summary, reply, 500);
  }
  return successHandle(summary, reply, 200);
});