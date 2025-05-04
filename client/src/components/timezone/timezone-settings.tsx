import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTimezoneScheduling } from "@/hooks/use-timezone-scheduling";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Globe, Sun, Sunrise, Sunset, Moon } from "lucide-react";

/**
 * Component for managing timezone and scheduling preferences
 */
export function TimezoneSettings() {
  const {
    userTimezone,
    currentTimeWindow,
    contentSchedule,
    preferences,
    updatePreferences,
  } = useTimezoneScheduling();

  const [isOpen, setIsOpen] = useState(false);

  // Create list of common timezones
  const commonTimezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Dubai",
    "Australia/Sydney",
    "Pacific/Auckland",
    "Africa/Lagos",
    "Africa/Nairobi",
    "Africa/Cairo",
  ];

  // Only show all timezones if user has selected "Other"
  const [showAllTimezones, setShowAllTimezones] = useState(
    !commonTimezones.includes(userTimezone)
  );

  // Get all available timezones from Intl API
  const allTimezones = Intl.supportedValuesOf
    ? Intl.supportedValuesOf("timeZone")
    : commonTimezones;

  // Get time window icon
  const getTimeWindowIcon = (window: string) => {
    switch (window) {
      case "morning":
        return <Sunrise className="h-5 w-5" />;
      case "afternoon":
        return <Sun className="h-5 w-5" />;
      case "evening":
        return <Sunset className="h-5 w-5" />;
      case "night":
        return <Moon className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="flex items-center gap-1 text-muted-foreground"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Timezone</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Timezone Settings
          </SheetTitle>
          <SheetDescription>
            Customize how content is displayed based on your timezone and
            preferences
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Current timezone info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Current Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Time Window:</span>
                <span className="flex items-center font-medium">
                  {getTimeWindowIcon(currentTimeWindow)}{" "}
                  <span className="ml-1 capitalize">{currentTimeWindow}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timezone:</span>
                <span className="font-medium">{userTimezone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preferred Content Time:</span>
                <span className="font-medium capitalize">
                  {preferences.preferredTimeWindow === "auto"
                    ? "Automatic"
                    : preferences.preferredTimeWindow}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timezone selection */}
          <div className="space-y-2">
            <Label htmlFor="timezone-select">Your Timezone</Label>
            <Select
              value={userTimezone}
              onValueChange={(value) => {
                updatePreferences({ timezone: value });
                // If user selected "Other", show all timezones
                if (value === "other") {
                  setShowAllTimezones(true);
                }
              }}
            >
              <SelectTrigger id="timezone-select">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {/* Common timezones first */}
                {!showAllTimezones ? (
                  <>
                    <SelectItem value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                      Auto-detect: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </SelectItem>
                    {commonTimezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace("_", " ")}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other (Show all timezones)</SelectItem>
                  </>
                ) : (
                  // All timezones if "other" was selected
                  allTimezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace("_", " ")}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Content time preference */}
          <div className="space-y-2">
            <Label htmlFor="time-preference">Preferred Content Time</Label>
            <Select
              value={preferences.preferredTimeWindow}
              onValueChange={(value) =>
                updatePreferences({
                  preferredTimeWindow: value as any,
                })
              }
            >
              <SelectTrigger id="time-preference">
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Automatic (Based on current time)
                  </div>
                </SelectItem>
                <SelectItem value="morning">
                  <div className="flex items-center">
                    <Sunrise className="mr-2 h-4 w-4" />
                    Morning (5:00 - 12:00)
                  </div>
                </SelectItem>
                <SelectItem value="afternoon">
                  <div className="flex items-center">
                    <Sun className="mr-2 h-4 w-4" />
                    Afternoon (12:00 - 17:00)
                  </div>
                </SelectItem>
                <SelectItem value="evening">
                  <div className="flex items-center">
                    <Sunset className="mr-2 h-4 w-4" />
                    Evening (17:00 - 21:00)
                  </div>
                </SelectItem>
                <SelectItem value="night">
                  <div className="flex items-center">
                    <Moon className="mr-2 h-4 w-4" />
                    Night (21:00 - 5:00)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Display preferences */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Display Preferences</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="sort-by-relevance" className="flex-1">
                Prioritize time-relevant content
                <p className="text-xs text-muted-foreground mt-1">
                  Show matches happening soon at the top
                </p>
              </Label>
              <Switch
                id="sort-by-relevance"
                checked={preferences.showTimeRelevantContentFirst}
                onCheckedChange={(checked) =>
                  updatePreferences({
                    showTimeRelevantContentFirst: checked,
                  })
                }
              />
            </div>
          </div>

          {/* Content schedule visualization */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Content Schedule</h3>
            <p className="text-xs text-muted-foreground">
              When different content types are prioritized
            </p>

            <Tabs defaultValue="predictions" className="mt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="predictions">Predictions</TabsTrigger>
                <TabsTrigger value="accumulators">Accumulators</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="livescores">Live Scores</TabsTrigger>
              </TabsList>
              <TabsContent value="predictions" className="py-2">
                <ScheduleTimeBar
                  startTime={contentSchedule.predictions.start}
                  endTime={contentSchedule.predictions.end}
                />
              </TabsContent>
              <TabsContent value="accumulators" className="py-2">
                <ScheduleTimeBar
                  startTime={contentSchedule.accumulators.start}
                  endTime={contentSchedule.accumulators.end}
                />
              </TabsContent>
              <TabsContent value="news" className="py-2">
                <ScheduleTimeBar
                  startTime={contentSchedule.news.start}
                  endTime={contentSchedule.news.end}
                />
              </TabsContent>
              <TabsContent value="livescores" className="py-2">
                <ScheduleTimeBar
                  startTime={contentSchedule.livescores.start}
                  endTime={contentSchedule.livescores.end}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <SheetFooter>
          <Button onClick={() => setIsOpen(false)}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Component to visualize time schedule
function ScheduleTimeBar({ startTime, endTime }: { startTime: string; endTime: string }) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  // Handle overnight schedules (e.g., 22:00 - 04:00)
  const isOvernight = endHour < startHour;
  
  // Calculate position percentages for the time bar
  const calculatePosition = (hour: number, minute: number) => {
    const position = ((hour * 60 + minute) / (24 * 60)) * 100;
    return position;
  };

  const startPosition = calculatePosition(startHour, startMinute);
  let endPosition = calculatePosition(endHour, endMinute);
  
  // Adjust for overnight schedule
  if (isOvernight) {
    endPosition += 100; // Add a full day if end is on the next day
  }

  const barWidth = isOvernight 
    ? endPosition - startPosition 
    : endPosition > startPosition 
      ? endPosition - startPosition 
      : 100 - startPosition + endPosition;

  return (
    <div className="space-y-1">
      <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
        <div
          className="absolute h-full bg-primary/20 rounded-lg"
          style={{
            left: `${startPosition}%`,
            width: `${barWidth}%`,
          }}
        ></div>
        
        {/* Current time indicator */}
        {(() => {
          const now = new Date();
          const currentPosition = calculatePosition(now.getHours(), now.getMinutes());
          return (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary"
              style={{ left: `${currentPosition}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-primary relative -left-[3px] top-1"></div>
            </div>
          );
        })()}
        
        {/* Time markers */}
        {[0, 6, 12, 18].map((hour) => (
          <div
            key={hour}
            className="absolute top-0 bottom-0 w-px bg-border"
            style={{ left: `${(hour / 24) * 100}%` }}
          >
            <span className="absolute -bottom-6 text-xs text-muted-foreground" style={{ marginLeft: '-10px' }}>
              {hour}:00
            </span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-xs">
        <span>{startTime}</span>
        <span>{endTime}{isOvernight ? " (next day)" : ""}</span>
      </div>
    </div>
  );
}