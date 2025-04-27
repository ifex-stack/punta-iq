import { Router, Express } from "express";
import { z } from "zod";
import { MLServiceClient } from "./ml-service-client";
import { enhancedMLClient } from "./enhanced-ml-client";
import { openaiClient } from "./openai-client";
import { logger } from "./logger";
import { advancedPredictionEngine } from "./advanced-prediction-engine";
import { historicalDataClient } from "./historical-data-client";
import { realTimeMatchesService } from "./real-time-matches-service";

// Use enhanced ML client if OpenAI API key is available, otherwise fall back to basic client
const mlClient = openaiClient.hasApiKey() ? enhancedMLClient : new MLServiceClient();
logger.info("MLRoutes", "ML service client initialized", { 
  client: mlClient,
  enhanced: openaiClient.hasApiKey(),
  aiCapabilities: openaiClient.hasApiKey() ? "available" : "unavailable"
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
  
  // Skip this handler for the ai-status endpoint which should be handled by the dedicated AI status router
  if (sport === 'ai-status') {
    return res.status(404).json({ error: "Not found" });  // Will be handled by the next matching route
  }
  
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
 * Generate advanced prediction for a specific match
 */
router.post("/api/predictions/advanced", async (req, res) => {
  // Require authentication for premium predictions
  if (!req.isAuthenticated() && req.body.premium) {
    return res.status(401).json({ error: "Authentication required for premium predictions" });
  }
  
  const schema = z.object({
    matchData: z.object({
      id: z.string().or(z.number()).optional(),
      homeTeam: z.string(),
      awayTeam: z.string(),
      league: z.string().optional(),
      sport: z.string().default("football"),
      startTime: z.string().optional(),
    }),
    historicalData: z.any().optional(),
    liveOdds: z.any().optional(),
    premium: z.boolean().optional().default(false),
  });

  const validationResult = schema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ errors: validationResult.error.errors });
  }

  try {
    const { matchData, historicalData, liveOdds, premium } = validationResult.data;
    
    logger.info("MLRoutes", "Generating advanced prediction", { 
      homeTeam: matchData.homeTeam,
      awayTeam: matchData.awayTeam,
      sport: matchData.sport,
      premium
    });
    
    // Process through advanced prediction engine
    const advancedPrediction = await advancedPredictionEngine.generateAdvancedPrediction(
      matchData,
      historicalData,
      liveOdds
    );
    
    res.json(advancedPrediction);
  } catch (error) {
    logger.error("MLRoutes", "Error generating advanced prediction", error);
    res.status(500).json({ error: "Error generating advanced prediction" });
  }
});

/**
 * Get historical data for a team
 */
router.get("/api/predictions/historical/team/:teamName", async (req, res) => {
  const { teamName } = req.params;
  
  if (!teamName) {
    return res.status(400).json({ error: "Team name is required" });
  }
  
  try {
    // Get team statistics
    const teamStats = await historicalDataClient.getTeamStats(teamName);
    
    // Get recent form
    const recentForm = await historicalDataClient.getTeamForm(teamName, 10);
    
    res.json({
      team: teamName,
      stats: teamStats,
      recentForm,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error("MLRoutes", "Error retrieving historical team data", error);
    res.status(500).json({ error: "Error retrieving historical team data" });
  }
});

/**
 * Get head-to-head data between two teams
 */
router.get("/api/predictions/historical/h2h", async (req, res) => {
  const { homeTeam, awayTeam } = req.query;
  
  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "Both homeTeam and awayTeam parameters are required" });
  }
  
  try {
    // Get head-to-head matches
    const h2hMatches = await historicalDataClient.getHeadToHeadMatches(
      homeTeam as string,
      awayTeam as string,
      10
    );
    
    res.json({
      homeTeam,
      awayTeam,
      matches: h2hMatches,
      count: h2hMatches.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error("MLRoutes", "Error retrieving head-to-head data", error);
    res.status(500).json({ error: "Error retrieving head-to-head data" });
  }
});

/**
 * Get prediction accuracy statistics
 */
router.get("/api/predictions/accuracy", async (req, res) => {
  const { market, minConfidence } = req.query;
  
  try {
    const marketType = (market as string) || "1X2";
    const confidenceThreshold = minConfidence ? parseInt(minConfidence as string, 10) : 70;
    
    // Get prediction accuracy stats
    const accuracyStats = await historicalDataClient.getPredictionAccuracy(
      marketType,
      confidenceThreshold
    );
    
    res.json({
      ...accuracyStats,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error("MLRoutes", "Error retrieving prediction accuracy", error);
    res.status(500).json({ error: "Error retrieving prediction accuracy" });
  }
});

/**
 * Generate advanced accumulators
 */
router.post("/api/predictions/advanced-accumulators", async (req, res) => {
  // Require authentication for premium accumulators
  if (!req.isAuthenticated() && req.body.premium) {
    return res.status(401).json({ error: "Authentication required for premium accumulators" });
  }
  
  const schema = z.object({
    predictions: z.array(z.any()),
    options: z.object({
      minConfidence: z.number().optional().default(65),
      premium: z.boolean().optional().default(false),
    }).optional().default({}),
  });

  const validationResult = schema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ errors: validationResult.error.errors });
  }

  try {
    const { predictions, options } = validationResult.data;
    
    if (!predictions || predictions.length < 2) {
      return res.status(400).json({ error: "At least 2 predictions are required" });
    }
    
    logger.info("MLRoutes", "Generating advanced accumulators", { 
      predictionsCount: predictions.length,
      options
    });
    
    // Generate advanced accumulators
    const advancedAccumulators = await advancedPredictionEngine.generateAdvancedAccumulators(
      predictions,
      options
    );
    
    res.json(advancedAccumulators);
  } catch (error) {
    logger.error("MLRoutes", "Error generating advanced accumulators", error);
    res.status(500).json({ error: "Error generating advanced accumulators" });
  }
});

/**
 * Check availability of advanced ML capabilities
 */
router.get("/api/predictions/advanced-capabilities", async (req, res) => {
  try {
    // Get available capabilities
    const capabilities = {
      advancedPredictions: true,
      historicalAnalysis: true,
      aiEnhanced: openaiClient.hasApiKey(),
      explainablePredictions: true,
      confidenceFactors: true,
      valueBetIdentification: true,
      predictionMethods: [
        "statistical-model",
        "historical-trend-analysis",
        "poisson-distribution",
        "points-distribution",
        ...(openaiClient.hasApiKey() ? ["ai-enhanced", "gpt-4o"] : [])
      ],
      status: "available",
      version: "1.0.0"
    };
    
    res.json(capabilities);
  } catch (error) {
    logger.error("MLRoutes", "Error checking advanced capabilities", error);
    res.status(500).json({ error: "Error checking advanced capabilities" });
  }
});

/**
 * Get real-time matches for today
 */
router.get("/api/predictions/real-time-matches", async (req, res) => {
  const { sport, date } = req.query;
  let dateOffset = 0; // Default to today
  
  // Parse date offset
  if (date) {
    if (date === 'yesterday') {
      dateOffset = -1;
    } else if (date === 'tomorrow') {
      dateOffset = 1;
    } else if (!isNaN(Number(date))) {
      dateOffset = Number(date);
    }
  }
  
  try {
    if (sport) {
      // Get matches for specific sport
      if (sport === 'football') {
        const matches = await realTimeMatchesService.getTodayFootballMatches();
        
        // Filter matches for the requested date
        const matchesForDate = realTimeMatchesService.getMatchesForDate(matches, dateOffset);
        return res.json(matchesForDate);
      } else if (sport === 'basketball') {
        const matches = await realTimeMatchesService.getTodayBasketballMatches();
        
        // Filter matches for the requested date
        const matchesForDate = realTimeMatchesService.getMatchesForDate(matches, dateOffset);
        return res.json(matchesForDate);
      }
    }
    
    // Get all sports matches if no specific sport requested
    const allMatches = await realTimeMatchesService.getAllSportsMatches(dateOffset);
    res.json(allMatches);
  } catch (error) {
    logger.error("MLRoutes", "Error fetching real-time matches", error);
    res.status(500).json({ error: "Error fetching real-time matches" });
  }
});

export function setupMLRoutes(app: Express) {
  app.use(router);
}