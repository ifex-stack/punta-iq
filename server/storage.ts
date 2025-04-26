import { 
  users, 
  sports, 
  leagues, 
  matches, 
  predictions, 
  userPredictions, 
  accumulators, 
  accumulatorItems,
  type User,
  type InsertUser,
  type Sport,
  type InsertSport,
  type League,
  type InsertLeague,
  type Match,
  type InsertMatch,
  type Prediction,
  type InsertPrediction,
  type UserPrediction,
  type InsertUserPrediction,
  type Accumulator,
  type InsertAccumulator,
  type AccumulatorItem,
  type InsertAccumulatorItem,
  subscriptionTiers
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { db, pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(userId: number, tier: string): Promise<User>;
  updateUserStripeInfo(userId: number, info: { stripeCustomerId?: string, stripeSubscriptionId?: string }): Promise<User>;
  
  // Sport & League methods
  getAllSports(): Promise<Sport[]>;
  getActiveSports(): Promise<Sport[]>;
  createSport(sport: InsertSport): Promise<Sport>;
  getAllLeagues(): Promise<League[]>;
  getLeaguesBySport(sportId: number): Promise<League[]>;
  createLeague(league: InsertLeague): Promise<League>;
  
  // Match methods
  getAllMatches(): Promise<Match[]>;
  getMatchById(id: number): Promise<Match | undefined>;
  getMatchesByLeague(leagueId: number): Promise<Match[]>;
  getUpcomingMatches(limit?: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  
  // Prediction methods
  getAllPredictions(): Promise<Prediction[]>;
  getPredictionById(id: number): Promise<Prediction | undefined>;
  getPredictionsByMatch(matchId: number): Promise<Prediction[]>;
  getFreePredictions(limit?: number): Promise<Prediction[]>;
  getPremiumPredictions(limit?: number): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  
  // User Prediction methods
  getUserPredictions(userId: number): Promise<UserPrediction[]>;
  saveUserPrediction(userPrediction: InsertUserPrediction): Promise<UserPrediction>;
  toggleSavedPrediction(userId: number, predictionId: number): Promise<UserPrediction>;
  
  // Accumulator methods
  getUserAccumulators(userId: number): Promise<Accumulator[]>;
  getAccumulatorById(id: number): Promise<Accumulator | undefined>;
  createAccumulator(accumulator: InsertAccumulator): Promise<Accumulator>;
  addToAccumulator(accumulatorItem: InsertAccumulatorItem): Promise<AccumulatorItem>;
  removeFromAccumulator(accumulatorId: number, predictionId: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private sportsMap: Map<number, Sport>;
  private leaguesMap: Map<number, League>;
  private matchesMap: Map<number, Match>;
  private predictionsMap: Map<number, Prediction>;
  private userPredictionsMap: Map<number, UserPrediction>;
  private accumulatorsMap: Map<number, Accumulator>;
  private accumulatorItemsMap: Map<number, AccumulatorItem>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number = 1;
  private sportIdCounter: number = 1;
  private leagueIdCounter: number = 1;
  private matchIdCounter: number = 1;
  private predictionIdCounter: number = 1;
  private userPredictionIdCounter: number = 1;
  private accumulatorIdCounter: number = 1;
  private accumulatorItemIdCounter: number = 1;

  constructor() {
    this.usersMap = new Map();
    this.sportsMap = new Map();
    this.leaguesMap = new Map();
    this.matchesMap = new Map();
    this.predictionsMap = new Map();
    this.userPredictionsMap = new Map();
    this.accumulatorsMap = new Map();
    this.accumulatorItemsMap = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      subscriptionTier: subscriptionTiers.FREE,
      notificationSettings: {
        predictions: true,
        results: true,
        promotions: true,
      }
    };
    this.usersMap.set(id, user);
    return user;
  }

  async updateUserSubscription(userId: number, tier: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, subscriptionTier: tier };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, info: { stripeCustomerId?: string; stripeSubscriptionId?: string; }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      stripeCustomerId: info.stripeCustomerId || user.stripeCustomerId,
      stripeSubscriptionId: info.stripeSubscriptionId || user.stripeSubscriptionId
    };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }

  // Sport & League methods
  async getAllSports(): Promise<Sport[]> {
    return Array.from(this.sportsMap.values());
  }

  async getActiveSports(): Promise<Sport[]> {
    return Array.from(this.sportsMap.values()).filter(sport => sport.isActive);
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const id = this.sportIdCounter++;
    const newSport: Sport = { ...sport, id };
    this.sportsMap.set(id, newSport);
    return newSport;
  }

  async getAllLeagues(): Promise<League[]> {
    return Array.from(this.leaguesMap.values());
  }

  async getLeaguesBySport(sportId: number): Promise<League[]> {
    return Array.from(this.leaguesMap.values()).filter(
      league => league.sportId === sportId
    );
  }

  async createLeague(league: InsertLeague): Promise<League> {
    const id = this.leagueIdCounter++;
    const newLeague: League = { ...league, id };
    this.leaguesMap.set(id, newLeague);
    return newLeague;
  }

  // Match methods
  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matchesMap.values());
  }

  async getMatchById(id: number): Promise<Match | undefined> {
    return this.matchesMap.get(id);
  }

  async getMatchesByLeague(leagueId: number): Promise<Match[]> {
    return Array.from(this.matchesMap.values()).filter(
      match => match.leagueId === leagueId
    );
  }

  async getUpcomingMatches(limit: number = 10): Promise<Match[]> {
    const now = new Date();
    return Array.from(this.matchesMap.values())
      .filter(match => new Date(match.startTime) > now && !match.isCompleted)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, limit);
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const id = this.matchIdCounter++;
    const newMatch: Match = { 
      ...match, 
      id, 
      isCompleted: false,
      result: null
    };
    this.matchesMap.set(id, newMatch);
    return newMatch;
  }

  // Prediction methods
  async getAllPredictions(): Promise<Prediction[]> {
    return Array.from(this.predictionsMap.values());
  }

  async getPredictionById(id: number): Promise<Prediction | undefined> {
    return this.predictionsMap.get(id);
  }

  async getPredictionsByMatch(matchId: number): Promise<Prediction[]> {
    return Array.from(this.predictionsMap.values()).filter(
      prediction => prediction.matchId === matchId
    );
  }

  async getFreePredictions(limit: number = 10): Promise<Prediction[]> {
    return Array.from(this.predictionsMap.values())
      .filter(prediction => !prediction.isPremium)
      .slice(0, limit);
  }

  async getPremiumPredictions(limit: number = 10): Promise<Prediction[]> {
    return Array.from(this.predictionsMap.values())
      .filter(prediction => prediction.isPremium)
      .slice(0, limit);
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const id = this.predictionIdCounter++;
    const now = new Date();
    const newPrediction: Prediction = { 
      ...prediction, 
      id, 
      createdAt: now,
      isCorrect: null
    };
    this.predictionsMap.set(id, newPrediction);
    return newPrediction;
  }

  // User Prediction methods
  async getUserPredictions(userId: number): Promise<UserPrediction[]> {
    return Array.from(this.userPredictionsMap.values()).filter(
      userPrediction => userPrediction.userId === userId
    );
  }

  async saveUserPrediction(userPrediction: InsertUserPrediction): Promise<UserPrediction> {
    const id = this.userPredictionIdCounter++;
    const now = new Date();
    const newUserPrediction: UserPrediction = { 
      ...userPrediction, 
      id, 
      viewedAt: now
    };
    this.userPredictionsMap.set(id, newUserPrediction);
    return newUserPrediction;
  }

  async toggleSavedPrediction(userId: number, predictionId: number): Promise<UserPrediction> {
    const existing = Array.from(this.userPredictionsMap.values()).find(
      up => up.userId === userId && up.predictionId === predictionId
    );

    if (existing) {
      const updated = { ...existing, isSaved: !existing.isSaved };
      this.userPredictionsMap.set(existing.id, updated);
      return updated;
    } else {
      return this.saveUserPrediction({
        userId,
        predictionId,
        isSaved: true,
        isInAccumulator: false
      });
    }
  }

  // Accumulator methods
  async getUserAccumulators(userId: number): Promise<Accumulator[]> {
    return Array.from(this.accumulatorsMap.values()).filter(
      acc => acc.userId === userId && acc.isActive
    );
  }

  async getAccumulatorById(id: number): Promise<Accumulator | undefined> {
    return this.accumulatorsMap.get(id);
  }

  async createAccumulator(accumulator: InsertAccumulator): Promise<Accumulator> {
    const id = this.accumulatorIdCounter++;
    const now = new Date();
    const newAccumulator: Accumulator = { 
      ...accumulator, 
      id, 
      createdAt: now,
      isActive: true
    };
    this.accumulatorsMap.set(id, newAccumulator);
    return newAccumulator;
  }

  async addToAccumulator(accumulatorItem: InsertAccumulatorItem): Promise<AccumulatorItem> {
    const id = this.accumulatorItemIdCounter++;
    const now = new Date();
    const newItem: AccumulatorItem = { 
      ...accumulatorItem, 
      id, 
      addedAt: now
    };
    this.accumulatorItemsMap.set(id, newItem);
    return newItem;
  }

  async removeFromAccumulator(accumulatorId: number, predictionId: number): Promise<boolean> {
    const item = Array.from(this.accumulatorItemsMap.values()).find(
      item => item.accumulatorId === accumulatorId && item.predictionId === predictionId
    );

    if (item) {
      this.accumulatorItemsMap.delete(item.id);
      return true;
    }
    
    return false;
  }

  // Initialize sample data
  private initializeSampleData() {
    // Add sample sports
    const sportsData: InsertSport[] = [
      { name: "Soccer", icon: "fa-futbol", isActive: true },
      { name: "Basketball", icon: "fa-basketball-ball", isActive: true },
      { name: "American Football", icon: "fa-football-ball", isActive: true },
      { name: "Baseball", icon: "fa-baseball-ball", isActive: true },
      { name: "Hockey", icon: "fa-hockey-puck", isActive: true },
      { name: "Tennis", icon: "fa-table-tennis", isActive: true }
    ];
    
    sportsData.forEach(sport => this.createSport(sport));
    
    // Add sample leagues
    const leaguesData: InsertLeague[] = [
      { sportId: 1, name: "Premier League", isActive: true },
      { sportId: 1, name: "La Liga", isActive: true },
      { sportId: 1, name: "Bundesliga", isActive: true },
      { sportId: 1, name: "Serie A", isActive: true },
      { sportId: 2, name: "NBA", isActive: true },
      { sportId: 2, name: "EuroLeague", isActive: true },
      { sportId: 3, name: "NFL", isActive: true },
      { sportId: 4, name: "MLB", isActive: true },
      { sportId: 5, name: "NHL", isActive: true },
      { sportId: 6, name: "ATP", isActive: true }
    ];
    
    leaguesData.forEach(league => this.createLeague(league));
    
    // Add sample matches
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const matchesData: InsertMatch[] = [
      { 
        leagueId: 1, 
        homeTeam: "Manchester City", 
        awayTeam: "Liverpool", 
        startTime: new Date(today.setHours(today.getHours() + 6)), 
        homeOdds: 2.10, 
        drawOdds: 3.40, 
        awayOdds: 3.20 
      },
      { 
        leagueId: 2, 
        homeTeam: "Barcelona", 
        awayTeam: "Real Madrid", 
        startTime: new Date(today.setHours(today.getHours() + 8)), 
        homeOdds: 1.85, 
        drawOdds: 3.50, 
        awayOdds: 4.20 
      },
      { 
        leagueId: 3, 
        homeTeam: "Bayern Munich", 
        awayTeam: "Dortmund", 
        startTime: new Date(today.setHours(today.getHours() + 4)), 
        homeOdds: 1.60, 
        drawOdds: 4.00, 
        awayOdds: 5.50 
      },
      { 
        leagueId: 5, 
        homeTeam: "Los Angeles Lakers", 
        awayTeam: "Golden State Warriors", 
        startTime: new Date(tomorrow.setHours(tomorrow.getHours() + 10)), 
        homeOdds: 1.90, 
        drawOdds: null, 
        awayOdds: 1.90 
      },
      { 
        leagueId: 7, 
        homeTeam: "Kansas City Chiefs", 
        awayTeam: "San Francisco 49ers", 
        startTime: new Date(tomorrow.setHours(tomorrow.getHours() + 12)), 
        homeOdds: 1.70, 
        drawOdds: null, 
        awayOdds: 2.10 
      }
    ];
    
    matchesData.forEach(match => this.createMatch(match));
    
    // Add sample predictions
    const predictionsData: InsertPrediction[] = [
      {
        matchId: 1,
        predictedOutcome: "home",
        confidence: 85,
        isPremium: false,
        additionalPredictions: { btts: true, overUnder: "over2.5" }
      },
      {
        matchId: 2,
        predictedOutcome: "home",
        confidence: 95,
        isPremium: true,
        additionalPredictions: { btts: true, overUnder: "over3.5" }
      },
      {
        matchId: 3,
        predictedOutcome: "home_over2.5",
        confidence: 80,
        isPremium: false,
        additionalPredictions: { btts: true, overUnder: "over2.5" }
      },
      {
        matchId: 4,
        predictedOutcome: "away",
        confidence: 70,
        isPremium: true,
        additionalPredictions: { overUnder: "over220.5", marginOfVictory: "+5.5" }
      },
      {
        matchId: 5,
        predictedOutcome: "home",
        confidence: 75,
        isPremium: true,
        additionalPredictions: { overUnder: "over48.5", marginOfVictory: "+3.5" }
      }
    ];
    
    predictionsData.forEach(prediction => this.createPrediction(prediction));
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        subscriptionTier: subscriptionTiers.FREE,
        notificationSettings: {
          predictions: true,
          results: true,
          promotions: true,
        }
      })
      .returning();
    return user;
  }

  async updateUserSubscription(userId: number, tier: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ subscriptionTier: tier })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateUserStripeInfo(userId: number, info: { stripeCustomerId?: string; stripeSubscriptionId?: string; }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: info.stripeCustomerId,
        stripeSubscriptionId: info.stripeSubscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) throw new Error("User not found");
    return user;
  }

  // Sport & League methods
  async getAllSports(): Promise<Sport[]> {
    return db.select().from(sports);
  }

  async getActiveSports(): Promise<Sport[]> {
    return db
      .select()
      .from(sports)
      .where(eq(sports.isActive, true));
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const [newSport] = await db
      .insert(sports)
      .values(sport)
      .returning();
    return newSport;
  }

  async getAllLeagues(): Promise<League[]> {
    return db.select().from(leagues);
  }

  async getLeaguesBySport(sportId: number): Promise<League[]> {
    return db
      .select()
      .from(leagues)
      .where(eq(leagues.sportId, sportId));
  }

  async createLeague(league: InsertLeague): Promise<League> {
    const [newLeague] = await db
      .insert(leagues)
      .values(league)
      .returning();
    return newLeague;
  }

  // Match methods
  async getAllMatches(): Promise<Match[]> {
    return db.select().from(matches);
  }

  async getMatchById(id: number): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, id));
    return match;
  }

  async getMatchesByLeague(leagueId: number): Promise<Match[]> {
    return db
      .select()
      .from(matches)
      .where(eq(matches.leagueId, leagueId));
  }

  async getUpcomingMatches(limit: number = 10): Promise<Match[]> {
    const now = new Date();
    return db
      .select()
      .from(matches)
      .where(
        and(
          gte(matches.startTime, now),
          eq(matches.isCompleted, false)
        )
      )
      .orderBy(matches.startTime)
      .limit(limit);
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db
      .insert(matches)
      .values({
        ...match,
        isCompleted: false,
        result: null
      })
      .returning();
    return newMatch;
  }

  // Prediction methods
  async getAllPredictions(): Promise<Prediction[]> {
    return db.select().from(predictions);
  }

  async getPredictionById(id: number): Promise<Prediction | undefined> {
    const [prediction] = await db
      .select()
      .from(predictions)
      .where(eq(predictions.id, id));
    return prediction;
  }

  async getPredictionsByMatch(matchId: number): Promise<Prediction[]> {
    return db
      .select()
      .from(predictions)
      .where(eq(predictions.matchId, matchId));
  }

  async getFreePredictions(limit: number = 10): Promise<Prediction[]> {
    return db
      .select()
      .from(predictions)
      .where(eq(predictions.isPremium, false))
      .limit(limit);
  }

  async getPremiumPredictions(limit: number = 10): Promise<Prediction[]> {
    return db
      .select()
      .from(predictions)
      .where(eq(predictions.isPremium, true))
      .limit(limit);
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [newPrediction] = await db
      .insert(predictions)
      .values({
        ...prediction,
        isCorrect: null
      })
      .returning();
    return newPrediction;
  }

  // User Prediction methods
  async getUserPredictions(userId: number): Promise<UserPrediction[]> {
    return db
      .select()
      .from(userPredictions)
      .where(eq(userPredictions.userId, userId));
  }

  async saveUserPrediction(userPrediction: InsertUserPrediction): Promise<UserPrediction> {
    const [newUserPrediction] = await db
      .insert(userPredictions)
      .values(userPrediction)
      .returning();
    return newUserPrediction;
  }

  async toggleSavedPrediction(userId: number, predictionId: number): Promise<UserPrediction> {
    const [existing] = await db
      .select()
      .from(userPredictions)
      .where(
        and(
          eq(userPredictions.userId, userId),
          eq(userPredictions.predictionId, predictionId)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(userPredictions)
        .set({ isSaved: !existing.isSaved })
        .where(eq(userPredictions.id, existing.id))
        .returning();
      return updated;
    } else {
      return this.saveUserPrediction({
        userId,
        predictionId,
        isSaved: true,
        isInAccumulator: false
      });
    }
  }

  // Accumulator methods
  async getUserAccumulators(userId: number): Promise<Accumulator[]> {
    return db
      .select()
      .from(accumulators)
      .where(
        and(
          eq(accumulators.userId, userId),
          eq(accumulators.isActive, true)
        )
      );
  }

  async getAccumulatorById(id: number): Promise<Accumulator | undefined> {
    const [accumulator] = await db
      .select()
      .from(accumulators)
      .where(eq(accumulators.id, id));
    return accumulator;
  }

  async createAccumulator(accumulator: InsertAccumulator): Promise<Accumulator> {
    const [newAccumulator] = await db
      .insert(accumulators)
      .values({
        ...accumulator,
        isActive: true
      })
      .returning();
    return newAccumulator;
  }

  async addToAccumulator(accumulatorItem: InsertAccumulatorItem): Promise<AccumulatorItem> {
    const [newItem] = await db
      .insert(accumulatorItems)
      .values(accumulatorItem)
      .returning();
    return newItem;
  }

  async removeFromAccumulator(accumulatorId: number, predictionId: number): Promise<boolean> {
    const result = await db
      .delete(accumulatorItems)
      .where(
        and(
          eq(accumulatorItems.accumulatorId, accumulatorId),
          eq(accumulatorItems.predictionId, predictionId)
        )
      );
    
    return result.rowCount > 0;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
