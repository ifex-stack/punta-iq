import { storage } from "./storage";
import { hashPassword } from "./auth";
import { createContextLogger } from "./logger";
import { users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

const logger = createContextLogger("SeedUser");

/**
 * Seeds a default test user if no users exist
 * This is useful for development and testing
 */
export async function seedTestUser() {
  try {
    // Only seed users in development mode or if explicitly set
    if (process.env.NODE_ENV !== 'development' && process.env.SEED_TEST_USER !== 'true') {
      logger.info('Skipping test user seeding in production mode without SEED_TEST_USER flag');
      return;
    }
    
    // First, check if we already have a test user
    try {
      // Check via database 
      const existingUserQuery = await db.select()
                                       .from(users)
                                       .where(eq(users.username, 'beta_tester'))
                                       .limit(1);
      
      if (existingUserQuery && existingUserQuery.length > 0) {
        logger.info('Test user already exists in database, skipping seed');
        return existingUserQuery[0];
      }
      
      // Also try via storage
      try {
        const testUser = await storage.getUserByUsername('beta_tester');
        if (testUser) {
          logger.info('Test user already exists in storage, skipping seed');
          return testUser;
        }
      } catch (storageErr) {
        logger.warn('Error checking for existing test user in storage:', { error: storageErr });
        // Continue with seeding attempt
      }
    } catch (err) {
      logger.warn('Error checking for existing test user in database:', { error: err });
      // Continue with seeding attempt
    }
    
    try {
      // Create test user directly through database
      logger.info('Creating test user account via database');
      const hashedPassword = await hashPassword('puntaiq_beta_test');
      
      // Try direct database insertion first
      const [insertedUser] = await db.insert(users)
        .values({
          username: 'beta_tester',
          email: 'beta@puntaiq.com',
          password: hashedPassword,
          // Remove role field as it's causing issues
          isActive: true,
          isEmailVerified: true,
          referralCode: 'BETATEST',
          createdAt: new Date()
        })
        .returning();
        
      logger.info('Test user created successfully via direct DB access', { userId: insertedUser.id });
      return insertedUser;
    } catch (dbError) {
      logger.warn('Failed to create test user via direct DB access, trying storage API', { error: dbError });
      
      try {
        // Try using storage API as fallback
        const hashedPassword = await hashPassword('puntaiq_beta_test');
        
        const user = await storage.createUser({
          username: 'beta_tester',
          email: 'beta@puntaiq.com',
          password: hashedPassword,
          // Remove role field as it's causing issues
          isActive: true,
          isEmailVerified: true,
          referralCode: 'BETATEST'
        });
        
        logger.info('Test user created successfully via storage API', { userId: user.id });
        return user;
      } catch (storageError) {
        logger.error('Failed to create test user via storage API, creating in-memory user', { error: storageError });
        
        // Create in-memory test user
        logger.info('Creating in-memory test user as last resort');
        
        // Direct MemStorage fallback
        try {
          const testUser = {
            id: 1,
            username: 'beta_tester',
            email: 'beta@puntaiq.com',
            password: await hashPassword('puntaiq_beta_test'),
            createdAt: new Date(),
            // Remove role field as it's causing issues
            isActive: true,
            isEmailVerified: true,
            referralCode: 'BETATEST',
            fantasyPoints: 100,
            totalContestsWon: 0,
            totalContestsEntered: 0
          };
          
          // Attempt to add to any in-memory storage system - this won't work in database mode
          try {
            // @ts-ignore - Adding to memory storage directly
            if (storage.users && Array.isArray(storage.users)) {
              // @ts-ignore
              storage.users.push(testUser);
              logger.info('Added test user to in-memory users array');
            }
          } catch (memErr) {
            logger.warn('Could not add user to in-memory array', { error: memErr });
          }
          
          logger.info('Created in-memory test user', { userId: testUser.id });
          return testUser;
        } catch (e) {
          logger.error('All test user creation methods failed', { error: e });
          throw e;
        }
      }
    }
  } catch (error) {
    logger.error('Failed to seed test user (all methods)', { error });
    return null;
  }
}