import { Router } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";

export const userPreferencesRouter = Router();

// Get user preferences
userPreferencesRouter.get("/api/user/preferences", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const [user] = await db
      .select({
        userPreferences: users.userPreferences,
        onboardingStatus: users.onboardingStatus,
        lastOnboardingStep: users.lastOnboardingStep,
      })
      .from(users)
      .where(eq(users.id, req.user!.id));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const preferences = user.userPreferences as Record<string, any>;
    
    // Include additional onboarding status information
    const onboardingInfo = {
      onboardingStatus: user.onboardingStatus,
      lastOnboardingStep: user.lastOnboardingStep,
    };
    
    res.json({
      ...preferences,
      ...onboardingInfo,
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ message: "Failed to fetch user preferences" });
  }
});

// Update user preferences
userPreferencesRouter.post("/api/user/preferences", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const preferenceData = req.body;
    const userId = req.user!.id;
    
    // Check if onboarding is completed in this update
    const onboardingCompleted = preferenceData.onboardingCompleted === true;
    const lastStep = preferenceData.lastStep || 0;
    
    // Update preferences using the fixed storage method
    const updatedUser = await storage.updateUserPreferences(userId, preferenceData);
    
    // If onboarding info is included, update it separately
    if (preferenceData.onboardingCompleted !== undefined || preferenceData.lastStep !== undefined) {
      const status = onboardingCompleted ? 'completed' : 'in_progress';
      await storage.updateUserOnboardingStatus(userId, status, lastStep);
    }
    
    // Get updated user to return complete status
    const [user] = await db
      .select({
        userPreferences: users.userPreferences,
        onboardingStatus: users.onboardingStatus,
        lastOnboardingStep: users.lastOnboardingStep,
      })
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return the updated preferences
    const preferences = user.userPreferences as Record<string, any>;
    const onboardingInfo = {
      onboardingStatus: user.onboardingStatus,
      lastOnboardingStep: user.lastOnboardingStep,
    };
    
    res.json({
      ...preferences,
      ...onboardingInfo,
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({ 
      message: "Failed to save user preferences",
      code: "PREFERENCES_UPDATE_ERROR"
    });
  }
});

// Reset user preferences to defaults (for testing)
userPreferencesRouter.post("/api/user/preferences/reset", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const userId = req.user!.id;
    const defaultPreferences = {
      favoriteSports: [],
      favoriteLeagues: [],
      bettingFrequency: null,
      predictionTypes: [],
      riskTolerance: null,
      preferredOddsFormat: 'decimal',
      predictionsPerDay: 5,
      experienceLevel: null,
      onboardingCompleted: false,
      lastStep: 0,
      completedSteps: []
    };
    
    // Update preferences using the fixed storage method
    await storage.updateUserPreferences(userId, defaultPreferences);
    
    // Update onboarding status separately
    await storage.updateUserOnboardingStatus(userId, 'not_started', 0);
    
    // Return the reset preferences and status
    res.json({
      ...defaultPreferences,
      onboardingStatus: 'not_started',
      lastOnboardingStep: 0,
    });
  } catch (error) {
    console.error("Error resetting user preferences:", error);
    res.status(500).json({ 
      message: "Failed to reset user preferences",
      code: "PREFERENCES_RESET_ERROR"
    });
  }
});