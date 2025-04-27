import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NewsArticle } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookmarkPlus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { NewsArticleCard } from "@/components/news/news-feed";

interface RecommendedArticle extends NewsArticle {
  score: number;
  recommendReason: string;
}

export default function RecommendedArticles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewedArticleIds, setViewedArticleIds] = useState<number[]>([]);
  
  // Get personalized recommendations
  const { 
    data: recommendations, 
    isLoading, 
    isError,
    refetch: refetchRecommendations
  } = useQuery<RecommendedArticle[]>({
    queryKey: ["/api/news/recommendations", { excludeIds: viewedArticleIds.join(',') }],
    enabled: !!user,
  });
  
  // Get trending articles (even for non-logged in users)
  const { 
    data: trendingArticles, 
    isLoading: trendingLoading 
  } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news/trending"],
  });
  
  // Update the viewed article IDs set
  useEffect(() => {
    const savedArticleIds = localStorage.getItem('viewedArticleIds');
    if (savedArticleIds) {
      try {
        const parsed = JSON.parse(savedArticleIds);
        if (Array.isArray(parsed)) {
          setViewedArticleIds(parsed);
        }
      } catch (e) {
        // If parsing fails, ignore and proceed with empty set
        localStorage.removeItem('viewedArticleIds');
      }
    }
  }, []);
  
  // Add an article to the viewed set
  const markAsViewed = (articleId: number) => {
    if (!viewedArticleIds.includes(articleId)) {
      const newViewedIds = [...viewedArticleIds, articleId];
      setViewedArticleIds(newViewedIds);
      localStorage.setItem('viewedArticleIds', JSON.stringify(newViewedIds));
      
      // If we've viewed 5 or more recommendations, refetch with the new exclude list
      if (newViewedIds.length % 5 === 0) {
        refetchRecommendations();
      }
    }
  };
  
  // Save an article
  const saveArticle = async (articleId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to save articles",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest("POST", `/api/news/${articleId}/save`);
      toast({
        title: "Article Saved",
        description: "The article has been saved to your collection",
      });
    } catch (error) {
      toast({
        title: "Failed to Save",
        description: "Couldn't save the article. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Combine recommendations and trending for a complete "For You" section
  const hasPersonalRecommendations = !!recommendations && recommendations.length > 0;
  const hasTrendingArticles = !!trendingArticles && trendingArticles.length > 0;
  
  if (isLoading && trendingLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isError && !hasTrendingArticles) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4 text-center">
          <p>Failed to load recommendations. Please try again later.</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => refetchRecommendations()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Personalized recommendations section */}
      {hasPersonalRecommendations && (
        <div>
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <span>Recommended For You</span>
            <Badge variant="outline" className="bg-primary/10">
              Personalized
            </Badge>
          </h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((article) => (
              <NewsArticleCard
                key={`recommended-${article.id}`}
                article={article}
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveArticle(article.id)}
                    className="flex-shrink-0"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                }
                onClick={() => markAsViewed(article.id)}
                badge={
                  <Badge className="bg-primary/20 text-xs">
                    {article.recommendReason}
                  </Badge>
                }
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Trending articles section */}
      {hasTrendingArticles && (
        <div>
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <span>Trending In Sports</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trendingArticles.map((article) => (
              <NewsArticleCard
                key={`trending-${article.id}`}
                article={article}
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveArticle(article.id)}
                    className="flex-shrink-0"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                }
                onClick={() => markAsViewed(article.id)}
                badge={
                  <Badge variant="secondary" className="text-xs">
                    Trending
                  </Badge>
                }
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty state - no recommendations */}
      {!hasPersonalRecommendations && !hasTrendingArticles && (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
            <p className="text-muted-foreground">
              Start reading articles or update your preferences to get personalized recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}