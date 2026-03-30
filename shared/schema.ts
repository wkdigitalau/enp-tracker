import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["nurse", "manager", "admin"]);
export const competencyStatusEnum = pgEnum("competency_status", ["not_started", "ready", "signed_off"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("nurse"),
});

export const facilities = pgTable("facilities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
});

export const managerFacilities = pgTable("manager_facilities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  managerUserId: integer("manager_user_id").notNull().references(() => users.id),
  facilityId: integer("facility_id").notNull().references(() => facilities.id),
});

export const programTemplates = pgTable("program_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
});

export const competencies = pgTable("competencies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  programTemplateId: integer("program_template_id").notNull().references(() => programTemplates.id),
  weekNumber: integer("week_number").notNull(),
  title: text("title").notNull(),
  phase: text("phase").notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nurseUserId: integer("nurse_user_id").notNull().references(() => users.id),
  programTemplateId: integer("program_template_id").notNull().references(() => programTemplates.id),
  facilityId: integer("facility_id").notNull().references(() => facilities.id),
  startDate: timestamp("start_date").notNull(),
  active: boolean("active").notNull().default(true),
});

export const competencyProgress = pgTable("competency_progress", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id),
  competencyId: integer("competency_id").notNull().references(() => competencies.id),
  status: competencyStatusEnum("status").notNull().default("not_started"),
  nurseReadyAt: timestamp("nurse_ready_at"),
  signedOffAt: timestamp("signed_off_at"),
  signedOffByUserId: integer("signed_off_by_user_id").references(() => users.id),
});

export const comments = pgTable("comments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  competencyProgressId: integer("competency_progress_id").notNull().references(() => competencyProgress.id),
  authorUserId: integer("author_user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  readAt: timestamp("read_at"),
});

export const demoFeedback = pgTable("demo_feedback", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  section: text("section").notNull(),
  authorName: text("author_name").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertFacilitySchema = createInsertSchema(facilities);
export const insertManagerFacilitySchema = createInsertSchema(managerFacilities);
export const insertProgramTemplateSchema = createInsertSchema(programTemplates);
export const insertCompetencySchema = createInsertSchema(competencies);
export const insertEnrollmentSchema = createInsertSchema(enrollments);
export const insertCompetencyProgressSchema = createInsertSchema(competencyProgress);
export const insertCommentSchema = createInsertSchema(comments);
export const insertNotificationSchema = createInsertSchema(notifications);

export const insertDemoFeedbackSchema = createInsertSchema(demoFeedback);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type ManagerFacility = typeof managerFacilities.$inferSelect;
export type ProgramTemplate = typeof programTemplates.$inferSelect;
export type Competency = typeof competencies.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type CompetencyProgress = typeof competencyProgress.$inferSelect;
export type InsertCompetencyProgress = z.infer<typeof insertCompetencyProgressSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type DemoFeedback = typeof demoFeedback.$inferSelect;
export type InsertDemoFeedback = z.infer<typeof insertDemoFeedbackSchema>;
