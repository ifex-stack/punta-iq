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

// Define route endpoints - use a different prefix to avoid potential conflicts
// userPreferencesRouter.get('/api/user/preferences', getUserPreferences);
// userPreferencesRouter.post('/api/user/preferences', updateUserPreferences);
// userPreferencesRouter.get('/api/user/prediction-filters', getPredictionFilters);
// userPreferencesRouter.post('/api/user/prediction-filters', updatePredictionFilters);

// Use new direct route definitions that should be more reliable
userPreferencesRouter.get('/user-preferences', getUserPreferences);
userPreferencesRouter.post('/user-preferences', updateUserPreferences);
userPreferencesRouter.get('/user-prediction-filters', getPredictionFilters);
userPreferencesRouter.post('/user-prediction-filters', updatePredictionFilters);

export async function getUserPreferences(req: Request, res: Response) {
  console.log('getUserPreferences: Route hit');
  preferencesLogger.info('getUserPreferences: Route hit');
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('getUserPreferences: Not authenticated');
      preferencesLogger.info('getUserPreferences: Not authenticated');
      return res.status(401).json({ status: 401, message: "Unauthorized", code: "ERROR_401" });
    }

    const userId = req.user?.id;
    console.log(`getUserPreferences: User ID: ${userId}`);
    preferencesLogger.info(`getUserPreferences: User ID: ${userId}`);
    if (!userId) {
      return res.status(400).json({ status: 400, message: "User ID is required", code: "ERROR_400" });
    }
    
    // Special handling for beta_tester user
    if (userId === 9999) {
      console.log('getUserPreferences: Using beta_tester preferences');
      preferencesLogger.info("Using beta_tester built-in user preferences");
      
      // Return user preferences directly from req.user
      const preferences = req.user?.userPreferences || {};
      return res.status(200).json(preferences);
    }

    // For regular users, get data from database
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
    
    // Sanitize the input data
    const { 
      onboardingCompleted,
      lastStep,
      completedSteps,
      ...otherPrefs 
    } = req.body;
    
    // Special handling for beta_tester user
    if (userId === 9999) {
      preferencesLogger.info("Pretending to save beta_tester user preferences (in-memory only)");
      
      // We'll log but not actually update the database for this user
      preferencesLogger.info(`Preferences for beta user ${userId}:`, JSON.stringify(req.body));
      
      // Create a simulated response
      const existingPreferences = req.user?.userPreferences || {};
      const updatedPreferences = {
        ...existingPreferences,
        ...otherPrefs,
        ...(onboardingCompleted !== undefined ? { onboardingCompleted } : {}),
        ...(lastStep !== undefined ? { lastStep } : {}),
        ...(completedSteps !== undefined ? { completedSteps } : {})
      };
      
      return res.status(200).json(updatedPreferences);
    }

    // For regular users, get data from database
    const userData = await db.select().from(users).where(eq(users.id, userId));
    if (!userData.length) {
      return res.status(404).json({ status: 404, message: "User not found", code: "ERROR_404" });
    }

    // Get existing preferences
    const existingPreferences = userData[0].userPreferences || {};
    
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
  console.log('getPredictionFilters: Route hit');
  preferencesLogger.info('getPredictionFilters: Route hit');
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('getPredictionFilters: Not authenticated');
      preferencesLogger.info('getPredictionFilters: Not authenticated');
      return res.status(401).json({ status: 401, message: "Unauthorized", code: "ERROR_401" });
    }

    const userId = req.user?.id;
    console.log(`getPredictionFilters: User ID: ${userId}`);
    preferencesLogger.info(`getPredictionFilters: User ID: ${userId}`);
    if (!userId) {
      return res.status(400).json({ status: 400, message: "User ID is required", code: "ERROR_400" });
    }

    // For the built-in beta_tester user (id: 9999), use the default preferences directly from the user object
    if (userId === 9999) {
      preferencesLogger.info("Using beta_tester built-in user preferences");
      
      // Get user preferences from the request.user object
      const userPreferences = req.user?.userPreferences || {};
      
      // Default prediction filters structure
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
      
      preferencesLogger.info(`Fetched prediction filters for beta user ${userId}`);
      return res.status(200).json(predictionFilters);
    }

    // For regular users, get data from database
    const userData = await db.select({
      id: users.id,
      userPreferences: users.userPreferences
    }).from(users).where(eq(users.id, userId));
    
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
    
    // Validate incoming filters
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ status: 400, message: "Invalid prediction filters", code: "ERROR_400" });
    }

    // Special handling for beta_tester user (id: 9999)
    if (userId === 9999) {
      // For beta_tester, we'll log but not actually save to database
      // as this user is recreated on each authentication
      preferencesLogger.info("Pretending to save beta_tester prediction filters (in-memory only)");
      preferencesLogger.info(`Filters for beta user ${userId}:`, JSON.stringify(req.body));
      
      // Return success response with the updated filters
      return res.status(200).json(req.body);
    }

    // For regular users, get data from database
    const userData = await db.select({
      id: users.id,
      userPreferences: users.userPreferences
    }).from(users).where(eq(users.id, userId));
    
    if (!userData.length) {
      return res.status(404).json({ status: 404, message: "User not found", code: "ERROR_404" });
    }

    // Get existing preferences
    const existingPreferences = userData[0].userPreferences || {};
    
    // Update the prediction filters
    const updatedPreferences = {
      ...existingPreferences,
      predictionFilters: {
        ...(existingPreferences.predictionFilters || {}),
        ...req.body
      }
    };

    preferencesLogger.info(`Saving prediction filters for user ${userId}:`, JSON.stringify(req.body));
    
    // Update user preferences in database
    await db.update(users)
      .set({ userPreferences: updatedPreferences })
      .where(eq(users.id, userId));

    preferencesLogger.info(`Updated prediction filters for user ${userId}`);
    return res.status(200).json(updatedPreferences.predictionFilters);
  } catch (error) {
    preferencesLogger.error("Error updating prediction filters:", error);
    return res.status(500).json({ status: 500, message: "Internal server error", code: "ERROR_500" });
  }
}
