/**
 * Mock gamification endpoints to support badges and leaderboards
 * This is a temporary solution until the database schema is updated to include these tables
 */

import { Express } from "express";

export function setupMockGamificationRoutes(app: Express) {
  // ============= BADGE ROUTES =============
  
  // Get all badges (with user progress if authenticated)
  app.get("/api/badges", (req, res) => {
    try {
      // Generate badge categories and tiers
      const badgeCategories = ['prediction', 'streak', 'achievement', 'special', 'activity', 'loyalty'];
      const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      
      const sampleBadges = [];
      
      // Generate a set of badges with different categories and tiers
      for (let i = 1; i <= 15; i++) {
        const category = badgeCategories[i % badgeCategories.length];
        const tier = tiers[Math.min(Math.floor(i / 3), 4)];
        
        sampleBadges.push({
          id: i,
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
          description: `Earn this badge by completing ${category} tasks at ${tier} level.`,
          category,
          tier,
          imageUrl: null,
          pointsAwarded: 50 * (tiers.indexOf(tier) + 1),
          criteria: `Complete ${5 * (tiers.indexOf(tier) + 1)} ${category} tasks`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // If user is authenticated, add progress data
      if (req.isAuthenticated()) {
        const userBadgeSample = sampleBadges.map((badge, index) => {
          const isAchieved = index < 8; // First 8 are achieved
          const progress = isAchieved ? 100 : Math.floor(Math.random() * 70);
          
          return {
            id: badge.id,
            badgeId: badge.id,
            userId: req.user.id,
            progress,
            achieved: isAchieved,
            earnedAt: isAchieved ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null,
            isNew: isAchieved && index < 2 // First 2 achieved badges are new
          };
        });
        
        const badgesWithProgress = sampleBadges.map(badge => {
          const userBadge = userBadgeSample.find(ub => ub.badgeId === badge.id);
          return {
            ...badge,
            achieved: userBadge?.achieved || false,
            progress: userBadge?.progress || 0,
            earnedAt: userBadge?.earnedAt || null
          };
        });
        
        res.json(badgesWithProgress);
      } else {
        // For non-authenticated users, return badges without progress
        res.json(sampleBadges.map(badge => ({
          ...badge,
          achieved: false,
          progress: 0
        })));
      }
    } catch (error: any) {
      console.error("Error generating mock badges:", error);
      res.status(500).json({ message: "Failed to generate badges" });
    }
  });
  
  // Get a user's badges
  app.get("/api/user-badges", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Same badge categories and tiers
      const badgeCategories = ['prediction', 'streak', 'achievement', 'special', 'activity', 'loyalty'];
      const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      
      // Generate user badges with progress
      const userBadges = [];
      
      for (let i = 1; i <= 15; i++) {
        const category = badgeCategories[i % badgeCategories.length];
        const tier = tiers[Math.min(Math.floor(i / 3), 4)];
        const isAchieved = i <= 8; // First 8 badges are achieved
        
        userBadges.push({
          id: i,
          userId: req.user.id,
          badgeId: i,
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
          description: `Earn this badge by completing ${category} tasks at ${tier} level.`,
          imageUrl: null,
          category,
          tier,
          achieved: isAchieved,
          progress: isAchieved ? 100 : Math.floor(Math.random() * 70),
          earnedAt: isAchieved ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null,
          isNew: isAchieved && i <= 2 // First 2 badges are newly achieved
        });
      }
      
      res.json(userBadges);
    } catch (error: any) {
      console.error("Error generating mock user badges:", error);
      res.status(500).json({ message: "Failed to generate user badges" });
    }
  });
  
  // Get a specific user's badges
  app.get("/api/users/:userId/badges", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Same badge categories and tiers
      const badgeCategories = ['prediction', 'streak', 'achievement', 'special', 'activity', 'loyalty'];
      const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      
      // Generate user badges with progress
      const userBadges = [];
      
      for (let i = 1; i <= 15; i++) {
        const category = badgeCategories[i % badgeCategories.length];
        const tier = tiers[Math.min(Math.floor(i / 3), 4)];
        const isAchieved = i <= 8; // First 8 badges are achieved
        
        userBadges.push({
          id: i,
          userId: req.user.id,
          badgeId: i,
          progress: isAchieved ? 100 : Math.floor(Math.random() * 70),
          achieved: isAchieved,
          earnedAt: isAchieved ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null,
          isNew: isAchieved && i <= 2 // First 2 badges are newly achieved
        });
      }
      
      res.json(userBadges);
    } catch (error: any) {
      console.error("Error generating mock user badges:", error);
      res.status(500).json({ message: "Failed to generate user badges" });
    }
  });
  
  // ============= LEADERBOARD ROUTES =============
  
  // All leaderboards
  app.get("/api/leaderboards", (req, res) => {
    try {
      const leaderboards = [
        {
          id: 1,
          name: "Weekly Competition",
          description: "This week's prediction performance",
          type: "weekly",
          period: new Date().toISOString().slice(0, 7) + "-W" + Math.ceil(new Date().getDate() / 7),
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: "Monthly Masters",
          description: "This month's prediction champions",
          type: "monthly",
          period: new Date().toISOString().slice(0, 7),
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          name: "All-Time Champions",
          description: "The best predictors of all time",
          type: "general",
          period: "all-time",
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      res.json(leaderboards);
    } catch (error: any) {
      console.error("Error generating mock leaderboards:", error);
      res.status(500).json({ message: "Failed to generate leaderboards" });
    }
  });
  
  // Weekly leaderboard
  app.get("/api/leaderboards/weekly", (req, res) => {
    try {
      const weeklyLeaderboard = [
        { id: 1, username: "PredictionKing", points: 240, avatar: null, rank: 1 },
        { id: 2, username: "BettingPro", points: 218, avatar: null, rank: 2 },
        { id: 3, username: "FootballGuru", points: 205, avatar: null, rank: 3 },
        { id: 4, username: "SportsExpert", points: 192, avatar: null, rank: 4 },
        { id: 5, username: "WinnerCircle", points: 187, avatar: null, rank: 5 },
        { id: 6, username: "LuckyStreak", points: 176, avatar: null, rank: 6 },
        { id: 7, username: "MatchMaster", points: 164, avatar: null, rank: 7 },
        { id: 8, username: "Fred4fun", points: 158, avatar: null, rank: 8 },
        { id: 9, username: "VictoryLane", points: 145, avatar: null, rank: 9 },
        { id: 10, username: "ChampionTips", points: 132, avatar: null, rank: 10 }
      ];
      
      res.json(weeklyLeaderboard);
    } catch (error: any) {
      console.error("Error generating mock weekly leaderboard:", error);
      res.status(500).json({ message: "Failed to generate weekly leaderboard" });
    }
  });
  
  // Monthly leaderboard
  app.get("/api/leaderboards/monthly", (req, res) => {
    try {
      const monthlyLeaderboard = [
        { id: 2, username: "BettingPro", points: 876, avatar: null, rank: 1 },
        { id: 1, username: "PredictionKing", points: 845, avatar: null, rank: 2 },
        { id: 5, username: "WinnerCircle", points: 792, avatar: null, rank: 3 },
        { id: 3, username: "FootballGuru", points: 764, avatar: null, rank: 4 },
        { id: 8, username: "Fred4fun", points: 722, avatar: null, rank: 5 },
        { id: 4, username: "SportsExpert", points: 705, avatar: null, rank: 6 },
        { id: 6, username: "LuckyStreak", points: 684, avatar: null, rank: 7 },
        { id: 7, username: "MatchMaster", points: 658, avatar: null, rank: 8 },
        { id: 9, username: "VictoryLane", points: 625, avatar: null, rank: 9 },
        { id: 10, username: "ChampionTips", points: 601, avatar: null, rank: 10 }
      ];
      
      res.json(monthlyLeaderboard);
    } catch (error: any) {
      console.error("Error generating mock monthly leaderboard:", error);
      res.status(500).json({ message: "Failed to generate monthly leaderboard" });
    }
  });
  
  // Global leaderboard
  app.get("/api/leaderboards/global", (req, res) => {
    try {
      const globalLeaderboard = [
        { id: 5, username: "WinnerCircle", points: 5642, avatar: null, rank: 1 },
        { id: 2, username: "BettingPro", points: 5420, avatar: null, rank: 2 },
        { id: 1, username: "PredictionKing", points: 5216, avatar: null, rank: 3 },
        { id: 7, username: "MatchMaster", points: 4957, avatar: null, rank: 4 },
        { id: 3, username: "FootballGuru", points: 4820, avatar: null, rank: 5 },
        { id: 8, username: "Fred4fun", points: 4762, avatar: null, rank: 6 },
        { id: 6, username: "LuckyStreak", points: 4685, avatar: null, rank: 7 },
        { id: 4, username: "SportsExpert", points: 4521, avatar: null, rank: 8 },
        { id: 10, username: "ChampionTips", points: 4350, avatar: null, rank: 9 },
        { id: 9, username: "VictoryLane", points: 4215, avatar: null, rank: 10 }
      ];
      
      res.json(globalLeaderboard);
    } catch (error: any) {
      console.error("Error generating mock global leaderboard:", error);
      res.status(500).json({ message: "Failed to generate global leaderboard" });
    }
  });
  
  // Generic leaderboard endpoint that serves all three types
  app.get("/api/leaderboard", (req, res) => {
    try {
      const type = req.query.type as string || 'global';
      
      if (type === 'weekly') {
        return res.redirect('/api/leaderboards/weekly');
      } else if (type === 'monthly') {
        return res.redirect('/api/leaderboards/monthly');
      } else {
        return res.redirect('/api/leaderboards/global');
      }
    } catch (error: any) {
      console.error("Error redirecting to leaderboard:", error);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });
}