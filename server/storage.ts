import { 
  users, 
  sports, 
  leagues, 
  matches, 
  predictions, 
  userPredictions, 
  accumulators, 
  accumulatorItems,
  fantasyTeams,
  footballPlayers,
  fantasyTeamPlayers,
  fantasyContests,
  fantasyGameweeks,
  playerGameweekStats,
  fantasyContestEntries,
  pointsTransactions,
  notifications,
  pushTokens,
  badges,
  userBadges,
  leaderboards,
  leaderboardEntries,
  referrals,
  newsArticles,
  userNewsPreferences,
  userSavedNews,
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
  type FantasyTeam,
  type InsertFantasyTeam,
  type FootballPlayer,
  type InsertFootballPlayer,
  type FantasyTeamPlayer,
  type InsertFantasyTeamPlayer,
  type FantasyContest,
  type InsertFantasyContest,
  type FantasyGameweek,
  type InsertFantasyGameweek,
  type FantasyContestEntry,
  type InsertFantasyContestEntry,
  type PlayerGameweekStat,
  type InsertPlayerGameweekStat,
  type PointsTransaction,
  type InsertPointsTransaction,
  type Notification,
  type InsertNotification,
  type PushToken,
  type InsertPushToken,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type Leaderboard,
  type InsertLeaderboard,
  type LeaderboardEntry,
  type InsertLeaderboardEntry,
  type Referral,
  type InsertReferral,
  type NewsArticle,
  type InsertNewsArticle,
  type UserNewsPreferences,
  type InsertUserNewsPreferences,
  type UserSavedNews,
  type InsertUserSavedNews,
  subscriptionTiers
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, desc, and, gte, sql, or, not, inArray, like } from "drizzle-orm";
import { db, pool } from "./db";
import WebSocket from "ws";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(userId: number, tier: string): Promise<User>;
  updateUserStripeInfo(userId: number, info: { stripeCustomerId?: string, stripeSubscriptionId?: string }): Promise<User>;
  updateUserNotificationSettings(userId: number, settings: any): Promise<User>;
  updateUserPreferences(userId: number, preferences: any): Promise<User>;
  updateUserOnboardingStatus(userId: number, status: string, lastStep: number): Promise<User>;
  updateLastLogin(userId: number): Promise<User>;
  verifyEmail(userId: number): Promise<User>;
  setPasswordResetToken(userId: number, token: string, expires: Date): Promise<User>;
  resetPassword(userId: number, newHashedPassword: string): Promise<User>;
  
  // Football Player methods
  getAllFootballPlayers(limit?: number, offset?: number, filters?: any): Promise<FootballPlayer[]>;
  getFootballPlayerById(id: number): Promise<FootballPlayer | undefined>;
  searchFootballPlayers(query: string, position?: string, team?: string, limit?: number): Promise<FootballPlayer[]>;
  getPlayerSeasonStats(playerId: number): Promise<import("@shared/player-interfaces").PlayerSeasonStats | null>;
  getPlayerRecentMatches(playerId: number, limit?: number): Promise<import("@shared/player-interfaces").PlayerMatchStats[]>;
  createFootballPlayer(player: InsertFootballPlayer): Promise<FootballPlayer>;
  updateFootballPlayerStats(id: number, stats: Partial<FootballPlayer>): Promise<FootballPlayer>;
  updateUserFantasyPoints(userId: number, points: number): Promise<User>;
  
  // 2FA methods
  enableTwoFactor(userId: number, secret: string, phoneNumber: string): Promise<User>;
  disableTwoFactor(userId: number): Promise<User>;
  verifyTwoFactorCode(userId: number, code: string): Promise<boolean>;
  
  // IMEI and device tracking
  updateUserDeviceImei(userId: number, imei: string): Promise<User>;
  getUserByDeviceImei(imei: string): Promise<User | undefined>;
  
  // Referral methods
  getUserReferrals(userId: number): Promise<Referral[]>;
  getReferralById(id: number): Promise<Referral | undefined>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferralStatus(id: number, status: string): Promise<Referral>;
  getUserReferralStats(userId: number): Promise<{ 
    totalReferrals: number, 
    pendingReferrals: number, 
    completedReferrals: number,
    totalRewards: number 
  }>;
  
  getReferralLeaderboard(limit?: number): Promise<Array<{
    userId: number;
    username: string;
    totalReferrals: number;
    completedReferrals: number;
    tier: string;
    rank: number;
  }>>;
  
  // Sport & League methods
  getAllSports(): Promise<Sport[]>;
  getActiveSports(): Promise<Sport[]>;
  createSport(sport: InsertSport): Promise<Sport>;
  getAllLeagues(): Promise<League[]>;
  getLeaguesBySport(sportId: number): Promise<League[]>;
  createLeague(league: InsertLeague): Promise<League>;
  
  // Match methods
  getAllMatches(): Promise<Match[]>;
  getCompletedMatches(): Promise<Match[]>;
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
  getUserSavedPredictions(userId: number): Promise<UserPrediction[]>;
  getUserAccumulatorSelections(userId: number): Promise<UserPrediction[]>;
  
  // Accumulator methods
  getUserAccumulators(userId: number): Promise<Accumulator[]>;
  getAccumulatorById(id: number): Promise<Accumulator | undefined>;
  createAccumulator(accumulator: InsertAccumulator): Promise<Accumulator>;
  addToAccumulator(accumulatorItem: InsertAccumulatorItem): Promise<AccumulatorItem>;
  removeFromAccumulator(accumulatorId: number, predictionId: number): Promise<boolean>;
  
  // Fantasy Football Team methods
  getUserFantasyTeams(userId: number): Promise<FantasyTeam[]>;
  getFantasyTeamById(id: number): Promise<FantasyTeam | undefined>;
  createFantasyTeam(team: InsertFantasyTeam): Promise<FantasyTeam>;
  updateFantasyTeam(id: number, data: Partial<InsertFantasyTeam>): Promise<FantasyTeam>;
  deleteFantasyTeam(id: number): Promise<boolean>;
  
  // Fantasy Team Players methods
  getFantasyTeamPlayers(teamId: number): Promise<FantasyTeamPlayer[]>;
  addPlayerToFantasyTeam(teamPlayer: InsertFantasyTeamPlayer): Promise<FantasyTeamPlayer>;
  removePlayerFromFantasyTeam: {
    (teamPlayerId: number): Promise<boolean>;
    (teamId: number, playerId: number): Promise<boolean>;
  };
  updateFantasyTeamPlayer(id: number, data: Partial<InsertFantasyTeamPlayer>): Promise<FantasyTeamPlayer>;
  resetFantasyTeamCaptains(teamId: number): Promise<boolean>;
  getFantasyPlayersByPosition(position: string): Promise<FootballPlayer[]>;
  getAllFantasyPlayers(limit?: number): Promise<FootballPlayer[]>;
  

  
  // Fantasy Contest methods
  getAllFantasyContests(limit?: number, status?: string, tier?: string): Promise<FantasyContest[]>;
  getFreeFantasyContests(limit?: number, status?: string): Promise<FantasyContest[]>;
  getPremiumFantasyContests(limit?: number, status?: string): Promise<FantasyContest[]>;
  getFantasyContestById(id: number): Promise<FantasyContest | undefined>;
  getUserFantasyContests(userId: number): Promise<FantasyContest[]>;
  createFantasyContest(contest: InsertFantasyContest): Promise<FantasyContest>;
  updateFantasyContestStatus(id: number, status: string): Promise<FantasyContest>;
  
  // Fantasy Gameweek methods
  getGameweeksByContestId(contestId: number): Promise<FantasyGameweek[]>;
  getGameweekById(id: number): Promise<FantasyGameweek | undefined>;
  createGameweek(gameweek: InsertFantasyGameweek): Promise<FantasyGameweek>;
  updateGameweekStatus(id: number, status: string): Promise<FantasyGameweek>;
  
  // Fantasy Contest Entry methods
  getContestEntries(contestId: number): Promise<FantasyContestEntry[]>;
  getUserContestEntries(userId: number): Promise<FantasyContestEntry[]>;
  getContestEntryById(id: number): Promise<FantasyContestEntry | undefined>;
  createContestEntry(entry: InsertFantasyContestEntry): Promise<FantasyContestEntry>;
  updateContestEntryScore(id: number, score: number, rank?: number): Promise<FantasyContestEntry>;
  awardContestPrizes(contestId: number): Promise<boolean>;
  
  // Player Gameweek Stats methods
  getPlayerGameweekStats(playerId: number, gameweekId: number): Promise<PlayerGameweekStat | undefined>;
  createPlayerGameweekStats(stats: InsertPlayerGameweekStat): Promise<PlayerGameweekStat>;
  updatePlayerGameweekStats(id: number, stats: Partial<InsertPlayerGameweekStat>): Promise<PlayerGameweekStat>;
  calculateGameweekPoints(gameweekId: number): Promise<boolean>;
  
  // Points Transaction methods
  getUserPointsTransactions(userId: number, limit?: number): Promise<PointsTransaction[]>;
  createPointsTransaction(transaction: InsertPointsTransaction): Promise<PointsTransaction>;
  getPointsLeaderboard(limit?: number): Promise<{userId: number, username: string, points: number}[]>;
  
  // Notification system methods
  getUserNotifications(userId: number, limit?: number): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // WebSocket client management
  registerWebSocketClient(userId: number, ws: WebSocket): Promise<void>;
  unregisterWebSocketClient(userId: number, ws: WebSocket): Promise<void>;
  notifyUserViaWebSocket(userId: number, payload: any): Promise<void>;
  
  // Push token methods
  getUserPushTokens(userId: number): Promise<PushToken[]>;
  getPushTokenById(id: number): Promise<PushToken | undefined>;
  createPushToken(token: InsertPushToken): Promise<PushToken>;
  deactivatePushToken(id: number): Promise<boolean>;
  registerPushToken(userId: number, token: string, platform: string, deviceName?: string): Promise<PushToken>;
  sendPushNotification(userId: number, title: string, body: string, data?: any): Promise<boolean>;
  
  // Badge methods
  getAllBadges(): Promise<Badge[]>;
  getBadgeById(id: number): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: number, data: Partial<InsertBadge>): Promise<Badge | undefined>;
  deleteBadge(id: number): Promise<boolean>;
  getUserBadges(userId: number): Promise<UserBadge[]>;
  awardBadgeToUser(userBadge: InsertUserBadge): Promise<UserBadge>;
  markBadgeAsViewed(userId: number, badgeId: number): Promise<boolean>;
  
  // Leaderboard methods
  getAllLeaderboards(): Promise<Leaderboard[]>;
  getLeaderboardWithEntries(id: number): Promise<{leaderboard: Leaderboard, entries: LeaderboardEntry[]} | undefined>;
  getUserLeaderboardEntries(userId: number): Promise<LeaderboardEntry[]>;
  createLeaderboard(leaderboard: InsertLeaderboard): Promise<Leaderboard>;
  updateLeaderboard(id: number, data: Partial<InsertLeaderboard>): Promise<Leaderboard | undefined>;
  deleteLeaderboard(id: number): Promise<boolean>;
  updateAllLeaderboards(): Promise<void>;
  
  // News Article methods
  getAllNewsArticles(limit?: number, offset?: number): Promise<NewsArticle[]>;
  getNewsArticleById(id: number): Promise<NewsArticle | undefined>;
  getNewsArticlesByType(type: string, limit?: number): Promise<NewsArticle[]>;
  getNewsArticlesBySport(sportId: number, limit?: number): Promise<NewsArticle[]>;
  getNewsArticlesByLeague(leagueId: number, limit?: number): Promise<NewsArticle[]>;
  searchNewsArticles(query: string, limit?: number): Promise<NewsArticle[]>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  updateNewsArticle(id: number, data: Partial<InsertNewsArticle>): Promise<NewsArticle>;
  deleteNewsArticle(id: number): Promise<boolean>;
  
  // User News Preferences methods
  getUserNewsPreferences(userId: number): Promise<UserNewsPreferences | undefined>;
  createUserNewsPreferences(prefs: InsertUserNewsPreferences): Promise<UserNewsPreferences>;
  updateUserNewsPreferences(userId: number, prefs: Partial<InsertUserNewsPreferences>): Promise<UserNewsPreferences>;
  
  // User Saved News methods
  getUserSavedNews(userId: number): Promise<UserSavedNews[]>;
  saveNewsArticle(data: InsertUserSavedNews): Promise<UserSavedNews>;
  markNewsArticleAsRead(userId: number, articleId: number): Promise<UserSavedNews>;
  unsaveNewsArticle(userId: number, articleId: number): Promise<boolean>;
  
  // Personalized News Feed
  getPersonalizedNewsFeed(userId: number, limit?: number, offset?: number): Promise<NewsArticle[]>;
  
  // Fantasy Football methods
  getAllFantasyContests(limit?: number, status?: string, tier?: string): Promise<FantasyContest[]>;
  getFreeFantasyContests(limit?: number, status?: string): Promise<FantasyContest[]>;
  getPremiumFantasyContests(limit?: number, status?: string): Promise<FantasyContest[]>;
  getFantasyContestById(id: number): Promise<FantasyContest | undefined>;
  createFantasyContest(contest: InsertFantasyContest): Promise<FantasyContest>;
  getFantasyTeamById(id: number): Promise<FantasyTeam | undefined>;
  getUserContestEntries(userId: number): Promise<FantasyContestEntry[]>;
  createContestEntry(entry: InsertFantasyContestEntry): Promise<FantasyContestEntry>;
  getContestLeaderboard(contestId: number): Promise<FantasyContestEntry[]>;
  updateFantasyContestStatus(id: number, status: string): Promise<FantasyContest | null>;
  
  // Player statistics methods
  getPlayerSeasonStats(playerId: number): Promise<import("@shared/player-interfaces").PlayerSeasonStats | undefined>;
  getPlayerMatchStats(playerId: number): Promise<import("@shared/player-interfaces").PlayerMatchStats[]>;
  getAllPlayerSeasonStats(): Promise<import("@shared/player-interfaces").PlayerSeasonStats[]>;
  
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
  
  // Fantasy football tables
  private fantasyTeamsMap: Map<number, FantasyTeam>;
  private footballPlayersMap: Map<number, FootballPlayer>;
  private fantasyTeamPlayersMap: Map<number, FantasyTeamPlayer>;
  private fantasyContestsMap: Map<number, FantasyContest>;
  private fantasyGameweeksMap: Map<number, FantasyGameweek>;
  private playerGameweekStatsMap: Map<number, PlayerGameweekStat>;
  private fantasyContestEntriesMap: Map<number, FantasyContestEntry>;
  private pointsTransactionsMap: Map<number, PointsTransaction>;
  
  // Notification system
  private notificationsMap: Map<number, Notification>;
  private pushTokensMap: Map<number, PushToken>;
  
  // Gamification system
  private badgesMap: Map<number, Badge>;
  private userBadgesMap: Map<number, UserBadge>;
  private leaderboardsMap: Map<number, Leaderboard>;
  private leaderboardEntriesMap: Map<number, LeaderboardEntry>;
  
  // Referral system
  private referralsMap: Map<number, Referral>;
  
  // News system
  private newsArticlesMap: Map<number, NewsArticle>;
  private userNewsPreferencesMap: Map<number, UserNewsPreferences>;
  private userSavedNewsMap: Map<number, UserSavedNews>;
  
  // Player comparison data from API
  private playerSeasonStatsMap: Map<number, import("@shared/player-interfaces").PlayerSeasonStats>;
  private playerMatchStatsMap: Map<number, import("@shared/player-interfaces").PlayerMatchStats[]>;
  
  // Connected websocket clients
  private wsClients: Map<number, WebSocket[]> = new Map();
  
  sessionStore: session.SessionStore;
  
  // ID counters for entities
  private userIdCounter: number = 1;
  private sportIdCounter: number = 1;
  private leagueIdCounter: number = 1;
  private matchIdCounter: number = 1;
  private predictionIdCounter: number = 1;
  private userPredictionIdCounter: number = 1;
  private accumulatorIdCounter: number = 1;
  private accumulatorItemIdCounter: number = 1;
  
  // Fantasy football ID counters
  private fantasyTeamIdCounter: number = 1;
  private footballPlayerIdCounter: number = 1;
  private fantasyTeamPlayerIdCounter: number = 1;
  private fantasyContestIdCounter: number = 1;
  private fantasyGameweekIdCounter: number = 1;
  private playerGameweekStatIdCounter: number = 1;
  private fantasyContestEntryIdCounter: number = 1;
  private pointsTransactionIdCounter: number = 1;
  
  // Notification system ID counters
  private notificationIdCounter: number = 1;
  private pushTokenIdCounter: number = 1;
  
  // Gamification system ID counters
  private badgeIdCounter: number = 1;
  private userBadgeIdCounter: number = 1;
  private leaderboardIdCounter: number = 1;
  private leaderboardEntryIdCounter: number = 1;
  
  // Referral system ID counters
  private referralIdCounter: number = 1;
  
  // News system ID counters
  private newsArticleIdCounter: number = 1;
  private userNewsPreferencesIdCounter: number = 1;
  private userSavedNewsIdCounter: number = 1;
  
  constructor() {
    this.usersMap = new Map();
    this.sportsMap = new Map();
    this.leaguesMap = new Map();
    this.matchesMap = new Map();
    this.predictionsMap = new Map();
    this.userPredictionsMap = new Map();
    this.accumulatorsMap = new Map();
    this.accumulatorItemsMap = new Map();
    
    // Initialize fantasy football maps
    this.fantasyTeamsMap = new Map();
    this.footballPlayersMap = new Map();
    this.fantasyTeamPlayersMap = new Map();
    this.fantasyContestsMap = new Map();
    this.fantasyGameweeksMap = new Map();
    this.playerGameweekStatsMap = new Map();
    this.fantasyContestEntriesMap = new Map();
    this.pointsTransactionsMap = new Map();
    
    // Initialize notification system maps
    this.notificationsMap = new Map();
    this.pushTokensMap = new Map();
    
    // Initialize gamification system maps
    this.badgesMap = new Map();
    this.userBadgesMap = new Map();
    this.leaderboardsMap = new Map();
    this.leaderboardEntriesMap = new Map();
    
    // Initialize referral system map
    this.referralsMap = new Map();
    
    // Initialize news system maps
    this.newsArticlesMap = new Map();
    this.userNewsPreferencesMap = new Map();
    this.userSavedNewsMap = new Map();
    
    // Initialize player comparison data maps
    this.playerSeasonStatsMap = new Map();
    this.playerMatchStatsMap = new Map();
    
    // Include a sample referral for demonstration
    const sampleReferral: Referral = {
      id: 1,
      status: 'pending',
      referrerId: 1, // Assigned to the first user
      referredId: 2, // Will be created later
      createdAt: new Date(),
      rewardAmount: 0,
      completedAt: null,
      rewardDate: null
    };
    this.referralsMap.set(1, sampleReferral);
    this.referralIdCounter = 2; // Next ID to use
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    // Initialize with sample data
    this.initializeSampleData();
    
    // Initialize with real player data from CSV
    this.initializePlayerData();
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
      lastLoginAt: now,
      isActive: true,
      isEmailVerified: false,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      notificationToken: null,
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
  
  async updateUserNotificationSettings(userId: number, settings: any): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      notificationSettings: settings
    };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserPreferences(userId: number, preferences: any): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      userPreferences: preferences
    };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserOnboardingStatus(userId: number, status: string, lastStep: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      onboardingStatus: status,
      lastOnboardingStep: lastStep
    };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateLastLogin(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = {
      ...user,
      lastLoginAt: new Date()
    };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    // Find a user with the given verification token
    for (const [, user] of this.usersMap) {
      if (user.emailVerificationToken === token) {
        return user;
      }
    }
    return undefined;
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    // Find a user with the given password reset token
    for (const [, user] of this.usersMap) {
      if (user.passwordResetToken === token) {
        return user;
      }
    }
    return undefined;
  }
  
  async verifyEmail(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      isEmailVerified: true,
      emailVerificationToken: null
    };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      passwordResetToken: token,
      passwordResetExpires: expires
    };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async resetPassword(userId: number, newHashedPassword: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      password: newHashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserFantasyPoints(userId: number, points: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Create current fantasyPoints property if it doesn't exist
    const currentPoints = user.fantasyPoints || 0;
    
    const updatedUser = { 
      ...user, 
      fantasyPoints: currentPoints + points,
      // Increment contest stats if needed
      totalContestsEntered: user.totalContestsEntered || 0,
      totalContestsWon: user.totalContestsWon || 0
    };
    
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  // 2FA Methods
  async enableTwoFactor(userId: number, secret: string, phoneNumber: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = {
      ...user,
      isTwoFactorEnabled: true,
      twoFactorSecret: secret,
      phoneNumber: phoneNumber
    };
    
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async disableTwoFactor(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = {
      ...user,
      isTwoFactorEnabled: false,
      twoFactorSecret: null
    };
    
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async verifyTwoFactorCode(userId: number, code: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
      return false;
    }
    
    // This is a simplified implementation for testing purposes
    // In a real implementation, we would validate the TOTP code
    return code === '123456';
  }
  
  // Player statistics methods
  async getPlayerSeasonStats(playerId: number): Promise<import("@shared/player-interfaces").PlayerSeasonStats | undefined> {
    // First, check if we have real player data from CSV
    const realPlayerStats = this.playerSeasonStatsMap.get(playerId);
    if (realPlayerStats) {
      return realPlayerStats;
    }
    
    // If no real data found, check if we have a player in the football players list
    const player = this.getFootballPlayerById(playerId);
    if (player) {
      // Create a player season stats object based on the football player data
      const stats: import("@shared/player-interfaces").PlayerSeasonStats = {
        playerId,
        season: new Date().getFullYear().toString(),
        competition: null,
        team: player.team,
        
        // Appearance stats
        appearances: player.appearances || 0,
        minutesPlayed: player.minutesPlayed || 0,
        captain: false,
        
        // Goal involvement
        goals: player.goals || 0,
        assists: player.assists || 0,
        
        // Disciplinary
        yellowCards: player.yellowCards || 0,
        redCards: player.redCards || 0,
        
        // Goalkeeper stats
        cleanSheets: player.cleanSheets || 0,
        goalsConceded: 0,
        
        // Basic stats
        passAccuracy: 75,
        
        // Additional info
        rating: player.rating || 6.5,
        fantasyPoints: player.fantasyPointsTotal || 0
      };
      
      return stats;
    }
    
    // If no data found, return undefined
    return undefined;
  }
  
  async getPlayerMatchStats(playerId: number): Promise<import("@shared/player-interfaces").PlayerMatchStats[]> {
    // Check if we have player match stats
    const matchStats = this.playerMatchStatsMap.get(playerId);
    if (matchStats && matchStats.length > 0) {
      return matchStats;
    }
    
    // If no match stats found, generate some placeholder stats
    const player = await this.getPlayerSeasonStats(playerId);
    if (player) {
      const generatedMatchStats: import("@shared/player-interfaces").PlayerMatchStats[] = [];
      const now = new Date();
      
      // Generate 5 match stats based on the season stats
      for (let i = 0; i < 5; i++) {
        const matchDate = new Date(now);
        matchDate.setDate(matchDate.getDate() - (i * 7)); // One match per week
        
        const minutesPlayed = player.appearances ? Math.round(player.minutesPlayed / player.appearances) : 90;
        
        // Scale down season stats for single match
        const goals = Math.random() > 0.7 ? 1 : 0;
        const assists = Math.random() > 0.8 ? 1 : 0;
        const yellowCard = Math.random() > 0.9;
        const redCard = Math.random() > 0.98;
        
        // Generate match stats
        generatedMatchStats.push({
          playerId,
          matchId: i + 1,
          matchDate,
          opponent: `Opponent FC ${i+1}`,
          homeOrAway: Math.random() > 0.5 ? 'home' : 'away',
          minutesPlayed,
          goals,
          assists,
          yellowCards: yellowCard ? 1 : 0,
          redCards: redCard ? 1 : 0,
          rating: 6 + (Math.random() * 3),
          fantasyPoints: minutesPlayed >= 60 ? 2 : 1 + (goals * 5) + (assists * 3)
        });
      }
      
      return generatedMatchStats;
    }
    
    // If no player data found, return empty array
    return [];
  }
  
  async getAllPlayerSeasonStats(): Promise<import("@shared/player-interfaces").PlayerSeasonStats[]> {
    // Return all player season stats from CSV
    return Array.from(this.playerSeasonStatsMap.values());
  }
  
  // Device tracking methods
  async updateUserDeviceImei(userId: number, imei: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Check if another user already has this IMEI
    const existingUser = await this.getUserByDeviceImei(imei);
    if (existingUser && existingUser.id !== userId) {
      throw new Error("This device is already registered to another user");
    }
    
    // Generate a referral code if the user doesn't have one
    const referralCode = user.referralCode || this.generateReferralCode(user.username);
    
    const updatedUser = {
      ...user,
      deviceImei: imei,
      referralCode
    };
    
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getUserByDeviceImei(imei: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      user => user.deviceImei === imei
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }
  
  async getAllReferrals(): Promise<Referral[]> {
    return Array.from(this.referralsMap.values());
  }
  
  async updateUserReferralCode(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const referralCode = this.generateReferralCode(user.username);
    const updatedUser = { ...user, referralCode };
    
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Referral Methods
  async getUserReferrals(userId: number): Promise<Referral[]> {
    return Array.from(this.referralsMap.values()).filter(
      referral => referral.referrerId === userId
    );
  }
  
  async getReferralById(id: number): Promise<Referral | undefined> {
    return this.referralsMap.get(id);
  }
  
  async createReferral(referral: InsertReferral): Promise<Referral> {
    const id = this.referralIdCounter++;
    const newReferral: Referral = {
      ...referral,
      id,
      createdAt: new Date(),
      rewardAmount: 0,
      completedAt: null,
      rewardDate: null,
      // Add support for tracking channel if provided
      channel: referral.channel || null,
      // Add support for UTM parameters if provided
      utmParameters: referral.utmParameters || null
    };
    
    this.referralsMap.set(id, newReferral);
    
    // Update the user's referral streak if this is a new referral
    const referrer = await this.getUser(referral.referrerId);
    if (referrer) {
      // Check if the user has made a referral in the last 7 days
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      
      // Only update if this is a fresh streak (no referral in the last week) or continuing streak
      if (!referrer.lastReferralDate || new Date(referrer.lastReferralDate) > lastWeek) {
        await this.usersMap.set(referrer.id, {
          ...referrer,
          referralStreak: (referrer.referralStreak || 0) + 1,
          lastReferralDate: today
        });
      } else {
        // It's been more than a week, reset streak
        await this.usersMap.set(referrer.id, {
          ...referrer,
          referralStreak: 1,
          lastReferralDate: today
        });
      }
    }
    
    return newReferral;
  }
  
  async updateReferralStatus(id: number, status: string): Promise<Referral> {
    const referral = this.referralsMap.get(id);
    if (!referral) throw new Error("Referral not found");
    
    const updatedReferral = {
      ...referral,
      status
    };
    
    // If the status is completed, award points to the referrer
    if (status === 'completed' && !referral.rewardDate) {
      const rewardAmount = 500; // Default reward amount
      const now = new Date();
      
      // Update the referral with reward info
      updatedReferral.rewardAmount = rewardAmount;
      updatedReferral.completedAt = now;
      updatedReferral.rewardDate = now;
      
      // Award points to the referrer
      await this.updateUserFantasyPoints(referral.referrerId, rewardAmount);
      
      // Create a points transaction
      await this.createPointsTransaction({
        userId: referral.referrerId,
        type: 'referral',
        amount: rewardAmount,
        description: 'Referral bonus',
        relatedId: id,
        relatedType: 'referral'
      });
      
      // Create notification for the referrer
      await this.createNotification({
        userId: referral.referrerId,
        type: 'referral',
        title: 'Referral Bonus',
        message: `You earned ${rewardAmount} points for a successful referral!`,
        isRead: false
      });
    }
    
    this.referralsMap.set(id, updatedReferral);
    return updatedReferral;
  }
  
  async getUserReferralStats(userId: number): Promise<{
    totalReferrals: number,
    pendingReferrals: number,
    completedReferrals: number,
    totalRewards: number,
    currentTier: string,
    nextTier: string | null,
    nextTierThreshold: number | null,
    progress: number,
    streakCount: number,
    lastReferralDate: Date | null,
    channelBreakdown: Record<string, number>,
    monthlyStats: Array<{ month: string, count: number }>,
    conversionRate: number,
    tierHistory: Array<{ tier: string, achievedAt: Date }>,
    perks: Array<{ name: string, description: string, tier: string, isUnlocked: boolean }>
  }> {
    const userReferrals = Array.from(this.referralsMap.values()).filter(
      referral => referral.referrerId === userId
    );
    
    // Basic stats
    const totalReferrals = userReferrals.length;
    const pendingReferrals = userReferrals.filter(r => r.status === 'pending').length;
    const completedReferrals = userReferrals.filter(r => r.status === 'completed').length;
    const totalRewards = userReferrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
    
    // Get the last referral date
    const sortedCompletedReferrals = userReferrals
      .filter(r => r.status === 'completed')
      .sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      });
    
    const lastReferralDate = sortedCompletedReferrals.length > 0 ? 
      sortedCompletedReferrals[0].completedAt : null;
    
    // Calculate referral streak
    let streakCount = 0;
    if (sortedCompletedReferrals.length > 0) {
      // Simple streak logic - check how many consecutive weeks with at least one referral
      const weekBuckets = new Set();
      sortedCompletedReferrals.forEach(ref => {
        if (ref.completedAt) {
          const date = new Date(ref.completedAt);
          const weekKey = `${date.getFullYear()}-${Math.floor(date.getDate() / 7)}`;
          weekBuckets.add(weekKey);
        }
      });
      streakCount = weekBuckets.size;
    }
    
    // Tier calculation logic
    const tiers = [
      { name: 'bronze', threshold: 1 },
      { name: 'silver', threshold: 5 },
      { name: 'gold', threshold: 10 },
      { name: 'platinum', threshold: 25 },
      { name: 'diamond', threshold: 50 }
    ];
    
    // Determine current tier
    let currentTier = 'none';
    let nextTier = null;
    let nextTierThreshold = null;
    let progress = 0;
    
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (completedReferrals >= tiers[i].threshold) {
        currentTier = tiers[i].name;
        
        // If we're not at max tier, calculate next tier
        if (i < tiers.length - 1) {
          nextTier = tiers[i + 1].name;
          nextTierThreshold = tiers[i + 1].threshold;
          progress = (completedReferrals / nextTierThreshold) * 100;
        } else {
          progress = 100; // Max tier reached
        }
        
        break;
      }
    }
    
    // If we're still at no tier but have some referrals, set progress toward bronze
    if (currentTier === 'none' && completedReferrals > 0) {
      nextTier = tiers[0].name;
      nextTierThreshold = tiers[0].threshold;
      progress = (completedReferrals / nextTierThreshold) * 100;
    } else if (currentTier === 'none') {
      // No referrals at all
      nextTier = tiers[0].name;
      nextTierThreshold = tiers[0].threshold;
      progress = 0;
    }
    
    // Channel breakdown
    const channelBreakdown: Record<string, number> = {};
    userReferrals.forEach(referral => {
      const channel = referral.channel || 'unknown';
      channelBreakdown[channel] = (channelBreakdown[channel] || 0) + 1;
    });
    
    // Calculate monthly stats
    const monthlyStats: Array<{ month: string, count: number }> = [];
    const monthMap: Record<string, number> = {};
    
    userReferrals.forEach(referral => {
      const date = new Date(referral.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthDisplayKey = `${monthName} ${date.getFullYear()}`;
      
      monthMap[monthDisplayKey] = (monthMap[monthDisplayKey] || 0) + 1;
    });
    
    Object.entries(monthMap).forEach(([month, count]) => {
      monthlyStats.push({ month, count });
    });
    
    // Sort monthly stats by date
    monthlyStats.sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      
      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });
    
    // Calculate conversion rate
    const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;
    
    // Generate tier history (simulated since we don't store this historically)
    const tierHistory = tiers
      .filter(tier => completedReferrals >= tier.threshold)
      .map((tier, index) => {
        // Simulate achieved dates based on chronological order
        const achievedAt = new Date();
        achievedAt.setMonth(achievedAt.getMonth() - (tiers.length - index));
        return {
          tier: tier.name,
          achievedAt
        };
      });
    
    // Referral program perks based on tier
    const perks = [
      {
        name: 'Welcome Bonus',
        description: 'Receive 200 points just for joining the referral program',
        tier: 'bronze',
        isUnlocked: currentTier !== 'none'
      },
      {
        name: 'Bonus Predictions',
        description: 'Get access to 3 premium predictions per week',
        tier: 'bronze',
        isUnlocked: ['bronze', 'silver', 'gold', 'platinum', 'diamond'].includes(currentTier)
      },
      {
        name: 'Early Access',
        description: 'Get predictions 1 hour before regular users',
        tier: 'silver',
        isUnlocked: ['silver', 'gold', 'platinum', 'diamond'].includes(currentTier)
      },
      {
        name: 'Double Points',
        description: 'Earn double points for all successful referrals',
        tier: 'gold',
        isUnlocked: ['gold', 'platinum', 'diamond'].includes(currentTier)
      },
      {
        name: 'Premium Access',
        description: 'Get 1 month of free premium membership',
        tier: 'platinum',
        isUnlocked: ['platinum', 'diamond'].includes(currentTier)
      },
      {
        name: 'VIP Status',
        description: 'Permanent VIP badge and special platform features',
        tier: 'diamond',
        isUnlocked: currentTier === 'diamond'
      }
    ];
    
    return {
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      totalRewards,
      currentTier,
      nextTier,
      nextTierThreshold,
      progress,
      streakCount,
      lastReferralDate,
      channelBreakdown,
      monthlyStats,
      conversionRate,
      tierHistory,
      perks
    };
  }
  
  // Get referral leaderboard
  async getReferralLeaderboard(limit: number = 10): Promise<Array<{
    userId: number;
    username: string;
    totalReferrals: number;
    completedReferrals: number;
    tier: string;
    rank: number;
  }>> {
    // Get all users with their referrals
    const users = Array.from(this.usersMap.values());
    const allReferrals = Array.from(this.referralsMap.values());
    
    // Count referrals for each user
    const referralCounts = users.map(user => {
      const userReferrals = allReferrals.filter(r => r.referrerId === user.id);
      const totalReferrals = userReferrals.length;
      const completedReferrals = userReferrals.filter(r => r.status === 'completed').length;
      
      // Determine tier
      let tier = 'none';
      if (completedReferrals >= 25) tier = 'platinum';
      else if (completedReferrals >= 10) tier = 'gold';
      else if (completedReferrals >= 5) tier = 'silver';
      else if (completedReferrals >= 1) tier = 'bronze';
      
      return {
        userId: user.id,
        username: user.username,
        totalReferrals,
        completedReferrals,
        tier
      };
    });
    
    // Sort by completed referrals in descending order
    const sortedLeaderboard = referralCounts
      .filter(entry => entry.totalReferrals > 0) // Only include users with at least one referral
      .sort((a, b) => {
        // First sort by completed referrals
        if (b.completedReferrals !== a.completedReferrals) {
          return b.completedReferrals - a.completedReferrals;
        }
        // If tie, sort by total referrals
        return b.totalReferrals - a.totalReferrals;
      });
    
    // Add rank
    const rankedLeaderboard = sortedLeaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
    // Return top N entries
    return rankedLeaderboard.slice(0, limit);
  }
  
  // Helper method to generate referral code (for both Memory and DB implementations)
  private generateReferralCode(username: string): string {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const usernamePart = username.substring(0, 3).toUpperCase();
    return `${usernamePart}-${randomPart}`;
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
  
  async getCompletedMatches(): Promise<Match[]> {
    return Array.from(this.matchesMap.values())
      .filter(match => match.isCompleted === true);
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
  
  async getUserSavedPredictions(userId: number): Promise<UserPrediction[]> {
    return Array.from(this.userPredictionsMap.values()).filter(
      up => up.userId === userId && up.isSaved === true
    );
  }
  
  async getUserAccumulatorSelections(userId: number): Promise<UserPrediction[]> {
    return Array.from(this.userPredictionsMap.values()).filter(
      up => up.userId === userId && up.isInAccumulator === true
    );
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
  
  // Fantasy Football Team methods
  async getUserFantasyTeams(userId: number): Promise<FantasyTeam[]> {
    return Array.from(this.fantasyTeamsMap.values()).filter(
      team => team.userId === userId
    );
  }
  
  async getFantasyTeamById(id: number): Promise<FantasyTeam | undefined> {
    return this.fantasyTeamsMap.get(id);
  }
  
  async createFantasyTeam(team: InsertFantasyTeam): Promise<FantasyTeam> {
    const id = this.fantasyTeamIdCounter++;
    const now = new Date();
    const newTeam: FantasyTeam = {
      ...team,
      id,
      totalPoints: 0,
      createdAt: now,
      updatedAt: now
    };
    this.fantasyTeamsMap.set(id, newTeam);
    return newTeam;
  }
  
  async updateFantasyTeam(id: number, data: Partial<InsertFantasyTeam>): Promise<FantasyTeam> {
    const team = await this.getFantasyTeamById(id);
    if (!team) throw new Error("Fantasy team not found");
    
    const now = new Date();
    const updatedTeam: FantasyTeam = {
      ...team,
      ...data,
      updatedAt: now
    };
    this.fantasyTeamsMap.set(id, updatedTeam);
    return updatedTeam;
  }
  
  async deleteFantasyTeam(id: number): Promise<boolean> {
    const team = await this.getFantasyTeamById(id);
    if (!team) return false;
    
    // Delete associated team players
    const teamPlayers = await this.getFantasyTeamPlayers(id);
    for (const player of teamPlayers) {
      this.fantasyTeamPlayersMap.delete(player.id);
    }
    
    // Delete team itself
    this.fantasyTeamsMap.delete(id);
    return true;
  }
  
  // Football Player methods
  async getAllFootballPlayers(limit: number = 20, offset: number = 0, filters: any = {}): Promise<FootballPlayer[]> {
    let players = Array.from(this.footballPlayersMap.values());
    
    // Apply filters if any
    if (filters.position) {
      players = players.filter(player => player.position === filters.position);
    }
    if (filters.team) {
      players = players.filter(player => player.team.includes(filters.team));
    }
    if (filters.league) {
      players = players.filter(player => player.league === filters.league);
    }
    if (filters.active !== undefined) {
      players = players.filter(player => player.active === filters.active);
    }
    
    return players.slice(offset, offset + limit);
  }
  
  async getFootballPlayerById(id: number): Promise<FootballPlayer | undefined> {
    return this.footballPlayersMap.get(id);
  }
  
  async searchFootballPlayers(query: string, position?: string, team?: string, limit: number = 20): Promise<FootballPlayer[]> {
    let players = Array.from(this.footballPlayersMap.values()).filter(
      player => player.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (position) {
      players = players.filter(player => player.position === position);
    }
    
    if (team) {
      players = players.filter(player => player.team.includes(team));
    }
    
    return players.slice(0, limit);
  }
  
  async createFootballPlayer(player: InsertFootballPlayer): Promise<FootballPlayer> {
    const id = this.footballPlayerIdCounter++;
    const now = new Date();
    const newPlayer: FootballPlayer = {
      ...player,
      id,
      active: true,
      appearances: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      cleanSheets: 0,
      minutesPlayed: 0,
      fantasyPointsTotal: 0,
      fantasyPointsAvg: 0,
      createdAt: now,
      updatedAt: now
    };
    this.footballPlayersMap.set(id, newPlayer);
    return newPlayer;
  }
  
  async updateFootballPlayerStats(id: number, stats: Partial<FootballPlayer>): Promise<FootballPlayer> {
    const player = await this.getFootballPlayerById(id);
    if (!player) throw new Error("Football player not found");
    
    const now = new Date();
    const updatedPlayer: FootballPlayer = {
      ...player,
      ...stats,
      updatedAt: now
    };
    
    // Calculate average points if appearances > 0
    if (updatedPlayer.appearances > 0) {
      updatedPlayer.fantasyPointsAvg = updatedPlayer.fantasyPointsTotal / updatedPlayer.appearances;
    }
    
    this.footballPlayersMap.set(id, updatedPlayer);
    return updatedPlayer;
  }
  
  // Player stats comparison methods
  async getPlayerSeasonStats(playerId: number): Promise<import("@shared/player-interfaces").PlayerSeasonStats | null> {
    try {
      // Check if the player exists
      const player = await this.getFootballPlayerById(playerId);
      
      if (!player) {
        return null;
      }
      
      // Check if we have real API data for this player
      const realPlayerData = this.playerSeasonStatsMap.get(playerId);
      
      if (realPlayerData) {
        // Return the real API data if available
        return realPlayerData;
      }
      
      // Get current season data
      const currentSeason = new Date().getFullYear().toString();
      
      // Create season stats object based on player data with better realistic values
      const seasonStats: import("@shared/player-interfaces").PlayerSeasonStats = {
        playerId: player.id,
        season: currentSeason,
        appearances: player.appearances || 0,
        games: player.appearances || 0,
        goals: player.goals || 0,
        assists: player.assists || 0,
        yellowCards: player.yellowCards || 0,
        redCards: player.redCards || 0,
        cleanSheets: player.cleanSheets || 0,
        minutesPlayed: player.minutesPlayed || 0,
        
        // More realistic stats based on position
        passAccuracy: player.position === 'midfielder' ? 85 : player.position === 'defender' ? 78 : 70,
        passesTotal: player.position === 'midfielder' ? 120 : player.position === 'defender' ? 90 : 50,
        passesKey: player.position === 'midfielder' ? 5 : player.position === 'forward' ? 3 : 1,
        
        // Defensive stats
        tackles: player.position === 'defender' ? 8 : player.position === 'midfielder' ? 5 : 1,
        tacklesTotal: player.position === 'defender' ? 10 : player.position === 'midfielder' ? 7 : 2,
        tacklesBlocks: player.position === 'defender' ? 3 : 1,
        tacklesInterceptions: player.position === 'defender' ? 4 : player.position === 'midfielder' ? 2 : 0,
        duelsTotal: player.position === 'defender' ? 15 : player.position === 'midfielder' ? 12 : 10,
        duelsWon: player.position === 'defender' ? 10 : player.position === 'midfielder' ? 8 : 6,
        
        // Attacking stats
        shotsTotal: player.position === 'forward' ? 4 * player.appearances : player.position === 'midfielder' ? 2 * player.appearances : player.appearances / 2,
        shotsOnTarget: player.position === 'forward' ? 2 * player.appearances : player.position === 'midfielder' ? player.appearances : player.appearances / 4,
        dribblesAttempts: player.position === 'forward' ? 8 : player.position === 'midfielder' ? 6 : 2,
        dribblesSuccess: player.position === 'forward' ? 5 : player.position === 'midfielder' ? 4 : 1,
        
        // Advanced metrics
        xG: parseFloat((player.goals * 1.1).toFixed(2)),
        xA: parseFloat((player.assists * 1.2).toFixed(2)),
        
        // Additional info
        rating: 6.5 + (player.fantasyPointsAvg / 20),
        form: this.getPlayerFormDescription(player),
        fantasyPoints: player.fantasyPointsTotal || 0,
        injury: null // No injuries by default
      };
      
      return seasonStats;
    } catch (error) {
      console.error("Error getting player season stats:", error);
      return null;
    }
  }
  
  private getPlayerFormDescription(player: FootballPlayer): string {
    // Logic to determine player form based on points average and player metrics
    const formOptions = [
      "Excellent form, consistently delivering strong performances",
      "Good recent performances with high influence in matches",
      "Average form with occasional standout games",
      "Inconsistent form, showing glimpses of quality",
      "Below average form, struggling to make an impact"
    ];
    
    // Simple selection based on fantasy points average
    const pointsAvg = player.fantasyPointsAvg || 0;
    
    if (pointsAvg > 8) return formOptions[0];
    if (pointsAvg > 6) return formOptions[1];
    if (pointsAvg > 4) return formOptions[2];
    if (pointsAvg > 2) return formOptions[3];
    return formOptions[4];
  }
  
  async getPlayerRecentMatches(playerId: number, limit = 5): Promise<import("@shared/player-interfaces").PlayerMatchStats[]> {
    try {
      // Check if player exists
      const player = await this.getFootballPlayerById(playerId);
      
      if (!player) {
        return [];
      }
      
      // Check if we have real match data for this player
      const realMatchData = this.playerMatchStatsMap.get(playerId);
      
      if (realMatchData && realMatchData.length > 0) {
        // Return real match data if available (limited to the requested count)
        return realMatchData.slice(0, limit);
      }
      
      // Generate realistic match data if real data is not available
      const recentMatches: import("@shared/player-interfaces").PlayerMatchStats[] = [];
      
      // Generate matches with realistic data based on player position and attributes
      const now = new Date();
      
      for (let i = 0; i < limit; i++) {
        const matchDate = new Date(now);
        matchDate.setDate(matchDate.getDate() - (i * 7)); // One match per week
        
        const homeOrAway = Math.random() > 0.5 ? 'home' : 'away';
        const opponents = ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Tottenham', 
                         'Manchester United', 'Everton', 'Newcastle', 'Leicester', 'Wolves'];
        const opponent = opponents[Math.floor(Math.random() * opponents.length)];
        
        // Goals more likely for forwards, assists for midfielders, clean sheets for goalkeepers/defenders
        let goals = 0;
        let assists = 0;
        let cleanSheet = false;
        let yellowCards = 0;
        let redCards = 0;
        
        // Position-based stat generation
        if (player.position === 'forward') {
          goals = Math.random() > 0.6 ? Math.floor(Math.random() * 2) + 1 : 0;
          assists = Math.random() > 0.8 ? 1 : 0;
        } else if (player.position === 'midfielder') {
          goals = Math.random() > 0.75 ? 1 : 0;
          assists = Math.random() > 0.65 ? Math.floor(Math.random() * 2) + 1 : 0;
        } else if (player.position === 'defender') {
          goals = Math.random() > 0.9 ? 1 : 0;
          assists = Math.random() > 0.8 ? 1 : 0;
          cleanSheet = Math.random() > 0.6;
        } else if (player.position === 'goalkeeper') {
          cleanSheet = Math.random() > 0.6;
        }
        
        // Card probability
        yellowCards = Math.random() > 0.85 ? 1 : 0;
        redCards = Math.random() > 0.95 ? 1 : 0;
        
        // Random minutes played (more likely to be 90, but could be less due to substitution or injury)
        const minutesPlayed = Math.random() > 0.8 ? Math.floor(Math.random() * 30) + 60 : 90;
        
        // Calculate fantasy points
        let fantasyPoints = minutesPlayed >= 60 ? 2 : 1; // minutes played points
        fantasyPoints += goals * (player.position === 'forward' ? 4 : player.position === 'midfielder' ? 5 : 6); // goals
        fantasyPoints += assists * 3; // assists
        fantasyPoints += cleanSheet && (player.position === 'goalkeeper' || player.position === 'defender') ? 4 : 0; // clean sheet
        fantasyPoints -= yellowCards * 1; // yellow card
        fantasyPoints -= redCards * 3; // red card
        
        // Player rating (1-10 scale)
        let rating = 6; // base rating
        rating += goals * 0.8;
        rating += assists * 0.5;
        rating += cleanSheet ? 0.5 : 0;
        rating -= yellowCards * 0.3;
        rating -= redCards * 1.5;
        
        // Ensure rating is within bounds
        rating = Math.max(3, Math.min(10, rating));
        rating = parseFloat(rating.toFixed(1));
        
        // Generate position-specific key stats
        const keyStats: Record<string, any> = {};
        
        if (player.position === 'goalkeeper') {
          keyStats.saves = Math.floor(Math.random() * 6) + 1;
          keyStats.penaltySaved = Math.random() > 0.9 ? 1 : 0;
          keyStats.passAccuracy = Math.floor(Math.random() * 20) + 70;
        } else if (player.position === 'defender') {
          keyStats.tackles = Math.floor(Math.random() * 8) + 2;
          keyStats.interceptions = Math.floor(Math.random() * 6) + 1;
          keyStats.clearances = Math.floor(Math.random() * 10) + 2;
          keyStats.aerialDuelsWon = Math.floor(Math.random() * 8) + 1;
        } else if (player.position === 'midfielder') {
          keyStats.passAccuracy = Math.floor(Math.random() * 15) + 75;
          keyStats.chancesCreated = Math.floor(Math.random() * 4) + 1;
          keyStats.distanceCovered = (Math.random() * 3 + 9).toFixed(1) + 'km';
          keyStats.dribbles = Math.floor(Math.random() * 5) + 1;
        } else if (player.position === 'forward') {
          keyStats.shotsOnTarget = Math.floor(Math.random() * 4) + (goals > 0 ? goals : 0);
          keyStats.shotsTotal = keyStats.shotsOnTarget + Math.floor(Math.random() * 4);
          keyStats.dribbles = Math.floor(Math.random() * 5) + 1;
          keyStats.aerialDuelsWon = Math.floor(Math.random() * 5) + 1;
        }
        
        recentMatches.push({
          playerId,
          matchId: i + 1,
          matchDate,
          opponent,
          homeOrAway,
          minutesPlayed,
          goals,
          assists,
          yellowCards,
          redCards,
          cleanSheet,
          rating,
          fantasyPoints,
          keyStats
        });
      }
      
      return recentMatches;
    } catch (error) {
      console.error("Error getting player recent matches:", error);
      return [];
    }
  }
  
  // Fantasy Team Players methods
  async getFantasyTeamPlayers(teamId: number): Promise<FantasyTeamPlayer[]> {
    return Array.from(this.fantasyTeamPlayersMap.values()).filter(
      teamPlayer => teamPlayer.teamId === teamId
    );
  }
  
  async addPlayerToFantasyTeam(teamPlayer: InsertFantasyTeamPlayer): Promise<FantasyTeamPlayer> {
    const id = this.fantasyTeamPlayerIdCounter++;
    const now = new Date();
    const newTeamPlayer: FantasyTeamPlayer = {
      ...teamPlayer,
      id,
      addedAt: now
    };
    this.fantasyTeamPlayersMap.set(id, newTeamPlayer);
    return newTeamPlayer;
  }
  
  async updateFantasyTeamPlayer(id: number, data: Partial<InsertFantasyTeamPlayer>): Promise<FantasyTeamPlayer> {
    const teamPlayer = this.fantasyTeamPlayersMap.get(id);
    if (!teamPlayer) throw new Error("Fantasy team player not found");
    
    const updatedTeamPlayer: FantasyTeamPlayer = {
      ...teamPlayer,
      ...data
    };
    this.fantasyTeamPlayersMap.set(id, updatedTeamPlayer);
    return updatedTeamPlayer;
  }
  
  async removePlayerFromFantasyTeam(teamId: number, playerId: number): Promise<boolean> {
    const teamPlayer = Array.from(this.fantasyTeamPlayersMap.values()).find(
      tp => tp.teamId === teamId && tp.playerId === playerId
    );
    
    if (teamPlayer) {
      this.fantasyTeamPlayersMap.delete(teamPlayer.id);
      return true;
    }
    
    return false;
  }
  
  // Fantasy Contest methods
  async getAllFantasyContests(limit: number = 20, status?: string, tier?: string): Promise<FantasyContest[]> {
    let contests = Array.from(this.fantasyContestsMap.values());
    
    if (status) {
      contests = contests.filter(contest => contest.status === status);
    }
    
    if (tier) {
      contests = contests.filter(contest => contest.tier === tier);
    }
    
    // Sort by startDate descending (newest first)
    contests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    return contests.slice(0, limit);
  }
  
  async getFreeFantasyContests(limit: number = 20, status?: string): Promise<FantasyContest[]> {
    return this.getAllFantasyContests(limit, status, 'free');
  }
  
  async getPremiumFantasyContests(limit: number = 20, status?: string): Promise<FantasyContest[]> {
    return this.getAllFantasyContests(limit, status, 'premium');
  }
  
  async getFantasyContestById(id: number): Promise<FantasyContest | undefined> {
    return this.fantasyContestsMap.get(id);
  }
  
  async getUserFantasyContests(userId: number): Promise<FantasyContest[]> {
    // Get all contest entries by this user
    const userEntries = Array.from(this.fantasyContestEntriesMap.values())
      .filter(entry => entry.userId === userId);
    
    // Get the contests for these entries
    const contestIds = userEntries.map(entry => entry.contestId);
    const contests = Array.from(this.fantasyContestsMap.values())
      .filter(contest => contestIds.includes(contest.id));
    
    return contests;
  }
  
  async createFantasyContest(contest: InsertFantasyContest): Promise<FantasyContest> {
    const id = this.fantasyContestIdCounter++;
    const now = new Date();
    const newContest: FantasyContest = {
      ...contest,
      id,
      status: 'upcoming',
      playerCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.fantasyContestsMap.set(id, newContest);
    return newContest;
  }
  
  async updateFantasyContestStatus(id: number, status: string): Promise<FantasyContest> {
    const contest = await this.getFantasyContestById(id);
    if (!contest) throw new Error("Fantasy contest not found");
    
    const now = new Date();
    const updatedContest: FantasyContest = {
      ...contest,
      status,
      updatedAt: now
    };
    this.fantasyContestsMap.set(id, updatedContest);
    return updatedContest;
  }
  
  // Fantasy Gameweek methods
  async getGameweeksByContestId(contestId: number): Promise<FantasyGameweek[]> {
    return Array.from(this.fantasyGameweeksMap.values())
      .filter(gameweek => gameweek.contestId === contestId)
      .sort((a, b) => a.gameweekNumber - b.gameweekNumber);
  }
  
  async getGameweekById(id: number): Promise<FantasyGameweek | undefined> {
    return this.fantasyGameweeksMap.get(id);
  }
  
  async createGameweek(gameweek: InsertFantasyGameweek): Promise<FantasyGameweek> {
    const id = this.fantasyGameweekIdCounter++;
    const now = new Date();
    const newGameweek: FantasyGameweek = {
      ...gameweek,
      id,
      status: 'upcoming',
      createdAt: now,
      updatedAt: now
    };
    this.fantasyGameweeksMap.set(id, newGameweek);
    return newGameweek;
  }
  
  async updateGameweekStatus(id: number, status: string): Promise<FantasyGameweek> {
    const gameweek = await this.getGameweekById(id);
    if (!gameweek) throw new Error("Gameweek not found");
    
    const now = new Date();
    const updatedGameweek: FantasyGameweek = {
      ...gameweek,
      status,
      updatedAt: now
    };
    this.fantasyGameweeksMap.set(id, updatedGameweek);
    return updatedGameweek;
  }
  
  // Fantasy Contest Entry methods
  async getContestEntries(contestId: number): Promise<FantasyContestEntry[]> {
    return Array.from(this.fantasyContestEntriesMap.values())
      .filter(entry => entry.contestId === contestId)
      .sort((a, b) => (b.score || 0) - (a.score || 0)); // Sort by score descending
  }
  
  async getUserContestEntries(userId: number): Promise<FantasyContestEntry[]> {
    return Array.from(this.fantasyContestEntriesMap.values())
      .filter(entry => entry.userId === userId);
  }
  
  async getContestEntryById(id: number): Promise<FantasyContestEntry | undefined> {
    return this.fantasyContestEntriesMap.get(id);
  }
  
  async createContestEntry(entry: InsertFantasyContestEntry): Promise<FantasyContestEntry> {
    const id = this.fantasyContestEntryIdCounter++;
    const now = new Date();
    const newEntry: FantasyContestEntry = {
      ...entry,
      id,
      score: 0,
      rank: null,
      createdAt: now,
      updatedAt: now
    };
    this.fantasyContestEntriesMap.set(id, newEntry);
    
    // Update contest player count
    const contest = await this.getFantasyContestById(entry.contestId);
    if (contest) {
      await this.fantasyContestsMap.set(contest.id, {
        ...contest,
        playerCount: contest.playerCount + 1
      });
      
      // Update user stats
      const user = await this.getUser(entry.userId);
      if (user) {
        await this.updateUserFantasyPoints(entry.userId, 0); // Just to make sure fantasyPoints exists
        const updatedUser = { 
          ...user, 
          totalContestsEntered: (user.totalContestsEntered || 0) + 1
        };
        this.usersMap.set(entry.userId, updatedUser);
      }
    }
    
    return newEntry;
  }
  
  async updateContestEntryScore(id: number, score: number, rank?: number): Promise<FantasyContestEntry> {
    const entry = await this.getContestEntryById(id);
    if (!entry) throw new Error("Contest entry not found");
    
    const now = new Date();
    const updatedEntry: FantasyContestEntry = {
      ...entry,
      score,
      rank: rank || entry.rank,
      updatedAt: now
    };
    this.fantasyContestEntriesMap.set(id, updatedEntry);
    return updatedEntry;
  }
  
  async awardContestPrizes(contestId: number): Promise<boolean> {
    const contest = await this.getFantasyContestById(contestId);
    if (!contest) return false;
    
    // Only award prizes for completed contests
    if (contest.status !== 'completed') return false;
    
    // Get all entries for this contest, sorted by score
    const entries = await this.getContestEntries(contestId);
    if (entries.length === 0) return false;
    
    // Award points based on ranking
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rank = i + 1;
      
      // Update entry rank
      await this.updateContestEntryScore(entry.id, entry.score || 0, rank);
      
      // Award points based on rank
      let pointsAwarded = 0;
      
      if (rank === 1) {
        // 1st place: 100 points + bonus
        pointsAwarded = 100 + (contest.firstPlaceBonus || 0);
        
        // Update user's won contests count
        const user = await this.getUser(entry.userId);
        if (user) {
          const updatedUser = { 
            ...user, 
            totalContestsWon: (user.totalContestsWon || 0) + 1
          };
          this.usersMap.set(entry.userId, updatedUser);
        }
      } 
      else if (rank === 2) {
        // 2nd place: 75 points
        pointsAwarded = 75;
      } 
      else if (rank === 3) {
        // 3rd place: 50 points
        pointsAwarded = 50;
      } 
      else if (rank <= 10) {
        // Top 10: 30 points
        pointsAwarded = 30;
      } 
      else if (rank <= 50) {
        // Top 50: 15 points
        pointsAwarded = 15;
      } 
      else if (rank <= 100) {
        // Top 100: 5 points
        pointsAwarded = 5;
      } 
      else {
        // Participation points
        pointsAwarded = 1;
      }
      
      if (pointsAwarded > 0) {
        // Add points transaction
        await this.createPointsTransaction({
          userId: entry.userId,
          points: pointsAwarded,
          type: 'contest_reward',
          description: `${rank}${this.getOrdinalSuffix(rank)} place in ${contest.name}`,
          relatedId: contestId
        });
        
        // Update user's total fantasy points
        await this.updateUserFantasyPoints(entry.userId, pointsAwarded);
      }
    }
    
    return true;
  }
  
  // Helper method for ordinal numbers
  private getOrdinalSuffix(i: number): string {
    const j = i % 10;
    const k = i % 100;
    if (j === 1 && k !== 11) {
      return "st";
    }
    if (j === 2 && k !== 12) {
      return "nd";
    }
    if (j === 3 && k !== 13) {
      return "rd";
    }
    return "th";
  }
  
  // Player Gameweek Stats methods
  async getPlayerGameweekStats(playerId: number, gameweekId: number): Promise<PlayerGameweekStat | undefined> {
    return Array.from(this.playerGameweekStatsMap.values()).find(
      stats => stats.playerId === playerId && stats.gameweekId === gameweekId
    );
  }
  
  async createPlayerGameweekStats(stats: InsertPlayerGameweekStat): Promise<PlayerGameweekStat> {
    const id = this.playerGameweekStatIdCounter++;
    const now = new Date();
    const newStats: PlayerGameweekStat = {
      ...stats,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.playerGameweekStatsMap.set(id, newStats);
    return newStats;
  }
  
  async updatePlayerGameweekStats(id: number, stats: Partial<InsertPlayerGameweekStat>): Promise<PlayerGameweekStat> {
    const existingStats = this.playerGameweekStatsMap.get(id);
    if (!existingStats) throw new Error("Player gameweek stats not found");
    
    const now = new Date();
    const updatedStats: PlayerGameweekStat = {
      ...existingStats,
      ...stats,
      updatedAt: now
    };
    this.playerGameweekStatsMap.set(id, updatedStats);
    return updatedStats;
  }
  
  async calculatePlayerPoints(stats: PlayerGameweekStat, playerTeam: string): Promise<number> {
    // Calculate points according to specified rules:
    // - Team wins: 3 points
    // - Player scores: 3 points
    // - Card (yellow or red): 5 points
    
    let points = 0;
    
    // Points for goals
    if (stats.goals > 0) {
      points += stats.goals * 3; // 3 points per goal
    }
    
    // Points for cards
    if (stats.yellowCards > 0) {
      points += stats.yellowCards * 5; // 5 points per yellow card
    }
    
    if (stats.redCard) {
      points += 5; // 5 points for red card
    }
    
    // Check if player's team won in this gameweek
    // We need to extract the match result from the gameweek fixtures
    const gameweek = await this.getGameweekById(stats.gameweekId);
    if (gameweek && gameweek.fixtures) {
      // This is a simplified check - in a real implementation,
      // we would need to match the player's team with fixture results
      const fixtures = gameweek.fixtures as any[];
      const teamFixture = fixtures.find((fixture: any) => 
        fixture.homeTeam === playerTeam || fixture.awayTeam === playerTeam
      );
      
      if (teamFixture) {
        const isHomeTeam = teamFixture.homeTeam === playerTeam;
        const result = teamFixture.result;
        
        // Check if player's team won
        if ((isHomeTeam && result === 'home') || (!isHomeTeam && result === 'away')) {
          points += 3; // 3 points for team win
        }
      }
    }
    
    return points;
  }
  
  async calculateGameweekPoints(gameweekId: number): Promise<boolean> {
    // Get the gameweek
    const gameweek = await this.getGameweekById(gameweekId);
    if (!gameweek) return false;
    
    // Gameweek must be completed to calculate points
    if (gameweek.status !== 'completed') return false;
    
    // Get all stats for this gameweek
    const allStats = Array.from(this.playerGameweekStatsMap.values())
      .filter(stats => stats.gameweekId === gameweekId);
    
    if (allStats.length === 0) return false;
    
    // Get all contest entries that include this gameweek's contest
    const contestEntries = Array.from(this.fantasyContestEntriesMap.values())
      .filter(entry => entry.contestId === gameweek.contestId);
    
    // For each entry, calculate their team's points for this gameweek
    for (const entry of contestEntries) {
      // Get the team
      const team = await this.getFantasyTeamById(entry.teamId);
      if (!team) continue;
      
      // Get all players in this team
      const teamPlayers = await this.getFantasyTeamPlayers(team.id);
      if (teamPlayers.length === 0) continue;
      
      let totalPoints = 0;
      
      // Calculate points for each player in the team
      for (const teamPlayer of teamPlayers) {
        const playerStats = allStats.find(stats => stats.playerId === teamPlayer.playerId);
        if (!playerStats) continue;
        
        // Get player details to determine team
        const player = await this.getFootballPlayerById(teamPlayer.playerId);
        if (!player) continue;
        
        // Calculate player points using our scoring system
        let playerPoints = await this.calculatePlayerPoints(playerStats, player.team);
        
        // Apply captain/vice captain multipliers
        if (teamPlayer.isCaptain) {
          playerPoints *= 2; // Double points for captain
        } else if (teamPlayer.isViceCaptain) {
          playerPoints *= 1.5; // 1.5x points for vice-captain
        }
        
        totalPoints += playerPoints;
      }
      
      // Update entry's score
      const currentScore = entry.score || 0;
      await this.updateContestEntryScore(entry.id, currentScore + totalPoints);
    }
    
    // After calculating all entry scores, check if this is the last gameweek
    // and award prizes if contest is now completed
    const contestGameweeks = await this.getGameweeksByContestId(gameweek.contestId);
    const allCompleted = contestGameweeks.every(gw => gw.status === 'completed');
    
    if (allCompleted) {
      // Mark contest as completed
      await this.updateFantasyContestStatus(gameweek.contestId, 'completed');
      
      // Award prizes
      await this.awardContestPrizes(gameweek.contestId);
    }
    
    return true;
  }
  
  // Points Transaction methods
  async getUserPointsTransactions(userId: number, limit: number = 50): Promise<PointsTransaction[]> {
    return Array.from(this.pointsTransactionsMap.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async createPointsTransaction(transaction: InsertPointsTransaction): Promise<PointsTransaction> {
    const id = this.pointsTransactionIdCounter++;
    const now = new Date();
    const newTransaction: PointsTransaction = {
      ...transaction,
      id,
      createdAt: now
    };
    this.pointsTransactionsMap.set(id, newTransaction);
    return newTransaction;
  }
  
  async getPointsLeaderboard(limit: number = 100): Promise<{userId: number, username: string, points: number}[]> {
    // Get all users with fantasy points
    const usersWithPoints = Array.from(this.usersMap.values())
      .filter(user => user.fantasyPoints && user.fantasyPoints > 0)
      .map(user => ({
        userId: user.id,
        username: user.username,
        points: user.fantasyPoints || 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
    
    return usersWithPoints;
  }
  
  // Notification system methods
  async getUserNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    return this.notificationsMap.get(id);
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const newNotification: Notification = {
      ...notification,
      id,
      read: false,
      timestamp: now,
    };
    this.notificationsMap.set(id, newNotification);
    
    // Send notification to connected WebSocket clients
    await this.notifyUserViaWebSocket(notification.userId, {
      type: 'notification',
      data: newNotification
    });
    
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notificationsMap.get(id);
    if (!notification) return false;
    
    notification.read = true;
    this.notificationsMap.set(id, notification);
    return true;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notificationsMap.values())
      .filter(notification => notification.userId === userId);
    
    for (const notification of userNotifications) {
      notification.read = true;
      this.notificationsMap.set(notification.id, notification);
    }
    
    return true;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    return this.notificationsMap.delete(id);
  }
  
  async deleteAllNotifications(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notificationsMap.values())
      .filter(notification => notification.userId === userId);
    
    for (const notification of userNotifications) {
      this.notificationsMap.delete(notification.id);
    }
    
    return true;
  }
  
  // WebSocket client management
  async registerWebSocketClient(userId: number, ws: WebSocket): Promise<void> {
    if (!this.wsClients.has(userId)) {
      this.wsClients.set(userId, []);
    }
    
    this.wsClients.get(userId)?.push(ws);
  }
  
  async unregisterWebSocketClient(userId: number, ws: WebSocket): Promise<void> {
    if (!this.wsClients.has(userId)) return;
    
    const clients = this.wsClients.get(userId) || [];
    const updatedClients = clients.filter(client => client !== ws);
    
    if (updatedClients.length === 0) {
      this.wsClients.delete(userId);
    } else {
      this.wsClients.set(userId, updatedClients);
    }
  }
  
  async notifyUserViaWebSocket(userId: number, payload: any): Promise<void> {
    const clients = this.wsClients.get(userId) || [];
    const message = JSON.stringify(payload);
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  // Push token methods for mobile and web notifications
  async getUserPushTokens(userId: number): Promise<PushToken[]> {
    return Array.from(this.pushTokensMap.values())
      .filter(token => token.userId === userId && token.isActive);
  }
  
  async getPushTokenById(id: number): Promise<PushToken | undefined> {
    return this.pushTokensMap.get(id);
  }
  
  async createPushToken(token: InsertPushToken): Promise<PushToken> {
    const id = this.pushTokenIdCounter++;
    const now = new Date();
    const newToken: PushToken = {
      ...token,
      id,
      isActive: true,
      createdAt: now,
      lastUsedAt: now,
    };
    this.pushTokensMap.set(id, newToken);
    return newToken;
  }
  
  async registerPushToken(userId: number, token: string, platform: string, deviceName?: string): Promise<PushToken> {
    // Check if user exists
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if token already exists for this user and platform
    const existingTokens = await this.getUserPushTokens(userId);
    const existingToken = existingTokens.find(
      t => t.token === token && t.platform === platform
    );
    
    if (existingToken) {
      // If token exists but is inactive, reactivate it
      if (!existingToken.isActive) {
        const updatedToken = {
          ...existingToken,
          isActive: true,
          lastUsedAt: new Date()
        };
        this.pushTokensMap.set(existingToken.id, updatedToken);
        return updatedToken;
      }
      
      // If token exists and is active, update the last used timestamp
      await this.updatePushTokenLastUsed(existingToken.id);
      return existingToken;
    }
    
    // Create a new token
    return this.createPushToken({
      userId,
      token,
      platform,
      deviceName
    });
  }
  
  async updatePushTokenLastUsed(id: number): Promise<boolean> {
    const token = this.pushTokensMap.get(id);
    if (!token) return false;
    
    token.lastUsedAt = new Date();
    this.pushTokensMap.set(id, token);
    return true;
  }
  
  async deactivatePushToken(id: number): Promise<boolean> {
    const token = this.pushTokensMap.get(id);
    if (!token) return false;
    
    token.isActive = false;
    this.pushTokensMap.set(id, token);
    return true;
  }
  
  async sendPushNotification(userId: number, title: string, body: string, data?: any): Promise<boolean> {
    try {
      // 1. Get user's active push tokens
      const tokens = await this.getUserPushTokens(userId);
      const activeTokens = tokens.filter(token => token.isActive);
      
      if (activeTokens.length === 0) {
        // No active tokens, fallback to creating an in-app notification
        await this.createNotification({
          userId,
          title,
          message: body,
          type: 'info',
          data
        });
        
        console.log(`Created in-app notification for user ${userId} (no push tokens)`);
        return false;
      }
      
      // 2. Send web socket notification if user is connected
      await this.notifyUserViaWebSocket(userId, {
        type: 'push_notification',
        title,
        body,
        data
      });
      
      // 3. Create in-app notification as well
      await this.createNotification({
        userId,
        title,
        message: body,
        type: 'info',
        data
      });
      
      // 4. In a real implementation, we would use Firebase Cloud Messaging for Android/iOS
      // or Web Push API for web browsers here
      console.log(`Sending push notification to user ${userId} with ${activeTokens.length} tokens`);
      
      // 5. Update lastUsedAt for each token
      for (const token of activeTokens) {
        await this.updatePushTokenLastUsed(token.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }
  
  async deactivateUserPushTokens(userId: number): Promise<boolean> {
    const userTokens = Array.from(this.pushTokensMap.values())
      .filter(token => token.userId === userId);
    
    for (const token of userTokens) {
      token.isActive = false;
      this.pushTokensMap.set(token.id, token);
    }
    
    return true;
  }

  // Badge methods
  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badgesMap.values());
  }
  
  async getBadgeById(id: number): Promise<Badge | undefined> {
    return this.badgesMap.get(id);
  }
  
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const id = this.badgeIdCounter++;
    const now = new Date();
    const newBadge: Badge = {
      ...badge,
      id,
      createdAt: now
    };
    this.badgesMap.set(id, newBadge);
    return newBadge;
  }
  
  async updateBadge(id: number, data: Partial<InsertBadge>): Promise<Badge | undefined> {
    const badge = await this.getBadgeById(id);
    if (!badge) return undefined;
    
    const updatedBadge: Badge = {
      ...badge,
      ...data
    };
    this.badgesMap.set(id, updatedBadge);
    return updatedBadge;
  }
  
  async deleteBadge(id: number): Promise<boolean> {
    if (!this.badgesMap.has(id)) return false;
    
    // Delete all user badges for this badge first
    const userBadges = Array.from(this.userBadgesMap.values())
      .filter(ub => ub.badgeId === id);
    
    for (const ub of userBadges) {
      this.userBadgesMap.delete(ub.id);
    }
    
    // Delete the badge itself
    this.badgesMap.delete(id);
    return true;
  }
  
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return Array.from(this.userBadgesMap.values())
      .filter(userBadge => userBadge.userId === userId);
  }
  
  async awardBadgeToUser(userBadge: InsertUserBadge): Promise<UserBadge> {
    // Check if user already has this badge
    const existing = Array.from(this.userBadgesMap.values()).find(
      ub => ub.userId === userBadge.userId && ub.badgeId === userBadge.badgeId
    );
    
    if (existing) {
      // If existing but at a lower tier, update it
      if (existing.tier !== userBadge.tier) {
        const updatedBadge: UserBadge = {
          ...existing,
          tier: userBadge.tier,
          isViewed: false,
          awardedAt: new Date()
        };
        this.userBadgesMap.set(existing.id, updatedBadge);
        
        // Create notification for badge upgrade
        const badge = this.badgesMap.get(userBadge.badgeId);
        if (badge) {
          this.createNotification({
            userId: userBadge.userId,
            title: "Badge Upgraded!",
            message: `Your ${badge.name} badge has been upgraded to ${userBadge.tier} tier!`,
            type: "achievement", 
            isRead: false
          });
        }
        
        return updatedBadge;
      }
      return existing;
    }
    
    // Create new user badge
    const id = this.userBadgeIdCounter++;
    const now = new Date();
    const newUserBadge: UserBadge = {
      ...userBadge,
      id,
      isViewed: false,
      awardedAt: now
    };
    this.userBadgesMap.set(id, newUserBadge);
    
    // Create notification for the user about the badge
    const badge = this.badgesMap.get(userBadge.badgeId);
    if (badge) {
      this.createNotification({
        userId: userBadge.userId,
        title: "New Badge Earned!",
        message: `You've earned the ${badge.name} badge (${userBadge.tier} tier)`,
        type: "achievement", 
        isRead: false
      });
    }
    
    return newUserBadge;
  }
  
  async markBadgeAsViewed(userId: number, badgeId: number): Promise<boolean> {
    const userBadge = Array.from(this.userBadgesMap.values()).find(
      ub => ub.userId === userId && ub.badgeId === badgeId
    );
    
    if (!userBadge) return false;
    
    const updatedBadge: UserBadge = {
      ...userBadge,
      isViewed: true
    };
    this.userBadgesMap.set(userBadge.id, updatedBadge);
    return true;
  }
  
  // Leaderboard methods
  async getAllLeaderboards(): Promise<Leaderboard[]> {
    return Array.from(this.leaderboardsMap.values());
  }
  
  async getLeaderboardById(id: number): Promise<Leaderboard | undefined> {
    return this.leaderboardsMap.get(id);
  }
  
  async updateLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    // Check if entry already exists
    const existingEntry = Array.from(this.leaderboardEntriesMap.values()).find(
      e => e.leaderboardId === entry.leaderboardId && e.userId === entry.userId
    );
    
    if (existingEntry) {
      // Update existing entry
      const updatedEntry: LeaderboardEntry = {
        ...existingEntry,
        score: entry.score,
        updatedAt: new Date()
      };
      this.leaderboardEntriesMap.set(existingEntry.id, updatedEntry);
      return updatedEntry;
    }
    
    // Create new entry
    const id = this.leaderboardEntryIdCounter++;
    const now = new Date();
    const newEntry: LeaderboardEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.leaderboardEntriesMap.set(id, newEntry);
    return newEntry;
  }
  
  async getLeaderboardWithEntries(id: number): Promise<{leaderboard: Leaderboard, entries: LeaderboardEntry[]} | undefined> {
    const leaderboard = this.leaderboardsMap.get(id);
    if (!leaderboard) return undefined;
    
    const entries = Array.from(this.leaderboardEntriesMap.values())
      .filter(entry => entry.leaderboardId === id)
      .sort((a, b) => b.score - a.score);
    
    return { leaderboard, entries };
  }
  
  async getUserLeaderboardEntries(userId: number): Promise<LeaderboardEntry[]> {
    return Array.from(this.leaderboardEntriesMap.values())
      .filter(entry => entry.userId === userId);
  }
  
  async createLeaderboard(leaderboard: InsertLeaderboard): Promise<Leaderboard> {
    const id = this.leaderboardIdCounter++;
    const now = new Date();
    const newLeaderboard: Leaderboard = {
      ...leaderboard,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.leaderboardsMap.set(id, newLeaderboard);
    return newLeaderboard;
  }
  
  async updateLeaderboard(id: number, data: Partial<InsertLeaderboard>): Promise<Leaderboard | undefined> {
    const leaderboard = this.leaderboardsMap.get(id);
    if (!leaderboard) return undefined;
    
    const now = new Date();
    const updatedLeaderboard: Leaderboard = {
      ...leaderboard,
      ...data,
      updatedAt: now
    };
    this.leaderboardsMap.set(id, updatedLeaderboard);
    return updatedLeaderboard;
  }
  
  async deleteLeaderboard(id: number): Promise<boolean> {
    if (!this.leaderboardsMap.has(id)) return false;
    
    // Delete all entries for this leaderboard
    const entries = Array.from(this.leaderboardEntriesMap.values())
      .filter(entry => entry.leaderboardId === id);
    
    for (const entry of entries) {
      this.leaderboardEntriesMap.delete(entry.id);
    }
    
    // Delete the leaderboard itself
    this.leaderboardsMap.delete(id);
    return true;
  }
  
  async updateAllLeaderboards(): Promise<void> {
    // This would typically calculate and update all leaderboard entries based on
    // the latest user stats and performances. For simplicity, just updating the
    // updatedAt timestamp of all leaderboards.
    const now = new Date();
    for (const [id, leaderboard] of this.leaderboardsMap.entries()) {
      this.leaderboardsMap.set(id, { ...leaderboard, updatedAt: now });
    }
  }

  // Initialize player data from CSV
  private initializePlayerData() {
    try {
      // Import the player data import function
      const { importAndSavePlayerData } = require('./player-data-importer');
      
      // Get the player stats from the CSV
      const playerStats = importAndSavePlayerData();
      
      // Store the player stats in the maps
      if (playerStats && playerStats.length > 0) {
        console.log(`Loaded ${playerStats.length} player statistics records from CSV`);
        
        // Save the player season stats
        playerStats.forEach(stats => {
          this.playerSeasonStatsMap.set(stats.playerId, stats);
          
          // Create dummy match stats for each player (in a real app, this would come from another API endpoint)
          const matchStats: import("@shared/player-interfaces").PlayerMatchStats[] = [];
          const now = new Date();
          
          // Create 5 recent matches with similar stats to the season totals but scaled down
          for (let i = 0; i < 5; i++) {
            const matchDate = new Date(now);
            matchDate.setDate(matchDate.getDate() - (i * 7)); // One match per week
            
            const minutesPlayed = stats.appearances && stats.minutesPlayed 
              ? Math.round(stats.minutesPlayed / stats.appearances) 
              : 90;
            
            const goals = stats.goals 
              ? Math.random() > 0.7 ? 1 : (Math.random() > 0.95 ? 2 : 0) 
              : 0;
              
            const assists = stats.assists 
              ? Math.random() > 0.8 ? 1 : 0 
              : 0;
              
            const yellowCard = Math.random() > (1 - (stats.yellowCards || 0) / (stats.appearances || 1) / 2);
            const redCard = Math.random() > (1 - (stats.redCards || 0) / (stats.appearances || 1) / 2);
            
            // Common opponents based on league
            const leagueOpponents: Record<string, string[]> = {
              'Premier League': ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Tottenham', 'Manchester United'],
              'Serie A': ['Juventus', 'Inter', 'AC Milan', 'Napoli', 'Roma', 'Lazio'],
              'La Liga': ['Barcelona', 'Real Madrid', 'Atletico Madrid', 'Sevilla', 'Valencia', 'Villarreal'],
              'Bundesliga': ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Wolfsburg']
            };
            
            // Get opponents based on league or use default
            const defaultOpponents = ['Opponent FC', 'United FC', 'City FC', 'Athletic', 'Rovers'];
            const leagueName = stats.competition || '';
            const opponents = leagueOpponents[leagueName] || defaultOpponents;
            const opponent = opponents[Math.floor(Math.random() * opponents.length)];
            
            // Generate passing stats based on season average
            const passesTotal = stats.passesTotal 
              ? Math.round((stats.passesTotal / (stats.appearances || 1)) * (0.8 + Math.random() * 0.4)) 
              : Math.round(20 + Math.random() * 40);
              
            const passAccuracy = stats.passAccuracy || Math.round(70 + Math.random() * 20);
            
            // Generate shot stats based on position and season average
            const shotsTotal = goals + Math.floor(Math.random() * 3);
            const shotsOnTarget = goals + (Math.random() > 0.7 ? 1 : 0);
            
            // Calculate match rating (1-10 scale)
            let rating = 6.0; // base rating
            rating += goals * 0.8;
            rating += assists * 0.5;
            rating -= yellowCard ? 0.3 : 0;
            rating -= redCard ? 1.5 : 0;
            rating = Math.max(3, Math.min(10, rating));
            rating = parseFloat(rating.toFixed(1));
            
            // Calculate fantasy points
            let fantasyPoints = minutesPlayed >= 60 ? 2 : 1;
            
            if (stats.competition?.includes('Premier League')) {
              // Use Premier League fantasy points system
              fantasyPoints += goals * (stats.position === 'forward' ? 4 : stats.position === 'midfielder' ? 5 : 6);
              fantasyPoints += assists * 3;
              fantasyPoints -= yellowCard ? 1 : 0;
              fantasyPoints -= redCard ? 3 : 0;
            } else {
              // Generic fantasy points
              fantasyPoints += goals * 5;
              fantasyPoints += assists * 3;
              fantasyPoints -= yellowCard ? 1 : 0;
              fantasyPoints -= redCard ? 2 : 0;
            }
            
            // Create the match stats
            matchStats.push({
              playerId: stats.playerId,
              matchId: i + 1,
              matchDate,
              opponent,
              homeOrAway: Math.random() > 0.5 ? 'home' : 'away',
              minutesPlayed,
              goals,
              assists,
              yellowCards: yellowCard ? 1 : 0,
              redCards: redCard ? 1 : 0,
              passesTotal,
              passAccuracy,
              shotsTotal,
              shotsOnTarget,
              rating,
              fantasyPoints
            });
          }
          
          // Save the match stats
          this.playerMatchStatsMap.set(stats.playerId, matchStats);
        });
        
        console.log('Player data initialization completed successfully');
      } else {
        console.log('No player data found in CSV');
      }
    } catch (error) {
      console.error('Error initializing player data:', error);
    }
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
    
    // Initialize sample fantasy football data 
    // Only if we have sample users
    if (this.usersMap.size > 0) {
      const sampleUser = this.usersMap.get(1);
      if (sampleUser) {
        // Add sample football players
        const playersData: InsertFootballPlayer[] = [
          { name: "Kevin De Bruyne", position: "midfielder", team: "Manchester City", league: "Premier League", country: "Belgium", imageUrl: "https://img.url/debruyne.jpg" },
          { name: "Harry Kane", position: "forward", team: "Bayern Munich", league: "Bundesliga", country: "England", imageUrl: "https://img.url/kane.jpg" },
          { name: "Virgil van Dijk", position: "defender", team: "Liverpool", league: "Premier League", country: "Netherlands", imageUrl: "https://img.url/vandijk.jpg" },
          { name: "Alisson Becker", position: "goalkeeper", team: "Liverpool", league: "Premier League", country: "Brazil", imageUrl: "https://img.url/alisson.jpg" },
          { name: "Jude Bellingham", position: "midfielder", team: "Real Madrid", league: "La Liga", country: "England", imageUrl: "https://img.url/bellingham.jpg" },
          { name: "Rodri", position: "midfielder", team: "Manchester City", league: "Premier League", country: "Spain", imageUrl: "https://img.url/rodri.jpg" },
          { name: "Erling Haaland", position: "forward", team: "Manchester City", league: "Premier League", country: "Norway", imageUrl: "https://img.url/haaland.jpg" },
          { name: "Mohamed Salah", position: "forward", team: "Liverpool", league: "Premier League", country: "Egypt", imageUrl: "https://img.url/salah.jpg" }
        ];
        const players = playersData.map(player => this.createFootballPlayer(player));
        
        // Create sample fantasy team
        const team = this.createFantasyTeam({
          userId: sampleUser.id,
          name: "Dream Team FC",
          budget: 100,
          remainingBudget: 83.5
        });
        
        // Add players to the team
        this.addPlayerToFantasyTeam({
          teamId: team.id,
          playerId: players[0].id,
          position: 1,
          isCaptain: true,
          isViceCaptain: false
        });
        
        this.addPlayerToFantasyTeam({
          teamId: team.id,
          playerId: players[1].id,
          position: 2,
          isCaptain: false,
          isViceCaptain: true
        });
        
        this.addPlayerToFantasyTeam({
          teamId: team.id,
          playerId: players[2].id,
          position: 3,
          isCaptain: false,
          isViceCaptain: false
        });
        
        // Create sample fantasy contest
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        
        const contest = this.createFantasyContest({
          name: "Premier League Gameweek 1",
          description: "Compete in the first gameweek of the Premier League season!",
          startDate: now,
          endDate: nextWeek,
          entryFee: 0,
          maxEntries: 1000,
          firstPlaceBonus: 50,
          prizes: { first: 100, second: 75, third: 50 }
        });
        
        // Create gameweek for contest
        const gameweek = this.createGameweek({
          contestId: contest.id,
          gameweekNumber: 1,
          startDate: now,
          endDate: nextWeek,
          description: "Opening matches of the season"
        });
        
        // Enter the contest with the team
        this.createContestEntry({
          userId: sampleUser.id,
          contestId: contest.id,
          teamId: team.id
        });
        
        // Add some points transactions
        this.createPointsTransaction({
          userId: sampleUser.id,
          points: 10,
          type: 'signup_bonus',
          description: 'Welcome bonus for signing up'
        });
        
        // Update user's fantasy points
        this.updateUserFantasyPoints(sampleUser.id, 10);
      }
    }
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  // Connected websocket clients
  private wsClients: Map<number, WebSocket[]> = new Map();

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
  }
  
  // 2FA methods
  async enableTwoFactor(userId: number, secret: string, phoneNumber: string): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          isTwoFactorEnabled: true,
          twoFactorSecret: secret,
          phoneNumber
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!user) throw new Error("User not found");
      return user;
    } catch (error) {
      console.error("Error enabling two-factor:", error);
      throw error;
    }
  }
  
  async disableTwoFactor(userId: number): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          isTwoFactorEnabled: false,
          twoFactorSecret: null
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!user) throw new Error("User not found");
      return user;
    } catch (error) {
      console.error("Error disabling two-factor:", error);
      throw error;
    }
  }
  
  async verifyTwoFactorCode(userId: number, code: string): Promise<boolean> {
    try {
      // This would normally use a library like 'speakeasy' to verify TOTP tokens
      // For now, we'll just do a simple check
      const user = await this.getUser(userId);
      if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
        return false;
      }
      
      // In a real implementation, we would verify the code against the secret
      // using something like: speakeasy.totp.verify({ 
      //   secret: user.twoFactorSecret,
      //   encoding: 'base32',
      //   token: code
      // });
      
      return code === '123456'; // Placeholder check
    } catch (error) {
      console.error("Error verifying two-factor code:", error);
      return false;
    }
  }
  
  // Football Player methods
  async getAllFootballPlayers(limit = 100, offset = 0, filters: any = {}): Promise<FootballPlayer[]> {
    try {
      let query = db.select().from(footballPlayers);
      
      if (filters) {
        // Filter by position
        if (filters.position) {
          query = query.where(eq(footballPlayers.position, filters.position));
        }
        
        // Filter by team
        if (filters.team) {
          query = query.where(eq(footballPlayers.team, filters.team));
        }
        
        // Filter by league
        if (filters.league) {
          query = query.where(eq(footballPlayers.league, filters.league));
        }
        
        // Filter by active status
        if (filters.active !== undefined) {
          query = query.where(eq(footballPlayers.active, filters.active));
        }
      }
      
      const players = await query.limit(limit).offset(offset);
      return players;
    } catch (error) {
      console.error("Error getting all football players:", error);
      return [];
    }
  }
  
  async searchFootballPlayers(query: string, position?: string, team?: string, limit = 20): Promise<FootballPlayer[]> {
    try {
      let playersQuery = db.select().from(footballPlayers)
        .where(eq(footballPlayers.active, true))
        .orderBy(desc(footballPlayers.fantasyPointsTotal))
        .limit(limit);
      
      // Apply filters
      if (query) {
        playersQuery = playersQuery.where(
          or(
            sql`${footballPlayers.name} ILIKE ${'%' + query + '%'}`,
            sql`${footballPlayers.team} ILIKE ${'%' + query + '%'}`
          )
        );
      }
      
      if (position) {
        playersQuery = playersQuery.where(eq(footballPlayers.position, position));
      }
      
      if (team) {
        playersQuery = playersQuery.where(eq(footballPlayers.team, team));
      }
      
      const players = await playersQuery;
      return players;
    } catch (error) {
      console.error("Error searching football players:", error);
      return [];
    }
  }
  
  async getFootballPlayerById(id: number): Promise<FootballPlayer | undefined> {
    try {
      const [player] = await db
        .select()
        .from(footballPlayers)
        .where(eq(footballPlayers.id, id));
      
      return player;
    } catch (error) {
      console.error("Error getting football player by ID:", error);
      return undefined;
    }
  }
  
  async getPlayerSeasonStats(playerId: number): Promise<PlayerSeasonStats | null> {
    try {
      // Get the player
      const player = await this.getFootballPlayerById(playerId);
      
      if (!player) {
        return null;
      }
      
      // Get current season data
      const currentSeason = new Date().getFullYear().toString();
      
      // Create season stats object based on player data
      const seasonStats: PlayerSeasonStats = {
        playerId: player.id,
        season: currentSeason,
        matches: player.appearances || 0,
        goals: player.goals || 0,
        assists: player.assists || 0,
        yellowCards: player.yellowCards || 0,
        redCards: player.redCards || 0,
        cleanSheets: player.cleanSheets || 0,
        minutesPlayed: player.minutesPlayed || 0,
        passAccuracy: Math.floor(Math.random() * 30) + 65, // Placeholder stats until API integration
        successfulTackles: player.position === 'defender' ? Math.floor(Math.random() * 60) + 20 : Math.floor(Math.random() * 30) + 10,
        successfulDribbles: player.position === 'midfielder' || player.position === 'forward' ? Math.floor(Math.random() * 40) + 20 : Math.floor(Math.random() * 20) + 5,
        chancesCreated: Math.floor(Math.random() * 40) + 5,
        shotsOnTarget: player.position === 'forward' ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 15) + 2,
        shotsTotal: player.position === 'forward' ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 25) + 5,
        xG: parseFloat((Math.random() * (player.goals || 1) * 1.2).toFixed(2)),
        xA: parseFloat((Math.random() * (player.assists || 1) * 1.1).toFixed(2)),
        form: this.getPlayerFormDescription(player),
        fantasyPoints: player.fantasyPointsTotal || 0,
        injury: null // No injuries by default
      };
      
      return seasonStats;
    } catch (error) {
      console.error("Error getting player season stats:", error);
      return null;
    }
  }
  
  private getPlayerFormDescription(player: FootballPlayer): string {
    // Logic to determine player form based on points average and player metrics
    const formOptions = [
      "Excellent form, consistently delivering strong performances",
      "Good recent performances with high influence in matches",
      "Average form with occasional standout games",
      "Inconsistent form, showing glimpses of quality",
      "Below average form, struggling to make an impact"
    ];
    
    // Simple selection based on fantasy points average
    const pointsAvg = player.fantasyPointsAvg || 0;
    
    if (pointsAvg > 8) return formOptions[0];
    if (pointsAvg > 6) return formOptions[1];
    if (pointsAvg > 4) return formOptions[2];
    if (pointsAvg > 2) return formOptions[3];
    return formOptions[4];
  }
  
  async getPlayerRecentMatches(playerId: number, limit = 5): Promise<PlayerMatchStats[]> {
    try {
      // Check if player exists
      const player = await this.getFootballPlayerById(playerId);
      
      if (!player) {
        return [];
      }
      
      // Generate sample data for player's recent matches
      // In a production environment, this would fetch from player_match_stats table
      const recentMatches: PlayerMatchStats[] = [];
      const today = new Date();
      
      for (let i = 0; i < limit; i++) {
        const matchDate = new Date(today);
        matchDate.setDate(today.getDate() - (i * 7)); // One match per week
        
        // Randomize some stats based on player position
        const goals = player.position === 'forward' ? 
          Math.floor(Math.random() * 2) : 
          (player.position === 'midfielder' ? 
            (Math.random() > 0.7 ? 1 : 0) : 
            (Math.random() > 0.9 ? 1 : 0));
            
        const assists = player.position === 'midfielder' ? 
          (Math.random() > 0.6 ? 1 : 0) : 
          (player.position === 'forward' ? 
            (Math.random() > 0.7 ? 1 : 0) : 
            (Math.random() > 0.9 ? 1 : 0));
            
        const yellowCard = Math.random() > 0.85;
        const redCard = Math.random() > 0.95;
        const minutesPlayed = Math.random() > 0.8 ? 
          Math.floor(Math.random() * 30) + 60 : 90;
            
        // Fantasy points calculation
        let fantasyPoints = minutesPlayed > 60 ? 2 : (minutesPlayed > 0 ? 1 : 0);
        fantasyPoints += goals * (player.position === 'forward' ? 4 : (player.position === 'midfielder' ? 5 : 6));
        fantasyPoints += assists * 3;
        fantasyPoints -= yellowCard ? 1 : 0;
        fantasyPoints -= redCard ? 3 : 0;
        
        if (player.position === 'goalkeeper' || player.position === 'defender') {
          const cleanSheet = Math.random() > 0.6;
          if (cleanSheet && minutesPlayed >= 60) fantasyPoints += 4;
        }
        
        // List of Premier League teams excluding player's own team
        const teams = [
          'Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 
          'Manchester United', 'Tottenham', 'Leicester City', 
          'Everton', 'West Ham', 'Aston Villa', 'Newcastle',
          'Crystal Palace', 'Brighton', 'Wolves', 'Southampton',
          'Burnley', 'Leeds United', 'Watford', 'Norwich', 'Brentford'
        ].filter(t => t !== player.team);
        
        // Random opponent
        const opponent = teams[Math.floor(Math.random() * teams.length)];
        const homeOrAway = Math.random() > 0.5 ? 'home' : 'away';
        
        // Position-specific stats
        const keyStats: Record<string, any> = {};
        
        if (player.position === 'goalkeeper') {
          keyStats.saves = Math.floor(Math.random() * 6) + 1;
          keyStats.penaltySaves = Math.random() > 0.9 ? 1 : 0;
        } else if (player.position === 'defender') {
          keyStats.tackles = Math.floor(Math.random() * 8) + 1;
          keyStats.interceptions = Math.floor(Math.random() * 7) + 1;
          keyStats.blocks = Math.floor(Math.random() * 4);
          keyStats.clearances = Math.floor(Math.random() * 9) + 1;
        } else if (player.position === 'midfielder') {
          keyStats.passCompletion = Math.floor(Math.random() * 15) + 75; // percentage
          keyStats.chancesCreated = Math.floor(Math.random() * 5);
          keyStats.tackles = Math.floor(Math.random() * 5);
          keyStats.distanceCovered = (Math.random() * 3 + 8).toFixed(1); // km
        } else if (player.position === 'forward') {
          keyStats.shots = Math.floor(Math.random() * 6) + goals;
          keyStats.shotsOnTarget = Math.min(keyStats.shots, Math.floor(Math.random() * 4) + goals);
          keyStats.dribbles = Math.floor(Math.random() * 8);
          keyStats.foulsWon = Math.floor(Math.random() * 4);
        }
        
        // Player rating (out of 10)
        const rating = Math.min(10, Math.max(4, (fantasyPoints / 3) + 5 + (Math.random() * 2 - 1)).toFixed(1));
        
        recentMatches.push({
          playerId: player.id,
          matchId: 10000 + i,
          matchDate,
          opponent,
          homeOrAway,
          minutesPlayed,
          goals,
          assists,
          yellowCards: yellowCard ? 1 : 0,
          redCards: redCard ? 1 : 0,
          cleanSheet: player.position === 'goalkeeper' || player.position === 'defender' 
            ? Math.random() > 0.6 
            : false,
          rating: parseFloat(rating),
          fantasyPoints,
          keyStats
        });
      }
      
      return recentMatches;
    } catch (error) {
      console.error("Error getting player recent matches:", error);
      return [];
    }
  }
  
  // Device tracking methods
  async updateUserDeviceImei(userId: number, imei: string): Promise<User> {
    try {
      // Check if another user already has this IMEI
      const existingUser = await this.getUserByDeviceImei(imei);
      if (existingUser && existingUser.id !== userId) {
        throw new Error("This device is already registered to another user");
      }
      
      const [user] = await db
        .update(users)
        .set({
          deviceImei: imei
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!user) throw new Error("User not found");
      
      // Generate a referral code if user doesn't have one
      if (!user.referralCode) {
        const referralCode = this.generateReferralCode(user.username);
        await db
          .update(users)
          .set({
            referralCode
          })
          .where(eq(users.id, userId));
          
        user.referralCode = referralCode;
      }
      
      return user;
    } catch (error) {
      console.error("Error updating device IMEI:", error);
      throw error;
    }
  }
  
  // Helper method to generate referral code
  private generateReferralCode(username: string): string {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const usernamePart = username.substring(0, 3).toUpperCase();
    return `${usernamePart}-${randomPart}`;
  }
  
  async getUserByDeviceImei(imei: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.deviceImei, imei));
      
      return user;
    } catch (error) {
      console.error("Error getting user by device IMEI:", error);
      return undefined;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }
  
  async getAllReferrals(): Promise<Referral[]> {
    try {
      return await db.select().from(referrals);
    } catch (error) {
      console.error("Error getting all referrals:", error);
      return [];
    }
  }
  
  async updateUserReferralCode(userId: number): Promise<User> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) throw new Error("User not found");
      
      const referralCode = this.generateReferralCode(user.username);
      const [updatedUser] = await db
        .update(users)
        .set({ referralCode })
        .where(eq(users.id, userId))
        .returning();
        
      return updatedUser;
    } catch (error) {
      console.error("Error updating user referral code:", error);
      throw error;
    }
  }
  
  // Referral methods
  async getUserReferrals(userId: number): Promise<Referral[]> {
    try {
      return await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId));
    } catch (error) {
      console.error("Error getting user referrals:", error);
      return [];
    }
  }
  
  async getReferralById(id: number): Promise<Referral | undefined> {
    try {
      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.id, id));
      
      return referral;
    } catch (error) {
      console.error("Error getting referral by ID:", error);
      return undefined;
    }
  }
  
  async createReferral(referral: InsertReferral): Promise<Referral> {
    try {
      const [newReferral] = await db
        .insert(referrals)
        .values(referral)
        .returning();
      
      return newReferral;
    } catch (error) {
      console.error("Error creating referral:", error);
      throw error;
    }
  }
  
  async updateReferralStatus(id: number, status: string): Promise<Referral> {
    try {
      const [referral] = await db
        .update(referrals)
        .set({
          status: status
        })
        .where(eq(referrals.id, id))
        .returning();
      
      if (!referral) throw new Error("Referral not found");
      
      // If the status is completed, award points to the referrer
      if (status === 'completed' && !referral.rewardClaimed) {
        const rewardAmount = 500; // Default reward amount
        
        // Update the referral to mark reward as claimed
        await db
          .update(referrals)
          .set({
            rewardAmount: rewardAmount,
            rewardClaimed: true
          })
          .where(eq(referrals.id, id));
        
        // Update the referrer's streak
        await this.updateReferrerStreak(referral.referrerId);
        
        // Award points to the referrer
        await this.updateUserFantasyPoints(referral.referrerId, rewardAmount);
        
        // Create a points transaction record
        await this.createPointsTransaction({
          userId: referral.referrerId,
          type: 'referral',
          amount: rewardAmount,
          description: 'Referral bonus',
          relatedId: id,
          relatedType: 'referral'
        });
        
        // Create notification for the referrer
        await this.createNotification({
          userId: referral.referrerId,
          type: 'referral',
          title: 'Referral Bonus',
          message: `You earned ${rewardAmount} points for a successful referral!`,
          isRead: false
        });
      }
      
      return referral;
    } catch (error) {
      console.error("Error updating referral status:", error);
      throw error;
    }
  }
  
  /**
   * Check and update a user's referral streak when a new referral is completed
   * @param referrerId The ID of the user who referred someone
   * @returns The updated User object
   */
  async updateReferrerStreak(referrerId: number): Promise<User> {
    try {
      // Get the user's current data
      const user = await this.getUser(referrerId);
      if (!user) throw new Error("User not found");
      
      const lastReferralDate = user.lastReferralDate;
      const today = new Date();
      let shouldIncrementStreak = true;
      
      if (lastReferralDate) {
        // Check if the last referral was within 30 days
        const daysSinceLastReferral = Math.floor(
          (today.getTime() - lastReferralDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // If it's been more than 30 days, reset the streak instead of incrementing
        if (daysSinceLastReferral > 30) {
          shouldIncrementStreak = false;
        }
      }
      
      // Update the user's streak
      return this.updateUserReferralStreak(referrerId, shouldIncrementStreak);
    } catch (error) {
      console.error("Error updating referrer streak:", error);
      throw error;
    }
  }
  
  async getUserReferralStats(userId: number): Promise<{ 
    totalReferrals: number, 
    pendingReferrals: number, 
    completedReferrals: number, 
    totalRewards: number 
  }> {
    try {
      const userReferrals = await this.getUserReferrals(userId);
      
      const totalReferrals = userReferrals.length;
      const pendingReferrals = userReferrals.filter(r => r.status === 'pending').length;
      const completedReferrals = userReferrals.filter(r => r.status === 'completed').length;
      const totalRewards = userReferrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
      
      return {
        totalReferrals,
        pendingReferrals,
        completedReferrals,
        totalRewards
      };
    } catch (error) {
      console.error("Error getting user referral stats:", error);
      return {
        totalReferrals: 0,
        pendingReferrals: 0,
        completedReferrals: 0,
        totalRewards: 0
      };
    }
  }

  async getReferralLeaderboard(limit: number = 10): Promise<Array<{
    userId: number;
    username: string;
    totalReferrals: number;
    completedReferrals: number;
    currentStreak: number;
    tier: string;
    rank: number;
  }>> {
    try {
      // Get all users with their streak information
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        referralStreak: users.referralStreak,
        lastReferralDate: users.lastReferralDate
      }).from(users);

      // Get all referrals
      const allReferrals = await db.select().from(referrals);
      
      // Count referrals for each user
      const referralCounts = await Promise.all(allUsers.map(async user => {
        const userReferrals = allReferrals.filter(r => r.referrerId === user.id);
        const totalReferrals = userReferrals.length;
        const completedReferrals = userReferrals.filter(r => r.status === 'completed').length;
        const currentStreak = user.referralStreak || 0;
        
        // Determine tier based on completed referrals
        let tier = 'none';
        if (completedReferrals >= 25) tier = 'platinum';
        else if (completedReferrals >= 10) tier = 'gold';
        else if (completedReferrals >= 5) tier = 'silver';
        else if (completedReferrals >= 1) tier = 'bronze';
        
        return {
          userId: user.id,
          username: user.username,
          totalReferrals,
          completedReferrals,
          currentStreak,
          tier
        };
      }));
      
      // Sort by completed referrals in descending order, with streak as secondary sort factor
      const sortedLeaderboard = referralCounts
        .filter(entry => entry.totalReferrals > 0) // Only include users with at least one referral
        .sort((a, b) => {
          // First sort by completed referrals
          if (b.completedReferrals !== a.completedReferrals) {
            return b.completedReferrals - a.completedReferrals;
          }
          // If tie, sort by streak
          if (b.currentStreak !== a.currentStreak) {
            return b.currentStreak - a.currentStreak;
          }
          // If still tie, sort by total referrals
          return b.totalReferrals - a.totalReferrals;
        });
      
      // Add rank
      const rankedLeaderboard = sortedLeaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
      
      // Return top N entries
      return rankedLeaderboard.slice(0, limit);
    } catch (error) {
      console.error("Error getting referral leaderboard:", error);
      return [];
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Use .select() without parameters to select all fields
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Use .select() without parameters to select all fields
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Use .select() without parameters to select all fields, which ensures we get email verification fields
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }
  
  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    try {
      // Use .select() without parameters to select all fields
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, referralCode));
      
      return user;
    } catch (error) {
      console.error("Error getting user by referral code:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log("Starting user creation with data:", JSON.stringify({
        ...insertUser,
        password: "REDACTED" // Don't log passwords
      }, null, 2));
      
      // Generate a unique referral code if not provided
      const referralCode = insertUser.referralCode || 
        `${insertUser.username.replace(/\s+/g, '').substring(0, 5).toUpperCase()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Explicitly set required fields and ensure proper type casting for enums
      const userValues = {
        username: insertUser.username,
        email: insertUser.email,
        password: insertUser.password,
        deviceImei: insertUser.deviceImei || null,
        phoneNumber: insertUser.phoneNumber || null,
        referralCode,
        referredBy: insertUser.referredBy || null,
        
        // Security and status fields
        role: "user", // Cast as enum value
        subscriptionTier: subscriptionTiers.FREE,
        isActive: true,
        isEmailVerified: insertUser.isEmailVerified !== undefined ? insertUser.isEmailVerified : false,
        emailVerificationToken: insertUser.emailVerificationToken || null,
        passwordResetToken: null,
        passwordResetExpires: null,
        
        // Need to initialize all timestamp fields with null or default
        lastLoginAt: null,
        lastReferralDate: null,
        
        // Make sure isTwoFactorEnabled is properly set
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
        
        // Stripe fields
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        
        // Gamification fields
        fantasyPoints: 0,
        totalContestsWon: 0,
        totalContestsEntered: 0,
        referralStreak: 0,
        
        // Notification token
        notificationToken: null,
        
        // Explicitly set notification settings structure
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
            cricket: true,
            formula1: true,
            mma: true,
            volleyball: true,
            other: true,
          },
          metrics: {
            notificationCount: 0,
            lastNotificationSent: null,
            clickThroughRate: 0,
            viewCount: 0,
            clickCount: 0,
            dismissCount: 0,
          }
        },
        
        // Onboarding fields - need to use the exact enum values 
        onboardingStatus: 'not_started' as 'not_started', // Explicit type cast to match enum
        lastOnboardingStep: 0,
        
        // User preferences
        userPreferences: {
          favoriteSports: [],
          favoriteLeagues: [],
          bettingFrequency: null,
          predictionTypes: [],
          riskTolerance: null,
          preferredOddsFormat: 'decimal',
          predictionsPerDay: null,
          experienceLevel: 'beginner',
          onboardingCompleted: false,
          lastStep: 0,
          completedSteps: [],
          timezone: null,
          autoDetectTimezone: true,
          preferredContentDeliveryTimes: {
            predictions: '08:00',
            results: '22:00',
            news: '12:00',
            promotions: '18:00'
          },
          schedulingPreferences: {
            weekdays: true,
            weekends: true,
            respectQuietHours: true,
            quietHoursStart: '23:00',
            quietHoursEnd: '07:00'
          },
          predictionFilters: {
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
          }
        }
      };
      
      try {
        console.log("Attempting to insert user with username:", userValues.username);
        
        // Insert the user with all fields properly initialized
        const result = await db
          .insert(users)
          .values(userValues)
          .returning();
          
        // Check if result is an array and has at least one element
        if (!Array.isArray(result) || result.length === 0) {
          throw new Error("User creation failed: No user returned from database");
        }
        
        const user = result[0];
        
        // Verify user object has required properties
        if (!user || typeof user !== 'object' || !user.id) {
          throw new Error("User creation failed: Invalid user object returned");
        }
        
        console.log("User created successfully with ID:", user.id);
          
        // If the user was referred by someone, create a referral record
        if (insertUser.referredBy) {
          try {
            await db.insert(referrals).values({
              referrerId: insertUser.referredBy,
              referredId: user.id,
              status: "pending" as "pending", // Explicit type cast to match enum
              // For new fields
              channel: null,
              utmParameters: null,
              deviceInfo: null,
              conversionTime: null,
              firstActionDate: null
            });
            console.log("Referral record created for new user");
          } catch (referralError) {
            console.error("Error creating referral record:", referralError);
            // Continue even if referral creation fails
          }
        }
        
        // Create welcome notification
        try {
          await db.insert(notifications).values({
            userId: user.id,
            title: "Welcome to PuntaIQ!",
            message: "Thanks for joining. Start exploring AI-powered sports predictions today!",
            type: "success",
            icon: "party-popper",
            read: false,
            timestamp: new Date(),
            priority: 3,
            channel: "in-app",
            data: {
              action: "onboarding",
              section: "welcome"
            },
            isDelivered: true,
            deliveredAt: new Date()
          });
          console.log("Welcome notification created for new user");
        } catch (notificationError) {
          console.error("Error creating welcome notification:", notificationError);
          // Continue even if notification creation fails
        }
        
        return user;
      } catch (dbError) {
        console.error("Error in database operation during user creation:", dbError);
        
        // Log detailed error information
        if (dbError.code) {
          console.error(`SQL Error Code: ${dbError.code}`);
        }
        if (dbError.constraint) {
          console.error(`Constraint violation: ${dbError.constraint}`);
        }
        if (dbError.message) {
          console.error(`DB Error message: ${dbError.message}`);
        }
        if (dbError.query) {
          console.error(`Failed query: ${dbError.query}`);
        }
        if (dbError.stack) {
          console.error(`Error stack: ${dbError.stack}`);
        }
        
        // Rethrow with more details
        throw new Error(`Database error during user creation: ${dbError.message}`);
      }
    } catch (error) {
      console.error("Outer error in createUser:", error);
      throw new Error(`Failed to create user: ${error.message || 'Unknown error'}`);
    }
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
  
  async updateUserNotificationSettings(userId: number, settings: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        notificationSettings: settings
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) throw new Error("User not found");
    return user;
  }
  
  async updateUserPreferences(userId: number, preferences: any): Promise<User> {
    try {
      // First check if the user exists
      const [existingUser] = await db
        .select({
          id: users.id
        })
        .from(users)
        .where(eq(users.id, userId));
      
      if (!existingUser) {
        throw new Error("User not found");
      }
      
      // Filter out any fields that shouldn't be in preferences to avoid schema issues
      const sanitizedPreferences = { ...preferences };
      // Remove fields that should be stored directly in the user table
      delete sanitizedPreferences.onboardingStatus;
      delete sanitizedPreferences.lastOnboardingStep;
      
      // Only update the userPreferences field to avoid issues with schema mismatches
      const [user] = await db
        .update(users)
        .set({
          userPreferences: sanitizedPreferences
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          userPreferences: users.userPreferences,
          onboardingStatus: users.onboardingStatus,
          lastOnboardingStep: users.lastOnboardingStep
        });
      
      return user;
    } catch (error) {
      console.error("Error updating user preferences:", error);
      // Return minimal user info instead of throwing to avoid breaking the flow
      const fallbackUser = {
        id: userId,
        username: "user",
        email: "user@example.com",
        userPreferences: preferences || {},
        onboardingStatus: 'in_progress' as 'in_progress', // Explicit cast to match enum
        lastOnboardingStep: 0,
        // Add any other required fields with sensible defaults
        password: "", // This will never be returned to the client
        createdAt: new Date(),
        isActive: true,
        isEmailVerified: false,
        role: "user"
      } as User;
      
      return fallbackUser;
    }
  }
  
  async updateUserOnboardingStatus(userId: number, status: string, lastStep: number): Promise<User> {
    try {
      // First check if the user exists
      const [existingUser] = await db
        .select({
          id: users.id
        })
        .from(users)
        .where(eq(users.id, userId));
      
      if (!existingUser) {
        throw new Error("User not found");
      }
      
      // Only update the specific onboarding fields to avoid schema mismatches
      // Check if status is one of the valid enum values and cast appropriately
      let onboardingStatusValue: 'not_started' | 'in_progress' | 'completed' | null;
      
      if (status === 'not_started' || status === 'in_progress' || status === 'completed') {
        onboardingStatusValue = status as 'not_started' | 'in_progress' | 'completed';
      } else {
        // Default to in_progress if an invalid value is passed
        console.warn(`Invalid onboarding status provided: ${status}. Defaulting to 'in_progress'`);
        onboardingStatusValue = 'in_progress';
      }
      
      const [user] = await db
        .update(users)
        .set({
          onboardingStatus: onboardingStatusValue,
          lastOnboardingStep: lastStep
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          onboardingStatus: users.onboardingStatus,
          lastOnboardingStep: users.lastOnboardingStep,
          userPreferences: users.userPreferences
        });
      
      return user;
    } catch (error) {
      console.error("Error updating user onboarding status:", error);
      // Return minimal user info instead of throwing
      // Use the same validation logic to ensure proper enum values in the fallback
      let fallbackStatus: 'not_started' | 'in_progress' | 'completed' | null;
      
      if (status === 'not_started' || status === 'in_progress' || status === 'completed') {
        fallbackStatus = status as 'not_started' | 'in_progress' | 'completed';
      } else {
        fallbackStatus = 'in_progress';
      }
      
      const fallbackUser = {
        id: userId,
        username: "user",
        email: "user@example.com",
        onboardingStatus: fallbackStatus,
        lastOnboardingStep: lastStep,
        userPreferences: {},
        // Add any other required fields with sensible defaults
        password: "", // This will never be returned to the client
        createdAt: new Date(),
        isActive: true,
        isEmailVerified: false
        // Don't include role field as it's causing SQL update issues
      } as User;
      
      return fallbackUser;
    }
  }
  
  async updateLastLogin(userId: number): Promise<User> {
    try {
      // Only update the lastLoginAt field to avoid schema mismatches
      const [user] = await db
        .update(users)
        .set({
          lastLoginAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          lastLoginAt: users.lastLoginAt
        });
      
      if (!user) throw new Error("User not found");
      return user;
    } catch (error) {
      console.error("Error updating user last login:", error);
      throw error;
    }
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    try {
      // Use .returning() to get all fields with proper types
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, token));
      
      return user;
    } catch (error) {
      console.error("Error getting user by verification token:", error);
      return undefined;
    }
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    try {
      // Use .returning() to get all fields with proper types
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.passwordResetToken, token));
      
      // If the reset token has expired, return undefined
      if (user && user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        return undefined;
      }
      
      return user;
    } catch (error) {
      console.error("Error getting user by reset token:", error);
      return undefined;
    }
  }
  
  async verifyEmail(userId: number): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          isEmailVerified: true,
          emailVerificationToken: null
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!user) throw new Error("User not found");
      return user;
    } catch (error) {
      console.error("Error verifying user email:", error);
      throw error;
    }
  }
  
  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          passwordResetToken: token,
          passwordResetExpires: expires
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!user) throw new Error("User not found");
      return user;
    } catch (error) {
      console.error("Error setting password reset token:", error);
      throw error;
    }
  }
  
  async resetPassword(userId: number, newHashedPassword: string): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          password: newHashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!user) throw new Error("User not found");
      return user;
    } catch (error) {
      console.error("Error resetting user password:", error);
      throw error;
    }
  }
  
  async updateUserFantasyPoints(userId: number, points: number): Promise<User> {
    try {
      // Get current fantasy points
      const user = await this.getUser(userId);
      if (!user) throw new Error("User not found");
      
      const currentPoints = user.fantasyPoints || 0;
      const newPoints = currentPoints + points;
      
      // Update user with new points total, selecting only needed fields to avoid schema mismatches
      const [updatedUser] = await db
        .update(users)
        .set({
          fantasyPoints: newPoints
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          fantasyPoints: users.fantasyPoints
        });
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user fantasy points:", error);
      throw error;
    }
  }
  
  /**
   * Update the referral streak for a user
   * Increments the streak if the referral was completed within 30 days of the last one
   * Resets the streak to 1 if it's been longer than 30 days
   * @param userId The user ID to update
   * @param incrementStreak Whether to increment the streak (true) or reset it to 1 (false)
   * @returns The updated user object
   */
  async updateUserReferralStreak(userId: number, incrementStreak: boolean = true): Promise<User> {
    try {
      // Get current user data
      const user = await this.getUser(userId);
      if (!user) throw new Error("User not found");
      
      const currentStreak = user.referralStreak || 0;
      const today = new Date();
      let newStreak = 1; // Default is to reset to 1
      
      if (incrementStreak) {
        // Increment streak if this is a continued streak
        newStreak = currentStreak + 1;
      }
      
      // Update user with new streak total and last referral date, selecting only needed fields
      const [updatedUser] = await db
        .update(users)
        .set({
          referralStreak: newStreak,
          lastReferralDate: today
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          referralStreak: users.referralStreak,
          lastReferralDate: users.lastReferralDate
        });
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user referral streak:", error);
      throw error;
    }
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
  
  async getCompletedMatches(): Promise<Match[]> {
    return db.select().from(matches)
      .where(eq(matches.isCompleted, true));
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
  
  async getUserSavedPredictions(userId: number): Promise<UserPrediction[]> {
    return db
      .select()
      .from(userPredictions)
      .where(
        and(
          eq(userPredictions.userId, userId),
          eq(userPredictions.isSaved, true)
        )
      );
  }
  
  async getUserAccumulatorSelections(userId: number): Promise<UserPrediction[]> {
    return db
      .select()
      .from(userPredictions)
      .where(
        and(
          eq(userPredictions.userId, userId),
          eq(userPredictions.isInAccumulator, true)
        )
      );
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

  // Notification system methods
  async getUserNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.timestamp))
      .limit(limit);
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notification,
        read: false,
        timestamp: new Date()
      })
      .returning();
    
    // Send notification to connected WebSocket clients
    await this.notifyUserViaWebSocket(notification.userId, {
      type: 'notification',
      data: newNotification
    });
    
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
    
    return result.rowCount > 0;
  }
  
  // WebSocket client management
  async registerWebSocketClient(userId: number, ws: WebSocket): Promise<void> {
    const clients = this.wsClients.get(userId) || [];
    clients.push(ws);
    this.wsClients.set(userId, clients);
  }
  
  async unregisterWebSocketClient(userId: number, ws: WebSocket): Promise<void> {
    const clients = this.wsClients.get(userId) || [];
    const updatedClients = clients.filter(client => client !== ws);
    
    if (updatedClients.length > 0) {
      this.wsClients.set(userId, updatedClients);
    } else {
      this.wsClients.delete(userId);
    }
  }
  
  async notifyUserViaWebSocket(userId: number, payload: any): Promise<void> {
    const clients = this.wsClients.get(userId) || [];
    const message = JSON.stringify(payload);
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  // Push token methods for mobile and web notifications
  async getUserPushTokens(userId: number): Promise<PushToken[]> {
    return db
      .select()
      .from(pushTokens)
      .where(
        and(
          eq(pushTokens.userId, userId),
          eq(pushTokens.isActive, true)
        )
      );
  }
  
  async getPushTokenById(id: number): Promise<PushToken | undefined> {
    const [token] = await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.id, id));
    return token;
  }
  
  async createPushToken(token: InsertPushToken): Promise<PushToken> {
    const [newToken] = await db
      .insert(pushTokens)
      .values({
        ...token,
        isActive: true,
        lastUsedAt: new Date()
      })
      .returning();
    return newToken;
  }
  
  async registerPushToken(userId: number, token: string, platform: string, deviceName?: string): Promise<PushToken> {
    // Check if user exists
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if token already exists for this user and platform
    const [existingToken] = await db
      .select()
      .from(pushTokens)
      .where(
        and(
          eq(pushTokens.userId, userId),
          eq(pushTokens.token, token),
          eq(pushTokens.platform, platform)
        )
      );
    
    if (existingToken) {
      // If token exists but is inactive, reactivate it
      if (!existingToken.isActive) {
        const [updatedToken] = await db
          .update(pushTokens)
          .set({ 
            isActive: true,
            lastUsedAt: new Date()
          })
          .where(eq(pushTokens.id, existingToken.id))
          .returning();
        return updatedToken;
      }
      
      // If token exists and is active, update the last used timestamp
      const [updatedToken] = await db
        .update(pushTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushTokens.id, existingToken.id))
        .returning();
      return updatedToken;
    }
    
    // Create a new token
    return this.createPushToken({
      userId,
      token,
      platform,
      deviceName
    });
  }
  
  async deactivatePushToken(id: number): Promise<boolean> {
    const result = await db
      .update(pushTokens)
      .set({ isActive: false })
      .where(eq(pushTokens.id, id));
    
    return result.rowCount > 0;
  }
  
  async sendPushNotification(userId: number, title: string, body: string, data?: any): Promise<boolean> {
    try {
      // 1. Get user's active push tokens
      const tokens = await this.getUserPushTokens(userId);
      const activeTokens = tokens.filter(token => token.isActive);
      
      if (activeTokens.length === 0) {
        // No active tokens, fallback to creating an in-app notification
        await this.createNotification({
          userId,
          title,
          message: body,
          type: 'info',
          data
        });
        
        console.log(`Created in-app notification for user ${userId} (no push tokens)`);
        return false;
      }
      
      // 2. Send web socket notification if user is connected
      await this.notifyUserViaWebSocket(userId, {
        type: 'push_notification',
        title,
        body,
        data
      });
      
      // 3. Create in-app notification as well
      await this.createNotification({
        userId,
        title,
        message: body,
        type: 'info',
        data
      });
      
      // 4. In a real implementation, we would use Firebase Cloud Messaging for Android/iOS
      // or Web Push API for web browsers here
      console.log(`Sending push notification to user ${userId} with ${activeTokens.length} tokens`);
      
      // 5. Update lastUsedAt for each token
      for (const token of activeTokens) {
        await db
          .update(pushTokens)
          .set({ lastUsedAt: new Date() })
          .where(eq(pushTokens.id, token.id));
      }
      
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Badge methods
  async getAllBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }
  
  async getBadgeById(id: number): Promise<Badge | undefined> {
    const [badge] = await db
      .select()
      .from(badges)
      .where(eq(badges.id, id));
    return badge;
  }
  
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db
      .insert(badges)
      .values(badge)
      .returning();
    return newBadge;
  }
  
  async updateBadge(id: number, data: Partial<InsertBadge>): Promise<Badge | undefined> {
    const [updatedBadge] = await db
      .update(badges)
      .set(data)
      .where(eq(badges.id, id))
      .returning();
    return updatedBadge;
  }
  
  async deleteBadge(id: number): Promise<boolean> {
    // First delete all user badges for this badge
    await db
      .delete(userBadges)
      .where(eq(userBadges.badgeId, id));
    
    // Then delete the badge itself
    const result = await db
      .delete(badges)
      .where(eq(badges.id, id));
    
    return result.rowCount > 0;
  }
  
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
  }
  
  async awardBadgeToUser(userBadge: InsertUserBadge): Promise<UserBadge> {
    // Check if user already has this badge
    const [existingBadge] = await db
      .select()
      .from(userBadges)
      .where(
        and(
          eq(userBadges.userId, userBadge.userId),
          eq(userBadges.badgeId, userBadge.badgeId)
        )
      );
    
    if (existingBadge) {
      // If existing but at a lower tier, update it
      if (existingBadge.tier !== userBadge.tier) {
        const [updatedBadge] = await db
          .update(userBadges)
          .set({
            tier: userBadge.tier,
            isViewed: false,
            awardedAt: new Date()
          })
          .where(eq(userBadges.id, existingBadge.id))
          .returning();
        
        // Create notification for badge upgrade
        const badge = await this.getBadgeById(userBadge.badgeId);
        if (badge) {
          await this.createNotification({
            userId: userBadge.userId,
            title: "Badge Upgraded!",
            message: `Your ${badge.name} badge has been upgraded to ${userBadge.tier} tier!`,
            type: "achievement", 
            isRead: false
          });
        }
        
        return updatedBadge;
      }
      return existingBadge;
    }
    
    // Create new user badge
    const [newUserBadge] = await db
      .insert(userBadges)
      .values({
        ...userBadge,
        isViewed: false,
        awardedAt: new Date()
      })
      .returning();
    
    // Create notification for the user about the badge
    const badge = await this.getBadgeById(userBadge.badgeId);
    if (badge) {
      await this.createNotification({
        userId: userBadge.userId,
        title: "New Badge Earned!",
        message: `You've earned the ${badge.name} badge (${userBadge.tier} tier)`,
        type: "achievement", 
        isRead: false
      });
    }
    
    return newUserBadge;
  }
  
  async markBadgeAsViewed(userId: number, badgeId: number): Promise<boolean> {
    const result = await db
      .update(userBadges)
      .set({ isViewed: true })
      .where(
        and(
          eq(userBadges.userId, userId),
          eq(userBadges.badgeId, badgeId)
        )
      );
    
    return result.rowCount > 0;
  }
  
  // Leaderboard methods
  async getAllLeaderboards(): Promise<Leaderboard[]> {
    return db.select().from(leaderboards);
  }
  
  async getLeaderboardById(id: number): Promise<Leaderboard | undefined> {
    const [leaderboard] = await db
      .select()
      .from(leaderboards)
      .where(eq(leaderboards.id, id));
    return leaderboard;
  }
  
  async getLeaderboardWithEntries(id: number): Promise<{leaderboard: Leaderboard, entries: LeaderboardEntry[]} | undefined> {
    const leaderboard = await this.getLeaderboardById(id);
    if (!leaderboard) return undefined;
    
    const entries = await db
      .select()
      .from(leaderboardEntries)
      .where(eq(leaderboardEntries.leaderboardId, id))
      .orderBy(desc(leaderboardEntries.score));
    
    return { leaderboard, entries };
  }
  
  async getUserLeaderboardEntries(userId: number): Promise<LeaderboardEntry[]> {
    return db
      .select()
      .from(leaderboardEntries)
      .where(eq(leaderboardEntries.userId, userId));
  }
  
  async createLeaderboard(leaderboard: InsertLeaderboard): Promise<Leaderboard> {
    const [newLeaderboard] = await db
      .insert(leaderboards)
      .values({
        ...leaderboard,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newLeaderboard;
  }
  
  async updateLeaderboard(id: number, data: Partial<InsertLeaderboard>): Promise<Leaderboard | undefined> {
    const [updatedLeaderboard] = await db
      .update(leaderboards)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(leaderboards.id, id))
      .returning();
    return updatedLeaderboard;
  }
  
  async deleteLeaderboard(id: number): Promise<boolean> {
    // First delete all entries for this leaderboard
    await db
      .delete(leaderboardEntries)
      .where(eq(leaderboardEntries.leaderboardId, id));
    
    // Then delete the leaderboard itself
    const result = await db
      .delete(leaderboards)
      .where(eq(leaderboards.id, id));
    
    return result.rowCount > 0;
  }
  
  async updateLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    // Check if entry already exists
    const [existingEntry] = await db
      .select()
      .from(leaderboardEntries)
      .where(
        and(
          eq(leaderboardEntries.leaderboardId, entry.leaderboardId),
          eq(leaderboardEntries.userId, entry.userId)
        )
      );
    
    if (existingEntry) {
      // Update existing entry
      const [updatedEntry] = await db
        .update(leaderboardEntries)
        .set({
          score: entry.score,
          updatedAt: new Date()
        })
        .where(eq(leaderboardEntries.id, existingEntry.id))
        .returning();
      return updatedEntry;
    }
    
    // Create new entry
    const [newEntry] = await db
      .insert(leaderboardEntries)
      .values({
        ...entry,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newEntry;
  }
  
  async updateAllLeaderboards(): Promise<void> {
    // Update the updatedAt timestamp of all leaderboards
    await db
      .update(leaderboards)
      .set({ updatedAt: new Date() });
    
    // In a real implementation, this would calculate new scores
    // for leaderboard entries based on user activity
  }

  // Fantasy Team methods implementation
  async getUserFantasyTeams(userId: number): Promise<FantasyTeam[]> {
    return db.select().from(fantasyTeams).where(eq(fantasyTeams.userId, userId));
  }
  
  async getFantasyTeamById(id: number): Promise<FantasyTeam | undefined> {
    const [team] = await db.select().from(fantasyTeams).where(eq(fantasyTeams.id, id));
    return team;
  }
  
  async createFantasyTeam(team: InsertFantasyTeam): Promise<FantasyTeam> {
    const [createdTeam] = await db
      .insert(fantasyTeams)
      .values({
        ...team,
        totalPoints: team.totalPoints ?? 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return createdTeam;
  }
  
  async updateFantasyTeam(id: number, data: Partial<InsertFantasyTeam>): Promise<FantasyTeam> {
    const [updatedTeam] = await db
      .update(fantasyTeams)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(fantasyTeams.id, id))
      .returning();
    
    return updatedTeam;
  }
  
  async deleteFantasyTeam(id: number): Promise<boolean> {
    const result = await db
      .delete(fantasyTeams)
      .where(eq(fantasyTeams.id, id));
    
    return result.rowCount > 0;
  }
  
  // Fantasy Team Players Management
  async getFantasyTeamPlayers(teamId: number): Promise<FantasyTeamPlayer[]> {
    // Get all players in the team
    const teamPlayersList = await db
      .select()
      .from(fantasyTeamPlayers)
      .where(eq(fantasyTeamPlayers.teamId, teamId));
    
    // Get the player details for each team player
    const result = await Promise.all(
      teamPlayersList.map(async (tp) => {
        const [player] = await db
          .select()
          .from(footballPlayers)
          .where(eq(footballPlayers.id, tp.playerId));
        
        return {
          ...tp,
          player
        };
      })
    );
    
    return result;
  }
  
  async addPlayerToFantasyTeam(data: InsertFantasyTeamPlayer): Promise<FantasyTeamPlayer> {
    const [teamPlayer] = await db
      .insert(fantasyTeamPlayers)
      .values(data)
      .returning();
    
    // Get player details
    const [player] = await db
      .select()
      .from(footballPlayers)
      .where(eq(footballPlayers.id, teamPlayer.playerId));
    
    return {
      ...teamPlayer,
      player
    };
  }
  
  async removePlayerFromFantasyTeam(teamId: number, playerId: number): Promise<boolean> {
    const result = await db
      .delete(fantasyTeamPlayers)
      .where(
        and(
          eq(fantasyTeamPlayers.teamId, teamId),
          eq(fantasyTeamPlayers.playerId, playerId)
        )
      );
    
    return result.rowCount > 0;
  }
  
  async updateFantasyTeamPlayer(id: number, data: Partial<InsertFantasyTeamPlayer>): Promise<FantasyTeamPlayer> {
    const [updatedTeamPlayer] = await db
      .update(fantasyTeamPlayers)
      .set(data)
      .where(eq(fantasyTeamPlayers.id, id))
      .returning();
    
    // Get player details
    const [player] = await db
      .select()
      .from(footballPlayers)
      .where(eq(footballPlayers.id, updatedTeamPlayer.playerId));
    
    return {
      ...updatedTeamPlayer,
      player
    };
  }
  
  async resetFantasyTeamCaptains(teamId: number): Promise<boolean> {
    try {
      // Reset all captain statuses for the team
      await db
        .update(fantasyTeamPlayers)
        .set({
          isCaptain: false,
          isViceCaptain: false
        })
        .where(eq(fantasyTeamPlayers.teamId, teamId));
      
      return true;
    } catch (error) {
      console.error('Error resetting team captains:', error);
      return false;
    }
  }
  
  async getFantasyPlayersByPosition(position: string): Promise<Player[]> {
    return db
      .select()
      .from(players)
      .where(eq(players.position, position))
      .orderBy(desc(players.fantasyPointsTotal))
      .limit(100);
  }
  
  async getAllFantasyPlayers(limit: number = 100): Promise<Player[]> {
    return db
      .select()
      .from(players)
      .orderBy(desc(players.fantasyPointsTotal))
      .limit(limit);
  }
  
  // News Article methods
  async getAllNewsArticles(limit = 20, offset = 0): Promise<NewsArticle[]> {
    return db
      .select()
      .from(newsArticles)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  async getNewsArticleById(id: number): Promise<NewsArticle | undefined> {
    const [article] = await db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.id, id));
    return article;
  }

  async getNewsArticlesByType(type: string, limit = 20): Promise<NewsArticle[]> {
    return db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.type, type))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit);
  }

  async getNewsArticlesBySport(sportId: number, limit = 20): Promise<NewsArticle[]> {
    return db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.sportId, sportId))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit);
  }

  async getNewsArticlesByLeague(leagueId: number, limit = 20): Promise<NewsArticle[]> {
    return db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.leagueId, leagueId))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit);
  }

  async searchNewsArticles(query: string, limit = 20): Promise<NewsArticle[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    
    return db
      .select()
      .from(newsArticles)
      .where(
        or(
          like(sql`LOWER(${newsArticles.title})`, lowerQuery),
          like(sql`LOWER(${newsArticles.content})`, lowerQuery),
          like(sql`LOWER(${newsArticles.summary})`, lowerQuery)
        )
      )
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit);
  }

  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const [newArticle] = await db
      .insert(newsArticles)
      .values({
        ...article,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newArticle;
  }

  async updateNewsArticle(id: number, data: Partial<InsertNewsArticle>): Promise<NewsArticle> {
    const [updatedArticle] = await db
      .update(newsArticles)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(newsArticles.id, id))
      .returning();
    
    if (!updatedArticle) {
      throw new Error("News article not found");
    }
    
    return updatedArticle;
  }

  async deleteNewsArticle(id: number): Promise<boolean> {
    const result = await db
      .delete(newsArticles)
      .where(eq(newsArticles.id, id));
    
    return result.rowCount > 0;
  }

  // User News Preferences methods
  async getUserNewsPreferences(userId: number): Promise<UserNewsPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userNewsPreferences)
      .where(eq(userNewsPreferences.userId, userId));
    
    return prefs;
  }

  async createUserNewsPreferences(prefs: InsertUserNewsPreferences): Promise<UserNewsPreferences> {
    const [newPrefs] = await db
      .insert(userNewsPreferences)
      .values({
        ...prefs,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newPrefs;
  }

  async updateUserNewsPreferences(userId: number, prefs: Partial<InsertUserNewsPreferences>): Promise<UserNewsPreferences> {
    // Check if preferences exist for this user
    const existingPrefs = await this.getUserNewsPreferences(userId);
    
    if (!existingPrefs) {
      // If no preferences exist yet, create them
      return this.createUserNewsPreferences({
        userId,
        ...prefs,
        favoriteTeams: prefs.favoriteTeams || [],
        favoriteLeagues: prefs.favoriteLeagues || [],
        favoriteSports: prefs.favoriteSports || [],
        preferredTopics: prefs.preferredTopics || [],
        excludedTopics: prefs.excludedTopics || []
      });
    }
    
    // Update existing preferences
    const [updatedPrefs] = await db
      .update(userNewsPreferences)
      .set({
        ...prefs,
        updatedAt: new Date()
      })
      .where(eq(userNewsPreferences.id, existingPrefs.id))
      .returning();
    
    return updatedPrefs;
  }

  // User Saved News methods
  async getUserSavedNews(userId: number): Promise<UserSavedNews[]> {
    return db
      .select()
      .from(userSavedNews)
      .where(eq(userSavedNews.userId, userId))
      .orderBy(desc(userSavedNews.savedAt));
  }

  async getSavedNewsWithArticles(userId: number): Promise<(UserSavedNews & { article: NewsArticle })[]> {
    try {
      // First validate that userId is a valid integer
      if (!userId || isNaN(Number(userId))) {
        console.error("Invalid user ID in getSavedNewsWithArticles:", userId);
        throw new Error("Invalid user ID");
      }
      
      // Ensure userId is a number type and it's a valid integer
      const userIdNumber = Math.floor(Number(userId));
      
      if (userIdNumber <= 0) {
        console.error("Invalid user ID value in getSavedNewsWithArticles:", userId);
        throw new Error("Invalid user ID value");
      }
      
      // Use a SQL query to ensure proper data handling
      const rawQuery = `
        SELECT 
          usn.id,
          usn.user_id,
          usn.article_id,
          usn.saved_at,
          usn.is_read,
          usn.read_at,
          na.*
        FROM 
          user_saved_news AS usn
        INNER JOIN 
          news_articles AS na ON usn.article_id = na.id
        WHERE 
          usn.user_id = $1
        ORDER BY 
          usn.saved_at DESC
      `;
      
      const { rows } = await pool.query(rawQuery, [userIdNumber]);
      
      // Transform the results to match the expected structure
      const results = rows.map(row => {
        // Get article properties from the newsArticles columns
        return {
          id: row.id,
          userId: row.user_id, 
          articleId: row.article_id,
          savedAt: row.saved_at,
          isRead: row.is_read,
          readAt: row.read_at,
          article: {
            id: row.article_id, // Use the article_id from user_saved_news for the article id
            title: row.title,
            content: row.content,
            summary: row.summary,
            author: row.author,
            source: row.source,
            sourceUrl: row.source_url,
            publishedAt: row.published_at,
            imageUrl: row.image_url,
            sportId: row.sport_id,
            leagueId: row.league_id,
            teams: row.teams,
            type: row.type,
            aiGenerated: row.ai_generated,
            aiEnhanced: row.ai_enhanced,
            isPremium: row.is_premium,
            tags: row.tags,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }
        };
      });
      
      return results || [];
    } catch (error) {
      console.error("Error in getSavedNewsWithArticles:", error);
      return [];
    }
  }

  async saveNewsArticle(data: InsertUserSavedNews): Promise<UserSavedNews> {
    // Check if already saved
    const [existing] = await db
      .select()
      .from(userSavedNews)
      .where(
        and(
          eq(userSavedNews.userId, data.userId),
          eq(userSavedNews.articleId, data.articleId)
        )
      );
    
    if (existing) {
      return existing;
    }
    
    // Save the article
    const [newSaved] = await db
      .insert(userSavedNews)
      .values({
        ...data,
        savedAt: new Date(),
        isRead: false
      })
      .returning();
    
    return newSaved;
  }

  async markNewsArticleAsRead(userId: number, articleId: number): Promise<UserSavedNews> {
    try {
      // Validate inputs
      if (!userId || isNaN(Number(userId))) {
        console.error("Invalid user ID in markNewsArticleAsRead:", userId);
        throw new Error("Invalid user ID");
      }
      
      if (!articleId || isNaN(Number(articleId))) {
        console.error("Invalid article ID in markNewsArticleAsRead:", articleId);
        throw new Error("Invalid article ID");
      }
      
      // Ensure numeric types
      const userIdNumber = Number(userId);
      const articleIdNumber = Number(articleId);
      
      // Check if saved
      const [saved] = await db
        .select()
        .from(userSavedNews)
        .where(
          and(
            eq(userSavedNews.userId, userIdNumber),
            eq(userSavedNews.articleId, articleIdNumber)
          )
        );
      
      if (!saved) {
        // If not saved, save it and mark as read
        return this.saveNewsArticle({
          userId: userIdNumber,
          articleId: articleIdNumber,
          isRead: true
        });
      }
      
      // Update read status
      const [updated] = await db
        .update(userSavedNews)
        .set({ isRead: true })
        .where(eq(userSavedNews.id, saved.id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error("Error in markNewsArticleAsRead:", error);
      throw error;
    }
  }

  async unsaveNewsArticle(userId: number, articleId: number): Promise<boolean> {
    try {
      // Validate inputs
      if (!userId || isNaN(Number(userId))) {
        console.error("Invalid user ID in unsaveNewsArticle:", userId);
        return false;
      }
      
      if (!articleId || isNaN(Number(articleId))) {
        console.error("Invalid article ID in unsaveNewsArticle:", articleId);
        return false;
      }
      
      // Ensure numeric types
      const userIdNumber = Number(userId);
      const articleIdNumber = Number(articleId);
      
      const result = await db
        .delete(userSavedNews)
        .where(
          and(
            eq(userSavedNews.userId, userIdNumber),
            eq(userSavedNews.articleId, articleIdNumber)
          )
        );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error in unsaveNewsArticle:", error);
      return false;
    }
  }

  // Personalized News Feed
  async getPersonalizedNewsFeed(userId: number, limit = 20, offset = 0): Promise<NewsArticle[]> {
    try {
      // Validate inputs
      if (!userId || isNaN(Number(userId))) {
        console.error("Invalid user ID in getPersonalizedNewsFeed:", userId);
        throw new Error("Invalid user ID");
      }
      
      // Ensure numeric types
      const userIdNumber = Number(userId);
      const limitNumber = Number(limit);
      const offsetNumber = Number(offset);
      
      // Validate limit and offset
      if (isNaN(limitNumber) || limitNumber <= 0) {
        console.warn("Invalid limit in getPersonalizedNewsFeed:", limit);
        // Default to 20 if invalid
        limit = 20;
      }
      
      if (isNaN(offsetNumber) || offsetNumber < 0) {
        console.warn("Invalid offset in getPersonalizedNewsFeed:", offset);
        // Default to 0 if invalid
        offset = 0;
      }
    
      const userPrefs = await this.getUserNewsPreferences(userIdNumber);
      
      if (!userPrefs) {
        // If no preferences, return general news
        return this.getAllNewsArticles(limit, offset);
      }
      
      // Start building a query with user preferences
      let query = db
        .select()
        .from(newsArticles);
      
      // We'll gather conditions to apply using OR/AND logic
      const sportConditions = [];
      const leagueConditions = [];
      const topicConditions = [];
      const excludeConditions = [];
      
      // Apply sport preferences if any
      if (userPrefs.favoriteSports && Array.isArray(userPrefs.favoriteSports) && userPrefs.favoriteSports.length > 0) {
        sportConditions.push(inArray(newsArticles.sportId, userPrefs.favoriteSports));
      }
      
      // Apply league preferences if any
      if (userPrefs.favoriteLeagues && Array.isArray(userPrefs.favoriteLeagues) && userPrefs.favoriteLeagues.length > 0) {
        leagueConditions.push(inArray(newsArticles.leagueId, userPrefs.favoriteLeagues));
      }
      
      // Apply topic preferences if any
      if (userPrefs.preferredTopics && Array.isArray(userPrefs.preferredTopics) && userPrefs.preferredTopics.length > 0) {
        topicConditions.push(inArray(newsArticles.type, userPrefs.preferredTopics));
      }
      
      // Apply exclusions if any
      if (userPrefs.excludedTopics && Array.isArray(userPrefs.excludedTopics) && userPrefs.excludedTopics.length > 0) {
        excludeConditions.push(not(inArray(newsArticles.type, userPrefs.excludedTopics)));
      }
      
      // Combine conditions
      const conditions = [];
      
      // Add sport OR league conditions (user might be interested in either)
      if (sportConditions.length > 0 || leagueConditions.length > 0) {
        conditions.push(or(...sportConditions, ...leagueConditions));
      }
      
      // Add topic conditions
      if (topicConditions.length > 0) {
        conditions.push(or(...topicConditions));
      }
      
      // Add exclusion conditions (these are always AND)
      conditions.push(...excludeConditions);
      
      // Apply all conditions if we have any
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply ordering, limit and offset
      const results = await query
        .orderBy(desc(newsArticles.publishedAt))
        .limit(limit)
        .offset(offset);
      
      return results || [];
    } catch (error) {
      console.error("Error in getPersonalizedNewsFeed:", error);
      return [];
    }
  }

  // Fantasy Football methods
  async getAllFantasyContests(limit: number = 20, status?: string, tier?: string): Promise<FantasyContest[]> {
    try {
      let query = db.select().from(fantasyContests);
      
      // Apply filters if provided
      if (status) {
        query = query.where(eq(fantasyContests.status, status as any));
      }
      
      if (tier) {
        query = query.where(eq(fantasyContests.tier, tier as any));
      }
      
      // Sort by start date (newest first)
      query = query.orderBy(desc(fantasyContests.startDate)).limit(limit);
      
      return await query;
    } catch (error) {
      console.error("Error getting fantasy contests:", error);
      return [];
    }
  }
  
  async getFreeFantasyContests(limit: number = 20, status?: string): Promise<FantasyContest[]> {
    return this.getAllFantasyContests(limit, status, 'free');
  }
  
  async getPremiumFantasyContests(limit: number = 20, status?: string): Promise<FantasyContest[]> {
    return this.getAllFantasyContests(limit, status, 'premium');
  }
  
  async getFantasyContestById(id: number): Promise<FantasyContest | undefined> {
    try {
      const [contest] = await db
        .select()
        .from(fantasyContests)
        .where(eq(fantasyContests.id, id));
      
      return contest;
    } catch (error) {
      console.error(`Error getting fantasy contest with id ${id}:`, error);
      return undefined;
    }
  }
  
  async createFantasyContest(contest: InsertFantasyContest): Promise<FantasyContest> {
    try {
      const [newContest] = await db
        .insert(fantasyContests)
        .values(contest)
        .returning();
      
      return newContest;
    } catch (error) {
      console.error("Error creating fantasy contest:", error);
      throw error;
    }
  }
  
  async getFantasyTeamById(id: number): Promise<FantasyTeam | undefined> {
    try {
      const [team] = await db
        .select()
        .from(fantasyTeams)
        .where(eq(fantasyTeams.id, id));
      
      return team;
    } catch (error) {
      console.error(`Error getting fantasy team with id ${id}:`, error);
      return undefined;
    }
  }
  
  async getUserContestEntries(userId: number): Promise<FantasyContestEntry[]> {
    try {
      return await db
        .select()
        .from(fantasyContestEntries)
        .where(eq(fantasyContestEntries.userId, userId));
    } catch (error) {
      console.error(`Error getting contest entries for user ${userId}:`, error);
      return [];
    }
  }
  
  async createContestEntry(entry: InsertFantasyContestEntry): Promise<FantasyContestEntry> {
    try {
      const [newEntry] = await db
        .insert(fantasyContestEntries)
        .values(entry)
        .returning();
      
      return newEntry;
    } catch (error) {
      console.error("Error creating contest entry:", error);
      throw error;
    }
  }
  
  async getContestLeaderboard(contestId: number): Promise<FantasyContestEntry[]> {
    try {
      return await db
        .select()
        .from(fantasyContestEntries)
        .where(eq(fantasyContestEntries.contestId, contestId))
        .orderBy(desc(fantasyContestEntries.totalPoints));
    } catch (error) {
      console.error(`Error getting leaderboard for contest ${contestId}:`, error);
      return [];
    }
  }
  
  async updateFantasyContestStatus(id: number, status: string): Promise<FantasyContest | null> {
    try {
      const [updatedContest] = await db
        .update(fantasyContests)
        .set({ status: status as any })
        .where(eq(fantasyContests.id, id))
        .returning();
      
      return updatedContest || null;
    } catch (error) {
      console.error(`Error updating status for contest ${id}:`, error);
      return null;
    }
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
