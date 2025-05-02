/**
 * API routes for interacting with the AI Flask microservice
 * Includes error handling and graceful degradation
 */
import { Router } from "express";
import { MicroserviceClient } from "./microservice-client";
import { createContextLogger } from "./logger";

export const microserviceRouter = Router();
const client = new MicroserviceClient();
const logger = createContextLogger("MicroserviceRoutes");

// Helper function to handle API errors uniformly
const handleApiError = (res: any, error: Error, fallbackMessage: string) => {
  logger.error(`API error: ${error.message}`);
  
  // Determine appropriate status code
  let statusCode = 500;
  if (error.message.includes('unavailable')) {
    statusCode = 503; // Service Unavailable
  } else if (error.message.includes('authentication failed')) {
    statusCode = 401; // Unauthorized
  } else if (error.message.includes('rate limit')) {
    statusCode = 429; // Too Many Requests
  }

  res.status(statusCode).json({
    error: error.message || fallbackMessage,
    status: 'error',
    timestamp: new Date().toISOString()
  });
};

// Get the status of the AI service and external APIs
microserviceRouter.get("/status", async (req, res) => {
  try {
    const status = await client.getStatus();
    res.json(status);
  } catch (error) {
    handleApiError(res, error as Error, "Failed to get service status");
  }
});

// Get list of supported sports
microserviceRouter.get("/sports", async (req, res) => {
  try {
    const sports = await client.getSports();
    res.json(sports);
  } catch (error) {
    handleApiError(res, error as Error, "Failed to get sports list");
  }
});

// Get odds for a specific sport
microserviceRouter.get("/odds/:sport", async (req, res) => {
  const sport = req.params.sport;
  try {
    const odds = await client.getOdds(sport);
    res.json(odds);
  } catch (error) {
    handleApiError(res, error as Error, `Failed to get odds for ${sport}`);
  }
});

// Get live scores for current matches
microserviceRouter.get("/livescore", async (req, res) => {
  try {
    const scores = await client.getLiveScores();
    res.json(scores);
  } catch (error) {
    handleApiError(res, error as Error, "Failed to get live scores");
  }
});

// Get fixtures for a specific league
microserviceRouter.get("/fixtures/league/:leagueId", async (req, res) => {
  const leagueId = req.params.leagueId;
  try {
    const fixtures = await client.getLeagueFixtures(leagueId);
    res.json(fixtures);
  } catch (error) {
    handleApiError(res, error as Error, `Failed to get fixtures for league ${leagueId}`);
  }
});

// Get teams in a specific league
microserviceRouter.get("/teams/league/:leagueId", async (req, res) => {
  const leagueId = req.params.leagueId;
  try {
    const teams = await client.getTeams(leagueId);
    res.json(teams);
  } catch (error) {
    handleApiError(res, error as Error, `Failed to get teams for league ${leagueId}`);
  }
});

// Get all leagues
microserviceRouter.get("/leagues", async (req, res) => {
  try {
    const leagues = await client.getLeagues();
    res.json(leagues);
  } catch (error) {
    handleApiError(res, error as Error, "Failed to get leagues");
  }
});

// Get predictions for a specific sport with tier support
microserviceRouter.get("/predictions/sports/:sport", async (req, res) => {
  const sport = req.params.sport;
  const minConfidence = req.query.minConfidence ? Number(req.query.minConfidence) : undefined;
  const tier = req.query.tier as string | undefined;
  const includePremium = req.query.includePremium !== 'false';
  
  // Check if user is authenticated for premium content
  const isAuthenticated = req.isAuthenticated();
  const user = req.user;
  const isPremiumUser = user?.subscriptionTier && ['pro', 'elite'].includes(user.subscriptionTier);
  
  // If requesting premium content but not authorized
  if (includePremium && !isPremiumUser && isAuthenticated) {
    return res.status(403).json({
      error: "Premium tier predictions require a Pro or Elite subscription",
      status: "error",
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    const predictions = await client.getSportPredictions(sport, {
      minConfidence,
      tier,
      includePremium: isPremiumUser || !isAuthenticated // Always include premium for non-auth (will be filtered in UI)
    });
    
    res.json({
      ...predictions,
      isPremiumUser,
      userTier: user?.subscriptionTier || 'free',
    });
  } catch (error) {
    handleApiError(res, error as Error, `Failed to get predictions for ${sport}`);
  }
});

// Get accumulator predictions with tier support
microserviceRouter.get("/predictions/accumulators", async (req, res) => {
  const tier = req.query.tier as string | undefined;
  const tierCategory = req.query.tierCategory as string | undefined;
  const size = req.query.size ? Number(req.query.size) : undefined;
  
  // Check if user is authenticated for premium content
  const isAuthenticated = req.isAuthenticated();
  const user = req.user;
  const isPremiumUser = user?.subscriptionTier && ['pro', 'elite'].includes(user.subscriptionTier);
  
  try {
    const accumulators = await client.getAccumulators({
      tier,
      tierCategory,
      size
    });
    
    // Filter out premium tiers for non-premium users
    if (isAuthenticated && !isPremiumUser) {
      // If user is logged in but not premium, remove premium accumulators
      if (accumulators.accumulators) {
        for (const category in accumulators.accumulators) {
          if (category === 'tier1' || category === 'tier2') {
            delete accumulators.accumulators[category];
          }
        }
      }
    }
    
    res.json({
      ...accumulators,
      isPremiumUser,
      userTier: user?.subscriptionTier || 'free',
    });
  } catch (error) {
    handleApiError(res, error as Error, "Failed to get accumulators");
  }
});

// Get predictions organized by tier
microserviceRouter.get("/predictions/tiers", async (req, res) => {
  // Check if user is authenticated for premium content
  const isAuthenticated = req.isAuthenticated();
  const user = req.user;
  const isPremiumUser = user?.subscriptionTier && ['pro', 'elite'].includes(user.subscriptionTier);
  
  try {
    const tieredPredictions = await client.getTieredPredictions();
    
    // Filter out premium tiers for non-premium users
    if (isAuthenticated && !isPremiumUser) {
      // If user is logged in but not premium, remove tier1 and tier2
      tieredPredictions.tier1 = [];
      tieredPredictions.tier2 = [];
    }
    
    res.json({
      ...tieredPredictions,
      isPremiumUser,
      userTier: user?.subscriptionTier || 'free',
    });
  } catch (error) {
    handleApiError(res, error as Error, "Failed to get tiered predictions");
  }
});

// Add a health endpoint
microserviceRouter.get("/health", async (req, res) => {
  try {
    const isRunning = await client.isRunning();
    if (isRunning) {
      res.json({ status: "ok", message: "AI Microservice is running" });
    } else {
      res.status(503).json({ 
        status: "error", 
        message: "AI Microservice is not running",
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    handleApiError(res, error as Error, "Failed to check microservice health");
  }
});