import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { setupPredictionRoutes } from "./predictions";
import { setupNotificationRoutes } from "./notifications";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up prediction-related routes
  setupPredictionRoutes(app);
  
  // Set up notification routes
  setupNotificationRoutes(app);
  
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

  return httpServer;
}
