import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { addDays, differenceInDays } from "date-fns";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  const testHash = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, testHash);
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface TokenEntry {
  userId: number;
  expiresAt: number;
}

const tokenStore = new Map<string, TokenEntry>();

// Purge expired tokens every hour
setInterval(() => {
  const now = Date.now();
  Array.from(tokenStore.entries()).forEach(([token, entry]) => {
    if (entry.expiresAt <= now) tokenStore.delete(token);
  });
}, 60 * 60 * 1000);

function getUserIdFromRequest(req: Request): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const entry = tokenStore.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    tokenStore.delete(token);
    return null;
  }
  return entry.userId;
}

function parseIntParam(param: string | string[]): number | null {
  const s = Array.isArray(param) ? param[0] : param;
  if (!s) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  (req as any).userId = userId;
  next();
}

function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    (req as any).userId = userId;
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  app.post("/api/auth/login", loginRateLimiter, async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await storage.getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = randomBytes(32).toString("hex");
    tokenStore.set(token, { userId: user.id, expiresAt: Date.now() + TOKEN_TTL_MS });
    const { passwordHash, ...safeUser } = user;
    res.json({ ...safeUser, token });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      tokenStore.delete(authHeader.slice(7));
    }
    res.json({ ok: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    const notifications = await storage.getNotificationsByUser((req as any).userId);
    res.json(notifications);
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    const id = parseIntParam(req.params.id);
    if (id === null) return res.status(400).json({ message: "Invalid id" });
    await storage.markNotificationRead(id);
    res.json({ ok: true });
  });

  app.post("/api/notifications/read-all", requireAuth, async (req: Request, res: Response) => {
    await storage.markAllNotificationsRead((req as any).userId);
    res.json({ ok: true });
  });

  app.get("/api/nurse/dashboard", requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser((req as any).userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const nurseId = user.role === "nurse" ? user.id : null;
    if (!nurseId) return res.status(403).json({ message: "Not a nurse" });

    const nurseEnrollments = await storage.getEnrollmentsByNurse(nurseId);
    if (nurseEnrollments.length === 0) return res.json(null);

    const enrollment = nurseEnrollments[0];
    const allCompetencies = await storage.getCompetenciesByProgram(enrollment.programTemplateId);
    const progress = await storage.getProgressByEnrollment(enrollment.id);
    const facilities = await storage.getAllFacilities();
    const facility = facilities.find((f) => f.id === enrollment.facilityId);
    const programs = await storage.getAllProgramTemplates();
    const program = programs.find((p) => p.id === enrollment.programTemplateId);

    const now = new Date();
    const progressWithDetails = allCompetencies.map((c) => {
      const p = progress.find((pr) => pr.competencyId === c.id);
      const dueDate = addDays(new Date(enrollment.startDate), (c.weekNumber - 1) * 7);
      let signedOffByName: string | null = null;

      return {
        id: p?.id || 0,
        competencyId: c.id,
        weekNumber: c.weekNumber,
        title: c.title,
        phase: c.phase,
        status: p?.status || "not_started",
        dueDate: dueDate.toISOString(),
        nurseReadyAt: p?.nurseReadyAt?.toISOString() || null,
        signedOffAt: p?.signedOffAt?.toISOString() || null,
        signedOffByName: signedOffByName as string | null,
      };
    }).sort((a, b) => a.weekNumber - b.weekNumber);

    const signedOffUserIds = progress
      .filter((p) => p.signedOffByUserId)
      .map((p) => p.signedOffByUserId!);
    const uniqueSignerIds = [...new Set(signedOffUserIds)];
    const signerMap = new Map<number, string>();
    for (const sid of uniqueSignerIds) {
      const signer = await storage.getUser(sid);
      if (signer) signerMap.set(sid, signer.name);
    }

    for (const item of progressWithDetails) {
      const p = progress.find((pr) => pr.competencyId === item.competencyId);
      if (p?.signedOffByUserId) {
        item.signedOffByName = signerMap.get(p.signedOffByUserId) || null;
      }
    }

    const stats = {
      total: allCompetencies.length,
      signedOff: progress.filter((p) => p.status === "signed_off").length,
      ready: progress.filter((p) => p.status === "ready").length,
      notStarted: progress.filter((p) => p.status === "not_started").length,
      overdue: progressWithDetails.filter((p) =>
        p.status !== "signed_off" && new Date(p.dueDate) < now
      ).length,
    };

    const maxWeek = allCompetencies.length > 0 ? Math.max(...allCompetencies.map(c => c.weekNumber)) : 50;
    const endDate = addDays(new Date(enrollment.startDate), maxWeek * 7);
    const currentWeek = Math.max(1, Math.min(maxWeek, Math.ceil(differenceInDays(now, new Date(enrollment.startDate)) / 7) + 1));

    res.json({
      enrollment: {
        id: enrollment.id,
        startDate: enrollment.startDate,
        endDate: endDate.toISOString(),
        facilityName: facility?.name || "",
        programName: program?.name || "",
        totalWeeks: maxWeek,
        currentWeek: Math.min(currentWeek, maxWeek),
      },
      progress: progressWithDetails,
      stats,
    });
  });

  app.get("/api/week/:enrollmentId/:competencyId", requireAuth, async (req: Request, res: Response) => {
    const enrollmentId = parseIntParam(req.params.enrollmentId);
    const competencyId = parseIntParam(req.params.competencyId);
    if (enrollmentId === null || competencyId === null) return res.status(400).json({ message: "Invalid id" });

    const enrollment = await storage.getEnrollmentById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    const user = await storage.getUser((req as any).userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.role === "nurse" && enrollment.nurseUserId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allCompetencies = await storage.getCompetenciesByProgram(enrollment.programTemplateId);
    const competency = allCompetencies.find((c) => c.id === competencyId);
    if (!competency) return res.status(404).json({ message: "Competency not found" });

    const progressList = await storage.getProgressByEnrollment(enrollmentId);
    const p = progressList.find((pr) => pr.competencyId === competencyId);
    if (!p) return res.status(404).json({ message: "Progress not found" });

    const dueDate = addDays(new Date(enrollment.startDate), (competency.weekNumber - 1) * 7);
    const nurse = await storage.getUser(enrollment.nurseUserId);
    const facility = (await storage.getAllFacilities()).find((f) => f.id === enrollment.facilityId);

    let signedOffByName: string | null = null;
    if (p.signedOffByUserId) {
      const signer = await storage.getUser(p.signedOffByUserId);
      signedOffByName = signer?.name || null;
    }

    const rawComments = await storage.getCommentsByProgress(p.id);
    const commentAuthors = new Map<number, { name: string; role: string }>();
    for (const c of rawComments) {
      if (!commentAuthors.has(c.authorUserId)) {
        const author = await storage.getUser(c.authorUserId);
        if (author) commentAuthors.set(c.authorUserId, { name: author.name, role: author.role });
      }
    }

    const commentsList = rawComments.map((c) => ({
      id: c.id,
      text: c.text,
      authorName: commentAuthors.get(c.authorUserId)?.name || "Unknown",
      authorRole: commentAuthors.get(c.authorUserId)?.role || "unknown",
      createdAt: c.createdAt.toISOString(),
    }));

    res.json({
      progress: {
        id: p.id,
        status: p.status,
        nurseReadyAt: p.nurseReadyAt?.toISOString() || null,
        signedOffAt: p.signedOffAt?.toISOString() || null,
        signedOffByName,
      },
      competency: {
        id: competency.id,
        weekNumber: competency.weekNumber,
        title: competency.title,
        phase: competency.phase,
      },
      enrollment: {
        id: enrollment.id,
        nurseName: nurse?.name || "",
        facilityName: facility?.name || "",
      },
      dueDate: dueDate.toISOString(),
      comments: commentsList,
    });
  });

  app.post("/api/progress/:id/ready", requireAuth, async (req: Request, res: Response) => {
    const progressId = parseIntParam(req.params.id);
    if (progressId === null) return res.status(400).json({ message: "Invalid id" });
    const p = await storage.getProgressById(progressId);
    if (!p) return res.status(404).json({ message: "Not found" });

    const enrollment = await storage.getEnrollmentById(p.enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    const user = await storage.getUser((req as any).userId);
    if (!user || (user.role === "nurse" && enrollment.nurseUserId !== user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (p.status !== "not_started") {
      return res.status(400).json({ message: "Can only mark as ready from not_started" });
    }

    await storage.markReady(progressId);

    const competencyList = await storage.getCompetenciesByProgram(enrollment.programTemplateId);
    const competency = competencyList.find((c) => c.id === p.competencyId);

    const facilityIds = [enrollment.facilityId];
    const allUsers = await storage.getAllUsers();
    for (const u of allUsers) {
      if (u.role === "manager") {
        const mfIds = await storage.getManagerFacilityIds(u.id);
        if (mfIds.some((fid) => facilityIds.includes(fid))) {
          await storage.createNotification(
            u.id,
            "ready_for_signoff",
            `Week ${competency?.weekNumber || "?"} marked as ready for sign-off`,
            `/week/${enrollment.id}/${p.competencyId}`
          );
        }
      }
      if (u.role === "admin") {
        await storage.createNotification(
          u.id,
          "ready_for_signoff",
          `Week ${competency?.weekNumber || "?"} marked as ready for sign-off`,
          `/week/${enrollment.id}/${p.competencyId}`
        );
      }
    }

    res.json({ ok: true });
  });

  app.post("/api/progress/:id/signoff", requireAuth, async (req: Request, res: Response) => {
    const progressId = parseIntParam(req.params.id);
    if (progressId === null) return res.status(400).json({ message: "Invalid id" });
    const p = await storage.getProgressById(progressId);
    if (!p) return res.status(404).json({ message: "Not found" });

    const user = await storage.getUser((req as any).userId);
    if (!user || (user.role !== "manager" && user.role !== "admin")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (p.status !== "ready") {
      return res.status(400).json({ message: "Can only sign off from ready status" });
    }

    await storage.signOff(progressId, user.id);

    const enrollment = await storage.getEnrollmentById(p.enrollmentId);
    if (enrollment) {
      const competencyList = await storage.getCompetenciesByProgram(enrollment.programTemplateId);
      const competency = competencyList.find((c) => c.id === p.competencyId);

      await storage.createNotification(
        enrollment.nurseUserId,
        "signed_off",
        `Week ${competency?.weekNumber || "?"} signed off: ${competency?.title || ""}`,
        `/week/${enrollment.id}/${p.competencyId}`
      );
    }

    res.json({ ok: true });
  });

  app.post("/api/progress/:id/comments", requireAuth, async (req: Request, res: Response) => {
    const progressId = parseIntParam(req.params.id);
    if (progressId === null) return res.status(400).json({ message: "Invalid id" });
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment text required" });
    if (text.length > 2000) return res.status(400).json({ message: "Comment too long (max 2000 characters)" });

    const p = await storage.getProgressById(progressId);
    if (!p) return res.status(404).json({ message: "Not found" });

    const comment = await storage.addComment(progressId, (req as any).userId, text.trim());
    res.json(comment);
  });

  app.get("/api/manager/dashboard", requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser((req as any).userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    let facilityIds: number[];
    if (user.role === "admin") {
      const allFacilities = await storage.getAllFacilities();
      facilityIds = allFacilities.map((f) => f.id);
    } else if (user.role === "manager") {
      facilityIds = await storage.getManagerFacilityIds(user.id);
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allFacilities = await storage.getAllFacilities();
    const facilitiesFiltered = allFacilities.filter((f) => facilityIds.includes(f.id));

    const allEnrollments = facilityIds.length > 0
      ? await storage.getEnrollmentsByFacilityIds(facilityIds)
      : [];

    const now = new Date();
    const nurses = [];

    for (const enrollment of allEnrollments) {
      const nurse = await storage.getUser(enrollment.nurseUserId);
      const facility = allFacilities.find((f) => f.id === enrollment.facilityId);
      const competenciesList = await storage.getCompetenciesByProgram(enrollment.programTemplateId);
      const progress = await storage.getProgressByEnrollment(enrollment.id);

      let overdue = 0;
      for (const c of competenciesList) {
        const p = progress.find((pr) => pr.competencyId === c.id);
        const dueDate = addDays(new Date(enrollment.startDate), (c.weekNumber - 1) * 7);
        if (p && p.status !== "signed_off" && dueDate < now) overdue++;
      }

      const maxWeek = competenciesList.length > 0 ? Math.max(...competenciesList.map(c => c.weekNumber)) : 50;
      const enrollEndDate = addDays(new Date(enrollment.startDate), maxWeek * 7);
      const enrollCurrentWeek = Math.max(1, Math.min(maxWeek, Math.ceil(differenceInDays(now, new Date(enrollment.startDate)) / 7) + 1));

      nurses.push({
        enrollmentId: enrollment.id,
        nurseId: enrollment.nurseUserId,
        nurseName: nurse?.name || "Unknown",
        facilityId: enrollment.facilityId,
        facilityName: facility?.name || "",
        startDate: enrollment.startDate,
        endDate: enrollEndDate.toISOString(),
        totalWeeks: maxWeek,
        currentWeek: Math.min(enrollCurrentWeek, maxWeek),
        total: competenciesList.length,
        signedOff: progress.filter((p) => p.status === "signed_off").length,
        ready: progress.filter((p) => p.status === "ready").length,
        overdue,
      });
    }

    res.json({
      facilities: facilitiesFiltered.map((f) => ({ id: f.id, name: f.name })),
      nurses,
      stats: {
        totalNurses: nurses.length,
        totalReady: nurses.reduce((sum, n) => sum + n.ready, 0),
        totalOverdue: nurses.reduce((sum, n) => sum + n.overdue, 0),
        totalFacilities: facilitiesFiltered.length,
      },
    });
  });

  app.get("/api/manager/signoff-queue", requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser((req as any).userId);
    if (!user || (user.role !== "manager" && user.role !== "admin")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let facilityIds: number[];
    if (user.role === "admin") {
      const allFacilities = await storage.getAllFacilities();
      facilityIds = allFacilities.map((f) => f.id);
    } else {
      facilityIds = await storage.getManagerFacilityIds(user.id);
    }

    const readyProgress = await storage.getReadyProgressByFacilityIds(facilityIds);

    const items = [];
    for (const p of readyProgress) {
      const enrollment = await storage.getEnrollmentById(p.enrollmentId);
      if (!enrollment) continue;
      const nurse = await storage.getUser(enrollment.nurseUserId);
      const facility = (await storage.getAllFacilities()).find((f) => f.id === enrollment.facilityId);
      const competenciesList = await storage.getCompetenciesByProgram(enrollment.programTemplateId);
      const competency = competenciesList.find((c) => c.id === p.competencyId);
      if (!competency) continue;

      const dueDate = addDays(new Date(enrollment.startDate), (competency.weekNumber - 1) * 7);

      items.push({
        progressId: p.id,
        enrollmentId: enrollment.id,
        competencyId: competency.id,
        weekNumber: competency.weekNumber,
        title: competency.title,
        nurseName: nurse?.name || "Unknown",
        facilityName: facility?.name || "",
        nurseReadyAt: p.nurseReadyAt?.toISOString() || new Date().toISOString(),
        dueDate: dueDate.toISOString(),
      });
    }

    items.sort((a, b) => a.weekNumber - b.weekNumber);
    res.json(items);
  });

  app.get("/api/enrollment/:id", requireAuth, async (req: Request, res: Response) => {
    const enrollmentId = parseIntParam(req.params.id);
    if (enrollmentId === null) return res.status(400).json({ message: "Invalid id" });
    const enrollment = await storage.getEnrollmentById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Not found" });

    const user = await storage.getUser((req as any).userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.role === "nurse" && enrollment.nurseUserId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const nurse = await storage.getUser(enrollment.nurseUserId);
    const facility = (await storage.getAllFacilities()).find((f) => f.id === enrollment.facilityId);
    const program = (await storage.getAllProgramTemplates()).find((p) => p.id === enrollment.programTemplateId);
    const competenciesList = await storage.getCompetenciesByProgram(enrollment.programTemplateId);
    const progressList = await storage.getProgressByEnrollment(enrollmentId);

    const now = new Date();
    const progress = competenciesList.map((c) => {
      const p = progressList.find((pr) => pr.competencyId === c.id);
      const dueDate = addDays(new Date(enrollment.startDate), (c.weekNumber - 1) * 7);

      return {
        id: p?.id || 0,
        competencyId: c.id,
        weekNumber: c.weekNumber,
        title: c.title,
        phase: c.phase,
        status: p?.status || "not_started",
        dueDate: dueDate.toISOString(),
        signedOffAt: p?.signedOffAt?.toISOString() || null,
        signedOffByName: null as string | null,
      };
    }).sort((a, b) => a.weekNumber - b.weekNumber);

    const signedOffUserIds = progressList.filter((p) => p.signedOffByUserId).map((p) => p.signedOffByUserId!);
    const signerMap = new Map<number, string>();
    for (const sid of [...new Set(signedOffUserIds)]) {
      const signer = await storage.getUser(sid);
      if (signer) signerMap.set(sid, signer.name);
    }
    for (const item of progress) {
      const p = progressList.find((pr) => pr.competencyId === item.competencyId);
      if (p?.signedOffByUserId) item.signedOffByName = signerMap.get(p.signedOffByUserId) || null;
    }

    const stats = {
      total: competenciesList.length,
      signedOff: progressList.filter((p) => p.status === "signed_off").length,
      ready: progressList.filter((p) => p.status === "ready").length,
      notStarted: progressList.filter((p) => p.status === "not_started").length,
      overdue: progress.filter((p) =>
        p.status !== "signed_off" && new Date(p.dueDate) < now
      ).length,
    };

    const maxWeek = competenciesList.length > 0 ? Math.max(...competenciesList.map(c => c.weekNumber)) : 50;
    const endDate = addDays(new Date(enrollment.startDate), maxWeek * 7);
    const currentWeek = Math.max(1, Math.min(maxWeek, Math.ceil(differenceInDays(now, new Date(enrollment.startDate)) / 7) + 1));

    res.json({
      enrollment: {
        id: enrollment.id,
        startDate: enrollment.startDate,
        endDate: endDate.toISOString(),
        facilityName: facility?.name || "",
        programName: program?.name || "",
        nurseName: nurse?.name || "",
        nurseEmail: nurse?.email || "",
        totalWeeks: maxWeek,
        currentWeek: Math.min(currentWeek, maxWeek),
      },
      progress,
      stats,
    });
  });

  app.get("/api/admin/users", requireRole("admin"), async (_req: Request, res: Response) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers.map((u) => ({ ...u, passwordHash: undefined })));
  });

  app.post("/api/admin/users", requireRole("admin"), async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const user = await storage.createUser({
      name,
      email,
      passwordHash: hashPassword(password),
      role,
    });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch("/api/admin/users/:id/password", requireRole("admin"), async (req: Request, res: Response) => {
    const userId = parseIntParam(req.params.id);
    if (userId === null) return res.status(400).json({ message: "Invalid id" });
    const { password } = req.body;
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    await storage.updateUserPassword(userId, hashPassword(password));
    res.json({ ok: true });
  });

  app.get("/api/admin/managers", requireRole("admin"), async (_req: Request, res: Response) => {
    const managers = await storage.getUsersByRole("manager");
    res.json(managers.map((u) => ({ ...u, passwordHash: undefined })));
  });

  app.get("/api/admin/nurses", requireRole("admin"), async (_req: Request, res: Response) => {
    const nurses = await storage.getUsersByRole("nurse");
    res.json(nurses.map((u) => ({ ...u, passwordHash: undefined })));
  });

  app.get("/api/admin/facilities", requireRole("admin"), async (_req: Request, res: Response) => {
    const data = await storage.getFacilitiesWithManagers();
    res.json(data);
  });

  app.get("/api/admin/facilities-list", requireRole("admin"), async (_req: Request, res: Response) => {
    const data = await storage.getAllFacilities();
    res.json(data);
  });

  app.post("/api/admin/facilities", requireRole("admin"), async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });
    const facility = await storage.createFacility(name);
    res.json(facility);
  });

  app.post("/api/admin/manager-facilities", requireRole("admin"), async (req: Request, res: Response) => {
    const { managerUserId, facilityId } = req.body;
    if (!managerUserId || !facilityId) return res.status(400).json({ message: "Manager and facility required" });
    await storage.assignManagerToFacility(managerUserId, facilityId);
    res.json({ ok: true });
  });

  app.get("/api/admin/programs", requireRole("admin"), async (_req: Request, res: Response) => {
    const programs = await storage.getAllProgramTemplates();
    res.json(programs);
  });

  app.get("/api/admin/enrollments", requireRole("admin"), async (_req: Request, res: Response) => {
    const allEnrollments = await storage.getAllEnrollments();
    const items = [];

    for (const e of allEnrollments) {
      const nurse = await storage.getUser(e.nurseUserId);
      const facility = (await storage.getAllFacilities()).find((f) => f.id === e.facilityId);
      const program = (await storage.getAllProgramTemplates()).find((p) => p.id === e.programTemplateId);
      const progress = await storage.getProgressByEnrollment(e.id);
      const competenciesList = await storage.getCompetenciesByProgram(e.programTemplateId);

      items.push({
        id: e.id,
        nurseName: nurse?.name || "Unknown",
        facilityName: facility?.name || "",
        programName: program?.name || "",
        startDate: e.startDate,
        active: e.active,
        signedOff: progress.filter((p) => p.status === "signed_off").length,
        total: competenciesList.length,
      });
    }

    res.json(items);
  });

  app.post("/api/admin/enrollments", requireRole("admin"), async (req: Request, res: Response) => {
    const { nurseUserId, facilityId, programTemplateId, startDate } = req.body;
    if (!nurseUserId || !facilityId || !programTemplateId || !startDate) {
      return res.status(400).json({ message: "All fields required" });
    }

    const enrollment = await storage.createEnrollment(
      nurseUserId,
      programTemplateId,
      facilityId,
      new Date(startDate)
    );

    const competenciesList = await storage.getCompetenciesByProgram(programTemplateId);
    for (const c of competenciesList) {
      await storage.createCompetencyProgress(enrollment.id, c.id);
    }

    res.json(enrollment);
  });

  app.get("/api/demo-feedback", requireAuth, async (_req: Request, res: Response) => {
    const feedback = await storage.getAllDemoFeedback();
    res.json(feedback);
  });

  app.post("/api/demo-feedback", requireAuth, async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    const { section, text } = req.body;
    if (!section || !text) {
      return res.status(400).json({ error: "section and text are required" });
    }
    if (text.length > 2000) return res.status(400).json({ error: "Feedback too long (max 2000 characters)" });
    const created = await storage.addDemoFeedback(section, user.role, text);
    res.json(created);
  });

  app.delete("/api/demo-feedback/:id", requireAuth, async (req: Request, res: Response) => {
    const id = parseIntParam(req.params.id);
    if (id === null) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteDemoFeedback(id);
    res.json({ ok: true });
  });

  return httpServer;
}
