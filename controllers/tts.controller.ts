import type { FastifyReply, FastifyRequest } from "fastify";
import { asyncHandle, successHandle, errorHandle } from "../utils/handler.js";
import { saveTTS } from "../services/tts.service.js";

export const saveTTSHandler = asyncHandle(async (request: FastifyRequest, reply: FastifyReply) => {
   const { summaryId, audioUrl, type, language } = request.body as { summaryId: string, audioUrl: string, type: string, language: string };
   console.log("jobId", summaryId);
   console.log("audioUrl", audioUrl);
   console.log("type", type);
   console.log("language", language);
   const tts = await saveTTS(summaryId, audioUrl, type, language);
   if (typeof tts === 'string') {
    return errorHandle(tts, reply, 500);
   }
   return successHandle(tts, reply, 201);
});