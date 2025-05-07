import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, Star, Filter, RefreshCw, BookmarkX } from "lucide-react";
import FilterSection, { FilterOptions } from "@/components/mobile/filter-section";
import { PredictionCard } from "@/components/mobile/prediction-card";
import { useAuth } from "@/hooks/use-auth";

// Types for prediction data
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

export default function FavoritesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<Prediction[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Prediction[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    sports: ["football", "basketball", "tennis", "baseball", "hockey"],
    confidenceLevel: 0,
    premiumOnly: false,
    sortBy: "time",
  });

  // Simulated favorites retrieval
  useEffect(() => {
    // Sample favorites data - in production this would come from an API
    const sampleFavorites: Prediction[] = [
      {
        id: "fav-1",
        matchId: "match-101",
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
        league: "Premier League",
        sport: "football",
        date: "2025-05-10",
        time: "15:00",
        prediction: "Home Win",
        confidence: 78,
        odds: 1.95,
        isPremium: true,
        status: "scheduled",
        favorite: true,
      },
      {
        id: "fav-2",
        matchId: "match-202",
        homeTeam: "LA Lakers",
        awayTeam: "Chicago Bulls",
        league: "NBA",
        sport: "basketball",
        date: "2025-05-09",
        time: "20:30",
        prediction: "Over 220.5 Points",
        confidence: 84,
        odds: 1.85,
        isPremium: false,
        status: "scheduled",
        favorite: true,
      },
      {
        id: "fav-3",
        matchId: "match-303",
        homeTeam: "Rafael Nadal",
        awayTeam: "Novak Djokovic",
        league: "Roland Garros",
        sport: "tennis",
        date: "2025-05-12",
        time: "14:00",
        prediction: "Away Win",
        confidence: 65,
        odds: 2.10,
        isPremium: true,
        status: "scheduled",
        favorite: true,
      },
    ];

    setFavorites(sampleFavorites);
    applyFilters(sampleFavorites, filters);
  }, []);

  // Apply filters to favorites
  const applyFilters = (predictions: Prediction[], filterOptions: FilterOptions) => {
    let filtered = [...predictions];

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
        // Sort by date and time (already the default)
        filtered.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });
        break;
    }

    setFilteredFavorites(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    applyFilters(favorites, newFilters);
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simulate refresh with a delay
    setTimeout(() => {
      applyFilters(favorites, filters);
      setIsLoading(false);
      
      toast({
        title: "Favorites refreshed",
        description: "Your favorites are up to date.",
      });
    }, 1000);
  };

  // Handle remove from favorites
  const handleRemoveFavorite = (id: string): void => {
    // Update favorites state
    const updatedFavorites = favorites.filter(fav => fav.id !== id);
    setFavorites(updatedFavorites);
    
    // Update filtered favorites
    applyFilters(updatedFavorites, filters);
    
    toast({
      title: "Removed from favorites",
      description: "Prediction removed from your favorites.",
    });
  };

  // Empty state animation variants
  const emptyStateVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5,
        delay: 0.2
      } 
    }
  };

  return (
    <div className="container px-4 py-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">My Favorites</h1>
          <p className="text-sm text-muted-foreground">
            Your saved predictions
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

      {/* Filters */}
      <FilterSection onFilterChange={handleFilterChange} />

      {/* Content */}
      <AnimatePresence mode="wait">
        {filteredFavorites.length > 0 ? (
          <motion.div
            key="favorites-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {filteredFavorites.map((prediction) => (
              <PredictionCard 
                key={prediction.id}
                prediction={prediction}
                onFavoriteToggle={(id) => handleRemoveFavorite(id)}
                isFavorite={true}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty-state"
            variants={emptyStateVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BookmarkX className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Add predictions to your favorites by tapping the heart icon on any prediction card.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="gap-2"
            >
              <Star size={16} />
              Browse Predictions
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}