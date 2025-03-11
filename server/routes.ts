import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertSubmissionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/upload/artwork", async (req, res) => {
    try {
      // This is a mock implementation - in a real app, you'd handle file uploads
      // and store them in a cloud storage service
      res.json({ url: `https://example.com/artwork/${Date.now()}.jpg` });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload artwork" });
    }
  });

  app.post("/api/upload/audio", async (req, res) => {
    try {
      // This is a mock implementation - in a real app, you'd handle file uploads
      // and store them in a cloud storage service
      res.json({ url: `https://example.com/audio/${Date.now()}.mp3` });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload audio" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    if (!insertSubmissionSchema.safeParse(req.body).success) {
      return res.status(400).send("Invalid submission data");
    }

    const submission = await storage.createSubmission({
      ...req.body,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(submission);
  });

  app.get("/api/submissions", async (req, res) => {
    if (!req.user?.isTeamMember) {
      return res.status(403).send("Access denied");
    }

    const submissions = await storage.getSubmissions();
    res.json(submissions);
  });

  app.get("/api/submissions/:id", async (req, res) => {
    if (!req.user?.isTeamMember) {
      return res.status(403).send("Access denied");
    }

    const id = parseInt(req.params.id);
    const submission = await storage.getSubmission(id);

    if (!submission) {
      return res.status(404).send("Submission not found");
    }

    res.json(submission);
  });

  app.patch("/api/submissions/:id", async (req, res) => {
    if (!req.user?.isTeamMember) {
      return res.status(403).send("Access denied");
    }

    const id = parseInt(req.params.id);
    const status = req.body.status;

    if (!["approved", "declined"].includes(status)) {
      return res.status(400).send("Invalid status");
    }

    const submission = await storage.updateSubmissionStatus(id, status);
    if (!submission) {
      return res.status(404).send("Submission not found");
    }

    res.json(submission);
  });

  app.delete("/api/submissions/:id/files", async (req, res) => {
    if (!req.user?.isTeamMember) {
      return res.status(403).send("Access denied");
    }

    const id = parseInt(req.params.id);
    const { type, index } = req.body;

    if (!["artwork", "audio"].includes(type)) {
      return res.status(400).send("Invalid file type");
    }

    const submission = await storage.deleteSubmissionFile(id, type, index);
    if (!submission) {
      return res.status(404).send("Submission not found");
    }

    res.json(submission);
  });

  const httpServer = createServer(app);
  return httpServer;
}