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
      
      // Very simple query with minimal options
      const { rows } = await pool.query("SELECT id, title FROM news_articles");
      
      console.log(`Direct news query found ${rows.length} articles`);
      res.json(rows);
    } catch (error: any) {
      console.error("Database error in /api/news/direct:", error);
      res.status(500).json({ 
        message: "Database error", 
        details: error.message,
        stack: error.stack
      });
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
  
  // Fantasy Contests endpoints
  const fantasyStore = getFantasyStore();
  
  app.get("/api/fantasy/contests", async (req, res) => {
    try {
      const { status, tier, limit } = req.query;
      let contests;
      const limitNumber = limit ? parseInt(limit as string) : 20;
      
      if (tier === 'free') {
        contests = fantasyStore.getFreeFantasyContests(limitNumber, status as string);
      } else if (tier === 'premium') {
        contests = fantasyStore.getPremiumFantasyContests(limitNumber, status as string);
      } else {
        contests = fantasyStore.getAllFantasyContests(limitNumber, status as string, tier as string);
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
      const contests = fantasyStore.getFreeFantasyContests(limitNumber, status as string);
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
      const contests = fantasyStore.getPremiumFantasyContests(limitNumber, status as string);
      
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
      const contest = fantasyStore.getFantasyContestById(contestId);
      
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
      const entries = fantasyStore.getContestLeaderboard(contestId);
      
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
      const contest = fantasyStore.getFantasyContestById(contestId);
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      
      // Validate the team exists and belongs to the user
      const team = fantasyStore.getFantasyTeamById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only enter with your own teams" });
      }
      
      // Check if user already has an entry for this contest
      const userEntries = fantasyStore.getUserContestEntries(req.user.id);
      const existingEntry = userEntries.find(entry => entry.contestId === contestId);
      
      if (existingEntry) {
        return res.status(400).json({ message: "You have already entered this contest" });
      }
      
      // Create the entry
      const entry = fantasyStore.createContestEntry({
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
  
  // Get trending news articles
  app.get("/api/news/trending", async (req, res) => {
    try {
      console.log("Getting basic news articles - no params, no transformations");
      
      // Simple raw SQL query to get news articles
      const result = await pool.query("SELECT * FROM news_articles LIMIT 10");
      
      // No transformations, just return the raw rows
      console.log(`Found ${result.rows.length} articles from basic query`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error in basic news article query:", error);
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
  
  // Get current user's news preferences
  app.get("/api/news/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const preferences = await storage.getUserNewsPreferences(req.user.id);
      res.json(preferences || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update user's news preferences
  app.post("/api/news/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const preferences = await storage.updateUserNewsPreferences(req.user.id, req.body);
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User Saved News API Routes
  
  // Get user's saved news articles
  app.get("/api/news/saved", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Ensure we have a valid user ID
      const userId = req.user?.id;
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: "Invalid user identification" });
      }
      
      // Convert to number explicitly to avoid potential type issues
      const savedNews = await storage.getSavedNewsWithArticles(Number(userId));
      
      // Return empty array instead of null/undefined to avoid client-side errors
      res.json(savedNews || []);
    } catch (error: any) {
      console.error("Error retrieving saved news:", error);
      res.status(500).json({ message: "Could not retrieve saved articles" });
    }
  });
  
  // Save a news article for the user
  app.post("/api/news/:id/save", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id;
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: "Invalid user identification" });
      }
      
      // Parse and validate article ID
      const articleId = parseInt(req.params.id);
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      // Check if article exists
      const article = await storage.getNewsArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "News article not found" });
      }
      
      const savedArticle = await storage.saveNewsArticle({
        userId: Number(userId),
        articleId
      });
      
      res.status(201).json(savedArticle);
    } catch (error: any) {
      console.error("Error saving news article:", error);
      res.status(500).json({ message: "Failed to save article" });
    }
  });
  
  // Mark a news article as read
  app.post("/api/news/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id;
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: "Invalid user identification" });
      }
      
      // Parse and validate article ID
      const articleId = parseInt(req.params.id);
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      // Check if article exists
      const article = await storage.getNewsArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "News article not found" });
      }
      
      const readArticle = await storage.markNewsArticleAsRead(Number(userId), articleId);
      res.json(readArticle);
    } catch (error: any) {
      console.error("Error marking article as read:", error);
      res.status(500).json({ message: "Failed to mark article as read" });
    }
  });
  
  // Unsave a news article
  app.delete("/api/news/:id/save", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id;
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: "Invalid user identification" });
      }
      
      // Parse and validate article ID
      const articleId = parseInt(req.params.id);
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const result = await storage.unsaveNewsArticle(Number(userId), articleId);
      
      if (!result) {
        return res.status(404).json({ message: "Saved article not found" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error("Error unsaving news article:", error);
      res.status(500).json({ message: "Failed to unsave article" });
    }
  });
  
  // Personalized News Feed
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
      
      const feed = await storage.getPersonalizedNewsFeed(Number(userId), limit, offset);
      
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

  return httpServer;
}
