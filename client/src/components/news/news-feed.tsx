import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { NewsArticle } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { CalendarIcon, BookmarkIcon, BookmarkPlusIcon, ArrowUpRightIcon, TagIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const ArticleSkeleton = () => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
    </Card>
  );
};

export function NewsArticleCard({ article }: { article: NewsArticle }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  
  const { data: savedArticles } = useQuery({
    queryKey: ["/api/news/saved"],
    enabled: !!user,
  });
  
  useEffect(() => {
    if (savedArticles) {
      const saved = savedArticles.some((saved: any) => saved.articleId === article.id);
      setIsSaved(saved);
    }
  }, [savedArticles, article.id]);
  
  const handleSaveArticle = async () => {
    if (!user) return;
    
    try {
      if (isSaved) {
        await apiRequest("DELETE", `/api/news/${article.id}/save`);
        setIsSaved(false);
        toast({
          title: "Removed from saved articles",
          description: "The article has been removed from your saved list",
        });
      } else {
        await apiRequest("POST", `/api/news/${article.id}/save`);
        setIsSaved(true);
        toast({
          title: "Article saved",
          description: "The article has been saved to your profile",
        });
      }
      
      // Invalidate the saved articles query to update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/news/saved"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save/unsave the article",
        variant: "destructive",
      });
    }
  };
  
  const handleReadArticle = async () => {
    if (!user) return;
    
    try {
      // Mark the article as read
      await apiRequest("POST", `/api/news/${article.id}/read`);
      
      // Open the article in a new tab
      if (article.sourceUrl) {
        window.open(article.sourceUrl, "_blank");
      }
    } catch (error) {
      console.error("Error marking article as read:", error);
    }
  };
  
  return (
    <Card className="mb-6 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">{article.title}</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSaveArticle}
            className="ml-2"
          >
            {isSaved ? (
              <BookmarkIcon className="h-5 w-5 text-primary" />
            ) : (
              <BookmarkPlusIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
        <CardDescription className="flex items-center mt-1 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4 mr-1" />
          {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
          {article.source && (
            <span className="ml-2">• {article.source}</span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        {article.imageUrl && (
          <div className="w-full h-48 mb-4 overflow-hidden rounded-md">
            <img 
              src={article.imageUrl}
              alt={article.title} 
              className="w-full h-full object-cover transition-transform hover:scale-105"
              onError={(e) => {
                // Handle image loading error with fallback
                const target = e.target as HTMLImageElement;
                // Use a sports placeholder based on sport ID
                const sportPlaceholders = {
                  1: 'https://img.freepik.com/free-vector/gradient-soccer-football-background_52683-64915.jpg',
                  2: 'https://img.freepik.com/free-vector/gradient-basketball-background_52683-65596.jpg',
                  3: 'https://img.freepik.com/free-photo/tennis-ball-baseline-tennis-court_1150-7405.jpg',
                  4: 'https://img.freepik.com/free-vector/realistic-racing-background_23-2148974621.jpg',
                  default: 'https://img.freepik.com/free-photo/sports-tools_53876-138077.jpg'
                };
                
                // Use sport-specific placeholder or default
                const sportId = article.sportId || 0;
                target.src = sportPlaceholders[sportId as keyof typeof sportPlaceholders] || sportPlaceholders.default;
                
                // Remove hover effect since it's a fallback
                target.className = 'w-full h-full object-cover';
              }}
            />
          </div>
        )}
        
        <p className="mb-4">{article.summary}</p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <TagIcon className="h-3 w-3" />
            {article.type}
          </Badge>
          
          {article.tags && Array.isArray(article.tags) && article.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button 
          variant="outline" 
          onClick={handleReadArticle}
          className="flex gap-2 w-full"
        >
          Read Full Article
          <ArrowUpRightIcon className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function NewsFeed({ initialTab = "personalized" }: { initialTab?: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Load recommended articles from our new API endpoint
  const { data: recommendedArticles, isLoading: loadingRecommended } = useQuery({
    queryKey: ["/api/news/recommendations"],
    enabled: !!user && activeTab === "recommended",
  });
  
  // Get trending articles for everybody
  const { data: trendingArticles, isLoading: loadingTrending } = useQuery({
    queryKey: ["/api/news/trending-fixed"],
    enabled: activeTab === "recommended",
  });
  
  const { data: personalizedNews, isLoading: loadingPersonalized } = useQuery({
    queryKey: ["/api/news/feed/personalized"],
    enabled: !!user && activeTab === "personalized",
  });
  
  const { data: allNews, isLoading: loadingAllNews } = useQuery({
    queryKey: ["/api/news/all"],
    enabled: activeTab === "all",
  });
  
  const { data: savedNews, isLoading: loadingSaved } = useQuery({
    queryKey: ["/api/news/saved"],
    enabled: !!user && activeTab === "saved",
  });
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
        Sports News Feed
      </h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="personalized" disabled={!user}>
            For You
          </TabsTrigger>
          <TabsTrigger value="recommended">
            Recommended
          </TabsTrigger>
          <TabsTrigger value="all">
            All News
          </TabsTrigger>
          <TabsTrigger value="saved" disabled={!user}>
            Saved
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personalized">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {!user ? (
              <div className="col-span-2 text-center py-8">
                <h3 className="text-xl font-medium mb-2">Sign in to see personalized news</h3>
                <p className="text-muted-foreground mb-4">
                  Create an account to get news tailored to your interests
                </p>
              </div>
            ) : loadingPersonalized ? (
              <>
                <ArticleSkeleton />
                <ArticleSkeleton />
              </>
            ) : personalizedNews && personalizedNews.length > 0 ? (
              personalizedNews.map((article: NewsArticle) => (
                <NewsArticleCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <h3 className="text-xl font-medium mb-2">No personalized news yet</h3>
                <p className="text-muted-foreground mb-4">
                  Update your preferences to get news tailored to your interests
                </p>
                <Button variant="outline">Update Preferences</Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* New Recommended tab with enhanced AI-powered recommendations */}
        <TabsContent value="recommended">
          <div>
            {/* For users with recommendations from AI engine */}
            {user && recommendedArticles && recommendedArticles.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span>Tailored For You</span>
                  <Badge className="ml-2 bg-primary/20">AI-powered</Badge>
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {recommendedArticles.map((article: any) => (
                    <div key={`rec-${article.id}`}>
                      <div className="flex items-center mb-2">
                        <Badge variant="outline" className="text-xs">
                          {article.recommendReason}
                        </Badge>
                        {article.score > 0.7 && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            High Match
                          </Badge>
                        )}
                      </div>
                      <NewsArticleCard article={article} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending section for everyone */}
            {trendingArticles && trendingArticles.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span>Trending In Sports</span>
                  <Badge variant="default" className="ml-2">Popular</Badge>
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {trendingArticles.map((article: NewsArticle) => (
                    <NewsArticleCard key={`trend-${article.id}`} article={article} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Loading state */}
            {(loadingRecommended || loadingTrending) && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ArticleSkeleton />
                <ArticleSkeleton />
                <ArticleSkeleton />
                <ArticleSkeleton />
              </div>
            )}
            
            {/* Empty state when no articles */}
            {!loadingRecommended && !loadingTrending && 
              (!recommendedArticles || recommendedArticles.length === 0) && 
              (!trendingArticles || trendingArticles.length === 0) && (
              <div className="text-center py-10">
                <h3 className="text-xl font-medium mb-2">No recommendations available</h3>
                <p className="text-muted-foreground mb-4">
                  Start reading articles or update your preferences to get personalized recommendations
                </p>
                <Button variant="outline" onClick={() => setActiveTab("all")}>
                  Browse All News
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {loadingAllNews ? (
              <>
                <ArticleSkeleton />
                <ArticleSkeleton />
                <ArticleSkeleton />
                <ArticleSkeleton />
              </>
            ) : allNews && allNews.length > 0 ? (
              allNews.map((article: NewsArticle) => (
                <NewsArticleCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <h3 className="text-xl font-medium mb-2">No news available</h3>
                <p className="text-muted-foreground">
                  Check back later for the latest sports news
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="saved">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {!user ? (
              <div className="col-span-2 text-center py-8">
                <h3 className="text-xl font-medium mb-2">Sign in to see saved news</h3>
                <p className="text-muted-foreground mb-4">
                  Create an account to save articles for later
                </p>
              </div>
            ) : loadingSaved ? (
              <>
                <ArticleSkeleton />
                <ArticleSkeleton />
              </>
            ) : savedNews && savedNews.length > 0 ? (
              savedNews.map((saved: any) => (
                <NewsArticleCard key={saved.id} article={saved.article} />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <h3 className="text-xl font-medium mb-2">No saved articles</h3>
                <p className="text-muted-foreground mb-4">
                  Save articles you want to read later
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}