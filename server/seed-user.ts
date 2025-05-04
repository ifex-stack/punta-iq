import { storage } from "./storage";
import { hashPassword } from "./auth";
import { createContextLogger } from "./logger";

const logger = createContextLogger("SeedUser");

/**
 * Seeds a default test user if no users exist
 * This is useful for development and testing
 */
export async function seedTestUser() {
  try {
    // Only seed users in development mode
    if (process.env.NODE_ENV !== 'development') {
      logger.info('Skipping test user seeding in production mode');
      return;
    }
    
    // Check if we already have users
    try {
      const testUser = await storage.getUserByUsername('beta_tester');
      if (testUser) {
        logger.info('Test user already exists, skipping seed');
        return;
      }
    } catch (err) {
      logger.warn('Error checking for existing test user:', { error: err });
      // Continue with seeding attempt
    }
    
    // Create test user
    logger.info('Creating test user account');
    const hashedPassword = await hashPassword('puntaiq_beta_test');
    
    const user = await storage.createUser({
      username: 'beta_tester',
      email: 'beta@puntaiq.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      referralCode: 'BETATEST'
    });
    
    logger.info('Test user created successfully', { userId: user.id });
    
    return user;
  } catch (error) {
    logger.error('Failed to seed test user', { error });
    return null;
  }
}