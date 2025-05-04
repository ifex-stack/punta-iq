/**
 * Routes for interacting with the AI microservice
 */
import type { Express } from "express";
import axios from "axios";
import { MicroserviceClient } from "./microservice-client";
import { execSync, spawn } from "child_process";
import path from "path";

interface ErrorWithResponse {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return error.response.data.message;
  } else if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isApiKeyError(error: unknown): boolean {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return true;
  }
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return true;
  }
  if (error instanceof Error && error.message.includes("API key")) {
    return true;
  }
  return false;
}

export function registerMicroserviceRoutes(app: Express) {
  const microserviceClient = new MicroserviceClient();

  // API Status endpoint
  app.get("/api/sports/status", async (req, res) => {
    try {
      const status = await microserviceClient.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting API status:", error);
      
      if (isApiKeyError(error)) {
        res.status(403).json({
          overall: "error",
          services: {
            odds_api: {
              status: "error",
              message: "API key required or invalid"
            },
            sportsdb_api: {
              status: "unknown",
              message: "Status unknown"
            }
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          overall: "error",
          services: {
            odds_api: {
              status: "error",
              message: "Service unavailable"
            },
            sportsdb_api: {
              status: "error",
              message: "Service unavailable"
            }
          },
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  // Get Sports
  app.get("/api/sports", async (req, res) => {
    try {
      const sports = await microserviceClient.getSports();
      res.json(sports);
    } catch (error) {
      console.error("Error getting sports:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get Odds
  app.get("/api/sports/odds/:sport", async (req, res) => {
    try {
      const { sport } = req.params;
      const odds = await microserviceClient.getOdds(sport);
      res.json(odds);
    } catch (error) {
      console.error(`Error getting odds for sport ${req.params.sport}:`, error);
      
      if (isApiKeyError(error)) {
        res.status(403).json({ error: "API key required or invalid for this operation" });
      } else {
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  });

  // Get Live Scores
  app.get("/api/sports/livescores", async (req, res) => {
    try {
      const livescores = await microserviceClient.getLiveScores();
      res.json(livescores);
    } catch (error) {
      console.error("Error getting live scores:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get league fixtures
  app.get("/api/fixtures/league/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const fixtures = await microserviceClient.getLeagueFixtures(id);
      res.json(fixtures);
    } catch (error) {
      console.error(`Error getting fixtures for league ${req.params.id}:`, error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get teams in a league
  app.get("/api/teams/league/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const teams = await microserviceClient.getTeams(id);
      res.json(teams);
    } catch (error) {
      console.error(`Error getting teams for league ${req.params.id}:`, error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get leagues
  app.get("/api/leagues", async (req, res) => {
    try {
      const leagues = await microserviceClient.getLeagues();
      res.json(leagues);
    } catch (error) {
      console.error("Error getting leagues:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Start the microservice
  app.post("/api/sports/microservice/start", async (req, res) => {
    try {
      console.log("Starting AI microservice...");
      
      // Execute the start-ai-service.js script
      const scriptPath = path.join(process.cwd(), "scripts", "start-ai-service.js");
      
      const childProcess = spawn("node", [scriptPath], {
        detached: true,
        stdio: ["ignore", "ignore", "ignore"]
      });
      
      // Unref the child process so the parent can exit independently
      childProcess.unref();
      
      console.log("Successfully started the AI microservice");
      
      res.json({ success: true, message: "AI microservice started successfully" });
    } catch (error) {
      console.error("Failed to start AI microservice:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });
}