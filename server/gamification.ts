import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { badgeTierEnum, insertBadgeSchema, insertLeaderboardSchema, insertUserBadgeSchema } from "@shared/schema";
import { z } from "zod";

// Setup gamification routes for badges and leaderboards
export function setupGamificationRoutes(app: Express) {
  // ========== BADGE ROUTES ==========

  // GET all badges
  app.get("/api/badges", async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GET specific badge by ID
  app.get("/api/badges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const badge = await storage.getBadgeById(id);
      
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      res.json(badge);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // POST create new badge (admin only)
  app.post("/api/badges", async (req, res) => {
    try {
      // In a real app, check if the user is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const badgeData = insertBadgeSchema.parse(req.body);
      const badge = await storage.createBadge(badgeData);
      res.status(201).json(badge);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid badge data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH update badge (admin only)
  app.patch("/api/badges/:id", async (req, res) => {
    try {
      // In a real app, check if the user is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const badgeData = insertBadgeSchema.partial().parse(req.body);
      
      const badge = await storage.updateBadge(id, badgeData);
      
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      res.json(badge);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid badge data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // DELETE badge (admin only)
  app.delete("/api/badges/:id", async (req, res) => {
    try {
      // In a real app, check if the user is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteBadge(id);
      
      if (!success) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GET user badges
  app.get("/api/users/:userId/badges", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.userId);
      
      // Only allow users to view their own badges (or admins can view any)
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // POST award badge to user (manually triggered, typically by an admin)
  app.post("/api/users/:userId/badges", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // In a real app, check if the user is an admin
      const userId = parseInt(req.params.userId);
      const badgeData = insertUserBadgeSchema.parse({
        ...req.body,
        userId,
      });
      
      const userBadge = await storage.awardBadgeToUser(badgeData);
      res.status(201).json(userBadge);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH mark badge as viewed
  app.patch("/api/users/:userId/badges/:badgeId/viewed", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.userId);
      const badgeId = parseInt(req.params.badgeId);
      
      // Only allow users to mark their own badges as viewed
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.markBadgeAsViewed(userId, badgeId);
      
      if (!success) {
        return res.status(404).json({ message: "Badge not found or not awarded to this user" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ========== LEADERBOARD ROUTES ==========

  // GET all leaderboards
  app.get("/api/leaderboards", async (req, res) => {
    try {
      const leaderboards = await storage.getAllLeaderboards();
      res.json(leaderboards);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GET specific leaderboard with entries
  app.get("/api/leaderboards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const leaderboard = await storage.getLeaderboardWithEntries(id);
      
      if (!leaderboard) {
        return res.status(404).json({ message: "Leaderboard not found" });
      }
      
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GET user leaderboard entries
  app.get("/api/users/:userId/leaderboards", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.userId);
      
      // Only allow users to view their own leaderboard entries
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const entries = await storage.getUserLeaderboardEntries(userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // POST create leaderboard (admin only)
  app.post("/api/leaderboards", async (req, res) => {
    try {
      // In a real app, check if the user is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const leaderboardData = insertLeaderboardSchema.parse(req.body);
      const leaderboard = await storage.createLeaderboard(leaderboardData);
      res.status(201).json(leaderboard);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid leaderboard data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH update leaderboard (admin only)
  app.patch("/api/leaderboards/:id", async (req, res) => {
    try {
      // In a real app, check if the user is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const leaderboardData = insertLeaderboardSchema.partial().parse(req.body);
      
      const leaderboard = await storage.updateLeaderboard(id, leaderboardData);
      
      if (!leaderboard) {
        return res.status(404).json({ message: "Leaderboard not found" });
      }
      
      res.json(leaderboard);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid leaderboard data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // DELETE leaderboard (admin only)
  app.delete("/api/leaderboards/:id", async (req, res) => {
    try {
      // In a real app, check if the user is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteLeaderboard(id);
      
      if (!success) {
        return res.status(404).json({ message: "Leaderboard not found" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Utility endpoint: Update all leaderboards (could be called by a cron job)
  app.post("/api/leaderboards/update-all", async (req, res) => {
    try {
      // In a real app, check if the user is an admin or if it's called from a secure source
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.updateAllLeaderboards();
      res.json({ message: "Leaderboards update initiated" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ========== REFERRAL ROUTES ==========
  
  // GET referrals for the logged-in user
  app.get("/api/referrals", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const referrals = await storage.getUserReferrals(req.user!.id);
      res.json(referrals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // GET referral stats for the logged-in user
  app.get("/api/referrals/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const stats = await storage.getUserReferralStats(req.user!.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // GET referral leaderboard
  app.get("/api/referrals/leaderboard", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getReferralLeaderboard(limit);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // POST validate a referral code
  app.post("/api/referrals/validate", async (req, res) => {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ valid: false, message: "Referral code is required" });
    }
    
    try {
      // Find user by referral code (simple validation for now)
      const referrer = await storage.getUserByReferralCode(code);
      
      if (!referrer) {
        return res.status(404).json({ valid: false, message: "Invalid referral code" });
      }
      
      return res.json({ valid: true, referrerId: referrer.id });
    } catch (error: any) {
      res.status(500).json({ valid: false, message: "Error validating referral code" });
    }
  });
}