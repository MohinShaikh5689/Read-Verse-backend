import { saveTTSHandler } from "../controllers/tts.controller.js";
import { FastifyInstance } from "fastify";

export const ttsRoutes = async (fastify: FastifyInstance) => {
    fastify.post('/save-tts', {
        schema: {
            tags: ['tts'],
            summary: 'Save TTS',
            body: {
                type: 'object',
                properties: {
                    jobId: { type: 'string' },
                    audioUrl: { type: 'string' },
                    type: { type: 'string' },
                },
            },
        },
    }, saveTTSHandler);
}