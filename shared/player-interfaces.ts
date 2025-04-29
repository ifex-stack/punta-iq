// Player stats comparison interfaces based on real API data
export interface PlayerSeasonStats {
  playerId: number;
  season: string;
  competition?: string;
  competitionId?: number;
  team?: string;
  teamId?: number;

  // Appearance stats
  appearances?: number;
  lineups?: number;
  minutesPlayed: number;
  games?: number;
  matches?: number;
  captain?: boolean;
  
  // Goal involvement
  goals: number;
  assists: number;
  penalties?: number;
  
  // Disciplinary
  yellowCards: number;
  redCards: number;
  
  // Goalkeeper stats
  cleanSheets: number;
  goalsConceded?: number;
  saves?: number;
  
  // Passing stats
  passesTotal?: number;
  passesKey?: number;
  passAccuracy: number | null;
  
  // Defensive stats
  tackles?: number;
  tacklesTotal?: number;
  tacklesBlocks?: number;
  tacklesInterceptions?: number;
  duelsTotal?: number;
  duelsWon?: number;
  
  // Attacking stats
  shotsTotal?: number | null;
  shotsOnTarget?: number | null;
  dribblesAttempts?: number;
  dribblesSuccess?: number;
  dribblesSuccessful?: number | null;
  successfulDribbles?: number | null;
  chancesCreated?: number | null;
  
  // Advanced metrics
  xG?: number | null;  // Expected goals
  xA?: number | null;  // Expected assists
  
  // Additional info
  form?: string | null; // Text description of recent form
  fantasyPoints?: number;
  rating?: number; // Average rating
  injury?: string | null; // Injury status if any
}

export interface PlayerMatchStats {
  playerId: number;
  matchId: number;
  date?: Date;
  matchDate?: Date;
  
  // Match information
  opponent: string;
  isHome?: boolean;
  homeOrAway?: 'home' | 'away';
  result?: string;
  competition?: string;
  competitionId?: number;
  team?: string;
  teamId?: number;
  
  // Performance stats
  position?: string;
  minutesPlayed: number;
  rating: number;
  captain?: boolean;
  
  // Goal involvement
  goals: number;
  assists: number;
  penalties?: number;
  
  // Disciplinary
  yellowCard?: boolean;
  yellowCards?: number;
  redCard?: boolean;
  redCards?: number;
  
  // Goalkeeper stats
  cleanSheet?: boolean;
  goalsConceded?: number;
  saves?: number;
  
  // Passing stats
  passesTotal?: number;
  passesKey?: number;
  passAccuracy?: number;
  keyPasses?: number;
  
  // Defensive stats
  tackles?: number;
  tacklesBlocks?: number;
  tacklesInterceptions?: number;
  duelsTotal?: number;
  duelsWon?: number;
  
  // Attacking stats
  shotsTotal?: number;
  shotsOnTarget?: number;
  dribbles?: number;
  dribblesSuccessful?: number;
  
  // Game impact 
  fantasyPoints?: number;
  keyStats?: Record<string, any> | null; // Additional stats specific to position
}