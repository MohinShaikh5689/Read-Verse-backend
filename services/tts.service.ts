import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const saveTTS = async (jobId: string, audioUrl: string, type: string, language: string) => {
    console.log("jobId", jobId);
    console.log("audioUrl", audioUrl);
    console.log("type", type);
    try {
        if (type === 'summary') {
            const summary = await prisma.translatedSummary.findUnique({
                where: { summaryId_language: { summaryId: jobId, language: language } },
            });
            if (summary) {
                await prisma.translatedSummary.update({ where: { summaryId_language: { summaryId: jobId, language: language } }, data: { audioUrl } });
                return summary;
            }
        } 
    } catch (error) {
        console.error(error);
        return 'Failed to save TTS';
    }
}