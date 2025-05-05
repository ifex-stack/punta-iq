import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { pool, useMemoryFallback } from "./db";
import { logger } from "./logger";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  
  // Session store setup
  let sessionStore;
  
  // Try to use PostgreSQL for session storage if available
  if (!useMemoryFallback) {
    try {
      const PostgresStore = connectPgSimple(session);
      sessionStore = new PostgresStore({
        pool,
        tableName: 'session', // Default table name for sessions
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 60 // Prune expired sessions every hour
      });
      logger.info('Auth', 'Using PostgreSQL session store for persistent sessions');
    } catch (error) {
      logger.error('Auth', `Failed to initialize PostgreSQL session store: ${error.message}`);
      logger.warn('Auth', 'Falling back to in-memory session store. Sessions will be lost on server restart.');
      
      // Fall back to memory store
      const MemoryStore = createMemoryStore(session);
      sessionStore = new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
    }
  } else {
    // Use memory store if database is not available
    logger.warn('Auth', 'Database not available. Using in-memory session store. Sessions will be lost on server restart.');
    const MemoryStore = createMemoryStore(session);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Debug account for beta testing
        // This allows testers to log in with a consistent account
        if (process.env.NODE_ENV === 'development' && username === 'beta_tester') {
          if (password === 'puntaiq_beta_test') {
            // Create a complete debug user object with all required fields from the schema
            const debugUser: SelectUser = {
              id: 9999,
              username: 'beta_tester',
              email: 'beta@puntaiq.com',
              password: 'hashed_password_placeholder',
              createdAt: new Date(),
              deviceImei: null,
              phoneNumber: null,
              isTwoFactorEnabled: false,
              twoFactorSecret: null,
              referralCode: 'BETATEST',
              role: 'admin' as const,
              lastLoginAt: new Date(),
              isActive: true,
              isEmailVerified: true,
              emailVerificationToken: null,
              passwordResetToken: null,
              passwordResetExpires: null,
              notificationToken: null,
              referredBy: null,
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              subscriptionTier: 'pro',
              // Gamification properties
              fantasyPoints: 1500,
              totalContestsWon: 12,
              totalContestsEntered: 25,
              referralStreak: 3,
              lastReferralDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
              // Additional properties 
              userPreferences: {
                favoriteSports: [1, 3, 5],
                favoriteLeagues: [39, 40, 61],
                preferredTimeZone: 'UTC',
                theme: 'dark',
                language: 'en',
                currency: 'USD',
                bettingFrequency: 'weekly',
                predictionTypes: ['singles', 'accumulators'],
                riskTolerance: 'medium',
                preferredOddsFormat: 'decimal',
                predictionsPerDay: 5,
                experienceLevel: 'intermediate',
                onboardingCompleted: true
              },
              notificationSettings: {
                general: {
                  predictions: true,
                  results: true,
                  promotions: true,
                },
                sports: {
                  football: true,
                  basketball: true,
                  tennis: true,
                  baseball: true,
                  hockey: true,
                  cricket: false,
                  formula1: false,
                  mma: true,
                  volleyball: false,
                  other: false
                },
                metrics: {
                  notificationCount: 24,
                  lastNotificationSent: new Date(),
                  clickThroughRate: 0.65,
                  viewCount: 42,
                  clickCount: 27,
                  dismissCount: 5
                }
              },
              onboardingStatus: 'completed',
              lastOnboardingStep: 5
            };
            return done(null, debugUser);
          }
        }
        
        // Regular authentication logic
        const isEmail = username.includes('@');
        const user = isEmail 
          ? await storage.getUserByEmail(username)
          : await storage.getUserByUsername(username);
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      // Handle debug user for beta testing
      if (id === 9999) {
        // Create a complete debug user object with all required fields from the schema
        const debugUser: SelectUser = {
          id: 9999,
          username: 'beta_tester',
          email: 'beta@puntaiq.com',
          password: 'hashed_password_placeholder',
          createdAt: new Date(),
          deviceImei: null,
          phoneNumber: null,
          isTwoFactorEnabled: false,
          twoFactorSecret: null,
          referralCode: 'BETATEST',
          role: 'admin' as const,
          lastLoginAt: new Date(),
          isActive: true,
          isEmailVerified: true,
          emailVerificationToken: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          notificationToken: null,
          referredBy: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionTier: 'pro',
          // Gamification properties
          fantasyPoints: 1500,
          totalContestsWon: 12,
          totalContestsEntered: 25,
          referralStreak: 3,
          lastReferralDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          // Additional properties 

          userPreferences: {
            favoriteSports: [1, 3, 5],
            favoriteLeagues: [39, 40, 61],
            preferredTimeZone: 'UTC',
            theme: 'dark',
            language: 'en',
            currency: 'USD',
            bettingFrequency: 'weekly',
            predictionTypes: ['singles', 'accumulators'],
            riskTolerance: 'medium',
            preferredOddsFormat: 'decimal',
            predictionsPerDay: 5,
            experienceLevel: 'intermediate',
            onboardingCompleted: true
          },
          notificationSettings: {
            general: {
              predictions: true,
              results: true,
              promotions: true,
            },
            sports: {
              football: true,
              basketball: true,
              tennis: true,
              baseball: true,
              hockey: true,
              cricket: false,
              formula1: false,
              mma: true,
              volleyball: false,
              other: false
            },
            metrics: {
              notificationCount: 24,
              lastNotificationSent: new Date(),
              clickThroughRate: 0.65,
              viewCount: 42,
              clickCount: 27,
              dismissCount: 5
            }
          },
          onboardingStatus: 'completed',
          lastOnboardingStep: 5
        };
        return done(null, debugUser);
      }
      
      // Normal user lookup from storage
      const user = await storage.getUser(id);
      if (!user) {
        // User not found, but don't throw an error
        // This prevents the app from crashing when sessions reference users
        // that no longer exist or when storage is in memory mode
        return done(null, null);
      }
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error);
    }
  });

  // Registration schema with additional validation
  const registerSchema = insertUserSchema.extend({
    email: z.string().email("Invalid email format"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({
          error: 'Registration Failed',
          message: "Username already exists",
          code: 'USERNAME_EXISTS'
        });
      }
      
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({
          error: 'Registration Failed',
          message: "Email already exists",
          code: 'EMAIL_EXISTS'
        });
      }

      // Create user with hashed password
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      // Create welcome notification for the new user
      try {
        await storage.createNotification({
          userId: user.id,
          title: "Welcome to PuntaIQ!",
          message: "Thanks for joining. Start exploring AI-powered sports predictions today!",
          type: "success",
          icon: "party-popper",
          data: {
            action: "onboarding",
            section: "welcome"
          }
        });
        console.log(`Created welcome notification for user ${user.id}`);
      } catch (notificationError) {
        console.error("Failed to create welcome notification:", notificationError);
        // Continue with login despite notification error
      }

      // Log user in
      req.login(user, (err) => {
        if (err) {
          console.error('Session creation error on registration:', err);
          return res.status(500).json({
            error: 'Session Error',
            message: 'Account created but login failed. Please try logging in manually.',
            code: 'SESSION_ERROR_AFTER_REGISTER'
          });
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Detailed validation error message
        return res.status(400).json({
          error: 'Validation Error',
          message: error.errors[0].message,
          code: 'VALIDATION_ERROR',
          field: error.errors[0].path.join('.') // Return the field that failed validation
        });
      }
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to create account. Please try again later.',
        code: 'REGISTRATION_ERROR'
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Validate input is present
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({
          error: 'Server Error',
          message: 'An error occurred during authentication. Please try again.',
          code: 'AUTH_ERROR'
        });
      }
      
      if (!user) {
        // Enhanced error response with clear messaging
        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid username or password. Please try again.',
          code: 'INVALID_CREDENTIALS'
        });
      }
      
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error('Session creation error:', loginErr);
          return res.status(500).json({
            error: 'Session Error',
            message: 'Could not create a session. Please try again.',
            code: 'SESSION_ERROR'
          });
        }
        
        try {
          // Update the last login timestamp
          await storage.updateLastLogin(user.id);
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          
          // Success - return user data
          res.status(200).json(userWithoutPassword);
        } catch (updateError) {
          console.warn('Failed to update last login time, but login successful:', updateError);
          // Still return user data even if updating last login fails
          const { password, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        }
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    // Check if user is authenticated first
    if (!req.isAuthenticated()) {
      return res.status(200).json({
        message: "Already logged out",
        code: "ALREADY_LOGGED_OUT"
      });
    }
    
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
          error: "Logout Error",
          message: "Failed to log out. Please try again.",
          code: "LOGOUT_ERROR"
        });
      }
      // Destroy the session completely to ensure clean logout
      if (req.session) {
        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            console.error('Session destroy error:', sessionErr);
            // Even if session destroy fails, we've already logged out
          }
          // Clear any cookies
          res.clearCookie('connect.sid');
          res.status(200).json({
            message: "Logged out successfully",
            code: "LOGOUT_SUCCESS"
          });
        });
      } else {
        res.status(200).json({
          message: "Logged out successfully",
          code: "LOGOUT_SUCCESS"
        });
      }
    });
  });

  app.get("/api/user", (req, res) => {
    // TEMPORARY FIX: In development mode, special handling for beta testing
    // This will create a mock session with a beta_tester user
    if (process.env.NODE_ENV === 'development' && req.query.beta_login === 'true') {
      // Create a complete debug user object with all required fields from the schema
      const debugUser = {
        id: 9999,
        username: 'beta_tester',
        email: 'beta@puntaiq.com',
        password: 'hashed_password_placeholder',
        createdAt: new Date(),
        deviceImei: null,
        phoneNumber: null,
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
        referralCode: 'BETATEST',
        role: 'admin',
        lastLoginAt: new Date(),
        isActive: true,
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        notificationToken: null,
        referredBy: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionTier: 'pro',
        // Gamification properties
        fantasyPoints: 1500,
        totalContestsWon: 12,
        totalContestsEntered: 25,
        referralStreak: 3,
        lastReferralDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        // Additional properties 
        userPreferences: {
          favoriteSports: [1, 3, 5],
          favoriteLeagues: [39, 40, 61],
          preferredTimeZone: 'UTC',
          theme: 'dark',
          language: 'en',
          currency: 'USD',
          bettingFrequency: 'weekly',
          predictionTypes: ['singles', 'accumulators'],
          riskTolerance: 'medium',
          preferredOddsFormat: 'decimal',
          predictionsPerDay: 5,
          experienceLevel: 'intermediate',
          onboardingCompleted: true
        },
        notificationSettings: {
          general: {
            predictions: true,
            results: true,
            promotions: true,
          },
          sports: {
            football: true,
            basketball: true,
            tennis: true,
            baseball: true,
            hockey: true,
            cricket: false,
            formula1: false,
            mma: true,
            volleyball: false,
            other: false
          },
          metrics: {
            notificationCount: 24,
            lastNotificationSent: new Date(),
            clickThroughRate: 0.65,
            viewCount: 42,
            clickCount: 27,
            dismissCount: 5
          }
        },
        onboardingStatus: 'completed',
        lastOnboardingStep: 5
      };
      
      // Create a login session for the beta tester
      req.login(debugUser, (err) => {
        if (err) {
          console.error('Error creating beta tester session:', err);
          return res.status(500).json({
            error: 'Session Error',
            message: 'Could not create a beta tester session',
            code: 'BETA_SESSION_ERROR'
          });
        }
        
        // Return the beta tester data
        return res.status(200).json(debugUser);
      });
      return;
    }
    
    // Enhanced authentication check with detailed error responses
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    // Check if session exists but user isn't valid
    if (!req.user || !req.user.id) {
      // Destroy the invalid session
      req.logout((err) => {
        if (err) console.error('Error destroying invalid session:', err);
        return res.status(401).json({
          error: 'Invalid Session',
          message: 'Your session appears to be invalid. Please login again.',
          code: 'INVALID_SESSION'
        });
      });
      return;
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // User preferences routes
  app.get("/api/user/preferences", async (req, res) => {
    // Enhanced authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to access your preferences',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Return user preferences or default empty object
      res.json(user.userPreferences || {});
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to fetch user preferences',
        code: 'PREFERENCES_FETCH_ERROR'
      });
    }
  });
  
  // Note: This endpoint is now managed by userPreferencesRouter
  // This implementation is kept for backward compatibility only
  app.post("/api/user/preferences", async (req, res, next) => {
    // Allow the request to be handled by userPreferencesRouter
    next();
  });
}
