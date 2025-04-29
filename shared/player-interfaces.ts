// Player stats comparison interfaces
export interface PlayerSeasonStats {
  playerId: number;
  season: string;
  games?: number;
  matches?: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  minutesPlayed: number;
  passAccuracy: number | null;
  tackles?: number;
  interceptions?: number;
  saves?: number;
  shotsOnTarget?: number | null;
  chanceCreated?: number;
  dribbleSuccess?: number;
  successfulTackles?: number | null;
  successfulDribbles?: number | null;
  chancesCreated?: number | null;
  shotsTotal?: number | null;
  xG?: number | null;  // Expected goals
  xA?: number | null;  // Expected assists
  form?: string | null; // Text description of recent form
  fantasyPoints?: number;
  injury?: string | null; // Injury status if any
}

export interface PlayerMatchStats {
  playerId: number;
  matchId: number;
  date?: Date;
  matchDate?: Date;
  opponent: string;
  isHome?: boolean;
  homeOrAway?: 'home' | 'away';
  result?: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCard?: boolean;
  yellowCards?: number;
  redCard?: boolean;
  redCards?: number;
  cleanSheet?: boolean;
  saves?: number;
  tackles?: number;
  keyPasses?: number;
  shotsOnTarget?: number;
  rating: number;
  fantasyPoints?: number;
  keyStats?: Record<string, any> | null; // Additional stats specific to position
}