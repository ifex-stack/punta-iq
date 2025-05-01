export interface HeatmapData {
  x: string;  // Represents the opposing team or match date
  y: string;  // Represents the statistic/metric being measured
  value: number; // The value of the performance metric
}

export interface PlayerStats {
  id: number;
  name: string;
  position: string;
  appearances: number;
  goals: number;
  assists: number;
  rating: number;
  minutes: number;
  team: string;
  teamLogo?: string;
  profileImage?: string;
}

export interface HistoricalMatch {
  date: string;
  opponent: string;
  result: 'W' | 'D' | 'L';
  goals: number;
  assists: number;
  minutes: number;
  rating: number;
}

export interface PlayerPerformanceAnalysis {
  player: PlayerStats;
  comparisonData?: PlayerStats[];
  historicalMatches: HistoricalMatch[];
  performanceByOpposition: HeatmapData[];
  performanceOverTime: HeatmapData[];
  strengthsAndWeaknesses: {
    strengths: string[];
    weaknesses: string[];
  };
}