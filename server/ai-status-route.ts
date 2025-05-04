import { Router } from "express";
import { openaiClient } from "./openai-client";
import { logger } from "./logger";

export function setupAiStatusRoutes(app: any) {
  const aiStatusRouter = Router();
  
  aiStatusRouter.get("/api/predictions/ai-status", (req, res) => {
    try {
      logger.info('AIStatus', 'Checking AI capabilities');
      
      const aiStatus = {
        enabled: openaiClient.hasApiKey(),
        capabilities: [
          { name: "match_insights", available: openaiClient.hasApiKey() },
          { name: "trend_analysis", available: openaiClient.hasApiKey() },
          { name: "ai_explanations", available: openaiClient.hasApiKey() },
          { name: "enhanced_accumulators", available: openaiClient.hasApiKey() },
        ],
        apiProvider: "OpenAI",
        model: "gpt-4o",
        apiStatus: openaiClient.hasApiKey() ? "connected" : "unavailable",
        requiresApiKey: !openaiClient.hasApiKey(),
        status: openaiClient.hasApiKey() ? "connected" : "unavailable"
      };
      
      logger.info('AIStatus', 'AI status check completed', { 
        enabled: aiStatus.enabled, 
        apiStatus: aiStatus.apiStatus,
        hasApiKey: openaiClient.hasApiKey()
      });
      
      return res.status(200).json(aiStatus);
    } catch (error) {
      logger.error('AIStatus', 'Error getting AI status', error);
      return res.status(500).json({ 
        error: "Error checking AI status",
        enabled: false,
        apiStatus: "error",
        status: "error",
        requiresApiKey: true
      });
    }
  });
  
  // Use AI status router
  app.use(aiStatusRouter);
}