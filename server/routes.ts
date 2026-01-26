import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { z } from "zod";
import { processConversation, generateOnePager, analyzeHealthScore, getNextInterviewPrompt } from "./ai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // Get published projects (marketplace)
  app.get('/api/projects', async (req, res) => {
    try {
      const { search, fundingType, status, sortBy } = req.query as any;
      const projects = await storage.getProjects({
        search,
        fundingType,
        status: status || 'published',
        sortBy,
      });
      res.json(projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get project by ID
  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.getProjectWithDetails(Number(req.params.id));
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Increment view count for published projects
      if (project.status === 'published') {
        await storage.incrementViewCount(project.id);
      }
      
      // Check if current user has starred
      const user = req.user as any;
      if (user) {
        project.isStarred = await storage.isStarred(user.claims.sub, project.id);
      }
      
      res.json(project);
    } catch (err) {
      console.error('Error fetching project:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create new project
  app.post('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      
      const user = req.user as any;
      const project = await storage.createProject(user.claims.sub, name);
      res.status(201).json(project);
    } catch (err) {
      console.error('Error creating project:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update project
  app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const user = req.user as any;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      if (project.founderId !== user.claims.sub) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const updated = await storage.updateProject(projectId, req.body);
      res.json(updated);
    } catch (err) {
      console.error('Error updating project:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Publish project
  app.post('/api/projects/:id/publish', isAuthenticated, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const user = req.user as any;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      if (project.founderId !== user.claims.sub) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const published = await storage.publishProject(projectId);
      res.json(published);
    } catch (err) {
      console.error('Error publishing project:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get user's own projects
  app.get('/api/my-projects', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const projects = await storage.getProjectsByFounder(user.claims.sub);
      res.json(projects);
    } catch (err) {
      console.error('Error fetching my projects:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get conversation for project
  app.get('/api/projects/:id/conversation', isAuthenticated, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const user = req.user as any;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      if (project.founderId !== user.claims.sub) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      let conversation = await storage.getConversation(projectId);
      
      // If no conversation yet, start with initial prompt
      if (!conversation || !conversation.messages || (conversation.messages as any[]).length === 0) {
        const initialPrompt = await getNextInterviewPrompt('solution', project.name);
        const messages = [{ role: 'assistant' as const, content: initialPrompt }];
        conversation = await storage.updateConversation(projectId, messages, 'solution');
      }
      
      res.json({
        messages: conversation.messages,
        currentStage: conversation.currentStage,
      });
    } catch (err) {
      console.error('Error fetching conversation:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Send message in conversation
  app.post('/api/projects/:id/conversation', isAuthenticated, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const { message } = req.body;
      const user = req.user as any;
      
      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      if (project.founderId !== user.claims.sub) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      let conversation = await storage.getConversation(projectId);
      const messages = (conversation?.messages as any[]) || [];
      const currentStage = conversation?.currentStage || 'solution';
      
      // Process with AI
      const result = await processConversation(message, {
        messages,
        currentStage,
        collected: {},
        projectName: project.name,
      });
      
      // Update messages
      const newMessages = [
        ...messages,
        { role: 'user', content: message },
        { role: 'assistant', content: result.response },
      ];
      
      await storage.updateConversation(projectId, newMessages, result.newStage);
      
      // Update project fields based on collected data
      const updates: any = {};
      if (result.collected.solution) updates.solution = result.collected.solution;
      if (result.collected.customer) updates.customer = result.collected.customer;
      if (result.collected.goals) updates.goals = result.collected.goals;
      if (result.collected.context) updates.context = result.collected.context;
      if (result.collected.barriers) updates.barriers = result.collected.barriers;
      if (result.collected.credentials) updates.credentials = result.collected.credentials;
      
      if (Object.keys(updates).length > 0) {
        await storage.updateProject(projectId, updates);
      }
      
      res.json({
        message: result.response,
        stage: result.newStage,
        collected: result.collected,
        complete: result.complete,
      });
    } catch (err) {
      console.error('Error processing conversation:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Generate one-pager
  app.post('/api/projects/:id/one-pager', isAuthenticated, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const user = req.user as any;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      if (project.founderId !== user.claims.sub) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const content = await generateOnePager(project);
      await storage.updateProject(projectId, { onePagerContent: content });
      
      res.json({ content });
    } catch (err) {
      console.error('Error generating one-pager:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Analyze health score
  app.post('/api/projects/:id/health-score', isAuthenticated, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const user = req.user as any;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      if (project.founderId !== user.claims.sub) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const scores = await analyzeHealthScore(project);
      
      // Save scores to project
      await storage.updateProject(projectId, {
        scoreProblem: scores.problem,
        scoreSolution: scores.solution,
        scoreCustomer: scores.customer,
        scoreFounder: scores.founder,
        scoreMarket: scores.market,
      });
      
      res.json(scores);
    } catch (err) {
      console.error('Error analyzing health score:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Toggle star
  app.post('/api/projects/:id/star', isAuthenticated, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const user = req.user as any;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const starred = await storage.toggleStar(user.claims.sub, projectId);
      res.json({ starred });
    } catch (err) {
      console.error('Error toggling star:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get starred projects
  app.get('/api/starred', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const projects = await storage.getStarredProjects(user.claims.sub);
      res.json(projects);
    } catch (err) {
      console.error('Error fetching starred projects:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Express interest
  app.post('/api/projects/:id/interest', isAuthenticated, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const { amount, message } = req.body;
      const user = req.user as any;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const interest = await storage.createInterest(user.claims.sub, {
        projectId,
        amount,
        message,
      });
      
      res.status(201).json(interest);
    } catch (err) {
      console.error('Error expressing interest:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get interests for project
  app.get('/api/projects/:id/interests', isAuthenticated, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const user = req.user as any;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      if (project.founderId !== user.claims.sub) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const interests = await storage.getInterestsForProject(projectId);
      res.json(interests);
    } catch (err) {
      console.error('Error fetching interests:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create question
  app.post('/api/projects/:id/questions', isAuthenticated, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const { question, isAnonymous } = req.body;
      const user = req.user as any;
      
      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const q = await storage.createQuestion(user.claims.sub, {
        projectId,
        question,
        isAnonymous: isAnonymous || false,
      });
      
      res.status(201).json(q);
    } catch (err) {
      console.error('Error creating question:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get questions for project
  app.get('/api/projects/:id/questions', async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const questions = await storage.getQuestionsForProject(projectId);
      res.json(questions);
    } catch (err) {
      console.error('Error fetching questions:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Answer question
  app.post('/api/questions/:id/answer', isAuthenticated, async (req, res) => {
    try {
      const questionId = Number(req.params.id);
      const { answer } = req.body;
      const user = req.user as any;
      
      if (!answer) {
        return res.status(400).json({ message: 'Answer is required' });
      }
      
      // Get question to verify ownership
      const questions = await storage.getQuestionsForProject(0); // Need to refactor for this
      const question = questions.find(q => q.id === questionId);
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      const project = await storage.getProject(question.projectId);
      if (!project || project.founderId !== user.claims.sub) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const answered = await storage.answerQuestion(questionId, answer);
      res.json(answered);
    } catch (err) {
      console.error('Error answering question:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return httpServer;
}
