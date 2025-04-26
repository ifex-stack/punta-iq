import type { Express } from "express";
import { mlServiceClient } from "./ml-service-client";
import { logger } from "./logger";

/**
 * Set up routes for interacting with the ML prediction service
 */
export function setupMLRoutes(app: Express) {
  // ML service health check
  app.get("/api/ml/health", async (req, res) => {
    try {
      const isHealthy = await mlServiceClient.isHealthy();
      if (isHealthy) {
        res.json({ status: "healthy" });
      } else {
        res.status(503).json({ status: "unhealthy", message: "ML service is not responding" });
      }
    } catch (error: any) {
      logger.error("Error checking ML service health", { error: error.message });
      res.status(500).json({ 
        status: "error", 
        message: "Failed to check ML service health", 
        error: error.message 
      });
    }
  });

  // Trigger prediction generation
  app.post("/api/ml/generate-predictions", async (req, res) => {
    // Only admins can manually trigger prediction generation
    if (!req.isAuthenticated() || req.user.id !== 1) {
      return res.status(403).json({ message: "Only administrators can generate predictions" });
    }

    try {
      const options = {
        daysAhead: req.body.daysAhead,
        sports: req.body.sports,
        storeResults: req.body.storeResults !== false,
        notifyUsers: req.body.notifyUsers !== false,
      };

      logger.info("Generating predictions", { options });
      const result = await mlServiceClient.generatePredictions(options);
      
      res.json(result);
    } catch (error: any) {
      logger.error("Error generating predictions", { error: error.message });
      res.status(500).json({ 
        message: "Failed to generate predictions", 
        error: error.message 
      });
    }
  });

  // Get latest predictions by sport
  app.get("/api/ml/predictions/:sport", async (req, res) => {
    try {
      const sport = req.params.sport;
      const isPremiumUser = req.isAuthenticated() && 
        ["basic", "pro", "elite"].includes(req.user.subscriptionTier);
      
      // Get predictions from ML service
      const data = await mlServiceClient.getSportPredictions(sport);
      
      // Filter out premium predictions for non-premium users
      const predictions = data.predictions.map((prediction: any) => {
        // If this is a premium prediction and user is not premium, mask some data
        if (prediction.tier === 'elite' && !isPremiumUser) {
          return {
            ...prediction,
            isLocked: true,
            predictions: {
              // Keep basic prediction info but remove details
              ...Object.fromEntries(
                Object.entries(prediction.predictions).map(([market, details]: [string, any]) => [
                  market,
                  {
                    predicted_outcome: "locked",
                    confidence: null,
                    probabilities: null,
                    requiresSubscription: true
                  }
                ])
              )
            }
          };
        }
        return prediction;
      });
      
      res.json({
        sport,
        predictions,
        timestamp: data.timestamp,
        count: predictions.length
      });
    } catch (error: any) {
      logger.error(`Error getting ${req.params.sport} predictions`, { error: error.message });
      res.status(500).json({ 
        message: `Failed to get ${req.params.sport} predictions`, 
        error: error.message 
      });
    }
  });

  // Get latest accumulator predictions
  app.get("/api/ml/accumulators", async (req, res) => {
    try {
      const isPremiumUser = req.isAuthenticated() && 
        ["basic", "pro", "elite"].includes(req.user.subscriptionTier);
      
      // Get accumulators from ML service
      const data = await mlServiceClient.getAccumulators();
      
      // Filter accumulators based on user subscription
      const accumulators = Object.fromEntries(
        Object.entries(data.accumulators).map(([key, acc]: [string, any]) => {
          // For premium accumulators, check subscription
          if ((key === 'five_fold' || key === 'ten_fold') && !isPremiumUser) {
            return [key, {
              ...acc,
              isLocked: true,
              picks: acc.picks.map((pick: any) => ({
                ...pick,
                prediction: "locked",
                confidence: null,
                requiresSubscription: true
              }))
            }];
          }
          return [key, acc];
        })
      );
      
      res.json({
        accumulators,
        timestamp: data.timestamp,
        count: Object.keys(accumulators).length
      });
    } catch (error: any) {
      logger.error("Error getting accumulator predictions", { error: error.message });
      res.status(500).json({ 
        message: "Failed to get accumulator predictions", 
        error: error.message 
      });
    }
  });

  // Train models (admin only)
  app.post("/api/ml/train", async (req, res) => {
    // Only admins can train models
    if (!req.isAuthenticated() || req.user.id !== 1) {
      return res.status(403).json({ message: "Only administrators can train models" });
    }

    try {
      const options = {
        sport: req.body.sport,
        modelType: req.body.modelType,
        useSyntheticData: req.body.useSyntheticData !== false,
      };

      if (!options.sport) {
        return res.status(400).json({ message: "Sport is required" });
      }

      logger.info("Training prediction models", { options });
      const result = await mlServiceClient.trainModels(options);
      
      res.json(result);
    } catch (error: any) {
      logger.error("Error training models", { error: error.message });
      res.status(500).json({ 
        message: "Failed to train models", 
        error: error.message 
      });
    }
  });

  // Get supported sports
  app.get("/api/ml/supported-sports", async (req, res) => {
    try {
      const data = await mlServiceClient.getSupportedSports();
      res.json(data.sports);
    } catch (error: any) {
      logger.error("Error getting supported sports", { error: error.message });
      res.status(500).json({ 
        message: "Failed to get supported sports", 
        error: error.message 
      });
    }
  });
}