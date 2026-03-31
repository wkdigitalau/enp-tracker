import sgMail from "@sendgrid/mail";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";
import {
  users,
  enrollments,
  competencies,
  competencyProgress,
  managerFacilities,
} from "@shared/schema";

const APP_URL = "https://enp.digitalp.com.au";

function getSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM || "noreply@digitalp.com.au";
  if (!apiKey) throw new Error("SENDGRID_API_KEY not set");
  sgMail.setApiKey(apiKey);
  return { from };
}

function dueDate(startDate: Date, weekNumber: number): Date {
  return new Date(startDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function emailWrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
<tr><td style="background:#1a1a2e;padding:24px 32px;">
  <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">ENP Training Platform</p>
  <p style="margin:4px 0 0;color:#a0a0b0;font-size:13px;">${title}</p>
</td></tr>
<tr><td style="padding:32px;">
  ${body}
  <hr style="border:none;border-top:1px solid #eeeeee;margin:32px 0;">
  <p style="margin:0;font-size:12px;color:#999999;">Elite Nurse Partners — <a href="${APP_URL}" style="color:#999999;">${APP_URL}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ─── Invite email ────────────────────────────────────────────────────────────

export async function sendInviteEmail(
  userName: string,
  userEmail: string,
  token: string,
): Promise<void> {
  const { from } = getSendGrid();
  const inviteUrl = `${APP_URL}/accept-invite?token=${token}`;

  const body = `
    <p style="font-size:16px;font-weight:bold;color:#1a1a2e;margin:0 0 8px;">Welcome, ${userName}</p>
    <p style="font-size:14px;color:#444444;margin:0 0 24px;">
      You've been added to the ENP Training Platform. Click the button below to set your password and get started.
    </p>
    <a href="${inviteUrl}" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:bold;">Accept Invitation</a>
    <p style="font-size:12px;color:#999999;margin:24px 0 0;">This link expires in 72 hours. If you weren't expecting this email, you can ignore it.</p>
  `;

  await sgMail.send({
    to: userEmail,
    from,
    subject: "You've been invited to ENP Training Platform",
    html: emailWrap("Invitation", body),
  });
}

// ─── Monthly emails ──────────────────────────────────────────────────────────

export async function sendAllMonthlyEmails(): Promise<{ nurses: number; managers: number }> {
  const { from } = getSendGrid();
  const today = new Date();
  const in28Days = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000);

  // Load all data upfront
  const allUsers = await db.select().from(users);
  const allEnrollments = await db.select().from(enrollments);
  const allCompetencies = await db.select().from(competencies);
  const allProgress = await db.select().from(competencyProgress);
  const allMF = await db.select().from(managerFacilities);

  const nurses = allUsers.filter((u) => u.role === "nurse");
  const managers = allUsers.filter((u) => u.role === "manager");

  let nurseCount = 0;
  let managerCount = 0;

  // ── Nurse emails ──────────────────────────────────────────────────────────
  for (const nurse of nurses) {
    const nurseEnrollments = allEnrollments.filter((e) => e.nurseUserId === nurse.id && e.active);
    if (nurseEnrollments.length === 0) continue;

    type CompItem = { weekNumber: number; title: string; dueDate: Date };
    const overdue: CompItem[] = [];
    const upcoming: CompItem[] = [];

    for (const enr of nurseEnrollments) {
      const progList = allProgress.filter((p) => p.enrollmentId === enr.id);
      for (const prog of progList) {
        if (prog.status === "signed_off") continue;
        const comp = allCompetencies.find((c) => c.id === prog.competencyId);
        if (!comp) continue;
        const due = dueDate(enr.startDate, comp.weekNumber);
        if (due < today) {
          overdue.push({ weekNumber: comp.weekNumber, title: comp.title, dueDate: due });
        } else if (due <= in28Days) {
          upcoming.push({ weekNumber: comp.weekNumber, title: comp.title, dueDate: due });
        }
      }
    }

    overdue.sort((a, b) => a.weekNumber - b.weekNumber);
    upcoming.sort((a, b) => a.weekNumber - b.weekNumber);

    const lastLogin = nurse.lastLoginAt
      ? `Last login: ${formatDateTime(nurse.lastLoginAt)}`
      : "You haven't logged in yet.";

    const overdueRows = overdue.length > 0
      ? overdue.map((c) => `<tr><td style="padding:6px 0;font-size:13px;color:#1a1a2e;">Week ${c.weekNumber}</td><td style="padding:6px 8px;font-size:13px;color:#444444;">${c.title}</td><td style="padding:6px 0;font-size:13px;color:#dc2626;white-space:nowrap;">Due ${formatDate(c.dueDate)}</td></tr>`).join("")
      : `<tr><td colspan="3" style="padding:6px 0;font-size:13px;color:#16a34a;">No overdue items — great work!</td></tr>`;

    const upcomingRows = upcoming.length > 0
      ? upcoming.map((c) => `<tr><td style="padding:6px 0;font-size:13px;color:#1a1a2e;">Week ${c.weekNumber}</td><td style="padding:6px 8px;font-size:13px;color:#444444;">${c.title}</td><td style="padding:6px 0;font-size:13px;color:#2563eb;white-space:nowrap;">Due ${formatDate(c.dueDate)}</td></tr>`).join("")
      : `<tr><td colspan="3" style="padding:6px 0;font-size:13px;color:#999999;">Nothing due in the next 4 weeks.</td></tr>`;

    const body = `
      <p style="font-size:16px;font-weight:bold;color:#1a1a2e;margin:0 0 4px;">Hi ${nurse.name},</p>
      <p style="font-size:14px;color:#444444;margin:0 0 24px;">Here's your monthly training update.</p>

      <p style="font-size:12px;color:#999999;margin:0 0 4px;text-transform:uppercase;letter-spacing:.5px;">Activity</p>
      <p style="font-size:14px;color:#444444;margin:0 0 24px;">${lastLogin}</p>

      <p style="font-size:12px;color:#999999;margin:0 0 8px;text-transform:uppercase;letter-spacing:.5px;">Overdue Items</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${overdueRows}</table>

      <p style="font-size:12px;color:#999999;margin:0 0 8px;text-transform:uppercase;letter-spacing:.5px;">Upcoming — Next 4 Weeks</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${upcomingRows}</table>

      <a href="${APP_URL}" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:bold;">Log in to ENP Platform</a>
    `;

    await sgMail.send({
      to: nurse.email,
      from,
      subject: "Your monthly ENP training update",
      html: emailWrap("Monthly Training Update", body),
    });
    nurseCount++;
  }

  // ── Manager emails ────────────────────────────────────────────────────────
  for (const manager of managers) {
    const facilityIds = allMF.filter((mf) => mf.managerUserId === manager.id).map((mf) => mf.facilityId);
    if (facilityIds.length === 0) continue;

    const facilityEnrollments = allEnrollments.filter(
      (e) => e.active && facilityIds.includes(e.facilityId),
    );
    if (facilityEnrollments.length === 0) continue;

    type NurseRow = { nurseName: string; items: { weekNumber: number; title: string; dueDate: Date }[] };
    const overdueByNurse: NurseRow[] = [];

    for (const enr of facilityEnrollments) {
      const nurse = allUsers.find((u) => u.id === enr.nurseUserId);
      if (!nurse) continue;
      const progList = allProgress.filter((p) => p.enrollmentId === enr.id);
      const overdueItems: { weekNumber: number; title: string; dueDate: Date }[] = [];

      for (const prog of progList) {
        if (prog.status === "signed_off") continue;
        const comp = allCompetencies.find((c) => c.id === prog.competencyId);
        if (!comp) continue;
        const due = dueDate(enr.startDate, comp.weekNumber);
        if (due < today) {
          overdueItems.push({ weekNumber: comp.weekNumber, title: comp.title, dueDate: due });
        }
      }

      if (overdueItems.length > 0) {
        overdueItems.sort((a, b) => a.weekNumber - b.weekNumber);
        overdueByNurse.push({ nurseName: nurse.name, items: overdueItems });
      }
    }

    const lastLogin = manager.lastLoginAt
      ? `Last login: ${formatDateTime(manager.lastLoginAt)}`
      : "You haven't logged in yet.";

    let overdueSection = "";
    if (overdueByNurse.length === 0) {
      overdueSection = `<p style="font-size:13px;color:#16a34a;margin:0 0 24px;">No overdue items across your facilities.</p>`;
    } else {
      overdueSection = overdueByNurse.map((row) => `
        <p style="font-size:13px;font-weight:bold;color:#1a1a2e;margin:0 0 4px;">${row.nurseName}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          ${row.items.map((c) => `<tr><td style="padding:4px 0;font-size:12px;color:#1a1a2e;width:60px;">Week ${c.weekNumber}</td><td style="padding:4px 8px;font-size:12px;color:#444444;">${c.title}</td><td style="padding:4px 0;font-size:12px;color:#dc2626;white-space:nowrap;">Due ${formatDate(c.dueDate)}</td></tr>`).join("")}
        </table>
      `).join("");
    }

    const body = `
      <p style="font-size:16px;font-weight:bold;color:#1a1a2e;margin:0 0 4px;">Hi ${manager.name},</p>
      <p style="font-size:14px;color:#444444;margin:0 0 24px;">Here's your monthly team overview.</p>

      <p style="font-size:12px;color:#999999;margin:0 0 4px;text-transform:uppercase;letter-spacing:.5px;">Activity</p>
      <p style="font-size:14px;color:#444444;margin:0 0 24px;">${lastLogin}</p>

      <p style="font-size:12px;color:#999999;margin:0 0 8px;text-transform:uppercase;letter-spacing:.5px;">Overdue Items by Nurse</p>
      ${overdueSection}

      <a href="${APP_URL}" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:bold;">Log in to ENP Platform</a>
    `;

    await sgMail.send({
      to: manager.email,
      from,
      subject: "Your monthly ENP team overview",
      html: emailWrap("Monthly Team Overview", body),
    });
    managerCount++;
  }

  return { nurses: nurseCount, managers: managerCount };
}
