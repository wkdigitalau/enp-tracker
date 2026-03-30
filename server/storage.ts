import { db } from "./db";
import { eq, and, inArray, isNull, desc } from "drizzle-orm";
import {
  users,
  facilities,
  managerFacilities,
  programTemplates,
  competencies,
  enrollments,
  competencyProgress,
  comments,
  notifications,
  demoFeedback,
  type User,
  type InsertUser,
  type Facility,
  type InsertFacility,
  type Competency,
  type Enrollment,
  type CompetencyProgress,
  type Comment,
  type Notification,
  type ProgramTemplate,
  type DemoFeedback,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, passwordHash: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;

  createFacility(name: string): Promise<Facility>;
  getAllFacilities(): Promise<Facility[]>;
  getFacilitiesWithManagers(): Promise<(Facility & { managers: { id: number; name: string }[] })[]>;

  assignManagerToFacility(managerUserId: number, facilityId: number): Promise<void>;
  getManagerFacilityIds(managerUserId: number): Promise<number[]>;

  createProgramTemplate(name: string): Promise<ProgramTemplate>;
  getAllProgramTemplates(): Promise<ProgramTemplate[]>;
  createCompetency(programTemplateId: number, weekNumber: number, title: string, phase: string): Promise<Competency>;
  getCompetenciesByProgram(programTemplateId: number): Promise<Competency[]>;

  createEnrollment(nurseUserId: number, programTemplateId: number, facilityId: number, startDate: Date): Promise<Enrollment>;
  getEnrollmentById(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByNurse(nurseUserId: number): Promise<Enrollment[]>;
  getEnrollmentsByFacilityIds(facilityIds: number[]): Promise<Enrollment[]>;
  getAllEnrollments(): Promise<Enrollment[]>;

  createCompetencyProgress(enrollmentId: number, competencyId: number): Promise<CompetencyProgress>;
  getProgressByEnrollment(enrollmentId: number): Promise<CompetencyProgress[]>;
  getProgressById(id: number): Promise<CompetencyProgress | undefined>;
  markReady(progressId: number): Promise<void>;
  signOff(progressId: number, signedOffByUserId: number): Promise<void>;
  getReadyProgressByFacilityIds(facilityIds: number[]): Promise<CompetencyProgress[]>;

  addComment(competencyProgressId: number, authorUserId: number, text: string): Promise<Comment>;
  getCommentsByProgress(competencyProgressId: number): Promise<Comment[]>;

  createNotification(userId: number, type: string, message: string, link?: string): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;

  addDemoFeedback(section: string, authorName: string, text: string): Promise<DemoFeedback>;
  getDemoFeedbackBySection(section: string): Promise<DemoFeedback[]>;
  getAllDemoFeedback(): Promise<DemoFeedback[]>;
  deleteDemoFeedback(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role as any));
  }

  async createFacility(name: string): Promise<Facility> {
    const [created] = await db.insert(facilities).values({ name }).returning();
    return created;
  }

  async getAllFacilities(): Promise<Facility[]> {
    return db.select().from(facilities);
  }

  async getFacilitiesWithManagers(): Promise<(Facility & { managers: { id: number; name: string }[] })[]> {
    const allFacilities = await db.select().from(facilities);
    const allMF = await db.select().from(managerFacilities);
    const managerIds = [...new Set(allMF.map((mf) => mf.managerUserId))];
    const managerUsers = managerIds.length > 0
      ? await db.select().from(users).where(inArray(users.id, managerIds))
      : [];

    return allFacilities.map((f) => ({
      ...f,
      managers: allMF
        .filter((mf) => mf.facilityId === f.id)
        .map((mf) => {
          const u = managerUsers.find((u) => u.id === mf.managerUserId);
          return { id: mf.managerUserId, name: u?.name || "Unknown" };
        }),
    }));
  }

  async assignManagerToFacility(managerUserId: number, facilityId: number): Promise<void> {
    const existing = await db.select().from(managerFacilities)
      .where(and(eq(managerFacilities.managerUserId, managerUserId), eq(managerFacilities.facilityId, facilityId)));
    if (existing.length > 0) return;
    await db.insert(managerFacilities).values({ managerUserId, facilityId });
  }

  async getManagerFacilityIds(managerUserId: number): Promise<number[]> {
    const rows = await db.select().from(managerFacilities).where(eq(managerFacilities.managerUserId, managerUserId));
    return rows.map((r) => r.facilityId);
  }

  async createProgramTemplate(name: string): Promise<ProgramTemplate> {
    const [created] = await db.insert(programTemplates).values({ name }).returning();
    return created;
  }

  async getAllProgramTemplates(): Promise<ProgramTemplate[]> {
    return db.select().from(programTemplates);
  }

  async createCompetency(programTemplateId: number, weekNumber: number, title: string, phase: string): Promise<Competency> {
    const [created] = await db.insert(competencies).values({ programTemplateId, weekNumber, title, phase }).returning();
    return created;
  }

  async getCompetenciesByProgram(programTemplateId: number): Promise<Competency[]> {
    return db.select().from(competencies).where(eq(competencies.programTemplateId, programTemplateId));
  }

  async createEnrollment(nurseUserId: number, programTemplateId: number, facilityId: number, startDate: Date): Promise<Enrollment> {
    const [created] = await db.insert(enrollments).values({ nurseUserId, programTemplateId, facilityId, startDate }).returning();
    return created;
  }

  async getEnrollmentById(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async getEnrollmentsByNurse(nurseUserId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.nurseUserId, nurseUserId));
  }

  async getEnrollmentsByFacilityIds(facilityIds: number[]): Promise<Enrollment[]> {
    if (facilityIds.length === 0) return [];
    return db.select().from(enrollments).where(inArray(enrollments.facilityId, facilityIds));
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    return db.select().from(enrollments);
  }

  async createCompetencyProgress(enrollmentId: number, competencyId: number): Promise<CompetencyProgress> {
    const [created] = await db.insert(competencyProgress).values({ enrollmentId, competencyId }).returning();
    return created;
  }

  async getProgressByEnrollment(enrollmentId: number): Promise<CompetencyProgress[]> {
    return db.select().from(competencyProgress).where(eq(competencyProgress.enrollmentId, enrollmentId));
  }

  async getProgressById(id: number): Promise<CompetencyProgress | undefined> {
    const [p] = await db.select().from(competencyProgress).where(eq(competencyProgress.id, id));
    return p;
  }

  async markReady(progressId: number): Promise<void> {
    await db.update(competencyProgress)
      .set({ status: "ready", nurseReadyAt: new Date() })
      .where(eq(competencyProgress.id, progressId));
  }

  async signOff(progressId: number, signedOffByUserId: number): Promise<void> {
    await db.update(competencyProgress)
      .set({ status: "signed_off", signedOffAt: new Date(), signedOffByUserId })
      .where(eq(competencyProgress.id, progressId));
  }

  async getReadyProgressByFacilityIds(facilityIds: number[]): Promise<CompetencyProgress[]> {
    if (facilityIds.length === 0) return [];
    const enrs = await this.getEnrollmentsByFacilityIds(facilityIds);
    const enrollmentIds = enrs.map((e) => e.id);
    if (enrollmentIds.length === 0) return [];
    return db.select().from(competencyProgress)
      .where(and(
        inArray(competencyProgress.enrollmentId, enrollmentIds),
        eq(competencyProgress.status, "ready")
      ));
  }

  async addComment(competencyProgressId: number, authorUserId: number, text: string): Promise<Comment> {
    const [created] = await db.insert(comments).values({ competencyProgressId, authorUserId, text }).returning();
    return created;
  }

  async getCommentsByProgress(competencyProgressId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.competencyProgressId, competencyProgressId));
  }

  async createNotification(userId: number, type: string, message: string, link?: string): Promise<Notification> {
    const [created] = await db.insert(notifications).values({ userId, type, message, link }).returning();
    return created;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  }

  async addDemoFeedback(section: string, authorName: string, text: string): Promise<DemoFeedback> {
    const [created] = await db.insert(demoFeedback).values({ section, authorName, text }).returning();
    return created;
  }

  async getDemoFeedbackBySection(section: string): Promise<DemoFeedback[]> {
    return db.select().from(demoFeedback).where(eq(demoFeedback.section, section)).orderBy(desc(demoFeedback.createdAt));
  }

  async getAllDemoFeedback(): Promise<DemoFeedback[]> {
    return db.select().from(demoFeedback).orderBy(desc(demoFeedback.createdAt));
  }

  async deleteDemoFeedback(id: number): Promise<void> {
    await db.delete(demoFeedback).where(eq(demoFeedback.id, id));
  }
}

export const storage = new DatabaseStorage();
