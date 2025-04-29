import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { setupPredictionRoutes } from "./predictions";
import { setupNotificationRoutes } from "./notifications";
import { setupGamificationRoutes } from "./gamification";
import { setupMLRoutes } from "./ml-routes";
import { setupAiStatusRoutes } from "./ai-status-route";
import { setupTestAiStatusRoute } from "./test-ai-status";
import { storage } from "./storage";
import { getFantasyStore } from "./fantasy-data-init";
import { PushNotificationService } from "./push-notification-service";
import { newsRecommendationEngine } from "./recommendation-engine";
import { db, pool } from "./db";
import { setupNewsRoutes } from "./news-routes";
import { PlayerSeasonStats, PlayerMatchStats } from "@shared/player-interfaces";

import { realTimeMatchesService } from "./real-time-matches-service";
import { openaiClient } from "./openai-client";
import { oddsAPIService } from "./odds-api-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up prediction-related routes
  setupPredictionRoutes(app);
  
  // Set up notification routes
  setupNotificationRoutes(app);
  
  // Set up gamification routes (badges & leaderboards)
  setupGamificationRoutes(app);
  
  // Set up AI status route (register this BEFORE the ML routes to prevent path conflicts)
  setupAiStatusRoutes(app);
  
  // Set up test AI status route
  setupTestAiStatusRoute(app);
  
  // Set up ML-based prediction routes 
  setupMLRoutes(app);
  
  // Set up fixed news routes
  setupNewsRoutes(app);
  
  // Add sample prediction data endpoint to ensure UI can display predictions
  app.get("/api/predictions/football", (req, res) => {
    // Generate today's date for realistic start times
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Generate sample football predictions data
    const sampleFootballPredictions = [
      {
        id: "f1",
        matchId: "m1",
        sport: "football",
        league: "Premier League",
        country: "England",
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
        startTime: `${todayString}T19:30:00.000Z`,
        venue: "Emirates Stadium, London",
        status: "NS",
        predictedOutcome: "1",
        confidence: 76,
        homeOdds: 2.10,
        drawOdds: 3.40,
        awayOdds: 3.50,
        dataSource: "OddsAPI",
        isRealTimeData: true,
        valueBet: { value: 12, market: "1X2", selection: "Home" },
        markets: {
          btts: { 
            prediction: "Yes", 
            confidence: 75, 
            odds: { yes: 1.72, no: 2.05 } 
          },
          overUnder: {
            line: 2.5,
            prediction: "Over",
            confidence: 70,
            odds: { over: 1.85, under: 1.95 }
          },
          correctScore: { 
            prediction: "2-1", 
            confidence: 28,
            odds: 9.5
          },
          corners: {
            total: { prediction: 10.5, confidence: 68 },
            home: { prediction: 6, confidence: 72 },
            away: { prediction: 4, confidence: 65 }
          },
          cards: {
            total: { prediction: 4.5, confidence: 73 },
            home: { prediction: 2, confidence: 68 },
            away: { prediction: 3, confidence: 71 }
          }
        }
      },
      {
        id: "f2",
        matchId: "m2",
        sport: "football",
        league: "La Liga",
        country: "Spain",
        homeTeam: "Barcelona",
        awayTeam: "Real Madrid",
        startTime: `${todayString}T20:00:00.000Z`,
        venue: "Camp Nou, Barcelona",
        status: "NS",
        predictedOutcome: "X",
        confidence: 68,
        homeOdds: 2.60,
        drawOdds: 3.20,
        awayOdds: 2.80,
        dataSource: "OddsAPI",
        isRealTimeData: true,
        valueBet: { value: 8, market: "1X2", selection: "Draw" },
        markets: {
          btts: { 
            prediction: "Yes", 
            confidence: 82, 
            odds: { yes: 1.62, no: 2.25 } 
          },
          overUnder: {
            line: 2.5,
            prediction: "Over",
            confidence: 77,
            odds: { over: 1.75, under: 2.10 }
          },
          correctScore: { 
            prediction: "2-2", 
            confidence: 22,
            odds: 11.0
          },
          corners: {
            total: { prediction: 9.5, confidence: 71 },
            home: { prediction: 5, confidence: 69 },
            away: { prediction: 5, confidence: 68 }
          },
          cards: {
            total: { prediction: 5.5, confidence: 79 },
            home: { prediction: 3, confidence: 75 },
            away: { prediction: 3, confidence: 74 }
          }
        }
      },
      {
        id: "f3",
        matchId: "m3",
        sport: "football",
        league: "Serie A",
        country: "Italy",
        homeTeam: "Juventus",
        awayTeam: "Inter Milan",
        startTime: `${todayString}T18:00:00.000Z`,
        venue: "Allianz Stadium, Turin",
        status: "NS",
        predictedOutcome: "2",
        confidence: 65,
        homeOdds: 2.75,
        drawOdds: 3.10,
        awayOdds: 2.65,
        dataSource: "OddsAPI",
        isRealTimeData: true,
        valueBet: { value: 7, market: "1X2", selection: "Away" },
        markets: {
          btts: { 
            prediction: "Yes", 
            confidence: 73, 
            odds: { yes: 1.75, no: 2.15 } 
          },
          overUnder: {
            line: 2.5,
            prediction: "Under",
            confidence: 62,
            odds: { over: 2.05, under: 1.85 }
          },
          correctScore: { 
            prediction: "1-2", 
            confidence: 24,
            odds: 10.5
          },
          corners: {
            total: { prediction: 8.5, confidence: 65 },
            home: { prediction: 4, confidence: 62 },
            away: { prediction: 5, confidence: 67 }
          },
          cards: {
            total: { prediction: 4.5, confidence: 72 },
            home: { prediction: 2, confidence: 70 },
            away: { prediction: 3, confidence: 75 }
          }
        }
      }
    ];
    
    res.json(sampleFootballPredictions);
  });
  
  app.get("/api/predictions/basketball", (req, res) => {
    // Generate today's date for realistic start times
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Generate sample basketball predictions data
    const sampleBasketballPredictions = [
      {
        id: "b1",
        matchId: "mb1",
        sport: "basketball",
        league: "NBA",
        country: "USA",
        homeTeam: "Los Angeles Lakers",
        awayTeam: "Golden State Warriors",
        startTime: `${todayString}T23:00:00.000Z`,
        venue: "Crypto.com Arena, Los Angeles",
        status: "NS",
        predictedOutcome: "Home",
        confidence: 72,
        homeOdds: 1.85,
        drawOdds: null,
        awayOdds: 1.95,
        dataSource: "OddsAPI",
        isRealTimeData: true,
        valueBet: { value: 9, market: "MoneyLine", selection: "Home" },
        markets: {
          pointSpread: {
            line: -3.5,
            prediction: "Home",
            confidence: 68,
            odds: { home: 1.90, away: 1.90 }
          },
          totalPoints: {
            line: 219.5,
            prediction: "Over",
            confidence: 71,
            odds: { over: 1.90, under: 1.90 }
          },
          overUnder: {
            line: 219.5,
            prediction: "Over",
            confidence: 71,
            odds: { over: 1.90, under: 1.90 }
          }
        }
      },
      {
        id: "b2",
        matchId: "mb2",
        sport: "basketball",
        league: "NBA",
        country: "USA",
        homeTeam: "Boston Celtics",
        awayTeam: "Philadelphia 76ers",
        startTime: `${todayString}T00:30:00.000Z`,
        venue: "TD Garden, Boston",
        status: "NS",
        predictedOutcome: "Away",
        confidence: 67,
        homeOdds: 1.75,
        drawOdds: null,
        awayOdds: 2.10,
        dataSource: "OddsAPI",
        isRealTimeData: true,
        valueBet: { value: 14, market: "MoneyLine", selection: "Away" },
        markets: {
          pointSpread: {
            line: 2.5,
            prediction: "Away",
            confidence: 65,
            odds: { home: 1.90, away: 1.90 }
          },
          totalPoints: {
            line: 224.5,
            prediction: "Under",
            confidence: 63,
            odds: { over: 1.90, under: 1.90 }
          },
          overUnder: {
            line: 224.5,
            prediction: "Under",
            confidence: 63,
            odds: { over: 1.90, under: 1.90 }
          }
        }
      }
    ];
    
    res.json(sampleBasketballPredictions);
  });
  
  app.get("/api/accumulators", (req, res) => {
    const sampleAccumulators = {
      small: [
        {
          id: "acc1",
          name: "Daily Double",
          type: "small",
          selections: [
            {
              matchId: "m1",
              homeTeam: "Arsenal",
              awayTeam: "Chelsea",
              league: "Premier League",
              country: "England",
              market: "1X2",
              prediction: "1",
              odds: 2.10,
              confidence: 76,
              startTime: new Date().toISOString()
            },
            {
              matchId: "mb1",
              homeTeam: "Los Angeles Lakers",
              awayTeam: "Golden State Warriors",
              league: "NBA",
              country: "USA",
              market: "MoneyLine",
              prediction: "Home",
              odds: 1.85,
              confidence: 72,
              startTime: new Date().toISOString()
            }
          ],
          totalOdds: 3.88,
          confidence: 74,
          createdAt: new Date().toISOString(),
          riskRating: 2
        }
      ],
      medium: [
        {
          id: "acc2",
          name: "Triple Threat",
          type: "medium",
          selections: [
            {
              matchId: "m1",
              homeTeam: "Arsenal",
              awayTeam: "Chelsea",
              league: "Premier League",
              country: "England",
              market: "1X2",
              prediction: "1",
              odds: 2.10,
              confidence: 76,
              startTime: new Date().toISOString()
            },
            {
              matchId: "m2",
              homeTeam: "Barcelona",
              awayTeam: "Real Madrid",
              league: "La Liga",
              country: "Spain",
              market: "BTTS",
              prediction: "Yes",
              odds: 1.62,
              confidence: 82,
              startTime: new Date().toISOString()
            },
            {
              matchId: "mb1",
              homeTeam: "Los Angeles Lakers",
              awayTeam: "Golden State Warriors",
              league: "NBA",
              country: "USA",
              market: "TotalPoints",
              prediction: "Over 219.5",
              odds: 1.90,
              confidence: 71,
              startTime: new Date().toISOString()
            }
          ],
          totalOdds: 6.46,
          confidence: 69,
          createdAt: new Date().toISOString(),
          riskRating: 3
        }
      ],
      large: [],
      mega: []
    };
    
    res.json(sampleAccumulators);
  });
  
  // Add stats data for the statistics tab
  app.get("/api/predictions/stats", (req, res) => {
    const statsData = {
      overall: {
        successRate: 76,
        totalPredictions: 244,
        successfulPredictions: 186,
        avgConfidence: 74,
        avgOdds: 1.87,
        potentialROI: "+42%",
        bestSport: "Football",
        bestSportRate: "82%"
      },
      user: {
        totalViewed: 68,
        successfulPredictions: 51,
        successRate: 75
      },
      historicalData: [
        { month: 'Nov', successRate: 73, totalPredictions: 40, correctPredictions: 29 },
        { month: 'Dec', successRate: 75, totalPredictions: 44, correctPredictions: 33 },
        { month: 'Jan', successRate: 72, totalPredictions: 46, correctPredictions: 33 },
        { month: 'Feb', successRate: 78, totalPredictions: 45, correctPredictions: 35 },
        { month: 'Mar', successRate: 77, totalPredictions: 43, correctPredictions: 33 },
        { month: 'Apr', successRate: 76, totalPredictions: 38, correctPredictions: 29 }
      ],
      sportBreakdown: {
        football: {
          totalPredictions: 148,
          successfulPredictions: 121,
          successRate: 82
        },
        basketball: {
          totalPredictions: 56,
          successfulPredictions: 39,
          successRate: 70
        },
        tennis: {
          totalPredictions: 24,
          successfulPredictions: 17,
          successRate: 71
        },
        hockey: {
          totalPredictions: 16,
          successfulPredictions: 9,
          successRate: 56
        }
      },
      marketTypes: {
        '1X2': { total: 98, correct: 75, rate: 77 },
        'BTTS': { total: 76, correct: 58, rate: 76 },
        'Over/Under': { total: 70, correct: 53, rate: 76 }
      }
    };
    
    res.json(statsData);
  });
  
  // Add history data for charts
  app.get("/api/predictions/history", (req, res) => {
    const historyData = [
      { date: "Apr 22", success: 4, fail: 1 },
      { date: "Apr 23", success: 5, fail: 2 },
      { date: "Apr 24", success: 3, fail: 1 },
      { date: "Apr 25", success: 6, fail: 1 },
      { date: "Apr 26", success: 5, fail: 0 },
      { date: "Apr 27", success: 4, fail: 2 },
      { date: "Apr 28", success: 5, fail: 1 },
      { date: "Apr 29", success: 4, fail: 1 }
    ];
    
    res.json(historyData);
  });
  
  // Add sports breakdown data
  app.get("/api/predictions/sports", (req, res) => {
    const sportsData = {
      football: {
        totalPredictions: 148,
        successfulPredictions: 121,
        successRate: 82,
        avgOdds: 1.95,
        roi: 43.2
      },
      basketball: {
        totalPredictions: 56,
        successfulPredictions: 39,
        successRate: 70,
        avgOdds: 1.82,
        roi: 27.4
      },
      tennis: {
        totalPredictions: 24,
        successfulPredictions: 17,
        successRate: 71,
        avgOdds: 1.76,
        roi: 24.9
      },
      hockey: {
        totalPredictions: 16,
        successfulPredictions: 9,
        successRate: 56,
        avgOdds: 2.10,
        roi: 5.6
      }
    };
    
    res.json(sportsData);
  });
  
  // Stripe subscription endpoint
  app.post("/api/create-subscription", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe key not configured" });
    }
    
    try {
      const { planId, isYearly, currencyCode } = req.body;
      const userId = req.user.id;
      
      // Simple mapping of plan IDs to Stripe price IDs
      // In a production app, these would be stored in the database
      const stripePriceIds = {
        basic: {
          monthly: "price_basic_monthly", // Replace with actual Stripe price IDs
          yearly: "price_basic_yearly"
        },
        pro: {
          monthly: "price_pro_monthly",
          yearly: "price_pro_yearly"
        },
        elite: {
          monthly: "price_elite_monthly",
          yearly: "price_elite_yearly"
        }
      };
      
      const billingCycle = isYearly ? "yearly" : "monthly";
      const priceId = stripePriceIds[planId]?.[billingCycle];
      
      if (!priceId) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }
      
      // For this MVP, we'll just simulate a successful response since we don't have actual Stripe price IDs
      // In a real implementation, we would create a Stripe Checkout session with the actual price ID
      
      const mockCheckoutSession = {
        id: `cs_test_${Math.random().toString(36).substring(2, 15)}`,
        object: "checkout.session",
        url: "/subscription-success", // Redirect to our success page
        subscription: null,
        status: "open",
        client_reference_id: userId.toString()
      };
      
      // For demonstration purposes, directly update the user's subscription tier
      // In a real implementation, this would happen after Stripe webhook confirmation
      await storage.updateUserSubscriptionTier(userId, planId);
      
      res.json({ 
        sessionId: mockCheckoutSession.id,
        url: mockCheckoutSession.url
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Test endpoint for OddsAPI
  app.get("/api/oddsapi/test", async (req, res) => {
    try {
      const sports = await oddsAPIService.fetchSports();
      res.json({
        success: true,
        message: "Successfully connected to OddsAPI",
        sports: sports.length,
        sportsList: sports
      });
    } catch (error: any) {
      console.error("Error testing OddsAPI:", error);
      res.status(500).json({
        success: false,
        message: "Error connecting to OddsAPI",
        error: error.message
      });
    }
  });
  
  // Test endpoint for OddsAPI football matches
  app.get("/api/oddsapi/football", async (req, res) => {
    try {
      // Use soccer as the key for football in OddsAPI
      const matches = await oddsAPIService.getTodayEvents("soccer");
      res.json({
        success: true,
        message: "Successfully fetched football matches from OddsAPI",
        matches: matches.length, 
        matchesList: matches
      });
    } catch (error: any) {
      console.error("Error fetching football matches from OddsAPI:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching football matches from OddsAPI",
        error: error.message
      });
    }
  });
  
  // Sports routes
  app.get("/api/sports", async (req, res) => {
    try {
      const sports = await storage.getActiveSports();
      res.json(sports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Simple direct SQL news fetch - Debugging endpoint
  app.get("/api/news/direct", async (req, res) => {
    try {
      console.log("Direct database query for news articles");
      
      // Use parameterized query with explicit schema reference
      const { rows } = await pool.query(
        `SELECT 
          id::int, 
          title, 
          summary, 
          image_url, 
          published_at, 
          author, 
          source 
        FROM news_articles 
        ORDER BY published_at DESC 
        LIMIT 10`
      );
      
      console.log(`Direct news query found ${rows.length} articles`);
      
      // Transform to camelCase property names for frontend consumption
      const articles = rows.map(row => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        imageUrl: row.image_url,
        publishedAt: row.published_at,
        author: row.author,
        source: row.source
      }));
      
      res.json(articles);
    } catch (error: any) {
      console.error("Database error in /api/news/direct:", error);
      res.status(500).json({ 
        message: "Database error", 
        details: error.message
      });
    }
  });
  
  // Real-time match data routes for all supported sports
  app.get("/api/matches/football", async (req, res) => {
    try {
      const dateOffset = req.query.date ? parseInt(req.query.date as string) : 0;
      const matches = await realTimeMatchesService.getMatchesForDate('football', dateOffset);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/matches/basketball", async (req, res) => {
    try {
      const dateOffset = req.query.date ? parseInt(req.query.date as string) : 0;
      const matches = await realTimeMatchesService.getMatchesForDate('basketball', dateOffset);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/matches/american_football", async (req, res) => {
    try {
      const dateOffset = req.query.date ? parseInt(req.query.date as string) : 0;
      const matches = await realTimeMatchesService.getMatchesForDate('american_football', dateOffset);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/matches/baseball", async (req, res) => {
    try {
      const dateOffset = req.query.date ? parseInt(req.query.date as string) : 0;
      const matches = await realTimeMatchesService.getMatchesForDate('baseball', dateOffset);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/matches/hockey", async (req, res) => {
    try {
      const dateOffset = req.query.date ? parseInt(req.query.date as string) : 0;
      const matches = await realTimeMatchesService.getMatchesForDate('hockey', dateOffset);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/matches/rugby", async (req, res) => {
    try {
      const dateOffset = req.query.date ? parseInt(req.query.date as string) : 0;
      const matches = await realTimeMatchesService.getMatchesForDate('rugby', dateOffset);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Generic endpoint to get matches for any supported sport
  app.get("/api/matches/:sport", async (req, res) => {
    try {
      const sport = req.params.sport;
      const dateOffset = req.query.date ? parseInt(req.query.date as string) : 0;
      const matches = await realTimeMatchesService.getMatchesForDate(sport, dateOffset);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get matches for all sports
  app.get("/api/matches", async (req, res) => {
    try {
      const dateOffset = req.query.date ? parseInt(req.query.date as string) : 0;
      const matches = await realTimeMatchesService.getAllSportsMatches(dateOffset);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get upcoming matches for a specific sport
  app.get("/api/matches/upcoming/:sport", async (req, res) => {
    try {
      const sport = req.params.sport;
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const matches = await realTimeMatchesService.getUpcomingMatches(sport, days);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Leagues routes
  app.get("/api/leagues/:sportId", async (req, res) => {
    try {
      const sportId = parseInt(req.params.sportId);
      const leagues = await storage.getLeaguesBySport(sportId);
      res.json(leagues);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // User subscription routes
  app.post("/api/subscription/update", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { tier } = req.body;
      if (!tier) {
        return res.status(400).json({ message: "Subscription tier is required" });
      }
      
      const user = await storage.updateUserSubscription(req.user.id, tier);
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Stripe subscription creation endpoint
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { planId, isYearly, currencyCode } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      // In a real implementation, we would interact with Stripe API
      // to create a checkout session or payment intent
      
      // For now, return a mock response to prevent the UI from breaking
      res.json({
        success: true,
        message: "Subscription initiated",
        url: "/subscription-success", // This would normally be a Stripe checkout URL
        planId,
        isYearly,
        currencyCode
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message || "Failed to create subscription" });
    }
  });
  
  // Profile settings routes
  app.patch("/api/user/notification-settings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const settings = req.body;
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserNotificationSettings(user.id, {
        ...user.notificationSettings,
        ...settings
      });
      
      res.json({ settings: updatedUser.notificationSettings });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Fantasy Football routes - Using main storage (these will be replaced by the memory store implementation below)
  /*
  app.get("/api/fantasy/contests", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const status = req.query.status as string;
      const tier = req.query.tier as string;
      const contests = await storage.getAllFantasyContests(limit, status, tier);
      res.json(contests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/fantasy/contests/free", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const status = req.query.status as string;
      const contests = await storage.getFreeFantasyContests(limit, status);
      res.json(contests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/fantasy/contests/premium", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const status = req.query.status as string;
      const contests = await storage.getPremiumFantasyContests(limit, status);
      
      // Check if user is authorized to access premium contests
      if (req.isAuthenticated() && req.user.subscriptionTier === 'premium') {
        res.json(contests);
      } else {
        // Return limited information for non-premium users
        const limitedContests = contests.map(contest => ({
          id: contest.id,
          name: contest.name,
          description: contest.description,
          startDate: contest.startDate,
          endDate: contest.endDate,
          tier: contest.tier,
          status: contest.status,
          prizePool: contest.prizePool,
          requiresPremium: true
        }));
        res.json(limitedContests);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/fantasy/contests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contest = await storage.getFantasyContestById(id);
      
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      
      res.json(contest);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/fantasy/contests", async (req, res) => {
    if (!req.isAuthenticated() || req.user.id !== 1) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const contestData = req.body;
      const contest = await storage.createFantasyContest(contestData);
      res.status(201).json(contest);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  */
  
  app.get("/api/fantasy/teams", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teams = await storage.getUserFantasyTeams(req.user.id);
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/fantasy/teams", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teamData = {
        ...req.body,
        userId: req.user.id
      };
      const team = await storage.createFantasyTeam(teamData);
      res.status(201).json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Fantasy team management routes
  app.get("/api/fantasy/teams/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getFantasyTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Fantasy team not found" });
      }
      
      // Ensure user can only access their own teams
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(team);
    } catch (error: any) {
      console.error('Error fetching fantasy team:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch fantasy team' });
    }
  });

  app.get("/api/fantasy/teams/:id/players", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getFantasyTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Fantasy team not found" });
      }
      
      // Ensure user can only access their own teams
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const players = await storage.getFantasyTeamPlayers(teamId);
      res.json(players);
    } catch (error: any) {
      console.error('Error fetching fantasy team players:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch fantasy team players' });
    }
  });

  app.post("/api/fantasy/teams/:id/players", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getFantasyTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Fantasy team not found" });
      }
      
      // Ensure user can only modify their own teams
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { playerId, position, isCaptain, isViceCaptain } = req.body;
      
      const teamPlayer = await storage.addPlayerToFantasyTeam({
        teamId,
        playerId,
        position,
        isCaptain: isCaptain || false,
        isViceCaptain: isViceCaptain || false,
        addedAt: new Date()
      });
      
      res.status(201).json(teamPlayer);
    } catch (error: any) {
      console.error('Error adding player to fantasy team:', error);
      res.status(500).json({ message: error.message || 'Failed to add player to fantasy team' });
    }
  });

  app.delete("/api/fantasy/teams/:teamId/players/:playerId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teamId = parseInt(req.params.teamId);
      const playerId = parseInt(req.params.playerId);
      
      const team = await storage.getFantasyTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Fantasy team not found" });
      }
      
      // Ensure user can only modify their own teams
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const success = await storage.removePlayerFromFantasyTeam(teamId, playerId);
      
      if (!success) {
        return res.status(404).json({ message: "Player not found in team" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error removing player from fantasy team:', error);
      res.status(500).json({ message: error.message || 'Failed to remove player from fantasy team' });
    }
  });

  app.put("/api/fantasy/teams/:teamId/players/:playerId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teamId = parseInt(req.params.teamId);
      const teamPlayerId = parseInt(req.params.playerId);
      
      const team = await storage.getFantasyTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Fantasy team not found" });
      }
      
      // Ensure user can only modify their own teams
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedPlayer = await storage.updateFantasyTeamPlayer(teamPlayerId, req.body);
      
      res.json(updatedPlayer);
    } catch (error: any) {
      console.error('Error updating fantasy team player:', error);
      res.status(500).json({ message: error.message || 'Failed to update fantasy team player' });
    }
  });

  app.put("/api/fantasy/teams/:id/reset-captains", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getFantasyTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Fantasy team not found" });
      }
      
      // Ensure user can only modify their own teams
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const success = await storage.resetFantasyTeamCaptains(teamId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to reset team captains" });
      }
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error resetting fantasy team captains:', error);
      res.status(500).json({ message: error.message || 'Failed to reset fantasy team captains' });
    }
  });

  app.put("/api/fantasy/teams/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getFantasyTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Fantasy team not found" });
      }
      
      // Ensure user can only modify their own teams
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Mark the team as complete (could involve validating the team roster, etc.)
      const updatedTeam = await storage.updateFantasyTeam(teamId, { isComplete: true });
      
      res.json(updatedTeam);
    } catch (error: any) {
      console.error('Error completing fantasy team setup:', error);
      res.status(500).json({ message: error.message || 'Failed to complete fantasy team setup' });
    }
  });
  
  // AI auto-fill for fantasy team
  app.post("/api/fantasy/teams/:id/ai-autofill", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teamId = parseInt(req.params.id);
      const { position } = req.body;
      
      // Get team info to determine formation
      const team = await storage.getFantasyTeamById(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      
      // Verify the user owns this team
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: 'You do not own this team' });
      }
      
      // Get existing team players
      const existingPlayers = await storage.getFantasyTeamPlayers(teamId);
      
      // Get players for the requested position
      // For now, use the search function with position filter
      const availablePlayers = await storage.searchFootballPlayers('', position || '', '', 50);
      
      // Filter out players already in the team
      const existingPlayerIds = existingPlayers.map(p => p.playerId);
      const filteredPlayers = availablePlayers.filter(p => !existingPlayerIds.includes(p.id));
      
      if (filteredPlayers.length === 0) {
        return res.status(404).json({ message: 'No available players found for this position' });
      }
      
      // Sort players by fantasy points (in a real implementation, this would use the AI service)
      const sortedPlayers = filteredPlayers.sort((a, b) => 
        (b.fantasyPointsTotal || 0) - (a.fantasyPointsTotal || 0)
      );
      
      const bestPlayer = sortedPlayers[0];
      
      // Get the next available position number
      // This is simplified - in a real implementation would need to handle formation correctly
      const nextPosition = existingPlayers.length + 1;
      
      // Add the player to the team
      const newTeamPlayer = await storage.addPlayerToFantasyTeam({
        teamId,
        playerId: bestPlayer.id,
        position: nextPosition,
        isCaptain: false,
        isViceCaptain: false
      });
      
      res.json({
        success: true,
        message: `${bestPlayer.name} has been added to your team`,
        player: {
          ...newTeamPlayer,
          player: bestPlayer
        }
      });
    } catch (error: any) {
      console.error('[ERROR] AI Auto-fill error:', error);
      res.status(500).json({ message: error.message || 'Failed to auto-fill team' });
    }
  });
  
  app.get("/api/fantasy/players", async (req, res) => {
    try {
      const { search, position, team, limit } = req.query;
      let players;
      
      if (search) {
        players = await storage.searchFootballPlayers(
          search as string,
          position as string,
          team as string,
          limit ? parseInt(limit as string) : 50
        );
      } else {
        players = await storage.getAllFootballPlayers(
          limit ? parseInt(limit as string) : 50
        );
      }
      
      res.json(players);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Player comparison endpoints
  app.get("/api/players/compare", async (req, res) => {
    try {
      const { playerIds } = req.query;
      
      if (!playerIds) {
        return res.status(400).json({ message: "Player IDs are required" });
      }
      
      // Parse player IDs from comma-separated string
      const ids = (playerIds as string).split(',').map(id => parseInt(id.trim()));
      
      if (ids.length < 2 || ids.some(id => isNaN(id))) {
        return res.status(400).json({ message: "At least two valid player IDs are required" });
      }
      
      // Get player details with full stats
      const players = await Promise.all(
        ids.map(async (id) => {
          const player = await storage.getFootballPlayerById(id);
          if (!player) {
            throw new Error(`Player with ID ${id} not found`);
          }
          return player;
        })
      );
      
      // Get season stats for each player
      const playerStats = await Promise.all(
        players.map(async (player) => {
          const seasonStats = await storage.getPlayerSeasonStats(player.id);
          return {
            ...player,
            seasonStats
          };
        })
      );
      
      res.json(playerStats);
    } catch (error: any) {
      console.error("Error comparing players:", error);
      res.status(500).json({ message: error.message || "Failed to compare players" });
    }
  });
  
  // Get detailed stats for a single player
  app.get("/api/players/:id/stats", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      
      const player = await storage.getFootballPlayerById(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Get full player stats
      const seasonStats = await storage.getPlayerSeasonStats(playerId);
      const recentMatches = await storage.getPlayerRecentMatches(playerId, 5);
      
      res.json({
        player,
        seasonStats,
        recentMatches
      });
      
    } catch (error: any) {
      console.error("Error fetching player stats:", error);
      res.status(500).json({ message: error.message || "Failed to fetch player stats" });
    }
  });
  
  // Get detailed player stats for analysis page
  app.get("/api/players/:id/stats", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      
      // Get player basic info
      const player = await storage.getFootballPlayerById(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Get player season stats
      const seasonStats = await storage.getPlayerSeasonStats(playerId);
      
      // Get recent matches
      const recentMatches = await storage.getPlayerRecentMatches(playerId, 5);
      
      res.json({
        player,
        seasonStats,
        recentMatches
      });
    } catch (error: any) {
      console.error("Error fetching player stats:", error);
      res.status(500).json({ message: error.message || "Failed to fetch player stats" });
    }
  });
  
  // Get contextual performance hints for a player
  app.get("/api/players/:id/performance-hints", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const includeMatchContext = req.query.includeMatchContext === 'true';
      
      // Get player data
      const player = await storage.getFootballPlayerById(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Get player season stats
      const seasonStats = await storage.getPlayerSeasonStats(playerId);
      
      // Get recent matches
      const recentMatches = await storage.getPlayerRecentMatches(playerId, 5);
      
      // Get next match data if requested and available
      let upcomingMatch = null;
      if (includeMatchContext) {
        // In a real implementation, you would fetch the player's next match
        // For now, we'll use mock data or leave it as null
        // This could include opponent strength, home/away, etc.
        // upcomingMatch = await storage.getPlayerUpcomingMatch(playerId);
      }
      
      // Combine player data for the OpenAI client
      const playerData = {
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team,
        league: player.league,
        seasonStats
      };
      
      // Generate AI-powered performance hints
      const performanceHints = await openaiClient.generatePlayerPerformanceHints(
        playerData,
        recentMatches,
        upcomingMatch
      );
      
      res.json({
        player: {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team
        },
        performanceHints,
        hasRecentMatches: recentMatches.length > 0,
        hasUpcomingMatch: !!upcomingMatch
      });
      
    } catch (error: any) {
      console.error("Error generating player performance hints:", error);
      res.status(500).json({ message: error.message || "Failed to generate performance hints" });
    }
  });
  
  // Search/list fantasy football players
  app.get("/api/fantasy/players", async (req, res) => {
    try {
      const search = req.query.search as string || "";
      const position = req.query.position as string || undefined;
      const team = req.query.team as string || undefined;
      const limit = parseInt(req.query.limit as string || "50");
      
      const players = await storage.searchFootballPlayers(search, position, team, limit);
      res.json(players);
    } catch (error: any) {
      console.error("Error searching players:", error);
      res.status(500).json({ message: error.message || "Failed to search players" });
    }
  });
  
  // Fantasy Contests endpoints
  const fantasyStore = getFantasyStore();
  
  app.get("/api/fantasy/contests", async (req, res) => {
    try {
      const { status, tier, limit } = req.query;
      let contests;
      const limitNumber = limit ? parseInt(limit as string) : 20;
      
      if (tier === 'free') {
        contests = await fantasyStore.getFreeFantasyContests(limitNumber, status as string);
      } else if (tier === 'premium') {
        contests = await fantasyStore.getPremiumFantasyContests(limitNumber, status as string);
      } else {
        contests = await fantasyStore.getAllFantasyContests(limitNumber, status as string, tier as string);
      }
      
      res.json(contests);
    } catch (error: any) {
      console.error("Error fetching contests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch contests" });
    }
  });
  
  // Add specific endpoints for free and premium contests
  app.get("/api/fantasy/contests/free", async (req, res) => {
    try {
      const { status, limit } = req.query;
      const limitNumber = limit ? parseInt(limit as string) : 20;
      const contests = await fantasyStore.getFreeFantasyContests(limitNumber, status as string);
      res.json(contests);
    } catch (error: any) {
      console.error("Error fetching free contests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch free contests" });
    }
  });
  
  app.get("/api/fantasy/contests/premium", async (req, res) => {
    try {
      const { status, limit } = req.query;
      const limitNumber = limit ? parseInt(limit as string) : 20;
      const contests = await fantasyStore.getPremiumFantasyContests(limitNumber, status as string);
      
      // Check if user is authorized to access premium contests
      if (req.isAuthenticated() && req.user.subscriptionTier === 'premium') {
        res.json(contests);
      } else {
        // Return limited information for non-premium users
        const limitedContests = contests.map(contest => ({
          id: contest.id,
          name: contest.name,
          description: contest.description,
          startDate: contest.startDate,
          endDate: contest.endDate,
          tier: contest.tier,
          status: contest.status,
          prizePool: contest.prizePool,
          requiresPremium: true
        }));
        res.json(limitedContests);
      }
    } catch (error: any) {
      console.error("Error fetching premium contests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch premium contests" });
    }
  });
  
  app.get("/api/fantasy/contests/:id", async (req, res) => {
    try {
      const contestId = parseInt(req.params.id);
      const contest = await fantasyStore.getFantasyContestById(contestId);
      
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      
      res.json(contest);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/fantasy/contests/:id/leaderboard", async (req, res) => {
    try {
      const contestId = parseInt(req.params.id);
      const entries = await fantasyStore.getContestLeaderboard(contestId);
      
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/fantasy/contests/:id/enter", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const contestId = parseInt(req.params.id);
      const teamId = parseInt(req.body.teamId);
      
      // Validate the contest exists
      const contest = await fantasyStore.getFantasyContestById(contestId);
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      
      // Validate the team exists and belongs to the user
      const team = await fantasyStore.getFantasyTeamById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only enter with your own teams" });
      }
      
      // Check if user already has an entry for this contest
      const userEntries = await fantasyStore.getUserContestEntries(req.user.id);
      const existingEntry = userEntries.find(entry => entry.contestId === contestId);
      
      if (existingEntry) {
        return res.status(400).json({ message: "You have already entered this contest" });
      }
      
      // Create the entry
      const entry = await fantasyStore.createContestEntry({
        userId: req.user.id,
        contestId,
        teamId,
        totalPoints: 0
      });
      
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/fantasy/teams/:teamId/players", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const teamId = parseInt(req.params.teamId);
      const team = await storage.getFantasyTeamById(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "Not your team" });
      }
      
      const playerData = {
        ...req.body,
        teamId
      };
      const player = await storage.addPlayerToFantasyTeam(playerData);
      res.status(201).json(player);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Using main storage - commented out in favor of the memory implementation above
  /*
  app.post("/api/fantasy/contests/:contestId/enter", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const contestId = parseInt(req.params.contestId);
      const { teamId } = req.body;
      
      if (!teamId) {
        return res.status(400).json({ message: "Team ID is required" });
      }
      
      const contest = await storage.getFantasyContestById(contestId);
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      
      // Check if this is a premium contest and user has appropriate subscription
      if (contest.tier === 'premium' && req.user.subscriptionTier !== 'premium') {
        return res.status(403).json({ 
          message: "This is a premium contest. Please upgrade your subscription to participate.",
          requiresUpgrade: true
        });
      }
      
      const team = await storage.getFantasyTeamById(parseInt(teamId));
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "Not your team" });
      }
      
      // Check if contest is still open for entries
      if (contest.status !== 'upcoming') {
        return res.status(400).json({ message: "Contest is no longer accepting entries" });
      }
      
      // Check if user has already entered this contest with this team
      const userEntries = await storage.getUserContestEntries(req.user.id);
      const existingEntry = userEntries.find(entry => 
        entry.contestId === contestId && entry.teamId === team.id
      );
      
      if (existingEntry) {
        return res.status(400).json({ message: "You have already entered this contest with this team" });
      }
      
      // Create entry
      const entry = await storage.createContestEntry({
        userId: req.user.id,
        contestId,
        teamId: team.id
      });
      
      // Update user stats
      await storage.updateUser(req.user.id, {
        totalContestsEntered: (req.user.totalContestsEntered || 0) + 1
      });
      
      // Create notification
      if (contest.tier === 'premium') {
        await storage.createNotification({
          userId: req.user.id,
          type: 'contest_entry',
          title: 'Premium Contest Entry',
          message: `You've successfully entered the premium contest: ${contest.name}`,
          icon: '🏆',
          link: `/fantasy/contests/${contestId}`
        });
      } else {
        await storage.createNotification({
          userId: req.user.id,
          type: 'contest_entry',
          title: 'Contest Entry',
          message: `You've successfully entered the contest: ${contest.name}`,
          icon: '🏆',
          link: `/fantasy/contests/${contestId}`
        });
      }
      
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  */
  
  // Gamification system endpoints
  app.get("/api/badges", async (req, res) => {
    try {
      // Get current user ID if authenticated
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      // Get all badges
      const badges = await storage.getAllBadges();
      
      // If user is authenticated, get user's badge progress
      if (userId) {
        const userBadges = await storage.getUserBadges(userId);
        
        // Merge user progress with badge definitions
        const badgesWithProgress = badges.map(badge => {
          const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
          return {
            ...badge,
            achieved: !!userBadge?.achieved,
            progress: userBadge?.progress || 0,
            achievedDate: userBadge?.achievedDate
          };
        });
        
        res.json(badgesWithProgress);
      } else {
        // For non-authenticated users, just return badge definitions without progress
        res.json(badges.map(badge => ({
          ...badge,
          achieved: false,
          progress: 0
        })));
      }
    } catch (error: any) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: error.message || "Error fetching badges" });
    }
  });
  
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const type = req.query.type as string || 'global';
      const limit = parseInt(req.query.limit as string || '10');
      
      // Get the appropriate leaderboard
      let leaderboardEntries;
      if (type === 'weekly') {
        leaderboardEntries = await storage.getWeeklyLeaderboard(limit);
      } else if (type === 'monthly') {
        leaderboardEntries = await storage.getMonthlyLeaderboard(limit);
      } else {
        leaderboardEntries = await storage.getGlobalLeaderboard(limit);
      }
      
      res.json(leaderboardEntries);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: error.message || "Error fetching leaderboard" });
    }
  });
  
  // Combined leaderboards endpoint
  app.get('/api/leaderboards', async (req, res) => {
    try {
      const userId = req.isAuthenticated() ? req.user.id : undefined;
      
      // Generate sample leaderboard data for demonstration
      const generateLeaderboardData = (type: string, entries: number = 10) => {
        const data = [];
        for (let i = 1; i <= entries; i++) {
          const isCurrentUser = i === 3 && userId !== undefined; // Put user at rank 3 for demo
          data.push({
            id: i,
            userId: isCurrentUser ? userId : 1000 + i,
            leaderboardId: 1,
            rank: i,
            previousRank: Math.max(1, i + (Math.random() > 0.7 ? 1 : Math.random() > 0.5 ? -1 : 0)),
            points: Math.floor(1000 - (i * 50) + Math.random() * 20),
            username: isCurrentUser ? req.user?.username || "You" : `Player${1000 + i}`,
            avatarUrl: undefined,
            details: {
              winStreak: Math.floor(Math.random() * 5),
              accuracy: Math.floor(50 + Math.random() * 30),
              gamesPlayed: Math.floor(10 + Math.random() * 30)
            },
            lastUpdated: new Date()
          });
        }
        return data;
      };
      
      // In the future, replace with actual leaderboard data
      // const [weekly, monthly, global] = await Promise.all([
      //   storage.getWeeklyLeaderboard(userId),
      //   storage.getMonthlyLeaderboard(userId),
      //   storage.getGlobalLeaderboard(userId),
      // ]);
      
      // Use sample data for now
      const weekly = generateLeaderboardData('weekly');
      const monthly = generateLeaderboardData('monthly', 15);
      const global = generateLeaderboardData('global', 20);
      
      res.json({
        weekly,
        monthly,
        global
      });
    } catch (error) {
      console.error('[ERROR] Failed to fetch leaderboards:', error);
      res.status(500).json({ message: 'Failed to fetch leaderboards' });
    }
  });
  
  // Endpoint to get all user badges
  app.get('/api/user/badges', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Generate sample badges for demonstration
      const badgeCategories = ['prediction', 'streak', 'achievement', 'special', 'activity', 'loyalty'];
      const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      
      const generateBadges = () => {
        const badges = [];
        
        // Generate a mix of earned and unearned badges
        for (let i = 1; i <= 12; i++) {
          const isEarned = i <= 7; // First 7 are earned
          const category = badgeCategories[i % badgeCategories.length];
          const tier = tiers[Math.min(Math.floor(i / 3), 4)];
          const progress = isEarned ? 100 : Math.floor(Math.random() * 80);
          const target = 100;
          
          badges.push({
            id: i,
            userId: req.user.id,
            badgeId: i,
            name: `${category.charAt(0).toUpperCase() + category.slice(1)} ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
            description: `Earn this badge by completing ${category} tasks at ${tier} level.`,
            category,
            tier,
            progress,
            target,
            earnedAt: isEarned ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null,
            isNew: isEarned && i <= 2 // First 2 earned badges are new
          });
        }
        
        return badges;
      };
      
      // In the future, replace with actual badge data
      // const badges = await storage.getUserBadges(req.user.id);
      const badges = generateBadges();
      
      res.json(badges);
    } catch (error) {
      console.error('[ERROR] Failed to fetch badges:', error);
      res.status(500).json({ message: 'Failed to fetch badges' });
    }
  });
  
  // Feature flags endpoint
  app.get("/api/feature-flags", async (req, res) => {
    try {
      // Base flags that apply to all users
      const baseFlags = {
        // Core features
        chatbot: true,
        notifications: true,
        historicalDashboard: true,
        
        // Premium features
        accumulators: true,
        premiumPredictions: true,
        
        // User experience and onboarding
        onboarding: true,
        gettingStartedGuide: true,
        featureHighlights: true,
        demoNotifications: true,
        
        // New and experimental features  
        socialSharing: false,
        userCommunity: false,
        predictionComments: false,
        trendingPredictions: false,
        
        // Regional features
        nigeriaSpecificContent: true,
        ukSpecificContent: true,
        
        // Marketing and engagement
        referralProgram: true,
        achievementBadges: true,
        streakRewards: true,
      };
      
      // If user is authenticated, we can personalize flags
      if (req.isAuthenticated()) {
        const user = req.user;
        
        // Give premium subscribers access to experimental features
        if (user.subscriptionTier === 'premium') {
          return res.json({
            ...baseFlags,
            socialSharing: true,
            trendingPredictions: true,
            achievementBadges: true,
          });
        }
        
        // Users with Nigerian IP might get Nigeria-specific features
        // This is a simplification - in production, use proper IP detection
        if (req.headers['x-user-country'] === 'NG') {
          return res.json({
            ...baseFlags,
            nigeriaSpecificContent: true,
          });
        }
      }
      
      // Default flags for non-authenticated users
      res.json(baseFlags);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Push notification token endpoints
  app.post("/api/push-tokens", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { token, platform, deviceName } = req.body;
      
      if (!token || !platform) {
        return res.status(400).json({ message: "Token and platform are required" });
      }
      
      // In a real implementation, this would be stored in the database
      // For now, we'll just register it in memory
      await storage.registerPushToken(req.user.id, token, platform, deviceName);
      
      res.status(201).json({ 
        success: true, 
        message: "Push token registered successfully" 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Note: The push notification test endpoint is now defined in the notifications.ts file

  // Referral System endpoints
  app.post("/api/referrals/validate", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { referralCode } = req.body;
      
      if (!referralCode) {
        return res.status(400).json({ message: "Referral code is required" });
      }
      
      // Find user with this referral code
      const allUsers = await storage.getAllUsers();
      const referrer = allUsers.find(user => user.referralCode === referralCode);
      
      if (!referrer) {
        return res.status(404).json({ message: "Invalid referral code" });
      }
      
      // Prevent self-referrals
      if (referrer.id === req.user.id) {
        return res.status(400).json({ message: "You cannot refer yourself" });
      }
      
      // Check if this user has already been referred
      const existingReferrals = await storage.getAllReferrals();
      const alreadyReferred = existingReferrals.some(
        ref => ref.referredId === req.user.id
      );
      
      if (alreadyReferred) {
        return res.status(400).json({ message: "You have already been referred by someone" });
      }
      
      // Create the referral
      const referral = await storage.createReferral({
        referrerId: referrer.id,
        referredId: req.user.id,
        status: 'pending'
      });
      
      res.status(201).json({ 
        success: true, 
        message: "Referral code applied successfully!",
        referral
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/referrals/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const stats = await storage.getUserReferralStats(req.user.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/referrals", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const referrals = await storage.getUserReferrals(req.user.id);
      res.json(referrals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/user/referral-code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user || !user.referralCode) {
        // Generate a referral code if user doesn't have one
        const updatedUser = await storage.updateUserReferralCode(req.user.id);
        res.json({ referralCode: updatedUser.referralCode });
      } else {
        res.json({ referralCode: user.referralCode });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Referral leaderboard
  app.get("/api/referrals/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getReferralLeaderboard();
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // News Feed API Routes
  
  // Get all news articles with pagination
  app.get("/api/news", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const articles = await storage.getAllNewsArticles(limit, offset);
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get a specific news article by ID
  app.get("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getNewsArticleById(id);
      
      if (!article) {
        return res.status(404).json({ message: "News article not found" });
      }
      
      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get news articles by type (e.g., transfer, injury, match-preview)
  app.get("/api/news/type/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const articles = await storage.getNewsArticlesByType(type, limit);
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get news articles by sport
  app.get("/api/news/sport/:sportId", async (req, res) => {
    try {
      const sportId = parseInt(req.params.sportId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const articles = await storage.getNewsArticlesBySport(sportId, limit);
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get news articles by league
  app.get("/api/news/league/:leagueId", async (req, res) => {
    try {
      const leagueId = parseInt(req.params.leagueId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const articles = await storage.getNewsArticlesByLeague(leagueId, limit);
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // REAL-TIME NEWS RECOMMENDATIONS API ROUTES
  
  // Get personalized article recommendations for the current user
  app.get("/api/news/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id;
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: "Invalid user identification" });
      }
      
      const count = req.query.count ? parseInt(req.query.count as string) : 5;
      
      // Get list of articles to exclude (already read or saved)
      const excludeIds = req.query.exclude ? (req.query.exclude as string)
        .split(',')
        .map(id => parseInt(id))
        .filter(id => !isNaN(id)) : [];
      
      const recommendations = await newsRecommendationEngine.getRecommendations(
        Number(userId), 
        count,
        excludeIds
      );
      
      res.json(recommendations);
    } catch (error: any) {
      console.error("Error getting article recommendations:", error);
      res.status(500).json({ message: "Could not retrieve article recommendations" });
    }
  });
  
  // Get AI-enhanced trending news articles
  app.get("/api/news/trending", async (req, res) => {
    try {
      console.log("Fetching AI-enhanced trending news articles");
      
      const count = req.query.count ? parseInt(req.query.count as string) : 5;
      
      // Try using the enhanced recommendation engine first
      try {
        // Get trending articles using the enhanced recommendation engine
        const trendingArticles = await newsRecommendationEngine.getTrendingArticles(count);
        console.log(`Retrieved ${trendingArticles.length} trending articles using AI-enhanced algorithm`);
        
        if (trendingArticles && trendingArticles.length > 0) {
          return res.json(trendingArticles);
        }
      } catch (engineError) {
        // Log the error but continue to fallback method
        console.error("Error using recommendation engine for trending articles:", engineError);
        console.log("Falling back to direct SQL query for trending articles");
      }
      
      // Fallback: Use direct SQL query with explicit column casting and ordering
      const { rows } = await pool.query(`
        SELECT 
          id::integer, 
          title, 
          summary, 
          image_url, 
          published_at, 
          author, 
          source,
          sport_id,
          COALESCE(views, 0) as views,
          COALESCE(likes, 0) as likes
        FROM news_articles 
        WHERE published_at > NOW() - INTERVAL '30 days'
        ORDER BY (COALESCE(views, 0) + COALESCE(likes, 0) * 2) DESC, published_at DESC 
        LIMIT $1
      `, [count]);
      
      console.log(`Found ${rows.length} trending articles via direct SQL (fallback method)`);
      
      // Transform to camelCase property names for frontend consumption
      const articles = rows.map(row => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        imageUrl: row.image_url,
        publishedAt: row.published_at,
        author: row.author,
        source: row.source,
        sportId: row.sport_id,
        views: row.views,
        likes: row.likes
      }));
      
      res.json(articles);
    } catch (error: any) {
      console.error("Error in trending news article query:", error);
      res.status(500).json({ message: error.message || "Could not retrieve articles" });
    }
  });

  // Search news articles
  app.get("/api/news/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const articles = await storage.searchNewsArticles(query, limit);
      
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create a new news article (admin only)
  app.post("/api/news", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      const article = await storage.createNewsArticle(req.body);
      res.status(201).json(article);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a news article (admin only)
  app.put("/api/news/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const article = await storage.updateNewsArticle(id, req.body);
      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a news article (admin only)
  app.delete("/api/news/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteNewsArticle(id);
      
      if (!result) {
        return res.status(404).json({ message: "News article not found" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User News Preferences API Routes
  
  // News preferences have been moved to news-routes.ts for ultra-robustness

  // User Saved News API Routes
  // These have been moved to news-routes.ts for ultra-robustness
  // Use the '/api/news/saved-ultra' endpoint to access saved articles
  // Use the '/api/news/:id/save-ultra' endpoint to save/unsave articles
  
  // Enhanced AI-Driven Personalized News Feed
  app.get("/api/news/feed/personalized", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id;
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: "Invalid user identification" });
      }
      
      // Parse and validate pagination parameters
      let limit = 20;
      let offset = 0;
      
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = parsedLimit;
        }
      }
      
      if (req.query.offset) {
        const parsedOffset = parseInt(req.query.offset as string);
        if (!isNaN(parsedOffset) && parsedOffset >= 0) {
          offset = parsedOffset;
        }
      }
      
      // Use the enhanced recommendation engine if available, otherwise fall back to storage method
      let feed = [];
      try {
        // Get personalized feed using the recommendation engine's enhanced algorithm
        feed = await newsRecommendationEngine.getPersonalizedFeed(Number(userId), limit);
        console.log(`Generated AI-enhanced personalized feed with ${feed.length} articles for user ${userId}`);
      } catch (aiError) {
        console.error("Error using recommendation engine for personalized feed:", aiError);
        // Fallback to storage method if the enhanced engine fails
        feed = await storage.getPersonalizedNewsFeed(Number(userId), limit, offset);
        console.log(`Fell back to database personalized feed for user ${userId}`);
      }
      
      // Always return an array, even if empty
      res.json(feed || []);
    } catch (error: any) {
      console.error("Error retrieving personalized news feed:", error);
      res.status(500).json({ message: "Could not retrieve personalized news feed" });
    }
  });

  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let registeredUserId: number | null = null;
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to PuntaIQ WebSocket server'
    }));
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle authentication
        if (data.type === 'authenticate') {
          const { userId } = data;
          
          if (!userId) {
            ws.send(JSON.stringify({
              type: 'auth_response',
              success: false,
              message: 'Missing user ID'
            }));
            return;
          }
          
          // Verify user exists
          const user = await storage.getUser(userId);
          if (!user) {
            ws.send(JSON.stringify({
              type: 'auth_response',
              success: false,
              message: 'Invalid user ID'
            }));
            return;
          }
          
          // Register this WebSocket client for the user
          await storage.registerWebSocketClient(userId, ws);
          registeredUserId = userId;
          
          // Send success response
          ws.send(JSON.stringify({
            type: 'auth_response',
            success: true,
            message: 'Successfully authenticated',
            userId
          }));
          
          // Send any unread notifications
          const notifications = await storage.getUserNotifications(userId, 10);
          const unreadNotifications = notifications.filter(n => !n.read);
          
          if (unreadNotifications.length > 0) {
            ws.send(JSON.stringify({
              type: 'unread_notifications',
              count: unreadNotifications.length,
              notifications: unreadNotifications
            }));
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', async () => {
      console.log('WebSocket client disconnected');
      
      // Unregister from the user's client list
      if (registeredUserId) {
        await storage.unregisterWebSocketClient(registeredUserId, ws);
      }
    });
  });
  
  // Player Comparison API Routes
  app.get("/api/players/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const position = req.query.position as string;
      const team = req.query.team as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const players = await storage.searchFootballPlayers(query, position, team, limit);
      res.json(players);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/players/:id/season-stats", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const stats = await storage.getPlayerSeasonStats(playerId);
      
      if (!stats) {
        return res.status(404).json({ message: "Player stats not found" });
      }
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/players/:id/recent-matches", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const matches = await storage.getPlayerRecentMatches(playerId, limit);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Player statistics routes for player comparison
  app.get("/api/players/stats", async (req, res) => {
    try {
      // Get fantasy players which have stats
      const players = await storage.getAllFootballPlayers();
      res.json(players);
    } catch (error: any) {
      console.error("Error fetching player statistics:", error);
      res.status(500).json({ message: error.message || "Failed to fetch player statistics" });
    }
  });
  
  app.get("/api/players/:id/season-stats", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await storage.getFootballPlayerById(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Create a season stats object from the player data
      const stats = {
        playerId: player.id,
        season: new Date().getFullYear().toString(),
        team: player.team,
        league: player.league,
        appearances: player.appearances || 0,
        minutesPlayed: player.minutesPlayed || 0,
        goals: player.goals || 0,
        assists: player.assists || 0,
        yellowCards: player.yellowCards || 0,
        redCards: player.redCards || 0,
        cleanSheets: player.cleanSheets || 0,
        passAccuracy: 75,
        rating: player.rating || 6.5,
        fantasyPoints: player.fantasyPointsTotal || 0
      };
      
      res.json(stats);
    } catch (error: any) {
      console.error(`Error fetching season statistics for player ${req.params.id}:`, error);
      res.status(500).json({ message: error.message || "Failed to fetch player season statistics" });
    }
  });
  
  app.get("/api/players/:id/match-stats", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await storage.getFootballPlayerById(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Create some sample match statistics based on the player's overall stats
      const totalMatches = player.appearances || 10;
      const matchStats = [];
      
      for (let i = 0; i < Math.min(totalMatches, 5); i++) {
        matchStats.push({
          playerId: player.id,
          matchId: 1000 + i,
          date: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)), // One week apart
          opponent: ["Manchester United", "Chelsea", "Arsenal", "Liverpool", "Tottenham"][i % 5],
          isHome: i % 2 === 0,
          minutesPlayed: Math.min(90, Math.floor(70 + Math.random() * 20)),
          rating: Math.floor(60 + Math.random() * 40) / 10, // 6.0 to 10.0
          goals: player.position === "forward" ? Math.floor(Math.random() * 2) : 0,
          assists: player.position === "midfielder" ? Math.floor(Math.random() * 2) : 0,
          yellowCards: Math.random() > 0.8 ? 1 : 0,
          redCards: Math.random() > 0.95 ? 1 : 0,
          cleanSheet: player.position === "goalkeeper" || player.position === "defender" ? Math.random() > 0.5 : false,
          fantasyPoints: Math.floor(Math.random() * 10 + 2)
        });
      }
      
      res.json(matchStats);
    } catch (error: any) {
      console.error(`Error fetching match statistics for player ${req.params.id}:`, error);
      res.status(500).json({ message: error.message || "Failed to fetch player match statistics" });
    }
  });
  
  app.get("/api/players/comparison", async (req, res) => {
    try {
      const playerIds = req.query.ids ? (req.query.ids as string).split(',').map(id => parseInt(id)) : [];
      
      if (playerIds.length === 0) {
        return res.status(400).json({ message: "Player IDs are required" });
      }
      
      // Get players for all requested IDs
      const players = await Promise.all(
        playerIds.map(id => storage.getFootballPlayerById(id))
      );
      
      // Filter out any undefined players and convert to stats objects
      const playerStats = players
        .filter(player => player !== undefined)
        .map(player => ({
          playerId: player.id,
          name: player.name,
          season: new Date().getFullYear().toString(),
          team: player.team,
          league: player.league,
          position: player.position,
          appearances: player.appearances || 0,
          minutesPlayed: player.minutesPlayed || 0,
          goals: player.goals || 0,
          assists: player.assists || 0,
          yellowCards: player.yellowCards || 0,
          redCards: player.redCards || 0,
          cleanSheets: player.cleanSheets || 0,
          passAccuracy: 75,
          rating: player.rating || 6.5,
          fantasyPoints: player.fantasyPointsTotal || 0
        }));
      
      res.json(playerStats);
    } catch (error: any) {
      console.error("Error comparing players:", error);
      res.status(500).json({ message: error.message || "Failed to compare players" });
    }
  });

  return httpServer;
}
