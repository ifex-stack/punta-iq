import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { NewsFeed } from "@/components/news/news-feed";
import { NewsPreferences } from "@/components/news/news-preferences";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Newspaper, Settings } from "lucide-react";

export default function NewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Sports News
          </h1>
          <p className="text-muted-foreground">
            Stay up-to-date with the latest sports news and analysis
          </p>
        </div>
        
        {user && (
          <Button
            variant={activeTab === "preferences" ? "default" : "outline"}
            onClick={() => setActiveTab(activeTab === "feed" ? "preferences" : "feed")}
            className="mt-4 md:mt-0"
          >
            {activeTab === "feed" ? (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Customize Feed
              </>
            ) : (
              <>
                <Newspaper className="h-4 w-4 mr-2" />
                View News Feed
              </>
            )}
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden">
          <TabsTrigger value="feed">News Feed</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed" className="mt-0">
          <NewsFeed initialTab={user ? "personalized" : "all"} />
        </TabsContent>
        
        <TabsContent value="preferences" className="mt-0">
          <NewsPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}