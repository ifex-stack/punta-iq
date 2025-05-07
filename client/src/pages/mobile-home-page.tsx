import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wand2, RefreshCw, CalendarDays, Heart, BarChart2, Zap } from "lucide-react";
import FilterSection, { FilterOptions } from "@/components/mobile/filter-section";
import { PredictionCard } from "@/components/mobile/prediction-card";
import { useAuth } from "@/hooks/use-auth";

// Types
interface Prediction {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  date: string;
  time: string;
  prediction: string;
  confidence: number;
  odds: number;
  isPremium: boolean;
  isLive?: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: "scheduled" | "live" | "completed" | "cancelled";
  favorite?: boolean;
}

// Date options for filter
const dateOptions = [
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This Week", value: "week" },
];

export default function MobileHomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [filteredPredictions, setFilteredPredictions] = useState<Prediction[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("today");
  const [isGenerating, setIsGenerating] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sports: ["football", "basketball", "tennis", "baseball", "hockey"],
    confidenceLevel: 0,
    premiumOnly: false,
    sortBy: "time",
  });

  // Load predictions on mount
  useEffect(() => {
    loadPredictions();
  }, []);

  // Load initial predictions
  const loadPredictions = (forceRefresh = false) => {
    setIsLoading(true);
    
    // In production, this would fetch from an API
    setTimeout(() => {
      generateRandomPredictions(6);
      setIsLoading(false);
      
      if (forceRefresh) {
        toast({
          title: "Predictions refreshed",
          description: "Latest predictions loaded.",
        });
      }
    }, 1000);
  };

  // Generate random predictions - DEMO ONLY
  // In production, this would be real data from your API
  const generateRandomPredictions = (count: number) => {
    const sports = ["football", "basketball", "tennis", "baseball", "hockey"];
    const footballTeams = [
      ["Arsenal", "Chelsea", "Premier League"], 
      ["Manchester City", "Liverpool", "Premier League"],
      ["Real Madrid", "Barcelona", "La Liga"],
      ["Bayern Munich", "Dortmund", "Bundesliga"],
      ["PSG", "Lyon", "Ligue 1"],
      ["Ajax", "PSV", "Eredivisie"],
      ["Inter Milan", "AC Milan", "Serie A"],
      ["Juventus", "Napoli", "Serie A"]
    ];
    const basketballTeams = [
      ["LA Lakers", "Chicago Bulls", "NBA"],
      ["Miami Heat", "Boston Celtics", "NBA"],
      ["Golden State Warriors", "Phoenix Suns", "NBA"],
      ["Milwaukee Bucks", "Brooklyn Nets", "NBA"]
    ];
    const tennisPlayers = [
      ["Rafael Nadal", "Novak Djokovic", "Roland Garros"],
      ["Roger Federer", "Andy Murray", "Wimbledon"],
      ["Carlos Alcaraz", "Daniil Medvedev", "US Open"],
      ["Jannik Sinner", "Alexander Zverev", "Australian Open"]
    ];
    const baseballTeams = [
      ["New York Yankees", "Boston Red Sox", "MLB"],
      ["Los Angeles Dodgers", "San Francisco Giants", "MLB"],
      ["Chicago Cubs", "St. Louis Cardinals", "MLB"]
    ];
    const hockeyTeams = [
      ["Toronto Maple Leafs", "Montreal Canadiens", "NHL"],
      ["Boston Bruins", "New York Rangers", "NHL"],
      ["Pittsburgh Penguins", "Washington Capitals", "NHL"]
    ];
    
    const footballPredictions = ["Home Win", "Away Win", "Draw", "Both Teams to Score", "Over 2.5 Goals", "Under 2.5 Goals"];
    const basketballPredictions = ["Home Win", "Away Win", "Over 220.5 Points", "Under 220.5 Points", "Handicap +5.5 Home", "Handicap -5.5 Away"];
    const tennisPredictions = ["Home Win", "Away Win", "Over 22.5 Games", "Under 22.5 Games", "Straight Sets Win", "Match to go 3+ Sets"];
    const baseballPredictions = ["Home Win", "Away Win", "Over 8.5 Runs", "Under 8.5 Runs", "Home Team Over 4.5 Runs", "No Run First Inning"];
    const hockeyPredictions = ["Home Win", "Away Win", "Over 5.5 Goals", "Under 5.5 Goals", "Both Teams to Score 2+", "First Period Over 1.5"];
    
    // Generate dates for the next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });
    
    // Generate times
    const times = ["12:00", "15:00", "17:30", "19:45", "20:30", "21:15"];
    
    // Generate new predictions
    const newPredictions: Prediction[] = [];
    
    for (let i = 0; i < count; i++) {
      const sportIndex = Math.floor(Math.random() * sports.length);
      const sport = sports[sportIndex];
      
      let teams: string[] = [];
      let predictions: string[] = [];
      
      // Get teams based on sport
      switch (sport) {
        case "football":
          teams = footballTeams[Math.floor(Math.random() * footballTeams.length)];
          predictions = footballPredictions;
          break;
        case "basketball":
          teams = basketballTeams[Math.floor(Math.random() * basketballTeams.length)];
          predictions = basketballPredictions;
          break;
        case "tennis":
          teams = tennisPlayers[Math.floor(Math.random() * tennisPlayers.length)];
          predictions = tennisPredictions;
          break;
        case "baseball":
          teams = baseballTeams[Math.floor(Math.random() * baseballTeams.length)];
          predictions = baseballPredictions;
          break;
        case "hockey":
          teams = hockeyTeams[Math.floor(Math.random() * hockeyTeams.length)];
          predictions = hockeyPredictions;
          break;
        default:
          teams = footballTeams[Math.floor(Math.random() * footballTeams.length)];
          predictions = footballPredictions;
      }
      
      const date = dates[Math.floor(Math.random() * dates.length)];
      const time = times[Math.floor(Math.random() * times.length)];
      const prediction = predictions[Math.floor(Math.random() * predictions.length)];
      const confidence = Math.floor(Math.random() * 41) + 60; // 60-100
      const odds = (Math.random() * 3 + 1).toFixed(2);
      const isPremium = Math.random() > 0.7; // 30% chance of being premium
      
      newPredictions.push({
        id: `pred-${Date.now()}-${i}`,
        matchId: `match-${Date.now()}-${i}`,
        homeTeam: teams[0],
        awayTeam: teams[1],
        league: teams[2],
        sport,
        date,
        time,
        prediction,
        confidence,
        odds: parseFloat(odds),
        isPremium,
        status: "scheduled"
      });
    }
    
    setPredictions(newPredictions);
    applyFilters(newPredictions, filters);
  };

  // Generate new AI predictions (auto-fill feature)
  const handleGenerateAIPredictions = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      generateRandomPredictions(Math.floor(Math.random() * 4) + 3); // 3-6 random predictions
      setIsGenerating(false);
      
      toast({
        title: "New AI predictions generated",
        description: "Our AI has created unique predictions just for you.",
      });
    }, 1500);
  };

  // Apply filters to predictions
  const applyFilters = (preds: Prediction[], filterOptions: FilterOptions) => {
    let filtered = [...preds];

    // Filter by sports
    if (filterOptions.sports.length > 0) {
      filtered = filtered.filter(pred => filterOptions.sports.includes(pred.sport));
    }

    // Filter by confidence level
    filtered = filtered.filter(pred => pred.confidence >= filterOptions.confidenceLevel);

    // Filter by premium only
    if (filterOptions.premiumOnly) {
      filtered = filtered.filter(pred => pred.isPremium);
    }

    // Sort predictions
    switch (filterOptions.sortBy) {
      case "confidence":
        filtered.sort((a, b) => b.confidence - a.confidence);
        break;
      case "odds":
        filtered.sort((a, b) => b.odds - a.odds);
        break;
      case "time":
      default:
        // Sort by date and time
        filtered.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });
        break;
    }

    setFilteredPredictions(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    applyFilters(predictions, newFilters);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadPredictions(true);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (id: string) => {
    setFavorites(prevFavs => {
      if (prevFavs.includes(id)) {
        toast({
          title: "Removed from favorites",
          description: "Prediction removed from your favorites.",
        });
        return prevFavs.filter(fav => fav !== id);
      } else {
        toast({
          title: "Added to favorites",
          description: "Prediction added to your favorites.",
        });
        return [...prevFavs, id];
      }
    });
  };

  // Handle date filter change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // In a real app, this would filter by date
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="container px-4 py-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">AI Predictions</h1>
          <p className="text-sm text-muted-foreground">
            Smart picks for today's matches
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          disabled={isLoading}
          onClick={handleRefresh}
        >
          <RefreshCw 
            size={20} 
            className={`${isLoading ? "animate-spin" : ""}`} 
          />
        </Button>
      </div>

      {/* Date Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {dateOptions.map(option => (
          <Button
            key={option.value}
            variant={selectedDate === option.value ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1 h-9"
            onClick={() => handleDateChange(option.value)}
          >
            <CalendarDays size={14} />
            {option.label}
          </Button>
        ))}
      </div>

      {/* AutoFill AI Generator Button */}
      <div className="mb-6">
        <Button
          variant="default"
          size="lg"
          className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
          onClick={handleGenerateAIPredictions}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
              />
              <span>Generating predictions...</span>
            </>
          ) : (
            <>
              <Wand2 size={18} />
              <span>AutoFill with AI Predictions</span>
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center mt-1">
          Get unique AI-generated predictions that change with each click
        </p>
      </div>

      {/* Filters */}
      <FilterSection onFilterChange={handleFilterChange} />

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"
            />
            <p className="text-muted-foreground">Loading predictions...</p>
          </motion.div>
        ) : filteredPredictions.length > 0 ? (
          <motion.div
            key="predictions-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredPredictions.map((prediction) => (
              <PredictionCard 
                key={prediction.id}
                prediction={prediction}
                onFavoriteToggle={handleFavoriteToggle}
                isFavorite={favorites.includes(prediction.id)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BarChart2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No predictions found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Try changing your filters or click the AutoFill button to generate new predictions.
            </p>
            <Button
              onClick={handleGenerateAIPredictions}
              className="gap-2"
            >
              <Zap size={16} />
              Generate New Predictions
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}