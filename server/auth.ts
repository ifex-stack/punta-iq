import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { users, User } from "@shared/schema";
import { createContextLogger } from "./logger";

const logger = createContextLogger("Auth");

// Define the User type for Express sessions
declare global {
  namespace Express {
    // This is to add typing to req.user
    interface User {
      id: number;
      username: string;
      email: string;
      // Add other properties as needed
    }
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
  logger.info("Setting up authentication...");
  
  if (!process.env.SESSION_SECRET) {
    logger.error("SESSION_SECRET environment variable is not set!");
    throw new Error("SESSION_SECRET environment variable is required");
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        logger.debug(`Attempting login for user: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          logger.debug(`Login failed: User not found: ${username}`);
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        const passwordMatches = await comparePasswords(password, user.password);
        
        if (!passwordMatches) {
          logger.debug(`Login failed: Password mismatch for user: ${username}`);
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        logger.info(`User authenticated successfully: ${username}`, { userId: user.id });
        return done(null, user);
      } catch (error) {
        logger.error(`Login error for user ${username}:`, { error });
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    logger.debug(`Serializing user: ${user.username}`, { userId: user.id });
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      logger.debug(`Deserializing user ID: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        logger.warn(`User not found during deserialization: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      logger.error(`Error deserializing user: ${id}`, { error });
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      logger.info(`Registration attempt for username: ${req.body.username}`);
      
      // Validate input
      if (!req.body.username || !req.body.password || !req.body.email) {
        logger.warn("Registration failed: Missing required fields");
        return res.status(400).json({ message: "Username, password, and email are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        logger.warn(`Registration failed: Username already exists: ${req.body.username}`);
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user
      // Only pass required and valid fields to createUser to avoid schema mismatches
      const user = await storage.createUser({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role || 'user',
        isActive: true,
        isEmailVerified: req.body.isEmailVerified || false,
        // Only add referralCode if provided
        ...(req.body.referralCode ? { referralCode: req.body.referralCode } : {}),
        // Only add referredBy if provided
        ...(req.body.referredBy ? { referredBy: req.body.referredBy } : {})
      });
      
      logger.info(`User registered successfully: ${user.username}`, { userId: user.id });
      
      // Log in the new user
      req.login(user, (err) => {
        if (err) {
          logger.error("Error logging in new user after registration", { error: err });
          return next(err);
        }
        res.status(201).json(user);
      });
    } catch (error) {
      logger.error("Registration error:", { error });
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    logger.info(`Login attempt for username: ${req.body.username}`);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        logger.error("Login error:", { error: err });
        return next(err);
      }
      
      if (!user) {
        logger.warn(`Login failed for user: ${req.body.username}`, { reason: info?.message });
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) {
          logger.error("Error during login session creation", { error: err });
          return next(err);
        }
        
        logger.info(`User logged in successfully: ${user.username}`, { userId: user.id });
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    if (req.user) {
      logger.info(`Logout for user: ${(req.user as User).username}`, { userId: (req.user as User).id });
    } else {
      logger.warn("Logout attempted with no active session");
    }
    
    req.logout((err) => {
      if (err) {
        logger.error("Error during logout", { error: err });
        return next(err);
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
  
  logger.info("Authentication setup complete");
}