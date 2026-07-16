import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

export * from "./models/auth";
import { users } from "./models/auth";

// Projects table - core startup/fundraising project
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  founderId: varchar("founder_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"), // 'draft', 'published', 'funded'
  
  // JTBD fields
  solution: text("solution"),
  customer: text("customer"),
  goals: text("goals"),
  context: text("context"),
  barriers: text("barriers"),
  
  // Founder info
  unfairAdvantages: text("unfair_advantages").array(),
  credentials: text("credentials"),
  
  // Funding type preference
  fundingTypeAccepted: text("funding_type_accepted").array(), // ['equity'], ['debt'], or ['equity', 'debt']
  
  // Equity parameters
  valuationMin: integer("valuation_min"),
  valuationMax: integer("valuation_max"),
  equityMaxPercentage: integer("equity_max_percentage"),
  
  // Debt parameters
  debtType: text("debt_type"), // 'revenue_share', 'fixed_return', 'convertible'
  expectedInterestRate: integer("expected_interest_rate"),
  repaymentMonths: integer("repayment_months"),
  revenueSharePercentage: integer("revenue_share_percentage"),
  revenueShareCapMultiple: numeric("revenue_share_cap_multiple"),
  
  fundingGoal: integer("funding_goal"),
  
  // Health scores (0-100)
  scoreProblem: integer("score_problem"),
  scoreSolution: integer("score_solution"),
  scoreCustomer: integer("score_customer"),
  scoreFounder: integer("score_founder"),
  scoreMarket: integer("score_market"),
  
  // Generated content
  onePagerContent: text("one_pager_content"),
  
  // Metrics
  viewCount: integer("view_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// AI Conversation history for JTBD interview
export const projectConversations = pgTable("project_conversations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  messages: jsonb("messages").notNull().default([]), // [{role: 'user'|'assistant', content: string}]
  currentStage: text("current_stage").default("solution"), // 'solution', 'customer', 'goals', etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project versions for history tracking
export const projectVersions = pgTable("project_versions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  onePagerContent: text("one_pager_content"),
  scores: jsonb("scores"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stars/bookmarks from investors
export const stars = pgTable("stars", {
  id: serial("id").primaryKey(),
  investorId: varchar("investor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Investment interests
export const investmentInterests = pgTable("investment_interests", {
  id: serial("id").primaryKey(),
  investorId: varchar("investor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  amount: integer("amount"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions from investors
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  investorId: varchar("investor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  answeredAt: timestamp("answered_at"),
});

// Investor preferences
export const investorPreferences = pgTable("investor_preferences", {
  id: serial("id").primaryKey(),
  investorId: varchar("investor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  preferredFundingTypes: text("preferred_funding_types").array(),
  valuationMin: integer("valuation_min"),
  valuationMax: integer("valuation_max"),
  preferredIndustries: text("preferred_industries").array(),
  minInterestRate: integer("min_interest_rate"),
  maxRepaymentMonths: integer("max_repayment_months"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  founder: one(users, {
    fields: [projects.founderId],
    references: [users.id],
  }),
  conversation: one(projectConversations),
  versions: many(projectVersions),
  stars: many(stars),
  investmentInterests: many(investmentInterests),
  questions: many(questions),
}));

export const projectConversationsRelations = relations(projectConversations, ({ one }) => ({
  project: one(projects, {
    fields: [projectConversations.projectId],
    references: [projects.id],
  }),
}));

export const starsRelations = relations(stars, ({ one }) => ({
  investor: one(users, {
    fields: [stars.investorId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [stars.projectId],
    references: [projects.id],
  }),
}));

export const investmentInterestsRelations = relations(investmentInterests, ({ one }) => ({
  investor: one(users, {
    fields: [investmentInterests.investorId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [investmentInterests.projectId],
    references: [projects.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  investor: one(users, {
    fields: [questions.investorId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [questions.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true, 
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  founderId: true,
});

export const insertStarSchema = createInsertSchema(stars).omit({
  id: true,
  createdAt: true,
  investorId: true,
});

export const insertInvestmentInterestSchema = createInsertSchema(investmentInterests).omit({
  id: true,
  createdAt: true,
  investorId: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  answeredAt: true,
  investorId: true,
  answer: true,
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectConversation = typeof projectConversations.$inferSelect;
export type Star = typeof stars.$inferSelect;
export type InsertStar = z.infer<typeof insertStarSchema>;
export type InvestmentInterest = typeof investmentInterests.$inferSelect;
export type InsertInvestmentInterest = z.infer<typeof insertInvestmentInterestSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InvestorPreference = typeof investorPreferences.$inferSelect;
