import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupPredictionRoutes } from "./predictions";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up prediction-related routes
  setupPredictionRoutes(app);
  
  // Sports routes
  app.get("/api/sports", async (req, res) => {
    try {
      const sports = await storage.getActiveSports();
      res.json(sports);
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
        referralProgram: false,
        achievementBadges: false,
        streakRewards: false,
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

  const httpServer = createServer(app);

  return httpServer;
}
