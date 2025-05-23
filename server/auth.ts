import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";
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
  
  // Get the session store from the storage implementation
  const sessionStore = storage.sessionStore;
  logger.info('Auth', 'Using session store from storage implementation');
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true, // Prevents client-side JS from reading the cookie
    }
  }

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
      logger.info('Auth', 'Registration attempt received');
      
      // Validate request body
      try {
        var validatedData = registerSchema.parse(req.body);
        logger.info('Auth', `Registration validation passed for: ${validatedData.username}`);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          // Detailed validation error message
          logger.warn('Auth', `Registration validation failed: ${validationError.errors[0].message}`);
          return res.status(400).json({
            error: 'Validation Error',
            message: validationError.errors[0].message,
            code: 'VALIDATION_ERROR',
            field: validationError.errors[0].path.join('.') // Return the field that failed validation
          });
        }
        throw validationError; // Re-throw unexpected validation errors
      }
      
      // Check if user already exists
      try {
        const existingUsername = await storage.getUserByUsername(validatedData.username);
        if (existingUsername) {
          logger.warn('Auth', `Registration failed: Username already exists (${validatedData.username})`);
          return res.status(400).json({
            error: 'Registration Failed',
            message: "Username already exists",
            code: 'USERNAME_EXISTS'
          });
        }
        
        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          logger.warn('Auth', `Registration failed: Email already exists (${validatedData.email})`);
          return res.status(400).json({
            error: 'Registration Failed',
            message: "Email already exists",
            code: 'EMAIL_EXISTS'
          });
        }
      } catch (lookupError) {
        logger.error('Auth', `Error checking user existence: ${lookupError}`);
        return res.status(500).json({
          error: 'Server Error',
          message: 'Database error occurred while checking user existence',
          code: 'DB_ERROR'
        });
      }

      // Generate verification token
      const verificationToken = randomBytes(32).toString('hex');
      
      // Create user with hashed password
      let user;
      try {
        const hashedPassword = await hashPassword(validatedData.password);
        logger.info('Auth', 'Password hashed successfully, creating user');
        
        user = await storage.createUser({
          ...validatedData,
          password: hashedPassword,
          emailVerificationToken: verificationToken,
          isEmailVerified: false
        });
        
        logger.info('Auth', `User created successfully: ${user.id}`);
      } catch (createError) {
        logger.error('Auth', `Failed to create user: ${createError}`);
        return res.status(500).json({
          error: 'Server Error',
          message: 'Failed to create user account',
          code: 'USER_CREATION_ERROR',
          details: process.env.NODE_ENV === 'development' ? createError.message : undefined
        });
      }

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
            logger.warn('Auth', 'All login attempts after registration failed, returning manual login required');
            return res.status(201).json({
              ...userWithoutPassword,
              loginStatus: 'manual_login_required',
              message: 'Account created successfully. Please log in with your credentials.'
            });
          }
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          logger.info('Auth', `Registration successful and user logged in: ${user.id}`);
          res.status(201).json({
            ...userWithoutPassword,
            loginStatus: 'success'
          });
        });
      };
      
      // Start the login process with retries
      loginWithRetry();
    } catch (error) {
      logger.error('Auth', `Unexpected registration error: ${error}`);
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
  
  // Seed a beta test user on server start (does nothing if user already exists)
  async function createBetaTestUser() {
    try {
      // Check if beta test user already exists
      const existingUser = await storage.getUserByUsername('betatester');
      if (existingUser) {
        logger.info('Auth', 'Beta test user already exists - no need to create');
        return;
      }
      
      // Create beta test user
      logger.info('Auth', 'Creating beta test user for demonstration purposes');
      const hashedPassword = await hashPassword('test1234');
      
      await storage.createUser({
        username: 'betatester',
        email: 'beta@puntaiq.test',
        password: hashedPassword,
        emailVerificationToken: '',
        isEmailVerified: true,
        isTwoFactorEnabled: false,
        subscriptionTier: 'elite', // Set to the highest tier for testing all features
        fantasyPoints: 1000,
        totalContestsWon: 5,
        totalContestsEntered: 10,
        referralStreak: 3,
        onboardingStatus: 'completed',
        lastOnboardingStep: 5
      });
      
      logger.info('Auth', 'Beta test user created successfully');
    } catch (error) {
      logger.error('Auth', `Failed to create beta test user: ${error}`);
    }
  }
  
  // Create beta test user when the server starts
  createBetaTestUser();

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