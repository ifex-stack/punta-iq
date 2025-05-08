import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertAccumulatorSchema, insertUserPredictionSchema, sports, leagues, accumulatorItems } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { generateBaseConfidenceBreakdown, generatePersonalizedConfidenceBreakdown } from "./confidence-service";

export function setupPredictionRoutes(app: Express) {
  // Get prediction statistics
  app.get("/api/predictions/stats", async (req, res) => {
    try {
      const period = req.query.period || 'all';
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      // Get all predictions with their matches
      const allPredictions = await storage.getAllPredictions();
      const completedMatches = await storage.getCompletedMatches();
      const completedMatchIds = completedMatches.map(m => m.id);
      
      // Filter predictions to only those with completed matches
      const predictions = allPredictions.filter(p => completedMatchIds.includes(p.matchId));
      
      // Calculate statistics
      const totalPredictions = predictions.length;
      const successfulPredictions = predictions.filter(p => p.isCorrect === true).length;
      const successRate = totalPredictions > 0 ? (successfulPredictions / totalPredictions) * 100 : 0;
      
      // Get user-specific statistics if authenticated
      let userStats = null;
      if (userId) {
        const userPredictions = await storage.getUserPredictions(userId);
        const userPredictionIds = userPredictions.map(up => up.predictionId);
        
        const viewedPredictions = predictions.filter(p => userPredictionIds.includes(p.id));
        const userSuccessfulPredictions = viewedPredictions.filter(p => p.isCorrect === true).length;
        const userTotalPredictions = viewedPredictions.length;
        
        userStats = {
          totalViewed: userTotalPredictions,
          successfulPredictions: userSuccessfulPredictions,
          successRate: userTotalPredictions > 0 ? (userSuccessfulPredictions / userTotalPredictions) * 100 : 0,
        };
      }
      
      // Generate historical data (success rate by month)
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Group by month and calculate success rate
      const historicalData = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      for (let m = 0; m < 6; m++) {
        const month = new Date();
        month.setMonth(month.getMonth() - m);
        
        const monthPredictions = predictions.filter(p => {
          const predDate = new Date(p.createdAt);
          return predDate.getMonth() === month.getMonth() && 
                 predDate.getFullYear() === month.getFullYear();
        });
        
        const monthSuccess = monthPredictions.filter(p => p.isCorrect === true).length;
        const monthRate = monthPredictions.length > 0 ? (monthSuccess / monthPredictions.length) * 100 : 0;
        
        historicalData.unshift({
          month: monthNames[month.getMonth()],
          successRate: Math.round(monthRate),
          totalPredictions: monthPredictions.length,
          correctPredictions: monthSuccess
        });
      }
      
      // Get market type breakdown
      const marketTypes = {};
      for (const prediction of predictions) {
        const type = prediction.predictedOutcome;
        if (!marketTypes[type]) {
          marketTypes[type] = { total: 0, correct: 0 };
        }
        marketTypes[type].total += 1;
        if (prediction.isCorrect === true) {
          marketTypes[type].correct += 1;
        }
      }
      
      // Convert to array and calculate success rates
      const marketTypeStats = Object.entries(marketTypes).map(([type, data]) => {
        const { total, correct } = data as { total: number, correct: number };
        return {
          type,
          total,
          correct,
          successRate: total > 0 ? Math.round((correct / total) * 100) : 0
        };
      });
      
      res.json({
        overall: {
          totalPredictions,
          successfulPredictions,
          successRate: Math.round(successRate),
          pendingPredictions: allPredictions.length - totalPredictions
        },
        userStats,
        historicalData,
        marketTypes: marketTypeStats
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get sports breakdown statistics
  app.get("/api/predictions/sports", async (req, res) => {
    try {
      const allSports = await storage.getActiveSports();
      const allPredictions = await storage.getAllPredictions();
      const completedMatches = await storage.getCompletedMatches();
      
      const result = [];
      
      for (const sport of allSports) {
        // Get leagues for this sport
        const leagues = await storage.getLeaguesBySport(sport.id);
        const leagueIds = leagues.map(l => l.id);
        
        // Get matches for these leagues
        const sportMatches = completedMatches.filter(m => leagueIds.includes(m.leagueId));
        const sportMatchIds = sportMatches.map(m => m.id);
        
        // Get predictions for these matches
        const sportPredictions = allPredictions.filter(p => sportMatchIds.includes(p.matchId));
        
        const totalPredictions = sportPredictions.length;
        const successfulPredictions = sportPredictions.filter(p => p.isCorrect === true).length;
        const successRate = totalPredictions > 0 ? (successfulPredictions / totalPredictions) * 100 : 0;
        
        result.push({
          sport,
          stats: {
            totalPredictions,
            successfulPredictions,
            successRate: Math.round(successRate)
          }
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  // Get today's predictions
  app.get("/api/predictions/today", async (req, res) => {
    try {
      // Get user subscription status
      const isPremiumUser = req.isAuthenticated() && 
        ["basic", "pro", "elite"].includes(req.user.subscriptionTier);
      
      // Get upcoming matches with predictions
      const upcomingMatches = await storage.getUpcomingMatches(20);
      const result = [];
      
      for (const match of upcomingMatches) {
        const predictions = await storage.getPredictionsByMatch(match.id);
        
        if (predictions.length > 0) {
          // Get associated league
          const [league] = await db
            .select()
            .from(leagues)
            .where(eq(leagues.id, match.leagueId));
          
          // Get sport
          const [sport] = league ? await db
            .select()
            .from(sports)
            .where(eq(sports.id, league.sportId)) : [];
          
          // For each match, combine with its predictions
          for (const prediction of predictions) {
            // Skip premium predictions for non-premium users
            if (prediction.isPremium && !isPremiumUser) {
              // Include prediction but mark as locked
              result.push({
                match,
                prediction: {
                  ...prediction,
                  isLocked: true,
                },
                league: league || null,
                sport: sport || null
              });
            } else {
              result.push({
                match,
                prediction,
                league: league || null,
                sport: sport || null
              });
            }
          }
        }
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get predictions by sport
  app.get("/api/predictions/sport/:sportId", async (req, res) => {
    try {
      const sportId = parseInt(req.params.sportId);
      
      // Get leagues for this sport
      const leagues = await storage.getLeaguesBySport(sportId);
      const leagueIds = leagues.map(league => league.id);
      
      // Get matches for these leagues
      const allMatches = await storage.getAllMatches();
      const sportMatches = allMatches.filter(match => leagueIds.includes(match.leagueId));
      
      // Get predictions for these matches
      const result = [];
      const isPremiumUser = req.isAuthenticated() && 
        ["basic", "pro", "elite"].includes(req.user.subscriptionTier);
      
      for (const match of sportMatches) {
        const predictions = await storage.getPredictionsByMatch(match.id);
        const [league] = await db
          .select()
          .from(leagues)
          .where(eq(leagues.id, match.leagueId));
        
        for (const prediction of predictions) {
          // Skip premium predictions for non-premium users
          if (prediction.isPremium && !isPremiumUser) {
            // Include prediction but mark as locked
            result.push({
              match,
              prediction: {
                ...prediction,
                isLocked: true,
              },
              league: league || null
            });
          } else {
            result.push({
              match,
              prediction,
              league: league || null
            });
          }
        }
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get prediction history
  app.get("/api/predictions/history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Get user's viewed predictions
      const userPredictions = await storage.getUserPredictions(req.user.id);
      const result = [];
      
      for (const userPrediction of userPredictions) {
        const prediction = await storage.getPredictionById(userPrediction.predictionId);
        if (prediction) {
          const match = await storage.getMatchById(prediction.matchId);
          if (match) {
            const [league] = await db
              .select()
              .from(leagues)
              .where(eq(leagues.id, match.leagueId));
            result.push({
              userPrediction,
              prediction,
              match,
              league: league || null
            });
          }
        }
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get personalized confidence breakdown for a prediction
  app.get("/api/predictions/:predictionId/confidence", async (req, res) => {
    try {
      const predictionId = parseInt(req.params.predictionId);
      if (isNaN(predictionId)) {
        return res.status(400).json({ message: "Invalid prediction ID" });
      }
      
      // Check if the prediction exists
      const prediction = await storage.getPredictionById(predictionId);
      if (!prediction) {
        return res.status(404).json({ message: "Prediction not found" });
      }
      
      // Generate confidence breakdown based on authentication status
      if (req.isAuthenticated()) {
        // User is authenticated, generate personalized confidence
        const userId = req.user.id;
        const confidenceBreakdown = await generatePersonalizedConfidenceBreakdown(userId, predictionId);
        
        if (confidenceBreakdown) {
          return res.json(confidenceBreakdown);
        }
      }
      
      // Fallback to base confidence for non-authenticated users or if personalization fails
      const baseConfidence = await generateBaseConfidenceBreakdown(predictionId);
      
      if (baseConfidence) {
        return res.json(baseConfidence);
      }
      
      // Last resort fallback if both methods fail
      res.status(500).json({ message: "Could not generate confidence breakdown" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Save/view a prediction
  app.post("/api/predictions/view", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { predictionId } = req.body;
      if (!predictionId) {
        return res.status(400).json({ message: "Prediction ID is required" });
      }
      
      // Check if premium prediction
      const prediction = await storage.getPredictionById(predictionId);
      if (!prediction) {
        return res.status(404).json({ message: "Prediction not found" });
      }
      
      // Check if user has access to this prediction
      if (prediction.isPremium && !["basic", "pro", "elite"].includes(req.user.subscriptionTier)) {
        return res.status(403).json({ message: "Upgrade required to view premium predictions" });
      }
      
      // Save the user prediction view
      const userPrediction = await storage.saveUserPrediction({
        userId: req.user.id,
        predictionId,
        isSaved: false,
        isInAccumulator: false
      });
      
      res.json(userPrediction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Toggle saved prediction
  app.post("/api/predictions/toggle-save", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { predictionId } = req.body;
      if (!predictionId) {
        return res.status(400).json({ message: "Prediction ID is required" });
      }
      
      const userPrediction = await storage.toggleSavedPrediction(req.user.id, predictionId);
      res.json(userPrediction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create accumulator
  app.post("/api/accumulator", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const validatedData = insertAccumulatorSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const accumulator = await storage.createAccumulator(validatedData);
      
      // If prediction IDs are provided, add them to the accumulator
      if (req.body.predictionIds && Array.isArray(req.body.predictionIds)) {
        for (const predictionId of req.body.predictionIds) {
          await storage.addToAccumulator({
            accumulatorId: accumulator.id,
            predictionId
          });
        }
      }
      
      res.status(201).json(accumulator);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get user's accumulators
  app.get("/api/accumulators", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const accumulators = await storage.getUserAccumulators(req.user.id);
      const result = [];
      
      for (const accumulator of accumulators) {
        // Get all accumulator items
        const items = await db
          .select()
          .from(accumulatorItems)
          .where(eq(accumulatorItems.accumulatorId, accumulator.id));
        
        const predictionItems = [];
        for (const item of items) {
          const prediction = await storage.getPredictionById(item.predictionId);
          if (prediction) {
            const match = await storage.getMatchById(prediction.matchId);
            if (match) {
              predictionItems.push({
                item,
                prediction,
                match
              });
            }
          }
        }
        
        result.push({
          accumulator,
          items: predictionItems
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Add to accumulator
  app.post("/api/accumulator/:id/add", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const accumulatorId = parseInt(req.params.id);
      const { predictionId } = req.body;
      
      if (!predictionId) {
        return res.status(400).json({ message: "Prediction ID is required" });
      }
      
      // Check if accumulator exists and belongs to user
      const accumulator = await storage.getAccumulatorById(accumulatorId);
      if (!accumulator) {
        return res.status(404).json({ message: "Accumulator not found" });
      }
      
      if (accumulator.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this accumulator" });
      }
      
      // Add prediction to accumulator
      const item = await storage.addToAccumulator({
        accumulatorId,
        predictionId
      });
      
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Remove from accumulator
  app.delete("/api/accumulator/:id/remove/:predictionId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const accumulatorId = parseInt(req.params.id);
      const predictionId = parseInt(req.params.predictionId);
      
      // Check if accumulator exists and belongs to user
      const accumulator = await storage.getAccumulatorById(accumulatorId);
      if (!accumulator) {
        return res.status(404).json({ message: "Accumulator not found" });
      }
      
      if (accumulator.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this accumulator" });
      }
      
      // Remove prediction from accumulator
      const success = await storage.removeFromAccumulator(accumulatorId, predictionId);
      
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ message: "Item not found in accumulator" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get football predictions
  app.get("/api/predictions/football", async (req, res) => {
    try {
      // Get sport ID for football/soccer
      const [football] = await db
        .select()
        .from(sports)
        .where(eq(sports.name, "Soccer"));
      
      if (!football) {
        // Return empty array instead of error to avoid error messages on frontend
        return res.json([]);
      }
      
      // Get leagues for football
      const leagues = await storage.getLeaguesBySport(football.id);
      const leagueIds = leagues.map(league => league.id);
      
      // Get matches for these leagues
      const allMatches = await storage.getUpcomingMatches(20);
      const sportMatches = allMatches.filter(match => leagueIds.includes(match.leagueId));
      
      // Get predictions for these matches
      const result = [];
      const isPremiumUser = req.isAuthenticated() && 
        ["basic", "pro", "elite"].includes(req.user.subscriptionTier);
      
      for (const match of sportMatches) {
        const predictions = await storage.getPredictionsByMatch(match.id);
        const [league] = await db
          .select()
          .from(leagues)
          .where(eq(leagues.id, match.leagueId));
        
        for (const prediction of predictions) {
          // Skip premium predictions for non-premium users
          if (prediction.isPremium && !isPremiumUser) {
            // Include prediction but mark as locked
            result.push({
              id: prediction.id,
              matchId: match.id,
              sport: "football",
              createdAt: prediction.createdAt,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              startTime: match.startTime,
              league: league?.name || "Unknown",
              predictedOutcome: prediction.outcome,
              confidence: prediction.confidence,
              isPremium: true,
              isLocked: true,
              predictions: prediction.markets || {}
            });
          } else {
            result.push({
              id: prediction.id,
              matchId: match.id,
              sport: "football",
              createdAt: prediction.createdAt,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              startTime: match.startTime,
              league: league?.name || "Unknown",
              predictedOutcome: prediction.outcome,
              confidence: prediction.confidence,
              isPremium: prediction.isPremium,
              predictions: prediction.markets || {}
            });
          }
        }
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get basketball predictions
  app.get("/api/predictions/basketball", async (req, res) => {
    try {
      // Get sport ID for basketball - ensure exact match with database
      const [basketball] = await db
        .select()
        .from(sports)
        .where(eq(sports.name, "Basketball"));
      
      if (!basketball) {
        // Return empty array instead of an error to avoid error messages on frontend
        return res.json([]);
      }
      
      // Get leagues for basketball
      const leagues = await storage.getLeaguesBySport(basketball.id);
      const leagueIds = leagues.map(league => league.id);
      
      // Get matches for these leagues
      const allMatches = await storage.getUpcomingMatches(20);
      const sportMatches = allMatches.filter(match => leagueIds.includes(match.leagueId));
      
      // Get predictions for these matches
      const result = [];
      const isPremiumUser = req.isAuthenticated() && 
        ["basic", "pro", "elite"].includes(req.user.subscriptionTier);
      
      for (const match of sportMatches) {
        const predictions = await storage.getPredictionsByMatch(match.id);
        const [league] = await db
          .select()
          .from(leagues)
          .where(eq(leagues.id, match.leagueId));
        
        for (const prediction of predictions) {
          // Skip premium predictions for non-premium users
          if (prediction.isPremium && !isPremiumUser) {
            // Include prediction but mark as locked
            result.push({
              id: prediction.id,
              matchId: match.id,
              sport: "basketball",
              createdAt: prediction.createdAt,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              startTime: match.startTime,
              league: league?.name || "Unknown",
              predictedOutcome: prediction.outcome,
              confidence: prediction.confidence,
              isPremium: true,
              isLocked: true,
              predictions: prediction.markets || {}
            });
          } else {
            result.push({
              id: prediction.id,
              matchId: match.id,
              sport: "basketball",
              createdAt: prediction.createdAt,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              startTime: match.startTime,
              league: league?.name || "Unknown",
              predictedOutcome: prediction.outcome,
              confidence: prediction.confidence,
              isPremium: prediction.isPremium,
              predictions: prediction.markets || {}
            });
          }
        }
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get saved predictions
  app.get("/api/predictions/saved", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json([]);
    }
    
    try {
      // Get saved prediction IDs for the user
      const savedPredictions = await storage.getUserSavedPredictions(req.user.id);
      const predictionIds = savedPredictions.map(sp => sp.predictionId);
      
      res.json(predictionIds);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get accumulator selections
  app.get("/api/predictions/accumulator-selections", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json([]);
    }
    
    try {
      // Get user's accumulator selections
      const selections = await storage.getUserAccumulatorSelections(req.user.id);
      const predictionIds = selections.map(s => s.predictionId);
      
      res.json(predictionIds);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}
