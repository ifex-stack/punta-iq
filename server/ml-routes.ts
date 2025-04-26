import { Router, Express } from "express";
import { z } from "zod";
import { MLServiceClient } from "./ml-service-client";
import { logger } from "./logger";

// Create a ML Service client
const mlClient = new MLServiceClient();
logger.info("MLRoutes", "ML service client initialized", { client: mlClient });

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

export function setupMLRoutes(app: Express) {
  app.use(router);
}