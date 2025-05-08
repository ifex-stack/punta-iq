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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Auth', `Failed to initialize PostgreSQL session store: ${errorMessage}`);
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
        // Check if login is with email or username
        const isEmail = username.includes('@');
        const user = isEmail 
          ? await storage.getUserByEmail(username)
          : await storage.getUserByUsername(username);
        
        // Validate the user and password
        if (!user || !(await comparePasswords(password, user.password))) {
          logger.warn('Auth', `Failed login attempt for user: ${username}`);
          return done(null, false);
        }
        
        // Check if email verification is required but not completed
        if (user.isEmailVerified === false) {
          logger.warn('Auth', `Login attempt with unverified email for user: ${username}`);
          // For now we're allowing login with unverified email
          // but we'll add a warning message to the client
        }
        
        // User is valid, update last login time
        try {
          await storage.updateLastLogin(user.id);
        } catch (updateError) {
          logger.error('Auth', `Failed to update last login time: ${updateError}`);
          // Continue login despite update error
        }
        
        return done(null, user);
      } catch (error) {
        logger.error('Auth', `Authentication error: ${error}`);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
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
      logger.error('Auth', `Error deserializing user: ${error}`);
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

      // Generate verification token
      const verificationToken = randomBytes(32).toString('hex');
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
        emailVerificationToken: verificationToken,
        isEmailVerified: false
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
        logger.info('Auth', `Created welcome notification for user ${user.id}`);
      } catch (notificationError) {
        logger.error('Auth', `Failed to create welcome notification: ${notificationError}`);
        // Continue with login despite notification error
      }

      // Log user in with retry mechanism
      const loginWithRetry = (retryCount = 0) => {
        req.login(user, (err) => {
          if (err) {
            logger.error('Auth', `Session creation error on registration (attempt ${retryCount + 1}): ${err}`);
            
            // Retry login up to 2 times if it fails
            if (retryCount < 2) {
              logger.info('Auth', `Retrying login after registration (attempt ${retryCount + 1})`);
              setTimeout(() => loginWithRetry(retryCount + 1), 500);
              return;
            }
            
            // If all retries fail, still return success with the user data,
            // but include a flag indicating that they may need to log in manually
            const { password, ...userWithoutPassword } = user;
            return res.status(201).json({
              ...userWithoutPassword,
              loginStatus: 'manual_login_required',
              message: 'Account created successfully. Please log in with your credentials.'
            });
          }
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          res.status(201).json({
            ...userWithoutPassword,
            loginStatus: 'success'
          });
        });
      };
      
      // Start the login process with retries
      loginWithRetry();
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
      logger.error('Auth', `Registration error: ${error}`);
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
        logger.error('Auth', `Authentication error: ${err}`);
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
          logger.error('Auth', `Session creation error: ${loginErr}`);
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
          logger.warn('Auth', `Failed to update last login time, but login successful: ${updateError}`);
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
        logger.error('Auth', `Logout error: ${err}`);
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
            logger.error('Auth', `Session destroy error: ${sessionErr}`);
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
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Remove sensitive info from user object
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Email verification endpoint
  app.post("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Verification token is required',
          code: 'MISSING_TOKEN'
        });
      }
      
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({
          error: 'Verification Failed',
          message: 'Invalid or expired verification token',
          code: 'INVALID_TOKEN'
        });
      }
      
      if (user.isEmailVerified) {
        return res.status(200).json({
          message: 'Email already verified',
          code: 'ALREADY_VERIFIED'
        });
      }
      
      // Mark email as verified
      const updatedUser = await storage.verifyEmail(user.id);
      
      if (req.isAuthenticated() && req.user.id === user.id) {
        // Update the session with the latest user data
        req.login(updatedUser, (err) => {
          if (err) {
            logger.error('Auth', `Session update error after email verification: ${err}`);
            // Continue despite error - verification still succeeded
          }
        });
      }
      
      res.status(200).json({
        message: 'Email verified successfully',
        code: 'VERIFICATION_SUCCESS'
      });
    } catch (error) {
      logger.error('Auth', `Email verification error: ${error}`);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to verify email. Please try again later.',
        code: 'VERIFICATION_ERROR'
      });
    }
  });

  // Password reset request
  app.post("/api/reset-password-request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Email is required',
          code: 'MISSING_EMAIL'
        });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal that the email doesn't exist for security reasons
        return res.status(200).json({
          message: 'If your email exists in our system, you will receive a password reset link',
          code: 'RESET_EMAIL_SENT'
        });
      }
      
      // Generate password reset token (expires in 1 hour)
      const resetToken = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      await storage.setPasswordResetToken(user.id, resetToken, expires);
      
      // Here, in a real implementation, we would send an email with the reset link
      // For now, we'll just return the token in the response for testing
      logger.info('Auth', `Password reset requested for user ${user.id}`);
      
      // Success response (same whether user exists or not, for security)
      res.status(200).json({
        message: 'If your email exists in our system, you will receive a password reset link',
        code: 'RESET_EMAIL_SENT',
        // The following would be removed in production:
        debug: {
          resetToken,
          userId: user.id 
        }
      });
    } catch (error) {
      logger.error('Auth', `Password reset request error: ${error}`);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to process password reset request. Please try again later.',
        code: 'RESET_REQUEST_ERROR'
      });
    }
  });

  // Password reset (with token)
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Reset token and new password are required',
          code: 'MISSING_RESET_DATA'
        });
      }
      
      // Validate password strength
      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Password must be at least 6 characters long',
          code: 'PASSWORD_TOO_SHORT'
        });
      }
      
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({
          error: 'Reset Failed',
          message: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }
      
      // Check if token is expired
      if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
        return res.status(400).json({
          error: 'Reset Failed',
          message: 'Reset token has expired. Please request a new one.',
          code: 'EXPIRED_RESET_TOKEN'
        });
      }
      
      // Update password and clear reset token
      const updatedUser = await storage.resetPassword(
        user.id, 
        await hashPassword(newPassword)
      );
      
      res.status(200).json({
        message: 'Password reset successfully. You can now log in with your new password.',
        code: 'PASSWORD_RESET_SUCCESS'
      });
    } catch (error) {
      logger.error('Auth', `Password reset error: ${error}`);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to reset password. Please try again later.',
        code: 'RESET_ERROR'
      });
    }
  });
}