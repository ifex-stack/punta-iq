import { 
  Trophy, 
  CircleDot, 
  Dumbbell, 
  StickyNote, 
  Snowflake, 
  Circle, 
  Bike,
  Shirt,
  Flag,
  HeartPulse,
  Waves,
  Car,
  Tennis as TennisIcon,
  Bowling,
  Table,
  Boxing,
  Clock,
  Mic,
  Golf,
  Racket,
  Asterisk,
  CircleDashed,
  Target,
  CrosshairIcon,
  Footprints,
  Wine,
  Ship,
  type LucideIcon
} from 'lucide-react';
import { 
  SiPremierleague, 
  SiNba, 
  SiNfl, 
  SiFormulae, 
  SiUfc 
} from "react-icons/si";
import type { IconType } from 'react-icons';

export type Sport = {
  id: string;
  label: string;
  icon: typeof SiPremierleague | LucideIcon;
  apiKey?: string;  // The key used in API requests
  color?: string;   // Optional theme color for the sport
  popular?: boolean; // Whether this is a popular sport
};

// Sports supported by our application
export const SPORTS_LIST: Sport[] = [
  // "All Sports" option is special and should be handled separately in components
  { id: 'all', label: 'All Sports', icon: Trophy, popular: true },
  
  // Most popular sports
  { id: 'football', label: 'Football', icon: SiPremierleague, apiKey: 'soccer', popular: true, color: '#38b6ff' },
  { id: 'basketball', label: 'Basketball', icon: SiNba, apiKey: 'basketball', popular: true, color: '#ff5500' },
  { id: 'tennis', label: 'Tennis', icon: TennisIcon, apiKey: 'tennis', popular: true, color: '#ffcc00' },
  { id: 'baseball', label: 'Baseball', icon: StickyNote, apiKey: 'baseball', popular: true, color: '#ff0000' },
  { id: 'hockey', label: 'Hockey', icon: Snowflake, apiKey: 'hockey', popular: true, color: '#0066ff' },
  
  // Additional popular sports
  { id: 'american_football', label: 'American Football', icon: Flag, apiKey: 'americanfootball', popular: true, color: '#663300' },
  { id: 'mma', label: 'MMA', icon: SiUfc, apiKey: 'mma', popular: true, color: '#ff3300' },
  { id: 'formula1', label: 'Formula 1', icon: Car, apiKey: 'formula1', popular: true, color: '#ff0000' },
  { id: 'cricket', label: 'Cricket', icon: Shirt, apiKey: 'cricket', popular: true, color: '#00cc66' },
  
  // Other sports
  { id: 'golf', label: 'Golf', icon: Golf, apiKey: 'golf', color: '#009933' },
  { id: 'cycling', label: 'Cycling', icon: Bike, apiKey: 'cycling', color: '#ff9900' },
  { id: 'rugby', label: 'Rugby', icon: Bowling, apiKey: 'rugby', color: '#663300' },
  { id: 'volleyball', label: 'Volleyball', icon: CircleDashed, apiKey: 'volleyball', color: '#ff6600' },
  { id: 'handball', label: 'Handball', icon: Circle, apiKey: 'handball', color: '#0099cc' },
  { id: 'boxing', label: 'Boxing', icon: Boxing, apiKey: 'boxing', color: '#cc0000' },
  { id: 'darts', label: 'Darts', icon: Target, apiKey: 'darts', color: '#009933' },
  { id: 'snooker', label: 'Snooker', icon: Table, apiKey: 'snooker', color: '#006600' },
  { id: 'motorsport', label: 'Motorsport', icon: Car, apiKey: 'motorsport', color: '#cc3300' },
  { id: 'badminton', label: 'Badminton', icon: Racket, apiKey: 'badminton', color: '#6600cc' },
  { id: 'water_sports', label: 'Water Sports', icon: Waves, apiKey: 'watersports', color: '#0099ff' },
  { id: 'winter_sports', label: 'Winter Sports', icon: Snowflake, apiKey: 'wintersports', color: '#3399ff' },
  { id: 'athletics', label: 'Athletics', icon: Footprints, apiKey: 'athletics', color: '#ff3399' },
  { id: 'esports', label: 'Esports', icon: Asterisk, apiKey: 'esports', color: '#9933cc' },
  { id: 'horse_racing', label: 'Horse Racing', icon: Clock, apiKey: 'horseracing', color: '#996633' },
  { id: 'chess', label: 'Chess', icon: Circle, apiKey: 'chess', color: '#666666' },
  { id: 'entertainment', label: 'Entertainment', icon: Mic, apiKey: 'entertainment', color: '#ff66cc' },
  { id: 'poker', label: 'Poker', icon: Wine, apiKey: 'poker', color: '#cc0066' },
  { id: 'sailing', label: 'Sailing', icon: Ship, apiKey: 'sailing', color: '#3366cc' }
];

// Subset of most popular sports for quick access
export const POPULAR_SPORTS = SPORTS_LIST.filter(sport => sport.popular);

// Get a sport by ID
export function getSportById(id: string): Sport | undefined {
  return SPORTS_LIST.find(sport => sport.id === id);
}

// Get sport icon component
export function getSportIcon(id: string): JSX.Element | null {
  const sport = getSportById(id);
  if (!sport) return null;
  
  const Icon = sport.icon;
  return <Icon className="h-4 w-4" />;
}

// Map sport ID to display name
export const sportDisplayNames: Record<string, string> = SPORTS_LIST.reduce(
  (acc, sport) => ({ ...acc, [sport.id]: sport.label }), 
  {}
);

// Default league display names by sport
export const leagueDisplayNames: Record<string, Record<string, string>> = {
  football: {
    'epl': 'English Premier League',
    'laliga': 'La Liga',
    'bundesliga': 'Bundesliga',
    'seriea': 'Serie A',
    'ligue1': 'Ligue 1',
    'champions_league': 'Champions League',
    'world_cup': 'World Cup',
    'europa_league': 'Europa League',
  },
  basketball: {
    'nba': 'NBA',
    'euroleague': 'EuroLeague',
    'ncaa': 'NCAA',
    'acb': 'Spanish ACB',
  },
  tennis: {
    'atp': 'ATP Tour',
    'wta': 'WTA Tour',
    'grand_slams': 'Grand Slams',
    'davis_cup': 'Davis Cup',
  },
  // Add other sports as needed
};