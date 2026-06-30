# Lernet — Learning Management System

Lernet is a full-stack learning platform built for students and administrators. It provides course discovery, enrollment, materials, assignments, exams, progress tracking, student-instructor communication, and a complete admin control panel.

## Overview

Lernet connects students with their academic content through a responsive, dashboard-based interface. Students can browse courses, enroll in theory and lab sections, access materials, track assignments, manage their CGPA, and communicate with friends and admins. Administrators can manage courses, students, content, exams, and analytics from a dedicated admin panel.

The project is built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **shadcn/ui**, backed by **Lovable Cloud** for authentication, database, storage, and edge functions.

---

## Public Entry Points

- `/` — Login page with student (Google OAuth) and admin (email/password) sign-in, plus a **Trial Mode** that lets guests browse the dashboard without an account.
- `/maintenance` — Maintenance mode page shown when the platform is under maintenance.

---

## Student Dashboard (`/dashboard`)

After signing in, students land on the dashboard. The sidebar provides navigation to every section.

### Dashboard Home
- View enrolled courses count and total credits.
- Track current CGPA at a glance.
- See the latest assignments with pending deadlines.
- Read admin messages and notifications.
- View a quick week calendar highlighting holidays.
- Watch a platform trailer video from the top bar.
- Open the **Help** guide for a full feature walkthrough.

### Courses (`/dashboard/courses`)
- Browse all published theory and lab courses.
- Search courses by name or description.
- Filter courses by theory days, lab days, or type.
- View full course details including credits, instructor, class days, and description.
- Enroll in a course and select preferred time slots and lab days.
- Edit selected slot and lab days after enrollment.
- Access course materials directly from enrolled courses.

### Course Materials (`/dashboard/courses/:courseId/materials`)
- Access materials organized by modules.
- View documents and PDFs uploaded for each module.
- Watch curated video lectures grouped by category.
- Download previous year question papers (PYQs).
- View course syllabus and module structure.
- Add videos from course materials to **My Space** for personal study.
- Save documents to **My Space** notes.
- Contribute missing materials to the admin for review.

### Assignments (`/dashboard/assignments`)
- View all posted assignments with course names and deadlines.
- Read assignment details and instructions.
- View attached sample documents uploaded by admins.
- Mark assignments as completed and revert completion if needed.
- See overdue assignments highlighted.
- Submit assignment request extensions or issues to admin.
- Track the status of submitted requests and admin feedback.

### Exams (`/dashboard/exams`)
- View all upcoming exams organized by category.
- Switch between Theory, Lab, and Non-Graded exam tabs.
- See exam dates and countdown.
- View exam portions by clicking on each exam entry.
- Track exam status (upcoming or completed).

### Progress (`/dashboard/progress`)
- View and manage CGPA calculation.
- Add, edit, and delete semesters with credits and GPA.
- Track earned credits.
- View course marks for enrolled theory and lab courses.
- Enter marks for CAT 1, CAT 2, DA 1-3, and FAT components.
- Mark components as absent.
- See pass/fail status and marks needed to pass.
- View total marks, marks lost, and maximum achievable marks.

### My Space (`/dashboard/myspace`)
- Create personal study subjects.
- Switch between **Plan** and **Notes** sections.
- Add study plans with start and end dates and track remaining days.
- Create subject-specific notes.
- Add videos to subjects by categories.
- Save videos and documents from course materials directly into My Space.
- Organize videos in custom categories.
- Delete subjects when no longer needed.

### Query (`/dashboard/query`)
- Submit queries to the admin with a subject and message.
- Track query status (pending / responded).
- Read admin responses.
- View query history.

### Academic Calendar (`/dashboard/calendar`)
- View the full academic calendar in a monthly layout.
- Holidays are marked in green; working days in red.
- Navigate between months.
- Current date is highlighted.
- Calendar events are set by the admin.

### Let's Talk / Chat (`/dashboard/chat`)
- Send friend requests to other students.
- Accept or reject incoming friend requests.
- Chat with accepted friends in real-time.
- See typing indicators.
- Access an AI chatbot for assistance.
- Toggle the friends panel on mobile.

### Help
- Open the **Help** window from the dashboard top bar.
- Browse all student-facing sections with a switchable left sidebar.
- Read one-line explanations of every feature in each section.
- Sections include Dashboard, Courses, Assignments, Exams, Progress, My Space, Query, Academic Calendar, Let's Talk, and Course Materials.

### Trial Mode
- Guests can click **Trial Mode** on the login page to browse without signing in.
- Trial users see an orange banner at the top and a trial indicator in the sidebar.
- Trial users can view courses and explore the UI, but any action that writes to the database (enrollment, submitting queries, adding friends, editing name, etc.) is blocked with a toast message.
- RLS policies also prevent unauthenticated database writes.

---

## Admin Dashboard (`/admin`)

Admins sign in with email and password and access a separate control panel.

### Admin Home
- Overview of platform activity, student counts, course counts, and pending items.

### Courses (`/admin/courses`)
- Create, edit, and delete courses.
- Manage course details: title, description, credits, type, days, instructor.
- Publish or unpublish courses.
- Set up course slots and lab days.
- Manage course materials for each course.

### Students (`/admin/students`)
- View the student list.
- Manage student enrollments and records.

### Analytics (`/admin/analytics`)
- View platform usage metrics.
- Track student engagement, course popularity, and activity trends.

### Exams (`/admin/exams`)
- Create and manage exams.
- Set exam categories (Theory CAT 1 / CAT 2 / FAT, Lab FAT, Non-Graded Assessments).
- Define exam dates and portions.

### Control Center (`/admin/control-center`)
- Toggle maintenance mode.
- Manage global platform settings.
- Configure academic calendar and holidays.

---

## Technology Stack

- **Frontend:** React 18, TypeScript 5, Vite 5
- **Styling:** Tailwind CSS 3, shadcn/ui components
- **State & Data:** TanStack Query, React Context
- **Backend / Auth / Database / Storage:** Lovable Cloud
- **Real-time:** Supabase Realtime subscriptions for chat and notifications
- **External Media:** YouTube embeds for trailers and course videos
- **AI:** Lovable AI Gateway for chatbot assistance

---

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. Open the local preview URL.

---

## Project Structure

- `src/pages/` — Page components for student and admin routes.
- `src/components/` — Reusable UI components and dialogs.
- `src/components/ui/` — shadcn/ui component library.
- `src/lib/` — Context providers, utilities, and trial-mode logic.
- `src/integrations/supabase/` — Auto-generated backend client and types.
- `supabase/` — Backend configuration and edge functions.

---

## Key Features Summary

- Google OAuth for students; email/password for admins.
- Course discovery with search, filters, and detailed previews.
- Enrollment with slot selection and lab day preferences.
- Course materials: PDFs, videos, PYQs, and syllabus modules.
- Assignment management with sample documents and completion tracking.
- Exam calendar with category-based organization.
- CGPA and marks tracking with pass/fail insights.
- Personal study workspace with plans and notes.
- Admin query and response system.
- Academic calendar with holidays and working days.
- Real-time chat and friend requests between students.
- AI-powered chatbot assistant.
- Help guide with all student features explained.
- Guest trial mode for browsing without registration.
- Fully responsive layout for desktop and mobile.
