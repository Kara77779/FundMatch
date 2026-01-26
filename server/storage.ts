import { 
  projects, projectConversations, projectVersions,
  stars, investmentInterests, questions, investorPreferences,
  type Project, type InsertProject, 
  type ProjectConversation, type Star, type InsertStar,
  type InvestmentInterest, type InsertInvestmentInterest,
  type Question, type InsertQuestion,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProjects(filters?: { search?: string; fundingType?: string; status?: string; sortBy?: string }): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectWithDetails(id: number): Promise<any>;
  createProject(founderId: string, name: string): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project>;
  getProjectsByFounder(founderId: string): Promise<Project[]>;
  publishProject(id: number): Promise<Project>;
  incrementViewCount(id: number): Promise<void>;

  // Conversations
  getConversation(projectId: number): Promise<ProjectConversation | undefined>;
  updateConversation(projectId: number, messages: any[], stage: string): Promise<ProjectConversation>;

  // Stars
  toggleStar(investorId: string, projectId: number): Promise<boolean>;
  getStarredProjects(investorId: string): Promise<Project[]>;
  isStarred(investorId: string, projectId: number): Promise<boolean>;
  getStarCount(projectId: number): Promise<number>;

  // Investment Interests
  createInterest(investorId: string, data: InsertInvestmentInterest): Promise<InvestmentInterest>;
  getInterestsForProject(projectId: number): Promise<InvestmentInterest[]>;

  // Questions
  createQuestion(investorId: string, data: InsertQuestion): Promise<Question>;
  getQuestionsForProject(projectId: number): Promise<Question[]>;
  answerQuestion(id: number, answer: string): Promise<Question>;

  // User lookup
  getUser(id: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getProjects(filters?: { search?: string; fundingType?: string; status?: string; sortBy?: string }): Promise<Project[]> {
    let query = db.select().from(projects);
    
    const conditions: any[] = [];
    
    if (filters?.status) {
      conditions.push(eq(projects.status, filters.status));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(projects.name, `%${filters.search}%`),
          ilike(projects.solution, `%${filters.search}%`),
          ilike(projects.customer, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.fundingType && filters.fundingType !== 'all') {
      conditions.push(sql`${filters.fundingType} = ANY(${projects.fundingTypeAccepted})`);
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    // Sorting
    if (filters?.sortBy === 'views') {
      return await query.orderBy(desc(projects.viewCount));
    } else if (filters?.sortBy === 'score') {
      return await query.orderBy(desc(projects.scoreProblem)); // Use problem score as primary
    }
    
    return await query.orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectWithDetails(id: number): Promise<any> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return undefined;

    const [founder] = await db.select().from(users).where(eq(users.id, project.founderId));
    const starCount = await this.getStarCount(id);
    const interestCount = await db.select({ count: sql<number>`count(*)` }).from(investmentInterests).where(eq(investmentInterests.projectId, id));

    return {
      ...project,
      founder,
      starCount,
      interestCount: Number(interestCount[0]?.count || 0),
    };
  }

  async createProject(founderId: string, name: string): Promise<Project> {
    const [project] = await db.insert(projects).values({
      founderId,
      name,
      status: 'draft',
    }).returning();

    // Create empty conversation
    await db.insert(projectConversations).values({
      projectId: project.id,
      messages: [],
      currentStage: 'solution',
    });

    return project;
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project> {
    const [project] = await db.update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async getProjectsByFounder(founderId: string): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.founderId, founderId))
      .orderBy(desc(projects.createdAt));
  }

  async publishProject(id: number): Promise<Project> {
    const [project] = await db.update(projects)
      .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async incrementViewCount(id: number): Promise<void> {
    await db.update(projects)
      .set({ viewCount: sql`${projects.viewCount} + 1` })
      .where(eq(projects.id, id));
  }

  // Conversations
  async getConversation(projectId: number): Promise<ProjectConversation | undefined> {
    const [conv] = await db.select().from(projectConversations)
      .where(eq(projectConversations.projectId, projectId));
    return conv;
  }

  async updateConversation(projectId: number, messages: any[], stage: string): Promise<ProjectConversation> {
    const existing = await this.getConversation(projectId);
    
    if (existing) {
      const [conv] = await db.update(projectConversations)
        .set({ messages, currentStage: stage, updatedAt: new Date() })
        .where(eq(projectConversations.projectId, projectId))
        .returning();
      return conv;
    } else {
      const [conv] = await db.insert(projectConversations).values({
        projectId,
        messages,
        currentStage: stage,
      }).returning();
      return conv;
    }
  }

  // Stars
  async toggleStar(investorId: string, projectId: number): Promise<boolean> {
    const [existing] = await db.select().from(stars)
      .where(and(eq(stars.investorId, investorId), eq(stars.projectId, projectId)));

    if (existing) {
      await db.delete(stars)
        .where(and(eq(stars.investorId, investorId), eq(stars.projectId, projectId)));
      return false;
    } else {
      await db.insert(stars).values({ investorId, projectId });
      return true;
    }
  }

  async getStarredProjects(investorId: string): Promise<Project[]> {
    const result = await db.select({ project: projects })
      .from(stars)
      .innerJoin(projects, eq(stars.projectId, projects.id))
      .where(eq(stars.investorId, investorId))
      .orderBy(desc(stars.createdAt));
    
    return result.map(r => r.project);
  }

  async isStarred(investorId: string, projectId: number): Promise<boolean> {
    const [existing] = await db.select().from(stars)
      .where(and(eq(stars.investorId, investorId), eq(stars.projectId, projectId)));
    return !!existing;
  }

  async getStarCount(projectId: number): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(stars)
      .where(eq(stars.projectId, projectId));
    return Number(result?.count || 0);
  }

  // Investment Interests
  async createInterest(investorId: string, data: InsertInvestmentInterest): Promise<InvestmentInterest> {
    const [interest] = await db.insert(investmentInterests).values({
      ...data,
      investorId,
    }).returning();
    return interest;
  }

  async getInterestsForProject(projectId: number): Promise<InvestmentInterest[]> {
    return await db.select().from(investmentInterests)
      .where(eq(investmentInterests.projectId, projectId))
      .orderBy(desc(investmentInterests.createdAt));
  }

  // Questions
  async createQuestion(investorId: string, data: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values({
      ...data,
      investorId,
    }).returning();
    return question;
  }

  async getQuestionsForProject(projectId: number): Promise<Question[]> {
    return await db.select().from(questions)
      .where(eq(questions.projectId, projectId))
      .orderBy(desc(questions.createdAt));
  }

  async answerQuestion(id: number, answer: string): Promise<Question> {
    const [question] = await db.update(questions)
      .set({ answer, answeredAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  // Users
  async getUser(id: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
}

export const storage = new DatabaseStorage();
