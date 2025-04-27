import { Router, Express } from "express";
import { z } from "zod";
import { MLServiceClient } from "./ml-service-client";
import { enhancedMLClient } from "./enhanced-ml-client";
import { perplexityClient } from "./perplexity-client";
import { logger } from "./logger";

// Use enhanced ML client if Perplexity API key is available, otherwise fall back to basic client
const mlClient = perplexityClient.hasApiKey() ? enhancedMLClient : new MLServiceClient();
logger.info("MLRoutes", "ML service client initialized", { 
  client: mlClient,
  enhanced: perplexityClient.hasApiKey(),
  aiCapabilities: perplexityClient.hasApiKey() ? "available" : "unavailable"
});

// Create a new router
const router = Router();

/**
 * Health check endpoint for the ML service
 */
router.get("/api/ml/health", async (req, res) => {
  try {
    const healthStatus = await mlClient.healthCheck();
    res.json(healthStatus);
  } catch (error) {
    logger.error("MLRoutes", "Error checking ML service health", error);
    res.status(500).json({ error: "Error checking ML service health" });
  }
});

/**
 * Generate predictions endpoint
 * This will trigger the ML service to generate predictions for upcoming matches
 */
router.post("/api/ml/generate-predictions", async (req, res) => {
  const schema = z.object({
    daysAhead: z.number().optional().default(3),
    sports: z.array(z.string()).optional(),
    storeResults: z.boolean().optional().default(true),
    notifyUsers: z.boolean().optional().default(true),
  });

  const validationResult = schema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ errors: validationResult.error.errors });
  }

  try {
    const { daysAhead, sports, storeResults, notifyUsers } = validationResult.data;
    
    logger.info("MLRoutes", "Generating predictions", { daysAhead, sports, storeResults, notifyUsers });
    
    const result = await mlClient.generatePredictions({
      daysAhead,
      sports,
      storeResults,
      notifyUsers,
    });
    
    res.json(result);
  } catch (error) {
    logger.error("MLRoutes", "Error generating predictions", error);
    res.status(500).json({ error: "Error generating predictions" });
  }
});

/**
 * Get predictions for a specific sport
 */
router.get("/api/predictions/:sport", async (req, res) => {
  const { sport } = req.params;
  
  if (!sport) {
    return res.status(400).json({ error: "Sport parameter is required" });
  }
  
  try {
    const predictions = await mlClient.getSportPredictions(sport);
    res.json(predictions);
  } catch (error) {
    logger.error("MLRoutes", "Error retrieving predictions", error);
    res.status(500).json({ error: "Error retrieving predictions" });
  }
});

/**
 * Get accumulator predictions
 */
router.get("/api/accumulators", async (req, res) => {
  try {
    const accumulators = await mlClient.getAccumulators();
    res.json(accumulators);
  } catch (error) {
    logger.error({ error });
    res.status(500).json({ error: "Error retrieving accumulators" });
  }
});

/**
 * Get a list of supported sports and their configurations
 */
router.get("/api/ml/sports", async (req, res) => {
  try {
    const sports = await mlClient.getSupportedSports();
    res.json(sports);
  } catch (error) {
    logger.error({ error });
    res.status(500).json({ error: "Error retrieving supported sports" });
  }
});

/**
 * Train prediction models
 */
router.post("/api/ml/train", async (req, res) => {
  const schema = z.object({
    sport: z.string(),
    modelType: z.string().optional(),
    useSyntheticData: z.boolean().optional().default(false),
  });

  const validationResult = schema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ errors: validationResult.error.errors });
  }

  try {
    const { sport, modelType, useSyntheticData } = validationResult.data;
    
    logger.info({ options: { sport, modelType, useSyntheticData } });
    
    const result = await mlClient.trainModels({
      sport,
      modelType,
      useSyntheticData,
    });
    
    res.json(result);
  } catch (error) {
    logger.error({ error });
    res.status(500).json({ error: "Error training models" });
  }
});

/**
 * Get saved predictions for current user
 */
router.get("/api/predictions/saved", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Mock data for now - in a real app, we would fetch from the database
  res.json(["pred-123", "pred-456"]);
});

/**
 * Get accumulator selections for current user
 */
router.get("/api/predictions/accumulator-selections", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Mock data for now - in a real app, we would fetch from the database
  res.json(["pred-789"]);
});

/**
 * Get detailed AI-powered insights for a specific match
 */
router.get("/api/predictions/match-insights/:matchId", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const { matchId } = req.params;
  const sport = req.query.sport as string || "football";
  
  if (!matchId) {
    return res.status(400).json({ error: "Match ID is required" });
  }
  
  try {
    // Check if we're using the enhanced client with AI capabilities
    if (mlClient === enhancedMLClient) {
      const insights = await enhancedMLClient.getMatchInsights(matchId, sport);
      return res.json(insights);
    }
    
    // Fall back to regular predictions if AI not available
    const sportPredictions = await mlClient.getSportPredictions(sport);
    const match = sportPredictions.find((p: any) => p.matchId === matchId || p.id === matchId);
    
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    
    res.json({
      match,
      insights: null,
      status: 'unavailable',
      reason: 'ai_not_enabled'
    });
  } catch (error) {
    logger.error("MLRoutes", "Error retrieving match insights", error);
    res.status(500).json({ error: "Error retrieving match insights" });
  }
});

/**
 * Get team performance trend analysis
 */
router.get("/api/predictions/team-trends/:teamId", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const { teamId } = req.params;
  
  if (!teamId) {
    return res.status(400).json({ error: "Team ID is required" });
  }
  
  try {
    // Mock team data for demonstration
    const teamData = {
      id: teamId,
      name: `Team ${teamId}`,
      league: "Premier League",
      ranking: 5,
      form: "WDWLW",
      // Add more team stats as needed
    };
    
    // Mock recent matches
    const recentMatches = [
      { opponent: "Team A", result: "W", score: "2-0", date: new Date(Date.now() - 7 * 86400000).toISOString() },
      { opponent: "Team B", result: "D", score: "1-1", date: new Date(Date.now() - 14 * 86400000).toISOString() },
      { opponent: "Team C", result: "W", score: "3-1", date: new Date(Date.now() - 21 * 86400000).toISOString() },
      { opponent: "Team D", result: "L", score: "0-2", date: new Date(Date.now() - 28 * 86400000).toISOString() },
      { opponent: "Team E", result: "W", score: "1-0", date: new Date(Date.now() - 35 * 86400000).toISOString() },
    ];
    
    // Check if we're using the enhanced client with AI capabilities
    if (mlClient === enhancedMLClient) {
      const trends = await enhancedMLClient.analyzeTeamTrends(teamData, recentMatches);
      return res.json(trends);
    }
    
    // Fall back to basic data if AI not available
    res.json({
      team: teamData,
      recentMatches,
      status: 'unavailable',
      reason: 'ai_not_enabled'
    });
  } catch (error) {
    logger.error("MLRoutes", "Error retrieving team trends", error);
    res.status(500).json({ error: "Error retrieving team trends" });
  }
});

/**
 * Check availability of advanced AI-powered predictions
 */
router.get("/api/predictions/ai-status", (req, res) => {
  const aiStatus = {
    enabled: mlClient === enhancedMLClient,
    capabilities: [
      { name: "match_insights", available: mlClient === enhancedMLClient },
      { name: "trend_analysis", available: mlClient === enhancedMLClient },
      { name: "ai_explanations", available: mlClient === enhancedMLClient },
      { name: "enhanced_accumulators", available: mlClient === enhancedMLClient },
    ],
    apiProvider: "Perplexity AI",
    apiStatus: perplexityClient.hasApiKey() ? "connected" : "unavailable",
    requiresApiKey: !perplexityClient.hasApiKey()
  };
  
  res.json(aiStatus);
});

export function setupMLRoutes(app: Express) {
  app.use(router);
}