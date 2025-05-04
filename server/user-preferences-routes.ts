import { Request, Response, Router } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { logger, createContextLogger } from "./logger";

// Create router for user preferences
export const userPreferencesRouter = Router();

// Define route endpoints
userPreferencesRouter.get('/api/user/preferences', getUserPreferences);
userPreferencesRouter.post('/api/user/preferences', updateUserPreferences);

const preferencesLogger = createContextLogger('user-preferences');

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
    
    // Merge existing preferences with new preferences
    const updatedPreferences = {
      ...existingPreferences,
      ...req.body
    };

    // Update user preferences in database
    await db.update(users)
      .set({ userPreferences: updatedPreferences })
      .where(eq(users.id, userId));

    preferencesLogger.info(`Updated preferences for user ${userId}`);
    return res.status(200).json(updatedPreferences);
  } catch (error) {
    preferencesLogger.error("Error updating user preferences:", error);
    return res.status(500).json({ status: 500, message: "Internal server error", code: "ERROR_500" });
  }
}