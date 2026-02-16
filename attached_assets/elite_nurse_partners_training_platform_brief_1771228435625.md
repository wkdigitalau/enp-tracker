# Elite Nurse Partners Training Platform (MVP) — Replit App Brief

**Target date (demo-ready):** April 14, 2026  
**Purpose:** Replace paper-based competency tracking with a professional web dashboard that demonstrates Elite Nurse Partners’ structured integration/training process for nurses entering Australian aged care.

## 1) MVP Scope (Phase 1)
### 1.1 Core workflow
1. **Nurse** reviews weekly competency (one competency per week).
2. Nurse marks competency as **Ready for sign-off** and optionally adds notes/evidence.
3. **Manager** receives an **in-app notification** and can review.
4. Manager **signs off** competency (records who/when) and can add feedback notes.
5. Nurse receives an **in-app notification** that it was signed off.

### 1.2 Key capabilities
- Digital platform/dashboard to replace paper-based competency tracking.
- **Self-assessment** for nurses (“Ready for sign-off”).
- **Manager sign-off** with audit trail (name + timestamp).
- **Role-based access control**:
  - Nurses: see only their own profile.
  - Managers: see their nurses across **multiple facilities** (not restricted to one facility).
  - Admin (Amy): global access across all facilities.
- **Comments/notes thread** per competency for nurse/manager feedback.
- **Deadline visibility + reminders** (in-app only).
- Presentation-ready UI (clean, professional) for Singapore presentation.

## 2) Users & Permissions
### 2.1 Roles
- **NURSE**
  - Read/write: own competency progress, own notes/evidence.
  - Read: signed-off status and manager feedback.
- **MANAGER**
  - Read: nurses assigned to any facility the manager is associated with.
  - Write: sign-off, manager feedback notes.
- **ADMIN (Amy)**
  - Read/write: everything.
  - Manage: facilities, user assignments, enrollment/program start dates.

## 3) Program Content (Seed Data)
Source: “Mayfield Aged Care New Graduate Registered Nurse Competency Program” (2025).  
Rule: **Exactly one competency per week**.

### Weeks 1–4: Orientation and Foundations
- **Week 1:** Complete site orientation: emergency procedures, layout, reporting structure (with Compliance manager)
- **Week 2:** Demonstrate accurate hand hygiene, PPE use, and infection control practices. Demonstrate ability to log into Centro assist, Medsig, painchek and Ausmed. (with Compliance Manager)
- **Week 3:** Safely complete and document basic vital signs, weight, BSL checks (with RN on the floor)
- **Week 4:** Use the resident management system, Leecare to access and update care plans (with care manager)

### Weeks 5–12: Clinical Care and Documentation
- **Week 5:** Safely administer medications following correct procedures (oral, subcut, topical)
- **Week 6:** Accurately complete medication documentation and incident reporting — to be provided feedback by the care manager
- **Week 7:** Complete an initial nursing assessment and update care plan
- **Week 8:** Demonstrate catheter care and incontinence management
- **Week 9:** Perform wound assessment and basic wound dressing changes — completing correct wound documentation in Leecare
- **Week 10:** Manage and document a resident fall incident, including SIRS reporting basics
- **Week 11:** Escalate a deteriorating resident use of ISBAR
- **Week 12:** Communicate with GPs and external providers (e.g., pharmacy, allied health)

### Weeks 13–20: Dementia, Palliative, and Behavioural Care
- **Week 13:** Recognise and support residents with early-stage dementia
- **Week 14:** Apply non-pharmacological interventions for responsive behaviours and document correct, direct care staff to manage behaviours
- **Week 15:** Deliver culturally sensitive care to residents and families
- **Week 16:** Participate in a case conference and provide clinical input
- **Week 17:** Identify and manage pain in non-verbal residents
- **Week 18:** Support a resident and family during end-of-life care
- **Week 19:** Document an advance care directive discussion accurately
- **Week 20:** Complete palliative care symptom management (e.g., syringe driver basics)

### Weeks 21–28: Compliance and Risk
- **Week 21:** Complete clinical documentation to meet aged care quality standards
- **Week 22:** Identify risks and contribute to a resident’s risk minimisation plan
- **Week 23:** Review a care plan for dietary, skin, falls and pressure injury risk
- **Week 24:** Audit medication administration and infection control
- **Week 25:** Participate in a family meeting and follow-up action
- **Week 26:** Review and apply restrictive practices legislation (chemical, physical, environmental)
- **Week 27:** Complete a pressure injury report and link to preventative strategies
- **Week 28:** Contribute to compliance data (e.g., clinical KPIs, quality indicators)

### Weeks 29–36: Leadership and Team Coordination
- **Week 29:** Lead a shift handover using ISBAR or similar
- **Week 30:** Allocate care to ENs and AINs based on resident acuity
- **Week 31:** Manage short staffing or changes in shift plans
- **Week 32:** Escalate concerns to after-hours support/management appropriately
- **Week 33:** Monitor and support a new or casual staff member during a shift
- **Week 34:** Provide constructive feedback to an AIN on care or documentation
- **Week 35:** Initiate a clinical debrief following an incident
- **Week 36:** Document staff performance issues or concerns (escalated appropriately)

### Weeks 37–44: Quality, Projects and Broader Understanding
- **Week 37:** Contribute to a resident quality-of-life improvement initiative
- **Week 38:** Assist with preparing for an accreditation or audit visit
- **Week 39:** Develop or revise a resident care plan based on changing needs
- **Week 40:** Participate in quality meetings or resident care reviews
- **Week 41:** Attend external education or webinar relevant to aged care
- **Week 42:** Identify and report equipment or environmental hazards
- **Week 43:** Collaborate with lifestyle team to support resident engagement
- **Week 44:** Reflect on feedback from families and implement care changes

### Weeks 45–49: Independence and Reflection
- **Week 45:** Independently lead an AM or PM shift
- **Week 46:** Complete and submit a reflective practice journal
- **Week 47:** Undertake a peer review and give constructive feedback
- **Week 48:** Prepare a mini in-service presentation for the care team
- **Week 49:** Meet with manager to complete final review and feedback

**Week 50:** The source document labels “Weeks 45–50” but lists competencies through Week 49. MVP should support up to Week 50; Week 50 can be left blank/optional or added later.

## 4) Deadline & Reminder Rules (In-App Only)
- Each nurse enrollment has a `start_date`.
- **Due date per week:**
  - `due_date = start_date + (week_number - 1) * 7 days`
- In-app reminders:
  - **Upcoming:** due within 3 days and not signed off.
  - **Overdue:** past due and not signed off (highlight in UI + notification).

## 5) Data Model (MVP)
### Entities
- **Facility**: id, name
- **User**: id, name, email, password_hash, role
- **ManagerFacility (join)**: manager_user_id, facility_id (manager can have many facilities)
- **NurseFacility (or via enrollment)**: nurse_user_id, facility_id
- **ProgramTemplate**: id, name (e.g., “Mayfield New Grad RN Competency Program 2025”)
- **Competency**: id, program_template_id, week_number (1–50), title/text
- **Enrollment**: id, nurse_user_id, program_template_id, facility_id, start_date, active
- **CompetencyProgress** (per nurse per week):
  - id, enrollment_id, competency_id
  - status: NOT_STARTED | READY | SIGNED_OFF
  - nurse_ready_at
  - signed_off_at, signed_off_by_user_id
- **Comment**:
  - id, competency_progress_id, author_user_id, text, created_at
- **Notification**:
  - id, user_id, type, message, link, created_at, read_at

## 6) Screens / Routes (MVP)
### Shared
- Login / logout
- Profile menu
- Notifications panel (bell icon)

### Nurse
- **My Dashboard**
  - Progress summary (e.g., signed off count / 50)
  - Week list with statuses (NOT_STARTED / READY / SIGNED_OFF)
  - Overdue highlighting
- **Week Detail**
  - Competency text
  - Notes/comments thread
  - Action: “Mark as Ready for sign-off” (only if not signed off)

### Manager
- **Manager Dashboard**
  - Facilities selector/filter (since manager can have multiple)
  - Nurse list with progress indicators
  - “Ready for sign-off” queue
- **Nurse Detail**
  - Week list + status
  - Week detail review
  - Action: “Sign off” + add manager feedback

### Admin (Amy)
- Facilities management (create/edit)
- User management (create users; assign roles)
- Assign managers to facilities
- Enroll nurses into a program template + set start date
- View any nurse progress

## 7) Notification Events (In-App)
- Nurse sets week to READY → notify relevant managers for that nurse’s facility (or those assigned to that facility).
- Manager signs off → notify nurse.
- Deadline rules generate notifications (daily on login or via simple scheduled job if available; MVP can compute on-demand and create notifications when user visits dashboard).

## 8) Tech Stack Recommendation (Replit-friendly)
- **Next.js** (App Router) full-stack
- **Prisma** ORM
- **SQLite** database
- **Tailwind CSS** for polished UI
- Auth: simple credentials + session (or NextAuth credentials)

## 9) Seed / Demo Data Requirements
- Facility: “Mayfield Aged Care”
- Users:
  - Admin: Amy
  - Manager: (e.g., Candace)
  - 1–3 nurses with mixed progress (some signed off, some ready, some not started)
- Seed the full 50-week template (Weeks 1–49 populated from document; Week 50 optional placeholder).

## 10) Acceptance Criteria (Demo-Ready Definition of Done)
- Role-based login works.
- Nurse can mark Week X as READY and add a note.
- Manager sees an in-app notification and can sign off Week X.
- Audit trail shows who signed off and when.
- Comments visible to both parties on that competency.
- Deadline/overdue highlighting visible.
- Clean UI suitable for presentation.

## 11) Replit Build Instruction (to paste into Replit Agent)
Build a Next.js + Prisma + SQLite app implementing the above spec. Enforce server-side RBAC: nurses only see their own data; managers can see nurses in any of their assigned facilities; admin sees all. Seed the 50-week competency template using the exact weekly competency text in this document (Weeks 1–49). Implement in-app notifications only (no email/SMS). Focus on the READY → SIGN-OFF workflow and demo-quality UI.
