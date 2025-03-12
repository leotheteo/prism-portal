import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertSubmissionSchema, insertFaqSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Submission routes
  app.post("/api/submissions", async (req: Request, res) => {
    // Removed auth check since artists don't need to login
    const submission = insertSubmissionSchema.parse(req.body);
    const created = await storage.createSubmission({
      ...submission,
      artistId: null, // Since we don't have auth
      status: "pending",
      createdAt: new Date(),
    });
    res.status(201).json(created);
  });

  app.get("/api/submissions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);

    try {
      const submissions = await storage.getSubmissions();
      console.log("Retrieved submissions:", submissions); // Add logging
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions/:id/review", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);

    const { status } = req.body;
    if (status !== "approved" && status !== "declined") {
      return res.status(400).send("Invalid status");
    }

    await storage.updateSubmission(parseInt(req.params.id), status);
    res.sendStatus(200);
  });

  // Download track
  app.get("/api/submissions/:id/tracks/:trackIndex/download", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);

    const submissionId = parseInt(req.params.id);
    const trackIndex = parseInt(req.params.trackIndex);
    
    const submission = await storage.getSubmission(submissionId);
    if (!submission || !submission.tracks || !submission.tracks[trackIndex]) {
      return res.status(404).send("Track not found");
    }
    
    const track = submission.tracks[trackIndex];
    
    // For demo purposes, we just send the URL
    // In a real app, you would stream the file from storage
    res.json({ downloadUrl: track.url });
  });

  // Download artwork
  app.get("/api/submissions/:id/artwork/download", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);

    const submissionId = parseInt(req.params.id);
    
    const submission = await storage.getSubmission(submissionId);
    if (!submission || !submission.artwork) {
      return res.status(404).send("Artwork not found");
    }
    
    // For demo purposes, we just send the URL
    // In a real app, you would stream the file from storage
    res.json({ downloadUrl: submission.artwork.url });
  });
  
  // Download a track
  app.get("/api/submissions/:id/tracks/:trackIndex/download", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);
    
    const submissionId = parseInt(req.params.id);
    const trackIndex = parseInt(req.params.trackIndex);
    
    const submission = await storage.getSubmission(submissionId);
    if (!submission || !submission.tracks || !submission.tracks[trackIndex]) {
      return res.status(404).send("Track not found");
    }
    
    // For demo purposes, we just send the URL
    // In a real app, you would stream the file from storage
    res.json({ downloadUrl: submission.tracks[trackIndex].url });
  });
  
  // Download artwork
  app.get("/api/submissions/:id/artwork/download", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);
    
    const submissionId = parseInt(req.params.id);
    
    const submission = await storage.getSubmission(submissionId);
    if (!submission || !submission.artwork) {
      return res.status(404).send("Artwork not found");
    }
    
    // For demo purposes, we just send the URL
    // In a real app, you would stream the file from storage
    res.json({ downloadUrl: submission.artwork.url });
  });

  // Delete track
  app.delete("/api/submissions/:id/tracks/:trackIndex", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);

    const submissionId = parseInt(req.params.id);
    const trackIndex = parseInt(req.params.trackIndex);
    
    await storage.deleteTrack(submissionId, trackIndex);
    res.sendStatus(200);
  });

  // Delete artwork
  app.delete("/api/submissions/:id/artwork", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);

    const submissionId = parseInt(req.params.id);
    
    await storage.deleteArtwork(submissionId);
    res.sendStatus(200);
  });

  // FAQ routes
  app.get("/api/faqs", async (req, res) => {
    const faqs = await storage.getFaqs();
    res.json(faqs);
  });

  app.post("/api/faqs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);

    const faq = insertFaqSchema.parse(req.body);
    const created = await storage.createFaq(faq);
    res.status(201).json(created);
  });

  app.patch("/api/faqs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);

    await storage.updateFaq(parseInt(req.params.id), req.body);
    res.sendStatus(200);
  });

  app.delete("/api/faqs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "team") return res.sendStatus(403);

    await storage.deleteFaq(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Test endpoint for authentication status
  app.get("/api/auth-status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({
        authenticated: true,
        user: req.user,
        sessionID: req.sessionID
      });
    } else {
      res.json({
        authenticated: false,
        message: "Not authenticated"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}