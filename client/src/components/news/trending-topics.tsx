import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, CalendarClock, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface TrendingTopic {
  id: string;
  title: string;
  date?: string;
  description: string;
  tags: string[];
  category: string;
  articleCount: number;
}

function TopicSkeleton() {
  return (
    <div className="flex items-start space-x-4 mb-6">
      <div className="flex-shrink-0">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-3 w-1/2 mb-1" />
        <Skeleton className="h-3 w-full mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function TrendingTopics() {
  // Use default type for the query hook (it's inferred from the generic type)
  const { data: trendingTopics, isLoading } = useQuery<TrendingTopic[]>({
    queryKey: ["/api/news/trending-topics"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Trending in Sports
            </CardTitle>
            <CardDescription>
              Hot topics and trending discussions
            </CardDescription>
          </div>
          <Link href="/news">
            <Badge variant="outline" className="cursor-pointer hover:bg-accent flex items-center gap-1">
              View All
              <ChevronRight className="h-3 w-3" />
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <>
            <TopicSkeleton />
            <TopicSkeleton />
            <TopicSkeleton />
          </>
        ) : trendingTopics && trendingTopics.length > 0 ? (
          <div className="space-y-6">
            {trendingTopics.map((topic: TrendingTopic) => (
              <div key={topic.id} className="flex items-start space-x-4">
                <div className="flex-shrink-0 rounded-full bg-primary/10 p-3 text-primary">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg">
                    <Link href={`/news?topic=${encodeURIComponent(topic.title)}`} className="hover:text-primary">
                      {topic.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {topic.date ? (
                      formatDistanceToNow(new Date(topic.date), { addSuffix: true })
                    ) : (
                      "Recent"
                    )}
                    <span className="mx-2">•</span>
                    <Badge variant="secondary" className="text-xs">
                      {topic.category}
                    </Badge>
                  </p>
                  <p className="text-sm mb-2">{topic.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {topic.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    <Badge variant="secondary" className="text-xs">
                      {topic.articleCount} articles
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No trending topics available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}