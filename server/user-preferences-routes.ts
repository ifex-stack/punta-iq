import { Router } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

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
    
    // Check if onboarding is completed in this update
    const onboardingCompleted = preferenceData.onboardingCompleted === true;
    
    // Update user record with new preferences
    const [updatedUser] = await db
      .update(users)
      .set({
        userPreferences: preferenceData,
        onboardingStatus: onboardingCompleted ? 'completed' : 'in_progress',
        lastOnboardingStep: preferenceData.lastStep || 0,
      })
      .where(eq(users.id, req.user!.id))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return the updated preferences
    const preferences = updatedUser.userPreferences as Record<string, any>;
    const onboardingInfo = {
      onboardingStatus: updatedUser.onboardingStatus,
      lastOnboardingStep: updatedUser.lastOnboardingStep,
    };
    
    res.json({
      ...preferences,
      ...onboardingInfo,
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({ message: "Failed to update user preferences" });
  }
});

// Reset user preferences to defaults (for testing)
userPreferencesRouter.post("/api/user/preferences/reset", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
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
    
    const [updatedUser] = await db
      .update(users)
      .set({
        userPreferences: defaultPreferences,
        onboardingStatus: 'not_started',
        lastOnboardingStep: 0,
      })
      .where(eq(users.id, req.user!.id))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      ...defaultPreferences,
      onboardingStatus: 'not_started',
      lastOnboardingStep: 0,
    });
  } catch (error) {
    console.error("Error resetting user preferences:", error);
    res.status(500).json({ message: "Failed to reset user preferences" });
  }
});