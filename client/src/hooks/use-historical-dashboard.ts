import { useQuery } from '@tanstack/react-query';

export interface HistoricalDashboardFilters {
  sport?: string;
  resultType?: string;
  date?: string;
  market?: string;
  page?: number;
  limit?: number;
}

interface HistoricalMetrics {
  totalPredictions: number;
  wonCount: number;
  lostCount: number;
  pendingCount: number;
  successRate: number;
  averageOdds: number;
  roi: number;
}

interface MonthlyPerformance {
  month: string;
  year: number;
  total: number;
  won: number;
  successRate: number;
}

interface SportPerformance {
  totalPredictions: number;
  wonCount: number;
  lostCount: number;
  successRate: number;
  averageOdds: number;
  roi: number;
}

export interface HistoricalPrediction {
  id: number;
  date: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  prediction: string;
  odds: number;
  result: string;
  isCorrect: boolean;
  confidence: number;
  market: string;
  createdAt: string;
}

export interface HistoricalDashboardResponse {
  metrics: HistoricalMetrics;
  predictions: HistoricalPrediction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    currentCount: number;
    hasNextPage: boolean;
  };
  monthlyPerformance: MonthlyPerformance[];
  sportPerformance: Record<string, SportPerformance>;
}

export function useHistoricalDashboard(filters: HistoricalDashboardFilters = {}) {
  return useQuery<HistoricalDashboardResponse>({
    queryKey: [
      '/api/historical-dashboard', 
      { 
        sport: filters.sport !== "all" ? filters.sport : undefined,
        resultType: filters.resultType !== "all" ? filters.resultType : undefined,
        date: filters.date,
        market: filters.market || undefined,
        page: filters.page || 1,
        limit: filters.limit || 20
      }
    ],
  });
}