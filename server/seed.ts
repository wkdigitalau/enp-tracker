import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { scryptSync, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const COMPETENCIES = [
  { week: 1, title: "Complete site orientation: emergency procedures, layout, reporting structure (with Compliance manager)", phase: "Orientation and Foundations" },
  { week: 2, title: "Demonstrate accurate hand hygiene, PPE use, and infection control practices. Demonstrate ability to log into Centro assist, Medsig, painchek and Ausmed. (with Compliance Manager)", phase: "Orientation and Foundations" },
  { week: 3, title: "Safely complete and document basic vital signs, weight, BSL checks (with RN on the floor)", phase: "Orientation and Foundations" },
  { week: 4, title: "Use the resident management system, Leecare to access and update care plans (with care manager)", phase: "Orientation and Foundations" },
  { week: 5, title: "Safely administer medications following correct procedures (oral, subcut, topical)", phase: "Clinical Care and Documentation" },
  { week: 6, title: "Accurately complete medication documentation and incident reporting — to be provided feedback by the care manager", phase: "Clinical Care and Documentation" },
  { week: 7, title: "Complete an initial nursing assessment and update care plan", phase: "Clinical Care and Documentation" },
  { week: 8, title: "Demonstrate catheter care and incontinence management", phase: "Clinical Care and Documentation" },
  { week: 9, title: "Perform wound assessment and basic wound dressing changes — completing correct wound documentation in Leecare", phase: "Clinical Care and Documentation" },
  { week: 10, title: "Manage and document a resident fall incident, including SIRS reporting basics", phase: "Clinical Care and Documentation" },
  { week: 11, title: "Escalate a deteriorating resident use of ISBAR", phase: "Clinical Care and Documentation" },
  { week: 12, title: "Communicate with GPs and external providers (e.g., pharmacy, allied health)", phase: "Clinical Care and Documentation" },
  { week: 13, title: "Recognise and support residents with early-stage dementia", phase: "Dementia, Palliative, and Behavioural Care" },
  { week: 14, title: "Apply non-pharmacological interventions for responsive behaviours and document correct, direct care staff to manage behaviours", phase: "Dementia, Palliative, and Behavioural Care" },
  { week: 15, title: "Deliver culturally sensitive care to residents and families", phase: "Dementia, Palliative, and Behavioural Care" },
  { week: 16, title: "Participate in a case conference and provide clinical input", phase: "Dementia, Palliative, and Behavioural Care" },
  { week: 17, title: "Identify and manage pain in non-verbal residents", phase: "Dementia, Palliative, and Behavioural Care" },
  { week: 18, title: "Support a resident and family during end-of-life care", phase: "Dementia, Palliative, and Behavioural Care" },
  { week: 19, title: "Document an advance care directive discussion accurately", phase: "Dementia, Palliative, and Behavioural Care" },
  { week: 20, title: "Complete palliative care symptom management (e.g., syringe driver basics)", phase: "Dementia, Palliative, and Behavioural Care" },
  { week: 21, title: "Complete clinical documentation to meet aged care quality standards", phase: "Compliance and Risk" },
  { week: 22, title: "Identify risks and contribute to a resident's risk minimisation plan", phase: "Compliance and Risk" },
  { week: 23, title: "Review a care plan for dietary, skin, falls and pressure injury risk", phase: "Compliance and Risk" },
  { week: 24, title: "Audit medication administration and infection control", phase: "Compliance and Risk" },
  { week: 25, title: "Participate in a family meeting and follow-up action", phase: "Compliance and Risk" },
  { week: 26, title: "Review and apply restrictive practices legislation (chemical, physical, environmental)", phase: "Compliance and Risk" },
  { week: 27, title: "Complete a pressure injury report and link to preventative strategies", phase: "Compliance and Risk" },
  { week: 28, title: "Contribute to compliance data (e.g., clinical KPIs, quality indicators)", phase: "Compliance and Risk" },
  { week: 29, title: "Lead a shift handover using ISBAR or similar", phase: "Leadership and Team Coordination" },
  { week: 30, title: "Allocate care to ENs and AINs based on resident acuity", phase: "Leadership and Team Coordination" },
  { week: 31, title: "Manage short staffing or changes in shift plans", phase: "Leadership and Team Coordination" },
  { week: 32, title: "Escalate concerns to after-hours support/management appropriately", phase: "Leadership and Team Coordination" },
  { week: 33, title: "Monitor and support a new or casual staff member during a shift", phase: "Leadership and Team Coordination" },
  { week: 34, title: "Provide constructive feedback to an AIN on care or documentation", phase: "Leadership and Team Coordination" },
  { week: 35, title: "Initiate a clinical debrief following an incident", phase: "Leadership and Team Coordination" },
  { week: 36, title: "Document staff performance issues or concerns (escalated appropriately)", phase: "Leadership and Team Coordination" },
  { week: 37, title: "Contribute to a resident quality-of-life improvement initiative", phase: "Quality, Projects and Broader Understanding" },
  { week: 38, title: "Assist with preparing for an accreditation or audit visit", phase: "Quality, Projects and Broader Understanding" },
  { week: 39, title: "Develop or revise a resident care plan based on changing needs", phase: "Quality, Projects and Broader Understanding" },
  { week: 40, title: "Participate in quality meetings or resident care reviews", phase: "Quality, Projects and Broader Understanding" },
  { week: 41, title: "Attend external education or webinar relevant to aged care", phase: "Quality, Projects and Broader Understanding" },
  { week: 42, title: "Identify and report equipment or environmental hazards", phase: "Quality, Projects and Broader Understanding" },
  { week: 43, title: "Collaborate with lifestyle team to support resident engagement", phase: "Quality, Projects and Broader Understanding" },
  { week: 44, title: "Reflect on feedback from families and implement care changes", phase: "Quality, Projects and Broader Understanding" },
  { week: 45, title: "Independently lead an AM or PM shift", phase: "Independence and Reflection" },
  { week: 46, title: "Complete and submit a reflective practice journal", phase: "Independence and Reflection" },
  { week: 47, title: "Undertake a peer review and give constructive feedback", phase: "Independence and Reflection" },
  { week: 48, title: "Prepare a mini in-service presentation for the care team", phase: "Independence and Reflection" },
  { week: 49, title: "Meet with manager to complete final review and feedback", phase: "Independence and Reflection" },
  { week: 50, title: "Program completion and final assessment", phase: "Independence and Reflection" },
];

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  console.log("Seeding database...");

  const admin = await storage.createUser({
    name: "Amy Chen",
    email: "amy@enp.com",
    passwordHash: hashPassword("admin123"),
    role: "admin",
  });

  const manager = await storage.createUser({
    name: "Candace Williams",
    email: "candace@enp.com",
    passwordHash: hashPassword("manager123"),
    role: "manager",
  });

  const nurse1 = await storage.createUser({
    name: "Sarah Mitchell",
    email: "sarah@enp.com",
    passwordHash: hashPassword("nurse123"),
    role: "nurse",
  });

  const nurse2 = await storage.createUser({
    name: "James Nguyen",
    email: "james@enp.com",
    passwordHash: hashPassword("nurse123"),
    role: "nurse",
  });

  const nurse3 = await storage.createUser({
    name: "Emily Davis",
    email: "emily@enp.com",
    passwordHash: hashPassword("nurse123"),
    role: "nurse",
  });

  const facility1 = await storage.createFacility("Mayfield Aged Care");
  const facility2 = await storage.createFacility("Sunridge Living");

  await storage.assignManagerToFacility(manager.id, facility1.id);
  await storage.assignManagerToFacility(manager.id, facility2.id);

  const program = await storage.createProgramTemplate("Mayfield New Grad RN Competency Program 2025");

  const competencyRecords: { id: number; weekNumber: number }[] = [];
  for (const c of COMPETENCIES) {
    const created = await storage.createCompetency(program.id, c.week, c.title, c.phase);
    competencyRecords.push({ id: created.id, weekNumber: c.week });
  }

  const startDate1 = new Date();
  startDate1.setDate(startDate1.getDate() - 56);

  const enrollment1 = await storage.createEnrollment(nurse1.id, program.id, facility1.id, startDate1);
  for (const c of competencyRecords) {
    const p = await storage.createCompetencyProgress(enrollment1.id, c.id);
    if (c.weekNumber <= 4) {
      await storage.signOff(p.id, manager.id);
    } else if (c.weekNumber <= 6) {
      await storage.markReady(p.id);
    }
  }

  const startDate2 = new Date();
  startDate2.setDate(startDate2.getDate() - 21);

  const enrollment2 = await storage.createEnrollment(nurse2.id, program.id, facility1.id, startDate2);
  for (const c of competencyRecords) {
    const p = await storage.createCompetencyProgress(enrollment2.id, c.id);
    if (c.weekNumber <= 2) {
      await storage.signOff(p.id, manager.id);
    } else if (c.weekNumber === 3) {
      await storage.markReady(p.id);
    }
  }

  const startDate3 = new Date();
  startDate3.setDate(startDate3.getDate() - 7);

  const enrollment3 = await storage.createEnrollment(nurse3.id, program.id, facility2.id, startDate3);
  for (const c of competencyRecords) {
    await storage.createCompetencyProgress(enrollment3.id, c.id);
  }

  await storage.addComment(1, nurse1.id, "Completed site orientation with the compliance manager. All procedures reviewed and understood.");
  await storage.addComment(1, manager.id, "Great work Sarah. You demonstrated thorough understanding of emergency procedures.");

  console.log("Seeding complete.");
}
