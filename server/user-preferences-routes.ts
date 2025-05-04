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
    return res.status(401).json({ 
      message: "Unauthorized", 
      code: "ERROR_401" 
    });
  }
  
  try {
    const preferenceData = req.body;
    const userId = req.user!.id;
    
    // Log received preferences for debugging
    console.log(`Updating preferences for user ${userId}:`, JSON.stringify(preferenceData));
    
    // Separate onboarding status fields from preference data
    const onboardingCompleted = preferenceData.onboardingCompleted === true;
    const lastStep = preferenceData.lastStep || 0;
    
    // Create a sanitized copy of preferences for DB storage
    const sanitizedPreferences = { ...preferenceData };
    
    // Update user preferences first - our improved implementation handles errors gracefully
    await storage.updateUserPreferences(userId, sanitizedPreferences);
    
    // Only update onboarding status if relevant fields are included in the request
    if (preferenceData.onboardingCompleted !== undefined || preferenceData.lastStep !== undefined) {
      const status = onboardingCompleted ? 'completed' : 'in_progress';
      await storage.updateUserOnboardingStatus(userId, status, lastStep);
    }
    
    // Return a successful response without attempting another DB query that might fail
    const combinedData = {
      ...sanitizedPreferences,
      onboardingStatus: onboardingCompleted ? 'completed' : 'in_progress',
      lastOnboardingStep: lastStep
    };
    
    // Log success
    console.log(`Successfully updated preferences for user ${userId}`);
    
    // Return the updated preferences
    res.json(combinedData);
  } catch (error: any) {
    console.error("Error updating user preferences:", error);
    
    // Return a more detailed error response
    res.status(500).json({ 
      message: "Failed to save user preferences",
      code: "PREFERENCES_UPDATE_ERROR",
      details: error.message || "Unknown error"
    });
  }
});

// Reset user preferences to defaults (for testing)
userPreferencesRouter.post("/api/user/preferences/reset", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      message: "Unauthorized",
      code: "ERROR_401"
    });
  }
  
  try {
    const userId = req.user!.id;
    
    // Log the reset action for debugging
    console.log(`Resetting preferences for user ${userId}`);
    
    // Define default preferences structure that matches schema
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
    
    // Update preferences using our improved storage method (handles errors gracefully)
    await storage.updateUserPreferences(userId, defaultPreferences);
    
    // Update onboarding status separately
    await storage.updateUserOnboardingStatus(userId, 'not_started', 0);
    
    // Log success
    console.log(`Successfully reset preferences for user ${userId}`);
    
    // Return the reset preferences and status
    res.json({
      ...defaultPreferences,
      onboardingStatus: 'not_started',
      lastOnboardingStep: 0,
    });
  } catch (error: any) {
    console.error("Error resetting user preferences:", error);
    
    // Return a more detailed error response
    res.status(500).json({ 
      message: "Failed to reset user preferences",
      code: "PREFERENCES_RESET_ERROR",
      details: error.message || "Unknown error"
    });
  }
});