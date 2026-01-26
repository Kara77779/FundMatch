import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/auth";
import { users } from "./models/auth";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  goalAmount: integer("goal_amount").notNull(), // in cents
  currentAmount: integer("current_amount").notNull().default(0), // in cents
  category: text("category").notNull(),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pledges = pgTable("pledges", {
  id: serial("id").primaryKey(),
  amount: integer("amount").notNull(), // in cents
  projectId: integer("project_id").notNull().references(() => projects.id),
  backerId: varchar("backer_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.creatorId],
    references: [users.id],
  }),
  pledges: many(pledges),
}));

export const pledgesRelations = relations(pledges, ({ one }) => ({
  project: one(projects, {
    fields: [pledges.projectId],
    references: [projects.id],
  }),
  backer: one(users, {
    fields: [pledges.backerId],
    references: [users.id],
  }),
}));

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true, 
  currentAmount: true,
  createdAt: true,
  creatorId: true // set on server from session
});

export const insertPledgeSchema = createInsertSchema(pledges).omit({
  id: true,
  createdAt: true,
  backerId: true // set on server from session
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Pledge = typeof pledges.$inferSelect;
export type InsertPledge = z.infer<typeof insertPledgeSchema>;
