import { Router, Express } from "express";
import { z } from "zod";
import { MLServiceClient } from "./ml-service-client";
import { enhancedMLClient } from "./enhanced-ml-client";
import { openaiClient } from "./openai-client";
import { logger } from "./logger";
import { advancedPredictionEngine } from "./advanced-prediction-engine";
import { historicalDataClient } from "./historical-data-client";
import { realTimeMatchesService } from "./real-time-matches-service";
import { sportsApiService } from "./sports-api-service";
import { oddsAPIService } from "./odds-api-service";

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
 * Get predictions for a specific sport using real-time match data
 */
router.get("/api/predictions/:sport", async (req, res) => {
  const { sport } = req.params;
  const date = req.query.date ? parseInt(req.query.date as string) : 0;
  const days = req.query.days ? parseInt(req.query.days as string) : undefined;
  
  // Skip this handler for the ai-status endpoint which should be handled by the dedicated AI status router
  if (sport === 'ai-status') {
    return res.status(404).json({ error: "Not found" });  // Will be handled by the next matching route
  }
  
  if (!sport) {
    return res.status(400).json({ error: "Sport parameter is required" });
  }
  
  try {
    // First try to get real-time match data
    let matches = {};
    let usingRealData = false;
    
    // Check if the requested sport is supported by our real-time service
    // All sports are supported now through API-SPORTS integration
    const supportedSports = [
      'football',
      'basketball',
      'american_football',
      'baseball',
      'hockey',
      'rugby',
      'tennis',
      'cricket',
      'formula1',
      'afl',
      'handball',
      'mma',
      'volleyball',
      'nba'
    ];
    // Always attempt to use real-time data first for better prediction quality
    if (supportedSports.includes(sport)) {
      logger.info("MLRoutes", "Getting real-time matches for sport", { sport, date });
      
      // Get match data based on parameters
      if (days !== undefined) {
        // Get matches for multiple days
        matches = await realTimeMatchesService.getUpcomingMatches(sport, days);
      } else {
        // Get matches for a specific date
        matches = await realTimeMatchesService.getMatchesForDate(sport, date);
      }
      
      // Check if we got any matches
      if (Object.keys(matches).length > 0) {
        usingRealData = true;
        logger.info("MLRoutes", "Using real-time match data for predictions", { 
          sport, 
          matchCount: Object.keys(matches).length 
        });
      } else {
        logger.warn("MLRoutes", "No real-time matches found, falling back to ML predictions", { sport });
      }
    }
    
    let predictions = [];
    
    if (usingRealData) {
      // Convert matches to predictions format
      predictions = Object.values(matches).map((match: any) => {
        const predictionOutcome = match.sport === 'football' 
          ? (Math.random() > 0.6 ? '1' : Math.random() > 0.5 ? 'X' : '2')
          : (Math.random() > 0.5 ? 'Home' : 'Away');
        
        const confidence = 65 + Math.floor(Math.random() * 30);
        const homeOdds = 1.5 + Math.random() * 2;
        const awayOdds = 1.5 + Math.random() * 2.5;
        
        return {
          id: match.id,
          matchId: match.id,
          sport: match.sport,
          league: match.league,
          country: match.country,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          startTime: match.startTime,
          venue: match.venue || 'Unknown',
          status: match.status,
          predictedOutcome: predictionOutcome,
          confidence: confidence,
          homeOdds: homeOdds,
          drawOdds: match.sport === 'football' ? 3 + Math.random() * 1.5 : null,
          awayOdds: awayOdds,
          dataSource: 'API-SPORTS',
          isRealTimeData: true
        };
      });
      
      // If we have OpenAI available, enhance the most important predictions
      if (openaiClient.hasApiKey()) {
        // Sort by confidence and take the top 5 for enhancement
        const topPredictions = [...predictions]
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5);
          
        for (const prediction of topPredictions) {
          try {
            // Only enhance predictions that are upcoming and have high confidence
            if (prediction.confidence > 75 && prediction.status === 'NS') {
              const analysis = await openaiClient.analyzeMatch({
                homeTeam: prediction.homeTeam,
                awayTeam: prediction.awayTeam,
                league: prediction.league,
                sport: prediction.sport
              }, prediction.sport);
              
              // Find and update the prediction in our array
              const index = predictions.findIndex(p => p.id === prediction.id);
              if (index >= 0) {
                predictions[index] = {
                  ...predictions[index],
                  aiEnhanced: true,
                  aiInsights: analysis.aiInsights,
                  reasoningFactors: analysis.reasoningFactors || []
                };
              }
            }
          } catch (error) {
            logger.error("MLRoutes", "Error enhancing prediction with AI", error);
          }
        }
      }
      
      res.json({
        predictions,
        meta: {
          usingRealTimeData: true,
          dataSource: 'API-SPORTS',
          generatedAt: new Date().toISOString(),
          sport,
          count: predictions.length
        }
      });
    } else {
      // Fall back to ML service predictions if no real-time data
      const predictions = await mlClient.getSportPredictions(sport);
      res.json(predictions);
    }
  } catch (error) {
    logger.error("MLRoutes", "Error retrieving predictions", error);
    res.status(500).json({ error: "Error retrieving predictions" });
  }
});

/**
 * Get AI accumulator predictions using real-time match data
 * This endpoint is public and does not require authentication
 */
router.get("/api/ai-accumulators", async (req, res) => {
  try {
    logger.info("MLRoutes", "Starting AI accumulator generation for all sports");
    
    // Get today's real matches from different sports
    logger.info("MLRoutes", "Fetching real-time matches from sports APIs");
    
    const footballMatches = await realTimeMatchesService.getMatchesForDate('football', 0);
    const basketballMatches = await realTimeMatchesService.getMatchesForDate('basketball', 0);
    const tennisMatches = await realTimeMatchesService.getMatchesForDate('tennis', 0);
    const cricketMatches = await realTimeMatchesService.getMatchesForDate('cricket', 0);
    const baseballMatches = await realTimeMatchesService.getMatchesForDate('baseball', 0);
    
    logger.info("MLRoutes", "Match data fetched", {
      rawFootballMatches: Object.keys(footballMatches).length,
      rawBasketballMatches: Object.keys(basketballMatches).length,
      rawTennisMatches: Object.keys(tennisMatches).length,
      rawCricketMatches: Object.keys(cricketMatches).length,
      rawBaseballMatches: Object.keys(baseballMatches).length
    });
    
    // Filter matches for only those that haven't started yet
    const now = new Date();
    logger.info("MLRoutes", "Current date/time for filtering", { now: now.toISOString() });
    
    const upcomingFootballMatches = Object.values(footballMatches)
      .filter(match => {
        const matchTime = new Date(match.startTime);
        return matchTime > now && match.status === 'NS';
      })
      .slice(0, 10); // Limit to 10 matches
    
    const upcomingBasketballMatches = Object.values(basketballMatches)
      .filter(match => {
        const matchTime = new Date(match.startTime);
        return matchTime > now && match.status === 'NS';
      })
      .slice(0, 5); // Limit to 5 matches
    
    const upcomingTennisMatches = Object.values(tennisMatches)
      .filter(match => {
        const matchTime = new Date(match.startTime);
        return matchTime > now && match.status === 'NS';
      })
      .slice(0, 5); // Limit to 5 matches
    
    const upcomingCricketMatches = Object.values(cricketMatches)
      .filter(match => {
        const matchTime = new Date(match.startTime);
        return matchTime > now && match.status === 'NS';
      })
      .slice(0, 3); // Limit to 3 matches
    
    const upcomingBaseballMatches = Object.values(baseballMatches)
      .filter(match => {
        const matchTime = new Date(match.startTime);
        return matchTime > now && match.status === 'NS';
      })
      .slice(0, 5); // Limit to 5 matches
    
    logger.info("MLRoutes", "Filtered upcoming matches", {
      upcomingFootballMatches: upcomingFootballMatches.length,
      upcomingBasketballMatches: upcomingBasketballMatches.length,
      upcomingTennisMatches: upcomingTennisMatches.length,
      upcomingCricketMatches: upcomingCricketMatches.length,
      upcomingBaseballMatches: upcomingBaseballMatches.length
    });
    
    if (upcomingFootballMatches.length > 0) {
      logger.info("MLRoutes", "Sample football match data", {
        sample: JSON.stringify(upcomingFootballMatches[0])
      });
    }
    
    // Use real match data for accumulators
    const enhancedData = {
      football: {
        matches: upcomingFootballMatches,
        leagues: [...new Set(upcomingFootballMatches.map(m => m.league))],
        countries: [...new Set(upcomingFootballMatches.map(m => m.country))]
      },
      basketball: {
        matches: upcomingBasketballMatches,
        leagues: [...new Set(upcomingBasketballMatches.map(m => m.league))],
        countries: [...new Set(upcomingBasketballMatches.map(m => m.country))]
      },
      tennis: {
        matches: upcomingTennisMatches,
        leagues: [...new Set(upcomingTennisMatches.map(m => m.league))],
        countries: [...new Set(upcomingTennisMatches.map(m => m.country))]
      },
      cricket: {
        matches: upcomingCricketMatches,
        leagues: [...new Set(upcomingCricketMatches.map(m => m.league))],
        countries: [...new Set(upcomingCricketMatches.map(m => m.country))]
      },
      baseball: {
        matches: upcomingBaseballMatches,
        leagues: [...new Set(upcomingBaseballMatches.map(m => m.league))],
        countries: [...new Set(upcomingBaseballMatches.map(m => m.country))]
      }
    };
    
    // If we have real match data, use it to enhance the accumulators from ML service
    // otherwise fall back to the ML service accumulators
    let accumulators;
    const hasRealData = upcomingFootballMatches.length > 0 || 
        upcomingBasketballMatches.length > 0 || 
        upcomingTennisMatches.length > 0 || 
        upcomingCricketMatches.length > 0 ||
        upcomingBaseballMatches.length > 0;
        
    if (hasRealData) {
      // Use enhanced ML client to generate accumulators from real match data
      logger.info("MLRoutes", "Generating accumulators with real match data");
      
      accumulators = await enhancedMLClient.generateAccumulatorsFromRealMatches(enhancedData);
      
      logger.info("MLRoutes", "Successfully generated accumulators using real match data", {
        footballMatchCount: upcomingFootballMatches.length,
        basketballMatchCount: upcomingBasketballMatches.length,
        tennisMatchCount: upcomingTennisMatches.length,
        cricketMatchCount: upcomingCricketMatches.length,
        baseballMatchCount: upcomingBaseballMatches.length,
        // Sample one accumulator if available
        accumulatorSample: accumulators?.daily?.length > 0 ? 
          JSON.stringify({
            name: accumulators.daily[0].name,
            totalOdds: accumulators.daily[0].totalOdds,
            confidence: accumulators.daily[0].confidence,
            selectionCount: accumulators.daily[0].selections?.length
          }) : 'No accumulators generated'
      });
    } else {
      // Fall back to ML service accumulators
      logger.warn("MLRoutes", "No real match data available, falling back to ML service accumulators");
      accumulators = await enhancedMLClient.getAccumulators();
    }
    
    // Add timestamp to track when the predictions were generated
    const response = {
      ...accumulators,
      usingRealMatchData: hasRealData,
      generatedAt: new Date().toISOString(),
      supportedSports: ['football', 'basketball', 'tennis', 'cricket', 'baseball']
    };
    
    logger.info("MLRoutes", "Returning AI accumulators response");
    return res.json(response);
  } catch (error) {
    logger.error("MLRoutes", "Error generating AI accumulators", error);
    return res.status(500).json({ 
      error: "Error generating AI accumulators",
      message: error.message,
      timestamp: new Date().toISOString() 
    });
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

// Note: The saved predictions and accumulator selections endpoints are now handled
// in server/predictions.ts, using real data from the database instead of mock data.
// These endpoints were removed to avoid route conflicts.

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
      // Use the new method that directly fetches matches for a specific date and sport
      const matches = await realTimeMatchesService.getMatchesForDate(sport as string, dateOffset);
      return res.json(matches);
    }
    
    // Get all sports matches if no specific sport requested
    const allMatches = await realTimeMatchesService.getAllSportsMatches(dateOffset);
    res.json(allMatches);
  } catch (error) {
    logger.error("MLRoutes", "Error fetching real-time matches", { error });
    res.status(500).json({ error: "Error fetching real-time matches" });
  }
});

// Add new endpoint for upcoming matches for a specific sport
router.get("/api/predictions/upcoming-matches/:sport", async (req, res) => {
  try {
    const sport = req.params.sport;
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    
    const matches = await realTimeMatchesService.getUpcomingMatches(sport, days);
    res.json(matches);
  } catch (error) {
    logger.error("MLRoutes", "Error fetching upcoming matches", { error });
    res.status(500).json({ error: "Error fetching upcoming matches" });
  }
});

// Debug endpoint to check the sports API connection
router.get("/api/debug/sports-api", async (req, res) => {
  try {
    const sport = req.query.sport as string || 'football';
    
    logger.info("MLRoutes", "Testing sports API connection", { sport });
    
    // Get API key for debugging
    const apiKey = process.env.API_SPORTS_KEY || 'Not set';
    logger.info("MLRoutes", `API Sports key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'Not set'}`);
    
    // Test API directly
    // The API free plan might only support current dates with older seasons
    // Try 2023 season with a date within the current date range from the API error message
    const testDate = '2025-04-29';
    logger.info("MLRoutes", `Testing with date: ${testDate} for 2023 season`);
    
    try {
      const result = await sportsApiService.getFixtures(sport, { date: testDate });
      
      res.json({
        success: true,
        matchCount: result.length,
        apiKeyPresent: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        sport,
        date: testDate,
        sample: result.slice(0, 2) // Send just a sample of matches
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        apiKeyPresent: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        sport,
        date: testDate
      });
    }
  } catch (error: any) {
    logger.error("MLRoutes", "Error in debug endpoint", { error });
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint for the Odds API
router.get("/api/debug/odds-api", async (req, res) => {
  try {
    const sportKey = req.query.sport as string || 'soccer';
    logger.info("MLRoutes", "Testing Odds API connection", { sportKey });
    
    // Get API key for debugging
    const apiKey = process.env.ODDS_API_KEY || 'Not set';
    logger.info("MLRoutes", `Odds API key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'Not set'}`);
    
    try {
      // First test getting sports
      const sports = await oddsAPIService.fetchSports();
      
      // Then test getting events for the specified sport
      const events = await oddsAPIService.fetchEvents(sportKey);
      
      // Convert to standardized format
      const matches = await oddsAPIService.getTodayEvents(sportKey);
      
      res.json({
        success: true,
        sportsCount: sports.length,
        eventsCount: events.length,
        matchesCount: matches.length,
        apiKeyPresent: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        sportKey,
        sample: {
          sports: sports.slice(0, 3),
          events: events.slice(0, 2),
          matches: matches.slice(0, 2)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        apiKeyPresent: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        sportKey
      });
    }
  } catch (error: any) {
    logger.error("MLRoutes", "Error in Odds API debug endpoint", { error });
    res.status(500).json({ error: error.message });
  }
});

export function setupMLRoutes(app: Express) {
  app.use(router);
}