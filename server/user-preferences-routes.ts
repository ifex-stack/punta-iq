import { Request, Response, Router } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { logger, createContextLogger } from "./logger";

// Create router for user preferences
export const userPreferencesRouter = Router();

const preferencesLogger = createContextLogger('user-preferences');

// Forward declarations of functions
// Function implementations are later in this file
export async function getUserPreferences(req: Request, res: Response);
export async function updateUserPreferences(req: Request, res: Response);
export async function getPredictionFilters(req: Request, res: Response);
export async function updatePredictionFilters(req: Request, res: Response);

// Define route endpoints
userPreferencesRouter.get('/api/user/preferences', getUserPreferences);
userPreferencesRouter.post('/api/user/preferences', updateUserPreferences);
userPreferencesRouter.get('/api/user/prediction-filters', getPredictionFilters);
userPreferencesRouter.post('/api/user/prediction-filters', updatePredictionFilters);

export async function getUserPreferences(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ status: 401, message: "Unauthorized", code: "ERROR_401" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ status: 400, message: "User ID is required", code: "ERROR_400" });
    }

    // Get user from database
    const userData = await db.select().from(users).where(eq(users.id, userId));
    if (!userData.length) {
      return res.status(404).json({ status: 404, message: "User not found", code: "ERROR_404" });
    }

    // Return user preferences
    const preferences = userData[0].userPreferences || {};
    
    preferencesLogger.info(`Fetched preferences for user ${userId}`);
    return res.status(200).json(preferences);
  } catch (error) {
    preferencesLogger.error("Error fetching user preferences:", error);
    return res.status(500).json({ status: 500, message: "Internal server error", code: "ERROR_500" });
  }
}

export async function updateUserPreferences(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ status: 401, message: "Unauthorized", code: "ERROR_401" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ status: 400, message: "User ID is required", code: "ERROR_400" });
    }

    // Get user from database
    const userData = await db.select().from(users).where(eq(users.id, userId));
    if (!userData.length) {
      return res.status(404).json({ status: 404, message: "User not found", code: "ERROR_404" });
    }

    // Get existing preferences
    const existingPreferences = userData[0].userPreferences || {};
    
    // Sanitize the input data
    const { 
      onboardingCompleted,
      lastStep,
      completedSteps,
      ...otherPrefs 
    } = req.body;
    
    // Merge existing preferences with new preferences
    const updatedPreferences = {
      ...existingPreferences,
      ...otherPrefs
    };
    
    // Handle onboarding specific fields separately
    if (onboardingCompleted !== undefined) {
      updatedPreferences.onboardingCompleted = onboardingCompleted;
    }
    
    if (lastStep !== undefined) {
      updatedPreferences.lastStep = lastStep;
    }
    
    if (completedSteps !== undefined) {
      updatedPreferences.completedSteps = completedSteps;
    }

    // Log the preferences being saved (for debugging)
    preferencesLogger.info(`Saving preferences for user ${userId}:`, JSON.stringify(updatedPreferences));
    
    try {
      // Update user preferences in database - only update the userPreferences field
      await db.update(users)
        .set({ 
          userPreferences: updatedPreferences,
          // If onboarding is completed, also update the onboarding status
          ...(onboardingCompleted ? { onboardingStatus: 'completed' } : {}),
          ...(lastStep !== undefined ? { lastOnboardingStep: lastStep } : {})
        })
        .where(eq(users.id, userId));
    } catch (updateError: any) {
      preferencesLogger.error(`Error in SQL update: ${updateError.message}`);
      throw updateError;
    }

    preferencesLogger.info(`Updated preferences for user ${userId}`);
    return res.status(200).json(updatedPreferences);
  } catch (error) {
    preferencesLogger.error("Error updating user preferences:", error);
    return res.status(500).json({ status: 500, message: "Internal server error", code: "ERROR_500" });
  }
}

/**
 * Get the prediction filters for the user
 */
export async function getPredictionFilters(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ status: 401, message: "Unauthorized", code: "ERROR_401" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ status: 400, message: "User ID is required", code: "ERROR_400" });
    }

    // Get user from database
    const userData = await db.select().from(users).where(eq(users.id, userId));
    if (!userData.length) {
      return res.status(404).json({ status: 404, message: "User not found", code: "ERROR_404" });
    }

    // Get the prediction filters from user preferences
    const userPreferences = userData[0].userPreferences || {};
    const predictionFilters = userPreferences.predictionFilters || {
      // Default filters if none are set
      enabledSports: {
        football: true,
        basketball: true,
        tennis: false,
        baseball: false,
        hockey: false,
        cricket: false,
        formula1: false,
        mma: false,
        volleyball: false
      },
      enabledLeagues: {
        football: ["premier_league", "laliga", "bundesliga", "seriea", "ligue1", "champions_league"],
        basketball: ["nba", "euroleague"],
        tennis: [],
        baseball: [],
        hockey: [],
        cricket: [],
        formula1: [],
        mma: [],
        volleyball: []
      },
      marketTypes: {
        matchWinner: true,
        bothTeamsToScore: true,
        overUnder: true,
        correctScore: false,
        handicap: false,
        playerProps: false
      },
      minimumConfidence: 60,
      minimumOdds: 1.5,
      maximumOdds: 10.0,
      includeAccumulators: true
    };
    
    preferencesLogger.info(`Fetched prediction filters for user ${userId}`);
    return res.status(200).json(predictionFilters);
  } catch (error) {
    preferencesLogger.error("Error fetching prediction filters:", error);
    return res.status(500).json({ status: 500, message: "Internal server error", code: "ERROR_500" });
  }
}

/**
 * Update the prediction filters for the user
 */
export async function updatePredictionFilters(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ status: 401, message: "Unauthorized", code: "ERROR_401" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ status: 400, message: "User ID is required", code: "ERROR_400" });
    }

    // Get user from database
    const userData = await db.select().from(users).where(eq(users.id, userId));
    if (!userData.length) {
      return res.status(404).json({ status: 404, message: "User not found", code: "ERROR_404" });
    }

    // Get existing preferences
    const existingPreferences = userData[0].userPreferences || {};
    
    // Validate incoming filters
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ status: 400, message: "Invalid prediction filters", code: "ERROR_400" });
    }
    
    // Update the prediction filters
    const updatedPreferences = {
      ...existingPreferences,
      predictionFilters: {
        ...(existingPreferences.predictionFilters || {}),
        ...req.body
      }
    };

    preferencesLogger.info(`Saving prediction filters for user ${userId}:`, JSON.stringify(req.body));
    
    try {
      // Update user preferences in database
      await db.update(users)
        .set({ userPreferences: updatedPreferences })
        .where(eq(users.id, userId));
    } catch (updateError: any) {
      preferencesLogger.error(`Error in SQL update: ${updateError.message}`);
      throw updateError;
    }

    preferencesLogger.info(`Updated prediction filters for user ${userId}`);
    return res.status(200).json(updatedPreferences.predictionFilters);
  } catch (error) {
    preferencesLogger.error("Error updating prediction filters:", error);
    return res.status(500).json({ status: 500, message: "Internal server error", code: "ERROR_500" });
  }
}