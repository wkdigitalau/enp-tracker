# Elite Nurse Partners Training Platform

## Overview
A digital competency tracking platform for nurses in Australian aged care, replacing paper-based tracking with a professional web dashboard. Supports the READY -> SIGN-OFF workflow with role-based access control.

## Recent Changes
- 2026-02-16: Initial MVP build with full schema, frontend, backend, auth, seed data

## Architecture
- **Frontend:** React + Vite + Tailwind CSS + Shadcn/UI components + Wouter routing
- **Backend:** Express.js with session-based auth + Drizzle ORM + PostgreSQL
- **Auth:** Session-based with email/password, role-based access (nurse, manager, admin)

## Key Features
- Role-based dashboards (Nurse, Manager, Admin)
- 50-week competency program tracking
- Mark ready / Sign-off workflow with audit trail
- In-app notifications
- Comments/notes per competency
- Deadline visibility with overdue highlighting
- Admin: user management, facility management, enrollment management

## Data Model
- **users**: id, name, email, passwordHash, role (nurse/manager/admin)
- **facilities**: id, name
- **manager_facilities**: manager_user_id, facility_id (many-to-many)
- **program_templates**: id, name
- **competencies**: id, program_template_id, week_number, title, phase
- **enrollments**: id, nurse_user_id, program_template_id, facility_id, start_date, active
- **competency_progress**: id, enrollment_id, competency_id, status, nurse_ready_at, signed_off_at, signed_off_by_user_id
- **comments**: id, competency_progress_id, author_user_id, text, created_at
- **notifications**: id, user_id, type, message, link, created_at, read_at

## Demo Accounts
- Admin: amy@enp.com / admin123
- Manager: candace@enp.com / manager123
- Nurse: sarah@enp.com / nurse123

## API Routes
- POST /api/auth/login, /api/auth/logout, GET /api/auth/me
- GET /api/notifications, POST /api/notifications/:id/read, POST /api/notifications/read-all
- GET /api/nurse/dashboard
- GET /api/week/:enrollmentId/:competencyId
- POST /api/progress/:id/ready, /api/progress/:id/signoff, /api/progress/:id/comments
- GET /api/manager/dashboard, /api/manager/signoff-queue
- GET /api/enrollment/:id
- Admin routes: /api/admin/users, /api/admin/facilities, /api/admin/enrollments, etc.

## Running
- `npm run dev` starts Express + Vite on port 5000
- `npm run db:push` pushes schema to PostgreSQL
