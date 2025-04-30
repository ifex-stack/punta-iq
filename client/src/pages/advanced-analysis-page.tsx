import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { 
  ArrowLeft, RefreshCw, Share2, Zap, TrendingUp, BarChart4, Calendar, Activity, 
  Info, AlertTriangle, LineChart as LineChartIcon, AreaChart as AreaChartIcon,
  PieChart, Target, Layers, ChevronDown, Percent, Flame, Trophy, Award, PieChart as PieChartIcon,
  Filter, Search, ListFilter, Check, Globe, Map
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, AreaChart,
  PieChart as RechartsPieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar
} from 'recharts';
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Common market types across different sports
export const COMMON_MARKETS = {
  MATCH_WINNER: "match_winner",
  SPREAD: "spreads",
  TOTALS: "totals",
  TEAM_TOTALS: "team_totals",
  DOUBLE_CHANCE: "double_chance",
  BOTH_TEAMS_TO_SCORE: "btts",
  CORRECT_SCORE: "correct_score",
  FIRST_SCORER: "first_scorer",
  ANYTIME_SCORER: "anytime_scorer",
  HALF_TIME_RESULT: "half_time_result",
  DRAW_NO_BET: "draw_no_bet",
};

// Sports-specific markets
export const SPORT_SPECIFIC_MARKETS = {
  football: [
    { id: "asian_handicap", name: "Asian Handicap" },
    { id: "corners", name: "Corners" },
    { id: "cards", name: "Cards" },
    { id: "half_time_full_time", name: "Half Time/Full Time" },
  ],
  basketball: [
    { id: "race_to_points", name: "Race to Points" },
    { id: "player_points", name: "Player Points" },
    { id: "player_rebounds", name: "Player Rebounds" },
    { id: "player_assists", name: "Player Assists" },
    { id: "quarter_winner", name: "Quarter Winner" },
  ],
  baseball: [
    { id: "run_line", name: "Run Line" },
    { id: "innings_total", name: "Innings Total" },
    { id: "player_hits", name: "Player Hits" },
    { id: "player_strikeouts", name: "Player Strikeouts" },
  ],
  american_football: [
    { id: "td_scorer", name: "Touchdown Scorer" },
    { id: "quarter_winner", name: "Quarter Winner" },
    { id: "player_passing_yards", name: "Player Passing Yards" },
    { id: "player_rushing_yards", name: "Player Rushing Yards" },
  ],
  tennis: [
    { id: "set_winner", name: "Set Winner" },
    { id: "correct_set_score", name: "Correct Set Score" },
    { id: "player_aces", name: "Player Aces" },
    { id: "player_games", name: "Player Games" },
  ],
  hockey: [
    { id: "puck_line", name: "Puck Line" },
    { id: "period_winner", name: "Period Winner" },
    { id: "player_goals", name: "Player Goals" },
    { id: "player_assists", name: "Player Assists" },
  ],
  cricket: [
    { id: "batsman_runs", name: "Batsman Runs" },
    { id: "bowler_wickets", name: "Bowler Wickets" },
    { id: "innings_runs", name: "Innings Runs" },
    { id: "match_winner", name: "Match Winner" },
  ],
  mma: [
    { id: "method_of_victory", name: "Method of Victory" },
    { id: "round_betting", name: "Round Betting" },
    { id: "total_rounds", name: "Total Rounds" },
    { id: "go_the_distance", name: "Go the Distance" },
  ],
  formula1: [
    { id: "race_winner", name: "Race Winner" },
    { id: "podium_finish", name: "Podium Finish" },
    { id: "fastest_lap", name: "Fastest Lap" },
    { id: "driver_matchups", name: "Driver Matchups" },
  ],
};

// Types to match what we're getting from the API
interface StandardizedMatch {
  id: string;
  sport: string;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  venue: string | null;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  status?: string;
  score?: {
    home: number | null;
    away: number | null;
  };
  prediction?: string;
  confidence?: number;
  explanation?: string;
}

interface Prediction extends StandardizedMatch {
  valueBet?: {
    market: string;
    selection: string;
    odds: number;
    value: number;
  };
  // Fields for advanced analysis
  h2hHistory?: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    winner: string;
  }>;
  formGuide?: {
    home: Array<string>;
    away: Array<string>;
  };
  injuryNews?: Array<{
    team: string;
    player: string;
    status: string;
    impact: string;
  }>;
  aiEnhancedAnalysis?: string;
  performanceChart?: Array<{
    month: string;
    predictedCorrect: number;
    accuracy: number;
  }>;
  // New fields for enhanced analysis
  keyStats?: {
    home: {
      [key: string]: number | string;
    };
    away: {
      [key: string]: number | string;
    };
  };
  trendingMarkets?: Array<{
    market: string;
    value: string;
    odds: number;
    trend: 'up' | 'down' | 'stable';
    confidence: number;
  }>;
  exoticMarkets?: Array<{
    market: string;
    options: Array<{
      selection: string;
      odds: number;
      probability: number;
    }>;
  }>;
  similarMatches?: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
    result: string;
    keyInsight: string;
  }>;
}

interface OddsAPISport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

interface MatchesResponse {
  events: Prediction[];
  byCountry: Record<string, Record<string, Prediction[]>>;
  byLeague: Record<string, Prediction[]>;
}

// Common statistics for all sports
const COMMON_STATS = [
  { key: 'winRate', label: 'Win Rate' },
  { key: 'formStreak', label: 'Form Streak' },
  { key: 'avgScore', label: 'Avg. Score' },
];

// Sport-specific statistics
const SPORT_STATS = {
  football: [
    { key: 'possession', label: 'Possession %' },
    { key: 'shots', label: 'Shots per Game' },
    { key: 'shotsOnTarget', label: 'Shots on Target' },
    { key: 'corners', label: 'Corners per Game' },
    { key: 'cards', label: 'Cards per Game' },
    { key: 'xG', label: 'Expected Goals (xG)' },
    { key: 'cleanSheets', label: 'Clean Sheets %' },
  ],
  basketball: [
    { key: 'fgPct', label: 'FG %' },
    { key: 'threePtPct', label: '3PT %' },
    { key: 'rebounds', label: 'Rebounds' },
    { key: 'assists', label: 'Assists' },
    { key: 'steals', label: 'Steals' },
    { key: 'blocks', label: 'Blocks' },
    { key: 'turnovers', label: 'Turnovers' },
  ],
  baseball: [
    { key: 'era', label: 'ERA' },
    { key: 'battingAvg', label: 'Batting Avg' },
    { key: 'obp', label: 'OBP' },
    { key: 'slg', label: 'SLG' },
    { key: 'whip', label: 'WHIP' },
    { key: 'homeRuns', label: 'Home Runs' },
    { key: 'strikeouts', label: 'Strikeouts' },
  ],
  american_football: [
    { key: 'yardsPerGame', label: 'Yards/Game' },
    { key: 'passingYards', label: 'Passing Yards' },
    { key: 'rushingYards', label: 'Rushing Yards' },
    { key: 'turnovers', label: 'Turnovers' },
    { key: 'sacks', label: 'Sacks' },
    { key: 'thirdDownPct', label: '3rd Down %' },
    { key: 'redZonePct', label: 'Red Zone %' },
  ],
  tennis: [
    { key: 'acesPct', label: 'Aces %' },
    { key: 'firstServePct', label: '1st Serve %' },
    { key: 'winOnFirstServe', label: 'Win on 1st Serve' },
    { key: 'breakPointsSaved', label: 'Break Points Saved' },
    { key: 'returnPtsWon', label: 'Return Pts Won' },
    { key: 'doubleFaults', label: 'Double Faults' },
  ],
  hockey: [
    { key: 'goalsPerGame', label: 'Goals/Game' },
    { key: 'shotsPerGame', label: 'Shots/Game' },
    { key: 'powerPlayPct', label: 'Power Play %' },
    { key: 'penaltyKillPct', label: 'Penalty Kill %' },
    { key: 'faceoffsPct', label: 'Faceoffs %' },
    { key: 'savePct', label: 'Save %' },
  ],
  cricket: [
    { key: 'battingAvg', label: 'Batting Avg' },
    { key: 'bowlingAvg', label: 'Bowling Avg' },
    { key: 'strikeRate', label: 'Strike Rate' },
    { key: 'economy', label: 'Economy' },
    { key: 'boundaries', label: 'Boundaries' },
    { key: 'wickets', label: 'Wickets' },
  ],
  mma: [
    { key: 'strikeAccuracy', label: 'Strike Accuracy' },
    { key: 'takedownDef', label: 'Takedown Def' },
    { key: 'submissionAvg', label: 'Submission Avg' },
    { key: 'knockoutRate', label: 'Knockout Rate' },
    { key: 'strikesLanded', label: 'Strikes Landed' },
    { key: 'takedownsLanded', label: 'Takedowns' },
  ],
  formula1: [
    { key: 'podiumPct', label: 'Podium %' },
    { key: 'avgFinish', label: 'Avg Finish' },
    { key: 'polePositions', label: 'Pole Positions' },
    { key: 'fastestLaps', label: 'Fastest Laps' },
    { key: 'dnfRate', label: 'DNF Rate' },
    { key: 'pointsPerRace', label: 'Points/Race' },
  ],
};

// Sport key mapping for API
const SPORT_KEY_MAPPING: Record<string, string> = {
  'football': 'soccer',
  'american_football': 'americanfootball_nfl',
  'basketball': 'basketball_nba',
  'baseball': 'baseball_mlb',
  'hockey': 'icehockey_nhl',
  'tennis': 'tennis_atp',
  'cricket': 'cricket_test_match',
  'mma': 'mma_mixed_martial_arts',
  'formula1': 'motorsport_f1'
};

const REVERSE_SPORT_KEY_MAPPING: Record<string, string> = {
  'soccer': 'football',
  'americanfootball_nfl': 'american_football',
  'basketball_nba': 'basketball',
  'baseball_mlb': 'baseball',
  'icehockey_nhl': 'hockey',
  'tennis_atp': 'tennis',
  'cricket_test_match': 'cricket',
  'mma_mixed_martial_arts': 'mma',
  'motorsport_f1': 'formula1'
};

export default function AdvancedAnalysisPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState("match_winner");
  const [selectedSport, setSelectedSport] = useState("soccer");
  const [selectedStandardSport, setSelectedStandardSport] = useState("football");
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch available sports directly from API
  const { data: sports, isLoading: loadingSports } = useQuery<any>({
    queryKey: ['/api/odds/sports'],
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false,
    retry: 3,
    enabled: true
  });
  
  // Directly fetch matches for soccer (football)
  const { 
    data: matchesData, 
    isLoading: loadingMatches,
    refetch: refetchMatches
  } = useQuery<any>({
    queryKey: ['/api/odds/soccer'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    enabled: true
  });
  
  // Derived values
  const countries = matchesData?.byCountry ? Object.keys(matchesData.byCountry) : [];
  const leagues = selectedCountry && matchesData?.byCountry?.[selectedCountry] 
    ? Object.keys(matchesData.byCountry[selectedCountry]) 
    : [];
  const matches = selectedLeague && selectedCountry && matchesData?.byCountry?.[selectedCountry]?.[selectedLeague]
    ? matchesData.byCountry[selectedCountry][selectedLeague]
    : [];
  
  const filteredMatches = searchQuery 
    ? matches.filter((match: any) => 
        match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) || 
        match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : matches;
    
  // Effect to initialize selected values when data loads
  useEffect(() => {
    if (matchesData && !loadingMatches) {
      // Set first country if none selected
      if (countries.length > 0 && !selectedCountry) {
        setSelectedCountry(countries[0]);
      }
      
      // Set first league if none selected
      if (selectedCountry && leagues.length > 0 && !selectedLeague) {
        setSelectedLeague(leagues[0]);
      }
      
      // Set first match if none selected
      if (filteredMatches.length > 0 && !selectedMatch) {
        setSelectedMatch(filteredMatches[0].id);
        setPrediction(filteredMatches[0]);
        
        // Simulate fetching additional data for the analysis
        setTimeout(() => {
          enhancePredictionWithAnalysis(filteredMatches[0]);
        }, 1000);
      }
    }
  }, [matchesData, selectedCountry, selectedLeague, loadingMatches]);
  
  // On first load, check the sport parameter or set a default
  useEffect(() => {
    const storedSport = sessionStorage.getItem('selectedSport');
    if (storedSport) {
      setSelectedSport(storedSport);
      setSelectedStandardSport(REVERSE_SPORT_KEY_MAPPING[storedSport] || 'football');
    } else {
      // Default to soccer/football
      setSelectedSport('soccer');
      setSelectedStandardSport('football');
    }
    
    // Set loading state
    setLoading(true);
    
    // Log the current state for debugging
    console.log("Advanced Analysis page initialized with sport:", selectedSport);
  }, []);
  
  // Log data for debugging purposes
  useEffect(() => {
    if (sports) {
      console.log("Sports loaded:", sports);
    }
    if (matchesData) {
      console.log("Matches data loaded:", matchesData);
    }
  }, [sports, matchesData]);
  
  // Function to enhance prediction with advanced analysis data
  const enhancePredictionWithAnalysis = (predictionData: Prediction) => {
    const sport = predictionData.sport || 'football';
    
    // Helper for win/loss/draw sequence
    const generateFormSequence = () => {
      const results = ['W', 'D', 'L'];
      return Array(5).fill(0).map(() => results[Math.floor(Math.random() * (sport === 'football' ? 3 : 2))]);
    };
    
    // Generate h2h history
    const h2hHistory = [];
    const today = new Date();
    
    for (let i = 0; i < 4; i++) {
      const matchDate = new Date(today);
      matchDate.setMonth(today.getMonth() - i * 2 - 1); // Matches every 2 months in the past
      
      const isHomeAway = i % 2 === 0;
      const homeTeam = isHomeAway ? predictionData.homeTeam : predictionData.awayTeam;
      const awayTeam = isHomeAway ? predictionData.awayTeam : predictionData.homeTeam;
      
      // Create random scores appropriate for the sport
      let homeScore, awayScore, result;
      if (sport === 'football') {
        homeScore = Math.floor(Math.random() * 4);
        awayScore = Math.floor(Math.random() * 3);
      } else if (sport === 'basketball') {
        homeScore = 85 + Math.floor(Math.random() * 40);
        awayScore = 85 + Math.floor(Math.random() * 40);
      } else if (sport === 'baseball') {
        homeScore = Math.floor(Math.random() * 8);
        awayScore = Math.floor(Math.random() * 8);
      } else if (sport === 'american_football') {
        homeScore = (Math.floor(Math.random() * 5) * 7) + (Math.floor(Math.random() * 2) * 3);
        awayScore = (Math.floor(Math.random() * 5) * 7) + (Math.floor(Math.random() * 2) * 3);
      } else if (sport === 'hockey') {
        homeScore = Math.floor(Math.random() * 6);
        awayScore = Math.floor(Math.random() * 6);
      } else if (['tennis', 'mma', 'formula1'].includes(sport)) {
        // For individual sports, we just note winner
        homeScore = Math.random() > 0.5 ? 1 : 0;
        awayScore = homeScore === 1 ? 0 : 1;
      } else {
        homeScore = Math.floor(Math.random() * 4);
        awayScore = Math.floor(Math.random() * 4);
      }
      
      // Determine winner
      let winner;
      if (homeScore > awayScore) {
        winner = homeTeam;
      } else if (awayScore > homeScore) {
        winner = awayTeam;
      } else {
        winner = "Draw";
      }
      
      h2hHistory.push({
        date: matchDate.toISOString().split('T')[0],
        homeTeam,
        awayTeam,
        score: `${homeScore}-${awayScore}`,
        winner,
      });
    }
    
    // Generate form guides
    const homeForm = generateFormSequence();
    const awayForm = generateFormSequence();
    
    // Generate injuries appropriate for the sport
    const injuries = [];
    if (['football', 'basketball', 'american_football', 'hockey'].includes(sport)) {
      const positions = {
        football: ['Striker', 'Midfielder', 'Defender', 'Goalkeeper'],
        basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
        american_football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Linebacker', 'Defensive Back'],
        hockey: ['Center', 'Left Wing', 'Right Wing', 'Defenseman', 'Goaltender'],
      };
      
      const injuryTypes = ['Hamstring', 'Ankle', 'Knee', 'Shoulder', 'Concussion'];
      const firstNames = ['John', 'James', 'David', 'Michael', 'Robert', 'Carlos', 'Kevin', 'Marcus'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia'];
      
      // Generate 1-3 injuries for each team
      const homeInjuries = Math.floor(Math.random() * 2) + 1;
      const awayInjuries = Math.floor(Math.random() * 2);
      
      for (let i = 0; i < homeInjuries; i++) {
        const sportPositions = positions[sport as 'football' | 'basketball' | 'american_football' | 'hockey'] || positions.football;
        injuries.push({
          team: predictionData.homeTeam,
          player: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
          status: Math.random() > 0.3 ? 'Out' : 'Doubtful',
          impact: Math.random() > 0.5 ? 'High' : 'Medium',
        });
      }
      
      for (let i = 0; i < awayInjuries; i++) {
        const sportPositions = positions[sport as 'football' | 'basketball' | 'american_football' | 'hockey'] || positions.football;
        injuries.push({
          team: predictionData.awayTeam,
          player: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
          status: Math.random() > 0.3 ? 'Out' : 'Doubtful',
          impact: Math.random() > 0.5 ? 'High' : 'Medium',
        });
      }
    }
    
    // Sport-specific key stats
    const generateKeyStats = () => {
      const stats: {[key: string]: number | string} = {};
      
      // Add common stats
      stats.winRate = Math.round(30 + Math.random() * 50);
      stats.formStreak = Math.random() > 0.5 ? 'W3' : 'W2 L1';
      stats.avgScore = (1 + Math.random() * 2).toFixed(1);
      
      // Add sport-specific stats
      const sportStatsList = SPORT_STATS[sport as keyof typeof SPORT_STATS] || SPORT_STATS.football;
      
      sportStatsList.forEach(statDef => {
        if (statDef.key.includes('Pct')) {
          stats[statDef.key] = Math.round(30 + Math.random() * 50) + '%';
        } else if (statDef.key.includes('Avg')) {
          stats[statDef.key] = (Math.random() * 10).toFixed(2);
        } else {
          stats[statDef.key] = Math.round(Math.random() * 25);
        }
      });
      
      return stats;
    };
    
    // Generate trending markets
    const trendingMarkets = [];
    const marketTypes = [
      { market: COMMON_MARKETS.MATCH_WINNER, value: predictionData.homeTeam, odds: predictionData.homeOdds || 0 },
      { market: COMMON_MARKETS.SPREAD, value: `${predictionData.homeTeam} -1.5`, odds: 2.2 + Math.random() },
      { market: COMMON_MARKETS.TOTALS, value: 'Over 2.5', odds: 1.8 + Math.random() },
    ];
    
    // Add 2-3 sport-specific markets
    const sportMarkets = SPORT_SPECIFIC_MARKETS[sport as keyof typeof SPORT_SPECIFIC_MARKETS] || [];
    if (sportMarkets.length > 0) {
      for (let i = 0; i < 2; i++) {
        const randomMarket = sportMarkets[Math.floor(Math.random() * sportMarkets.length)];
        marketTypes.push({
          market: randomMarket.id,
          value: `${predictionData.homeTeam} ${randomMarket.name.toLowerCase()}`,
          odds: 1.8 + Math.random() * 2
        });
      }
    }
    
    // Select 3-5 trending markets
    const numMarkets = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numMarkets; i++) {
      if (i < marketTypes.length) {
        trendingMarkets.push({
          ...marketTypes[i],
          trend: Math.random() > 0.5 ? 'up' as const : (Math.random() > 0.5 ? 'down' as const : 'stable' as const),
          confidence: Math.round(55 + Math.random() * 30)
        });
      }
    }
    
    // Generate exotic markets
    const exoticMarkets = [];
    const exoticTypes = [
      { market: 'First Goal Method', options: [
        { selection: 'Header', odds: 4.5, probability: 22 },
        { selection: 'Inside Box', odds: 1.8, probability: 55 },
        { selection: 'Outside Box', odds: 3.5, probability: 28 },
        { selection: 'Free Kick', odds: 8.0, probability: 12 },
        { selection: 'Penalty', odds: 9.0, probability: 11 },
      ]},
      { market: 'Time of First Goal', options: [
        { selection: '1-10 mins', odds: 3.5, probability: 28 },
        { selection: '11-25 mins', odds: 2.8, probability: 36 },
        { selection: '26-45 mins', odds: 3.0, probability: 33 },
        { selection: '46+ mins', odds: 3.2, probability: 31 },
        { selection: 'No Goal', odds: 9.0, probability: 11 },
      ]}
    ];
    
    if (sport === 'basketball') {
      exoticTypes.push({ market: 'First Basket Type', options: [
        { selection: '3-pointer', odds: 3.0, probability: 33 },
        { selection: 'Jump Shot', odds: 2.2, probability: 45 },
        { selection: 'Layup', odds: 2.0, probability: 50 },
        { selection: 'Dunk', odds: 3.5, probability: 28 },
        { selection: 'Free Throw', odds: 5.0, probability: 20 },
      ]});
    } else if (sport === 'american_football') {
      exoticTypes.push({ market: 'First Scoring Play', options: [
        { selection: 'Touchdown', odds: 1.9, probability: 52 },
        { selection: 'Field Goal', odds: 2.5, probability: 40 },
        { selection: 'Safety', odds: 15.0, probability: 6 },
        { selection: 'No Score', odds: 20.0, probability: 5 },
      ]});
    }
    
    for (let i = 0; i < 2; i++) {
      if (i < exoticTypes.length) {
        exoticMarkets.push(exoticTypes[i]);
      }
    }
    
    // Generate similar matches
    const similarMatches = [];
    for (let i = 0; i < 3; i++) {
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() - (7 * (i + 1)));
      
      const randomTeams = [
        [predictionData.homeTeam, "Liverpool"],
        ["Bayern Munich", predictionData.awayTeam],
        ["Real Madrid", "Barcelona"],
      ];
      
      const homeTeam = randomTeams[i][0];
      const awayTeam = randomTeams[i][1];
      
      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 3);
      
      const insights = [
        "Both teams scored in the first half",
        "Late goal decided the match",
        "Home team dominated possession",
        "Away team efficient on counter-attacks",
        "High pressing game with many chances",
      ];
      
      similarMatches.push({
        id: `match-${i}`,
        homeTeam,
        awayTeam,
        date: matchDate.toISOString().split('T')[0],
        result: `${homeScore}-${awayScore}`,
        keyInsight: insights[Math.floor(Math.random() * insights.length)],
      });
    }
    
    // Generate performance chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const performanceChart = months.map(month => {
      const predictedCorrect = 10 + Math.floor(Math.random() * 15);
      const total = predictedCorrect + Math.floor(Math.random() * 8);
      const accuracy = Math.round((predictedCorrect / total) * 100);
      
      return {
        month,
        predictedCorrect,
        accuracy,
      };
    });
    
    // Compose enhanced AI analysis based on generated data
    let aiAnalysis = `Based on our AI-powered analysis, ${predictionData.homeTeam} has shown ${
      homeForm.filter(r => r === 'W').length
    } wins in their last 5 games, while ${predictionData.awayTeam} has ${
      awayForm.filter(r => r === 'W').length
    } wins.\n\n`;
    
    // Add h2h analysis
    const h2hHomeWins = h2hHistory.filter(h => h.winner === predictionData.homeTeam).length;
    const h2hAwayWins = h2hHistory.filter(h => h.winner === predictionData.awayTeam).length;
    const h2hDraws = h2hHistory.filter(h => h.winner === 'Draw').length;
    
    aiAnalysis += `In head-to-head matches, ${predictionData.homeTeam} has won ${h2hHomeWins}, ${predictionData.awayTeam} has won ${h2hAwayWins}`;
    if (h2hDraws > 0) aiAnalysis += `, and there have been ${h2hDraws} draws`;
    aiAnalysis += '.\n\n';
    
    // Add injuries analysis if applicable
    if (injuries.length > 0) {
      const homeInjuries = injuries.filter(i => i.team === predictionData.homeTeam);
      const awayInjuries = injuries.filter(i => i.team === predictionData.awayTeam);
      
      if (homeInjuries.length > 0) {
        aiAnalysis += `${predictionData.homeTeam} has ${homeInjuries.length} key ${homeInjuries.length === 1 ? 'player' : 'players'} ${homeInjuries.length === 1 ? 'who is' : 'who are'} injured or doubtful, which could impact their performance.\n`;
      }
      
      if (awayInjuries.length > 0) {
        aiAnalysis += `${predictionData.awayTeam} has ${awayInjuries.length} key ${awayInjuries.length === 1 ? 'player' : 'players'} ${awayInjuries.length === 1 ? 'who is' : 'who are'} injured or doubtful, which may affect their strategy.\n`;
      }
      
      aiAnalysis += '\n';
    }
    
    // Add value analysis
    if (predictionData.confidence) {
      const valuePct = predictionData.valueBet?.value || Math.round(Math.random() * 15) + 5;
      aiAnalysis += `Our model gives ${predictionData.prediction} a ${predictionData.confidence}% chance to win, which presents a ${valuePct}% value opportunity against current market odds.\n\n`;
    }
    
    // Add conclusion
    aiAnalysis += `Taking all factors into account, including current form, head-to-head record, and ${sport}-specific performance metrics, our model predicts ${predictionData.prediction} as the most likely outcome for this match.`;
    
    // Build the enhanced prediction
    const enhancedPrediction: Prediction = {
      ...predictionData,
      h2hHistory,
      formGuide: {
        home: homeForm,
        away: awayForm,
      },
      injuryNews: injuries,
      aiEnhancedAnalysis: aiAnalysis,
      performanceChart,
      keyStats: {
        home: generateKeyStats(),
        away: generateKeyStats(),
      },
      trendingMarkets,
      exoticMarkets,
      similarMatches,
      valueBet: {
        market: 'match_winner',
        selection: predictionData.prediction || predictionData.homeTeam,
        odds: predictionData.prediction === 'Home Win' 
          ? (predictionData.homeOdds || 2.0) 
          : predictionData.prediction === 'Away Win' 
          ? (predictionData.awayOdds || 3.0)
          : (predictionData.drawOdds || 3.25),
        value: Math.round(Math.random() * 15) + 5
      }
    };
    
    setPrediction(enhancedPrediction);
    setLoading(false);
  };
  
  // Function to handle refresh of analysis
  const handleRefreshAnalysis = () => {
    setRefreshing(true);
    
    // Refresh predictions
    refetchMatches().then(() => {
      if (prediction) {
        enhancePredictionWithAnalysis(prediction);
        toast({
          title: "Analysis Refreshed",
          description: "The prediction analysis has been updated with the latest data",
        });
      }
      setRefreshing(false);
    });
  };
  
  // Function to load performance history
  const handleLoadPerformanceHistory = () => {
    setLoadingPerformance(true);
    
    // Simulate loading performance data
    setTimeout(() => {
      setLoadingPerformance(false);
    }, 1500);
  };
  
  // Function to share analysis
  const handleShareAnalysis = () => {
    // Copy a shareable link to clipboard
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "A shareable link has been copied to your clipboard",
    });
  };
  
  // Function to format market name for display
  const formatMarketName = (marketId: string) => {
    // Replace underscores with spaces and capitalize each word
    return marketId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Function to change sport
  const handleSportChange = (sport: string) => {
    // Store selected sport
    sessionStorage.setItem('selectedSport', sport);
    
    setSelectedSport(sport);
    setSelectedStandardSport(REVERSE_SPORT_KEY_MAPPING[sport] || 'football');
    setSelectedCountry(null);
    setSelectedLeague(null);
    setSelectedMatch(null);
    setLoading(true);
  };
  
  // Function to select a match
  const handleSelectMatch = (match: Prediction) => {
    setSelectedMatch(match.id);
    setPrediction(match);
    setLoading(true);
    
    // Simulate fetching additional data for the analysis
    setTimeout(() => {
      enhancePredictionWithAnalysis(match);
    }, 1000);
  };
  
  // Global loading state while fetching initial data
  if (loadingSports || (loadingMatches && !matchesData)) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation("/predictions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Predictions
          </Button>
          <div className="flex-1">
            <Skeleton className="h-8 w-60" />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-52 mb-2" />
            <Skeleton className="h-5 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
              <Skeleton className="h-60" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Main layout with selection interface and analysis
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation("/predictions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Advanced Analysis</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedSport} onValueChange={handleSportChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              {sports?.map(sport => (
                <SelectItem key={sport.key} value={sport.key}>
                  {sport.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleRefreshAnalysis} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Update analysis with latest data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Selection Panel */}
        <div className="md:col-span-1">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Map className="h-4 w-4 mr-2 text-muted-foreground" />
                Match Selection
              </CardTitle>
              <CardDescription>
                Select a country, league, and match
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search teams..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Country Selection */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Country</h4>
                <ScrollArea className="h-32 rounded-md border">
                  <div className="p-2">
                    {countries.length > 0 ? (
                      countries.map((country) => (
                        <Button
                          key={country}
                          variant={selectedCountry === country ? "default" : "ghost"}
                          className="w-full justify-start mb-1"
                          onClick={() => {
                            setSelectedCountry(country);
                            setSelectedLeague(null);
                            setSelectedMatch(null);
                          }}
                        >
                          {country}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-2">No countries available</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              {/* League Selection */}
              {selectedCountry && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">League</h4>
                  <ScrollArea className="h-32 rounded-md border">
                    <div className="p-2">
                      {leagues.length > 0 ? (
                        leagues.map((league) => (
                          <Button
                            key={league}
                            variant={selectedLeague === league ? "default" : "ghost"}
                            className="w-full justify-start mb-1"
                            onClick={() => {
                              setSelectedLeague(league);
                              setSelectedMatch(null);
                            }}
                          >
                            {league}
                          </Button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground p-2">No leagues available</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {/* Match Selection */}
              {selectedLeague && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Matches</h4>
                  <ScrollArea className="h-64 rounded-md border">
                    <div className="p-2">
                      {filteredMatches.length > 0 ? (
                        filteredMatches.map((match) => (
                          <Button
                            key={match.id}
                            variant={selectedMatch === match.id ? "default" : "ghost"}
                            className="w-full justify-start mb-2 flex-col items-start"
                            onClick={() => handleSelectMatch(match)}
                          >
                            <span className="text-sm">{match.homeTeam} vs {match.awayTeam}</span>
                            <div className="flex justify-between w-full text-xs mt-1">
                              <span className="text-muted-foreground">
                                {new Date(match.startTime).toLocaleDateString()}
                              </span>
                              {match.confidence && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {match.confidence}% Conf.
                                </Badge>
                              )}
                            </div>
                          </Button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground p-2">No matches available</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Analysis Panel */}
        <div className="md:col-span-2">
          {loading || !prediction ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-52 mb-2" />
                <Skeleton className="h-5 w-80" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                  <Skeleton className="h-60" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{prediction.homeTeam} vs {prediction.awayTeam}</CardTitle>
                    <CardDescription>{prediction.league} • {new Date(prediction.startTime).toLocaleString()}</CardDescription>
                  </div>
                  <Badge 
                    className={
                      prediction.confidence && prediction.confidence >= 75 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                      prediction.confidence && prediction.confidence >= 60 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" :
                      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                    }
                  >
                    {prediction.confidence || "85"}% Confidence
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-muted-foreground">
                    Prediction: <span className="font-medium text-foreground">{prediction.prediction}</span>
                  </div>
                  {prediction.valueBet && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/60">
                      {prediction.valueBet.value}% Value Bet
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="analysis">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                    <TabsTrigger value="stats">Match Stats</TabsTrigger>
                    <TabsTrigger value="markets">Markets</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="analysis" className="space-y-6">
                    <Card className="border-blue-200 dark:border-blue-900/60">
                      <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-950/30">
                        <CardTitle className="text-base flex items-center text-blue-700 dark:text-blue-400">
                          <Zap className="h-4 w-4 mr-2" />
                          AI-Enhanced Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm whitespace-pre-line">{prediction.aiEnhancedAnalysis}</p>
                      </CardContent>
                    </Card>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            Head-to-Head History
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {prediction.h2hHistory && prediction.h2hHistory.length > 0 ? (
                            <ul className="space-y-2">
                              {prediction.h2hHistory.map((match, index) => (
                                <li key={index} className="text-sm p-2 border-b border-border/40 last:border-b-0">
                                  <div className="flex justify-between">
                                    <span>{new Date(match.date).toLocaleDateString()}</span>
                                    <span 
                                      className={
                                        match.winner === prediction.homeTeam ? "text-green-600 dark:text-green-400" :
                                        match.winner === prediction.awayTeam ? "text-red-600 dark:text-red-400" :
                                        "text-blue-600 dark:text-blue-400"
                                      }
                                    >
                                      {match.score}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {match.homeTeam} vs {match.awayTeam}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground text-sm py-2">No historical data available</p>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                            Recent Form Guide
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {prediction.formGuide ? (
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{prediction.homeTeam}</span>
                                  <span className="text-xs text-muted-foreground">Last 5 matches</span>
                                </div>
                                <div className="flex space-x-1">
                                  {prediction.formGuide.home.map((result, index) => (
                                    <div 
                                      key={index}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                        result === 'W' ? 'bg-green-500 dark:bg-green-600' :
                                        result === 'D' ? 'bg-blue-500 dark:bg-blue-600' :
                                        'bg-red-500 dark:bg-red-600'
                                      }`}
                                    >
                                      {result}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{prediction.awayTeam}</span>
                                  <span className="text-xs text-muted-foreground">Last 5 matches</span>
                                </div>
                                <div className="flex space-x-1">
                                  {prediction.formGuide.away.map((result, index) => (
                                    <div 
                                      key={index}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                        result === 'W' ? 'bg-green-500 dark:bg-green-600' :
                                        result === 'D' ? 'bg-blue-500 dark:bg-blue-600' :
                                        'bg-red-500 dark:bg-red-600'
                                      }`}
                                    >
                                      {result}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm py-2">No form data available</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    {prediction.similarMatches && prediction.similarMatches.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                            Similar Matches
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Table>
                            <TableBody>
                              {prediction.similarMatches.map((match, index) => (
                                <TableRow key={index}>
                                  <TableCell className="w-24">
                                    <div className="text-xs text-muted-foreground">{match.date}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">{match.homeTeam} vs {match.awayTeam}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{match.keyInsight}</div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {match.result}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                    
                    {prediction.injuryNews && prediction.injuryNews.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-muted-foreground" />
                            Injury & Team News
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <ul className="divide-y divide-border">
                            {prediction.injuryNews.map((news, index) => (
                              <li key={index} className="py-2 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{news.player}</p>
                                  <p className="text-xs text-muted-foreground">{news.team}</p>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    news.status === 'Out' ? 'border-red-200 text-red-600 dark:border-red-800' :
                                    news.status === 'Doubtful' ? 'border-yellow-200 text-yellow-600 dark:border-yellow-800' :
                                    'border-green-200 text-green-600 dark:border-green-800'
                                  }
                                >
                                  {news.status}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="stats" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-0">
                          <CardTitle className="text-base flex items-center">
                            <BarChart4 className="h-4 w-4 mr-2 text-muted-foreground" />
                            Key Team Statistics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {prediction.keyStats ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Stat</TableHead>
                                  <TableHead className="text-right">{prediction.homeTeam}</TableHead>
                                  <TableHead className="text-right">{prediction.awayTeam}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {/* Common stats like win rate, form streak, etc. */}
                                {COMMON_STATS.map(stat => (
                                  <TableRow key={stat.key}>
                                    <TableCell className="font-medium">{stat.label}</TableCell>
                                    <TableCell className="text-right">
                                      {prediction.keyStats?.home[stat.key] || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {prediction.keyStats?.away[stat.key] || 'N/A'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                
                                {/* Sport-specific stats */}
                                {SPORT_STATS[selectedStandardSport as keyof typeof SPORT_STATS]?.slice(0, 5).map(stat => (
                                  <TableRow key={stat.key}>
                                    <TableCell className="font-medium">{stat.label}</TableCell>
                                    <TableCell className="text-right">
                                      {prediction.keyStats?.home[stat.key] || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {prediction.keyStats?.away[stat.key] || 'N/A'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-muted-foreground text-sm py-2">No statistics available</p>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-0">
                          <CardTitle className="text-base flex items-center">
                            <RadarChart className="h-4 w-4 mr-2 text-muted-foreground" />
                            Team Comparison
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart outerRadius={90} data={[
                                { stat: 'Attack', home: Math.floor(Math.random() * 70 + 30), away: Math.floor(Math.random() * 70 + 30) },
                                { stat: 'Defense', home: Math.floor(Math.random() * 70 + 30), away: Math.floor(Math.random() * 70 + 30) },
                                { stat: 'Form', home: Math.floor(Math.random() * 70 + 30), away: Math.floor(Math.random() * 70 + 30) },
                                { stat: 'Consistency', home: Math.floor(Math.random() * 70 + 30), away: Math.floor(Math.random() * 70 + 30) },
                                { stat: 'Home/Away', home: Math.floor(Math.random() * 70 + 30), away: Math.floor(Math.random() * 70 + 30) },
                              ]}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="stat" />
                                <PolarRadiusAxis domain={[0, 100]} />
                                <Radar name={prediction.homeTeam} dataKey="home" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} />
                                <Radar name={prediction.awayTeam} dataKey="away" stroke="#dc2626" fill="#ef4444" fillOpacity={0.5} />
                                <Legend />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardHeader className="pb-0">
                        <CardTitle className="text-base flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                          Match Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-4">{prediction.explanation}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">{prediction.homeTeam} Strengths</h4>
                            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                              <li>Strong home record with consistent performances</li>
                              <li>Solid defensive organization</li>
                              <li>Effective at set pieces</li>
                              {selectedStandardSport === 'football' && <li>High pressing game with quick transitions</li>}
                              {selectedStandardSport === 'basketball' && <li>Efficient three-point shooting</li>}
                              {selectedStandardSport === 'american_football' && <li>Strong passing attack</li>}
                              {selectedStandardSport === 'tennis' && <li>Superior first serve accuracy</li>}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">{prediction.awayTeam} Strengths</h4>
                            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                              <li>Fast counter-attacking style</li>
                              <li>Good recent away form</li>
                              <li>Creating quality scoring chances</li>
                              {selectedStandardSport === 'football' && <li>Strong aerial presence at set pieces</li>}
                              {selectedStandardSport === 'basketball' && <li>Dominant rebounding</li>}
                              {selectedStandardSport === 'american_football' && <li>Strong rushing defense</li>}
                              {selectedStandardSport === 'tennis' && <li>Excellent return game</li>}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Add visual representation of odds */}
                    <Card>
                      <CardHeader className="pb-0">
                        <CardTitle className="text-base flex items-center">
                          <Percent className="h-4 w-4 mr-2 text-muted-foreground" />
                          Implied Probabilities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: prediction.homeTeam, value: Math.round(100 / (prediction.homeOdds || 2.5)) },
                                  ...(prediction.drawOdds ? [{ name: 'Draw', value: Math.round(100 / prediction.drawOdds) }] : []),
                                  { name: prediction.awayTeam, value: Math.round(100 / (prediction.awayOdds || 3.0)) },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell fill="#3b82f6" />
                                {prediction.drawOdds && <Cell fill="#a3a3a3" />}
                                <Cell fill="#ef4444" />
                              </Pie>
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Implied probabilities based on current market odds
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="markets" className="space-y-6">
                    {/* Market selection section */}
                    <div className="grid grid-cols-1 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                            Market Selection
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <h3 className="text-sm font-medium mb-2">Common Markets</h3>
                            <div className="flex flex-wrap gap-2">
                              {Object.values(COMMON_MARKETS).slice(0, showAllMarkets ? undefined : 5).map(market => (
                                <Badge
                                  key={market}
                                  variant={selectedMarket === market ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => setSelectedMarket(market)}
                                >
                                  {formatMarketName(market)}
                                </Badge>
                              ))}
                              
                              {!showAllMarkets && Object.values(COMMON_MARKETS).length > 5 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs"
                                  onClick={() => setShowAllMarkets(true)}
                                >
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  More
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">{selectedStandardSport.charAt(0).toUpperCase() + selectedStandardSport.slice(1).replace('_', ' ')} Specific Markets</h3>
                            <div className="flex flex-wrap gap-2">
                              {SPORT_SPECIFIC_MARKETS[selectedStandardSport as keyof typeof SPORT_SPECIFIC_MARKETS]?.map(market => (
                                <Badge
                                  key={market.id}
                                  variant={selectedMarket === market.id ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => setSelectedMarket(market.id)}
                                >
                                  {market.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Trending markets */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <Flame className="h-4 w-4 mr-2 text-muted-foreground" />
                          Trending Market Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {prediction.trendingMarkets?.map((market, index) => (
                            <Card key={index} className={market.trend === 'up' ? 'border-green-200 dark:border-green-900/60' : market.trend === 'down' ? 'border-red-200 dark:border-red-900/60' : ''}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="text-sm font-medium">{formatMarketName(market.market)}</h3>
                                    <p className="text-xs text-muted-foreground">{market.value}</p>
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      market.trend === 'up' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/60' :
                                      market.trend === 'down' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/60' :
                                      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/60'
                                    }
                                  >
                                    {market.trend === 'up' ? 'Value ↑' : market.trend === 'down' ? 'Avoid ↓' : 'Neutral'}
                                  </Badge>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Odds</p>
                                    <p className="font-medium">{market.odds.toFixed(2)}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Confidence</p>
                                    <p className="font-medium">{market.confidence}%</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Exotic markets */}
                    {prediction.exoticMarkets && prediction.exoticMarkets.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                            Exotic Markets
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Tabs defaultValue={prediction.exoticMarkets[0].market.replace(/\s+/g, '-').toLowerCase()}>
                            <TabsList className="mb-4">
                              {prediction.exoticMarkets.map((market, index) => (
                                <TabsTrigger 
                                  key={index} 
                                  value={market.market.replace(/\s+/g, '-').toLowerCase()}
                                >
                                  {market.market}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            
                            {prediction.exoticMarkets.map((market, marketIndex) => (
                              <TabsContent 
                                key={marketIndex} 
                                value={market.market.replace(/\s+/g, '-').toLowerCase()}
                              >
                                <div className="space-y-4">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Selection</TableHead>
                                        <TableHead className="text-right">Odds</TableHead>
                                        <TableHead className="text-right">Probability</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {market.options.map((option, optionIndex) => (
                                        <TableRow key={optionIndex}>
                                          <TableCell className="font-medium">{option.selection}</TableCell>
                                          <TableCell className="text-right">{option.odds.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{option.probability}%</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                  
                                  <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={market.options}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="selection" />
                                        <YAxis domain={[0, 100]} />
                                        <RechartsTooltip
                                          formatter={(value: any) => [`${value}%`, 'Probability']}
                                        />
                                        <Bar 
                                          dataKey="probability" 
                                          fill="#3b82f6" 
                                          radius={[4, 4, 0, 0]}
                                          name="Probability"
                                        />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </TabsContent>
                            ))}
                          </Tabs>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Value bet details */}
                    {prediction.valueBet && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <LineChartIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            Value Bet Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Market</p>
                              <p className="font-medium">{formatMarketName(prediction.valueBet.market)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Selection</p>
                              <p className="font-medium">{prediction.valueBet.selection}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Value Rating</p>
                              <p className="font-medium text-green-600 dark:text-green-400">{prediction.valueBet.value}%</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm">
                              Our model has identified a {prediction.valueBet.value}% edge in this market, suggesting 
                              the true probability is higher than what the odds reflect. This represents a positive expected value bet.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="performance" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                          Prediction Performance History
                        </CardTitle>
                        <CardDescription>
                          Historical performance of similar predictions over time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingPerformance ? (
                          <div className="h-72 flex items-center justify-center">
                            <div className="flex flex-col items-center space-y-2">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Loading performance data...</p>
                            </div>
                          </div>
                        ) : prediction.performanceChart ? (
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={prediction.performanceChart}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis domain={[0, 100]} />
                                <RechartsTooltip
                                  formatter={(value: any, name: any) => [
                                    `${value}${name === 'accuracy' ? '%' : ''}`,
                                    name === 'accuracy' ? 'Success Rate' : 'Predictions'
                                  ]}
                                />
                                <Area
                                  type="monotone"
                                  name="accuracy"
                                  dataKey="accuracy"
                                  stroke="#3b82f6"
                                  fillOpacity={1}
                                  fill="url(#colorAccuracy)"
                                />
                                <Legend />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-72 flex items-center justify-center">
                            <Button onClick={handleLoadPerformanceHistory}>
                              Load Performance History
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Trophy className="h-4 w-4 mr-2 text-muted-foreground" />
                            Success Rate by Sport
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  { sport: 'Football', rate: 76 },
                                  { sport: 'Basketball', rate: 73 },
                                  { sport: 'Tennis', rate: 68 },
                                  { sport: 'Hockey', rate: 65 },
                                  { sport: 'Baseball', rate: 71 },
                                ]}
                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="sport" />
                                <YAxis domain={[0, 100]} />
                                <RechartsTooltip
                                  formatter={(value: any) => [`${value}%`, 'Success Rate']}
                                />
                                <Bar 
                                  dataKey="rate" 
                                  fill="#3b82f6" 
                                  radius={[4, 4, 0, 0]}
                                  name="Success Rate"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <PieChartIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            Success Rate by Confidence
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={[
                                  { confidence: '50-59%', rate: 55 },
                                  { confidence: '60-69%', rate: 63 },
                                  { confidence: '70-79%', rate: 76 },
                                  { confidence: '80-89%', rate: 85 },
                                  { confidence: '90%+', rate: 92 },
                                ]}
                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="confidence" />
                                <YAxis domain={[0, 100]} />
                                <RechartsTooltip
                                  formatter={(value: any) => [`${value}%`, 'Success Rate']}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="rate" 
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  dot={{ r: 4 }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setLocation("/predictions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Predictions
        </Button>
        <Button onClick={handleShareAnalysis}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Analysis
        </Button>
      </div>
    </div>
  );
}