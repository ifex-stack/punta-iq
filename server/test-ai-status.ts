import { Express } from "express";
import { openaiClient } from "./openai-client";
import { logger } from "./logger";

export function setupTestAiStatusRoute(app: Express) {
  // Direct route - no router
  app.get("/api/ai-status-test", (req, res) => {
    try {
      logger.info('AIStatusTest', 'Checking AI capabilities');
      
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
      
      logger.info('AIStatusTest', 'AI status check completed', { 
        enabled: aiStatus.enabled, 
        apiStatus: aiStatus.apiStatus,
        hasApiKey: openaiClient.hasApiKey()
      });
      
      return res.status(200).json(aiStatus);
    } catch (error) {
      logger.error('AIStatusTest', 'Error getting AI status', error);
      return res.status(500).json({ 
        error: "Error checking AI status",
        enabled: false,
        apiStatus: "error",
        status: "error",
        requiresApiKey: true
      });
    }
  });
}