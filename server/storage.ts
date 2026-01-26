import { 
  projects, pledges, 
  type Project, type InsertProject, 
  type Pledge, type InsertPledge 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  createPledge(pledge: InsertPledge): Promise<Pledge>;
  getPledgesForProject(projectId: number): Promise<Pledge[]>;
  getPledgesByUser(userId: string): Promise<Pledge[]>;
}

export class DatabaseStorage implements IStorage {
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async createPledge(insertPledge: InsertPledge): Promise<Pledge> {
    // Transaction to ensure we update project amount and create pledge
    return await db.transaction(async (tx) => {
      const [pledge] = await tx.insert(pledges).values(insertPledge).returning();
      
      const [project] = await tx.select().from(projects).where(eq(projects.id, insertPledge.projectId));
      if (project) {
        await tx.update(projects)
          .set({ currentAmount: project.currentAmount + insertPledge.amount })
          .where(eq(projects.id, insertPledge.projectId));
      }
      
      return pledge;
    });
  }

  async getPledgesForProject(projectId: number): Promise<Pledge[]> {
    return await db.select().from(pledges).where(eq(pledges.projectId, projectId));
  }

  async getPledgesByUser(userId: string): Promise<Pledge[]> {
    return await db.select().from(pledges).where(eq(pledges.backerId, userId));
  }
}

export const storage = new DatabaseStorage();
