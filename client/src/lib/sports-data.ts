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
  Waves,
  Car,
  Swords,
  Table,
  Clock,
  Mic,
  Rocket,
  Gamepad,
  Asterisk,
  CircleDashed,
  Target,
  Footprints,
  Wine,
  Ship
} from 'lucide-react';
import { SiPremierleague, SiNba, SiUfc } from "react-icons/si";
import type { IconType } from 'react-icons';
import React from 'react';

// This is a safe type that TypeScript can understand
type IconComponent = React.ComponentType<any>;

export interface Sport {
  id: string;
  label: string;
  icon: IconComponent;
  apiKey?: string;
  color?: string;
  popular?: boolean;
}

// Sports supported by our application
export const SPORTS_LIST: Sport[] = [
  // "All Sports" option is special and should be handled separately in components
  { id: 'all', label: 'All Sports', icon: Trophy, popular: true },
  
  // Most popular sports
  { id: 'football', label: 'Football', icon: SiPremierleague, apiKey: 'soccer', popular: true, color: '#38b6ff' },
  { id: 'basketball', label: 'Basketball', icon: SiNba, apiKey: 'basketball', popular: true, color: '#ff5500' },
  { id: 'tennis', label: 'Tennis', icon: CircleDot, apiKey: 'tennis', popular: true, color: '#ffcc00' },
  { id: 'baseball', label: 'Baseball', icon: StickyNote, apiKey: 'baseball', popular: true, color: '#ff0000' },
  { id: 'hockey', label: 'Hockey', icon: Snowflake, apiKey: 'hockey', popular: true, color: '#0066ff' },
  
  // Additional popular sports
  { id: 'american_football', label: 'American Football', icon: Flag, apiKey: 'americanfootball', popular: true, color: '#663300' },
  { id: 'mma', label: 'MMA', icon: SiUfc, apiKey: 'mma', popular: true, color: '#ff3300' },
  { id: 'formula1', label: 'Formula 1', icon: Car, apiKey: 'formula1', popular: true, color: '#ff0000' },
  { id: 'cricket', label: 'Cricket', icon: Shirt, apiKey: 'cricket', popular: true, color: '#00cc66' },
  
  // Other sports
  { id: 'golf', label: 'Golf', icon: CircleDot, apiKey: 'golf', color: '#009933' },
  { id: 'cycling', label: 'Cycling', icon: Bike, apiKey: 'cycling', color: '#ff9900' },
  { id: 'rugby', label: 'Rugby', icon: Dumbbell, apiKey: 'rugby', color: '#663300' },
  { id: 'volleyball', label: 'Volleyball', icon: CircleDashed, apiKey: 'volleyball', color: '#ff6600' },
  { id: 'handball', label: 'Handball', icon: Circle, apiKey: 'handball', color: '#0099cc' },
  { id: 'boxing', label: 'Boxing', icon: Swords, apiKey: 'boxing', color: '#cc0000' },
  { id: 'darts', label: 'Darts', icon: Target, apiKey: 'darts', color: '#009933' },
  { id: 'snooker', label: 'Snooker', icon: Table, apiKey: 'snooker', color: '#006600' },
  { id: 'motorsport', label: 'Motorsport', icon: Car, apiKey: 'motorsport', color: '#cc3300' },
  { id: 'badminton', label: 'Badminton', icon: Rocket, apiKey: 'badminton', color: '#6600cc' },
  { id: 'water_sports', label: 'Water Sports', icon: Waves, apiKey: 'watersports', color: '#0099ff' },
  { id: 'winter_sports', label: 'Winter Sports', icon: Snowflake, apiKey: 'wintersports', color: '#3399ff' },
  { id: 'athletics', label: 'Athletics', icon: Footprints, apiKey: 'athletics', color: '#ff3399' },
  { id: 'esports', label: 'Esports', icon: Gamepad, apiKey: 'esports', color: '#9933cc' },
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

// Get sport icon component (as a string identifier instead of JSX to avoid type issues)
export function getSportIconId(id: string): string | null {
  const sport = getSportById(id);
  if (!sport) return null;
  return id;
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