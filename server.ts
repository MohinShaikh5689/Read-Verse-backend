import Fastify from 'fastify';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import multipart from "@fastify/multipart";
import fastifyCors from '@fastify/cors';

import { AuthorRoutes } from './routes/author.routes.js';
import { BookRoutes } from './routes/book.routes.js';
import { CategoryRoutes } from './routes/categories.routes.js';
import { PodcastRoutes } from './routes/podcast.routes.js';
import { PageRoutes } from './routes/page.routes.js';
import { ttsRoutes } from './routes/tts.routes.js';
import { UserRoutes } from './routes/user.routes.js';


// Create Fastify instance
const fastify: FastifyInstance = Fastify();

// Plugins and routes are registered during startup

// Start the server
const start = async (): Promise<void> => {
  try {
    dotenv.config();
    const port = process.env.PORT ? parseInt(process.env.PORT) :4000;
    const host = process.env.HOST || 'localhost';
    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : [
        'http://localhost:5173',
      ];

    const corsOptions = {
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    };
    await fastify.register(fastifyCors, corsOptions);
    
    // Register multipart first so parser is available for all routes
    const maxFileSizeMb = process.env.MAX_FILE_SIZE_MB ? parseInt(process.env.MAX_FILE_SIZE_MB) : 100; // default 100MB for audio files
    await fastify.register(multipart, {
      limits: {
        fileSize: maxFileSizeMb * 1024 * 1024, // Convert MB to bytes
        files: 10, // Maximum number of files
        fieldSize: 1024 * 1024, // 1MB for field values (JSON data)
        fields: 50, // Maximum number of fields
      }
    });

    // Swagger/OpenAPI setup
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'Read verse-api',
          description: 'API documentation',
          version: '1.0.0'
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        }
      }
    });

    await fastify.register(swaggerUI, {
      routePrefix: '/api/v1/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      }
    });

    // Health check response handler
    const healthCheckHandler = async (request: FastifyRequest, reply: FastifyReply) => {
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Read Verse API Engine'
      };
    };

    // Health check schema for docs
    const healthCheckSchema = {
      tags: ['health'],
      summary: 'Health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            service: { type: 'string' }
          },
          required: ['status', 'timestamp', 'service']
        }
      }
    };

    // Health check endpoints - both root and /health for App Runner compatibility
    fastify.get('/', {
      schema: healthCheckSchema
    }, healthCheckHandler);

    fastify.get('/health', {
      schema: healthCheckSchema
    }, healthCheckHandler);
    // Register API routes
    await fastify.register(AuthorRoutes, { prefix: '/api/v1' });
    await fastify.register(BookRoutes, { prefix: '/api/v1' });
    await fastify.register(CategoryRoutes, { prefix: '/api/v1' });
    await fastify.register(PodcastRoutes, { prefix: '/api/v1' });
    await fastify.register(PageRoutes, { prefix: '/api/v1' });
    await fastify.register(ttsRoutes, { prefix: '/api/v1' });
    await fastify.register(UserRoutes, { prefix: '/api/v1' });
    await fastify.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

// Start the server
start();