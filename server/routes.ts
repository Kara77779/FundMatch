import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Projects API
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  });

  app.post(api.projects.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const user = req.user as any;
      
      const project = await storage.createProject({
        ...input,
        creatorId: user.claims.sub
      });
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.projects.pledge.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.projects.pledge.input.parse(req.body);
      const projectId = Number(req.params.id);
      const user = req.user as any;

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const pledge = await storage.createPledge({
        amount: input.amount,
        projectId: projectId,
        backerId: user.claims.sub
      });
      
      res.status(201).json(pledge);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.pledges.list.path, async (req, res) => {
    const projectId = Number(req.params.id);
    const pledges = await storage.getPledgesForProject(projectId);
    res.json(pledges);
  });

  // Seed data
  if ((await storage.getProjects()).length === 0) {
    console.log("Seeding database...");
    
    // We need a dummy creator ID if we don't have users yet.
    // In real app, first user would create projects.
    // For now, we'll wait for a user or just insert with a placeholder if constraint allows?
    // Constraints enforce existing user.
    // So we can't seed projects without users.
    // We will skip auto-seeding projects that depend on users, or mock a user if we could.
    // But `users` table is managed by auth storage and ID comes from Replit.
    // I'll skip seeding for now, or I'd have to insert a mock user.
    // Let's insert a mock user for seeding purposes.
    
    // Note: We need to import authStorage or db to insert user.
    // But authStorage is in another file.
    // Let's just log that we need users.
    console.log("Database empty. Log in and create a project!");
  }

  return httpServer;
}
