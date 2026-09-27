// Seeded, already-attended meetings shown in the Meetings library and used as agent context.
import { SARAH_DEMO_RECIPIENT } from "@/lib/demo-recipient";

export type Platform = "Google Meet" | "Zoom" | "Microsoft Teams";

export interface FormField {
  key: string;
  label: string;
  type?: "text" | "email" | "textarea" | "date" | "tel";
}

export interface FormDef {
  id: string;
  title: string;
  org: string;
  meetingId: string;
  due: string;
  /** Default recipient the completed form is emailed to. */
  submitTo: string;
  fields: FormField[];
}

export interface PastMeeting {
  id: string;
  title: string;
  kind: "Internship" | "Class" | "Work";
  platform: Platform;
  date: string;
  duration: string;
  attendees: string[];
  summary: string;
  decisions: string[];
  actionItems: { task: string; owner: string; due: string }[];
  links: { label: string; url: string; via: "chat" | "qr" | "slide" }[];
  formIds: string[];
  contacts: { name: string; email: string; role: string }[];
  transcript: string;
}

export const FORMS: FormDef[] = [
  {
    id: "internship-app",
    submitTo: SARAH_DEMO_RECIPIENT,
    title: "Summer Engineering Internship Application",
    org: "Nova Dynamics",
    meetingId: "discovery-day",
    due: "Oct 18, 2026",
    fields: [
      { key: "fullName", label: "Full name" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "location", label: "City, State" },
      { key: "linkedin", label: "LinkedIn URL" },
      { key: "github", label: "GitHub URL" },
      { key: "portfolio", label: "Portfolio / website" },
      { key: "school", label: "University" },
      { key: "degree", label: "Degree" },
      { key: "major", label: "Major" },
      { key: "gpa", label: "GPA" },
      { key: "gradDate", label: "Expected graduation" },
      { key: "role", label: "Role applying for" },
      { key: "exp1", label: "Experience 1 (company, title, dates, impact)", type: "textarea" },
      { key: "exp2", label: "Experience 2 (company, title, dates, impact)", type: "textarea" },
      { key: "project", label: "Best project", type: "textarea" },
      { key: "skills", label: "Top skills", type: "textarea" },
      { key: "workAuth", label: "Work authorization (US)" },
      { key: "sponsorship", label: "Needs visa sponsorship? (Yes/No)" },
      { key: "startDate", label: "Earliest start date" },
      { key: "referral", label: "Referred by / met at" },
      { key: "whyNova", label: "Why Nova Dynamics?", type: "textarea" },
      { key: "consent", label: "I certify this information is accurate (Yes)" },
    ],
  },
  {
    id: "lab-signup",
    submitTo: SARAH_DEMO_RECIPIENT,
    title: "BIO 204 Lab Section Signup",
    org: "W&M Biology",
    meetingId: "bio-204",
    due: "Sep 30, 2026",
    fields: [
      { key: "fullName", label: "Full name" },
      { key: "studentId", label: "Student ID" },
      { key: "email", label: "School email", type: "email" },
      { key: "section", label: "Preferred lab section" },
      { key: "partner", label: "Lab partner" },
      { key: "notes", label: "Notes for instructor", type: "textarea" },
    ],
  },
  {
    id: "vendor-intake",
    submitTo: SARAH_DEMO_RECIPIENT,
    title: "Vendor Intake Form",
    org: "Helix Supply Co.",
    meetingId: "vendor-sync",
    due: "Oct 2, 2026",
    fields: [
      { key: "legalName", label: "Legal business name" },
      { key: "contactName", label: "Primary contact" },
      { key: "email", label: "Contact email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "address", label: "Business address" },
      { key: "services", label: "Services provided", type: "textarea" },
      { key: "startDate", label: "Contract start date" },
    ],
  },
  {
    id: "w9",
    submitTo: SARAH_DEMO_RECIPIENT,
    title: "W-9 Taxpayer Details",
    org: "Helix Supply Co.",
    meetingId: "vendor-sync",
    due: "Oct 2, 2026",
    fields: [
      { key: "name", label: "Name (as shown on tax return)" },
      { key: "business", label: "Business name" },
      { key: "classification", label: "Federal tax classification" },
      { key: "address", label: "Address" },
      { key: "tinType", label: "TIN type (SSN / EIN)" },
    ],
  },
  {
    id: "job-app",
    submitTo: SARAH_DEMO_RECIPIENT,
    title: "Associate Software Engineer — Job Application",
    org: "Nova Dynamics",
    meetingId: "discovery-day",
    due: "Oct 15, 2026",
    fields: [
      { key: "fullName", label: "Full name" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "location", label: "City, State" },
      { key: "linkedin", label: "LinkedIn URL" },
      { key: "github", label: "GitHub URL" },
      { key: "portfolio", label: "Portfolio / website" },
      { key: "school", label: "University" },
      { key: "degree", label: "Degree" },
      { key: "major", label: "Major" },
      { key: "gpa", label: "GPA" },
      { key: "gradDate", label: "Expected graduation" },
      { key: "position", label: "Position" },
      { key: "yearsExp", label: "Years of experience" },
      { key: "experience", label: "Relevant experience", type: "textarea" },
      { key: "skills", label: "Top skills", type: "textarea" },
      { key: "workAuth", label: "Work authorization (US)" },
      { key: "sponsorship", label: "Needs visa sponsorship? (Yes/No)" },
      { key: "startDate", label: "Earliest start date" },
      { key: "referral", label: "Referred by / met at" },
      { key: "salary", label: "Desired salary" },
      { key: "coverLetter", label: "Cover letter", type: "textarea" },
      { key: "consent", label: "I certify this information is accurate (Yes)" },
    ],
  },
  {
    id: "class-form",
    submitTo: SARAH_DEMO_RECIPIENT,
    title: "BIO 204 Lab Report Submission",
    org: "W&M Biology",
    meetingId: "bio-204",
    due: "Oct 3, 2026",
    fields: [
      { key: "fullName", label: "Full name" },
      { key: "email", label: "School email", type: "email" },
      { key: "course", label: "Course & section" },
      { key: "instructor", label: "Instructor" },
      { key: "assignment", label: "Assignment" },
      { key: "specimen", label: "Specimen imaged" },
      { key: "dueDate", label: "Due date" },
      { key: "summary", label: "Findings summary", type: "textarea" },
    ],
  },
];

export const PAST_MEETINGS: PastMeeting[] = [
  {
    id: "discovery-day",
    title: "Nova Dynamics — Internship Discovery Day",
    kind: "Internship",
    platform: "Google Meet",
    date: "Sep 24, 2026 · 2:00 PM",
    duration: "42 min",
    attendees: ["Sarah Chen (University Recruiting Lead)", "Michael Torres (Staff Engineer)", "You"],
    summary:
      "Nova Dynamics presented its Summer 2027 Software Engineering Internship. Applications close Oct 18 at 11:59 PM ET; the portal was shared as a QR code on a slide and a link in chat. Michael highlighted Python fundamentals and distributed systems experience.",
    decisions: ["You will apply for the Software Engineering Intern role", "Follow-up coffee chat with Michael next week"],
    actionItems: [
      { task: "Submit internship application", owner: "You", due: "Oct 18" },
      { task: "Email Sarah a thank-you note", owner: "You", due: "Sep 26" },
      { task: "Send coffee chat invite", owner: "Michael Torres", due: "Oct 1" },
    ],
    links: [
      { label: "Application portal", url: "/apply/internship-app", via: "qr" },
      { label: "Job application", url: "/apply/job-app", via: "chat" },
    ],
    formIds: ["internship-app", "job-app"],
    contacts: [
      { name: "Sarah Chen", email: SARAH_DEMO_RECIPIENT, role: "Recruiter (demo recipient: your inbox)" },
      { name: "Michael Torres", email: "m.torres@novadynamics.io", role: "Staff Engineer" },
    ],
    transcript:
      `Sarah: Welcome to Discovery Day. Applications for the Summer 2027 Software Engineering Internship close October 18 at 11:59 PM Eastern. Michael: We look for strong fundamentals in Python and some exposure to distributed systems. Scan the QR on this slide or use the link in chat. Sarah's demo follow-ups are routed to your inbox at ${SARAH_DEMO_RECIPIENT}.`,
  },
  {
    id: "bio-204",
    title: "BIO 204 — Cell Imaging Lecture",
    kind: "Class",
    platform: "Zoom",
    date: "Sep 23, 2026 · 10:00 AM",
    duration: "75 min",
    attendees: ["Dr. Amara Osei (Professor)", "Liam Park (TA)", "32 students", "You"],
    summary:
      "Dr. Osei covered SEM imaging of Thalassiosira diatom frustules. Lab report 2 is due Friday. The lab section signup sheet was shared as a QR code; the syllabus PDF was linked in chat.",
    decisions: ["Lab report 2 due Friday Oct 2", "Lab sections limited to 12 students each"],
    actionItems: [
      { task: "Sign up for a lab section", owner: "You", due: "Sep 30" },
      { task: "Submit lab report 2", owner: "You", due: "Oct 2" },
      { task: "Post SEM image dataset", owner: "Liam Park", due: "Sep 25" },
    ],
    links: [
      { label: "Lab signup sheet", url: "/apply/lab-signup", via: "qr" },
      { label: "Class form", url: "/apply/class-form", via: "chat" },
      { label: "SEM dataset", url: "https://nanomat.as.wm.edu/owncloud/s/fK5FbeKFAbzeKaQ", via: "slide" },
    ],
    formIds: ["lab-signup", "class-form"],
    contacts: [
      { name: "Dr. Amara Osei", email: "aosei@wm.edu", role: "Professor" },
      { name: "Liam Park", email: "lpark@wm.edu", role: "TA" },
    ],
    transcript:
      "Dr. Osei: Today we look at SEM images of Thalassiosira frustules at 25,000x. Lab report 2 is due Friday. Scan the QR to sign up for a lab section — Tuesday or Thursday afternoons, 12 seats each. Liam: I'll post the dataset link.",
  },
  {
    id: "vendor-sync",
    title: "Q4 Vendor Onboarding Sync",
    kind: "Work",
    platform: "Microsoft Teams",
    date: "Sep 22, 2026 · 4:30 PM",
    duration: "28 min",
    attendees: ["Priya Nair (Ops Manager)", "Daniel Brooks (Finance)", "You"],
    summary:
      "Priya kicked off onboarding Helix Supply Co. as a Q4 vendor. You own the paperwork: NDA, W-9 and the vendor intake form, all due Friday. Daniel needs the W-9 before issuing a PO.",
    decisions: ["Helix Supply Co. approved as Q4 vendor", "Contract start date Oct 15"],
    actionItems: [
      { task: "Complete vendor intake form", owner: "You", due: "Oct 2" },
      { task: "Collect W-9 details", owner: "You", due: "Oct 2" },
      { task: "Countersign NDA", owner: "Priya Nair", due: "Oct 2" },
      { task: "Issue purchase order", owner: "Daniel Brooks", due: "Oct 6" },
    ],
    links: [
      { label: "Vendor intake portal", url: "/apply/vendor-intake", via: "chat" },
      { label: "IRS W-9 form (PDF)", url: "https://www.irs.gov/pub/irs-pdf/fw9.pdf", via: "qr" },
    ],
    formIds: ["vendor-intake", "w9"],
    contacts: [
      { name: "Priya Nair", email: "priya.nair@acme-corp.com", role: "Ops Manager" },
      { name: "Daniel Brooks", email: "d.brooks@acme-corp.com", role: "Finance" },
    ],
    transcript:
      "Priya: Helix Supply Co. is approved for Q4, start date October 15. Their contact is Jordan Lee, jordan@helixsupply.com, 555-0142, 88 Harbor Way, Norfolk VA. They provide lab consumables and cold-chain logistics. Please finish the NDA, W-9 and intake form by Friday. Daniel: I need the W-9 before I can issue the PO. Helix is an LLC, they use an EIN.",
  },
];

export const SAMPLE_RESUME = {
  name: "Sumon_Mondal_Resume.pdf",
  text: `                                                       Sumon Mondal
       646-624-9273 | sumonmondal0701@gmail.com | linkedin.com/in/sumonmonda1| github.com/Sumon-Mondal

WORK EXPERIENCE
American Woodmark                                                                                                            Lincolnton, NC
Project Associate in Development                                                                                      June 2026 – August 2026
  ● Developing service-integration capabilities that enable software components within the ecosystem to connect and operate through a
     more modular and maintainable architecture.
  ● Investigating integration challenges, evaluating possible solutions and iterating implementations on technical feedback from mentors.
  ● Collaborating with project mentors and different departments to translate technical requirements into project milestones
  ● Managing the project independently across research, development, testing, documentation, and progress and meeting within Deadlines
  ● Creating technical documentation of integration workflows, implementation decisions, setup procedure and maintenance requirements
SAS Institute                                                                                                                      Cary, NC
Software Development Engineering Intern                                                                               May 2025 – August 2025
  ● Developed and maintained automated test suites using Pytest and Playwright, improving test execution efficiency by 20%
  ● Created reusable test utilities and fixtures to improve coverage, stability, and readability across multiple testing modules
  ● Executed regression, functional, and integration testing across multiple browsers/drivers/environments to validate cross-platform
  ● Validated UI workflows and critical user paths, verifying expected behavior across releases and catching breaking changes early
  ● Identified, logged, and debugged issues by analyzing failures and collaborating with QA and development teams to validate fixes
University of North Carolina at Charlotte                                                                                      Charlotte, NC
 IT Cloud Intern                                                                                                      June 2024 – August 2024
  ● Engineered a logistics data pipeline using Azure SQL and Logic Apps to optimize resource allocation and real-time tracking
  ● Designed a cloud-based inventory monitoring system on Azure, integrating SQL databases to automate supply tracking
  ● Created and distributed targeted system and print promotional materials, increasing program visibility and engagement by 25%
  ● Automated invitation and registration processes to improve participant engagement and used KPI tools to track performance
Livingstone College                                                                                                            Salisbury, NC
IT Technician                                                                                                         January 2024 – May 2024
  ● Allot technical assistance and support for incoming queries and issues related to computer systems, software, and hardware
  ● Respond to emails from customers seeking help, Install, modify, and repair computer hardware and software for 80+ devices
  ● Fixed and optimized 70+ computers for daily use by students, faculties, staffs and installed 2 servers racks for our datacenter
EDUCATION
Livingstone College, Salisbury, NC                                                                                 Cumulative GPA: 3.9
Major: Bachelor of Science in Computer Science | Minor: Project Management                           Expected Graduation: December 2027
PROJECTS
Lenovo – Data Trade Gateway                                                                                              Morrisville, NC
Data Analyst                                                                                                   February 2025 – April 2025
  ● Utilized Python and SQL for data wrangling, cleansing, and transformation, integrating datasets into a unified structure for analysis
  ● Creating interactive dashboards that shows real-time business insights, resulting in a 17% in sales & 20% improvement in social media
AI Innovation Hackathon – InternXL                                                                                             Atlanta, GA
Software Engineer – 2nd Place winner                                                                                       November 2024
  ● Reduced participation barriers by 60% through real-time update for the MVP and improving user satisfaction on demand
  ● Used Selenium to scrape real-time meeting data and integrated it into Firebase, automating content delivery to the live website
  ● Reduced participation barriers by 60% through real-time updates, mobile responsiveness, and improving resident satisfaction by 40%
LEADERSHIP
Google Developers Group                                                                                                       Charlotte, NC
Development and API Mentor                                                                                          January 2025 – April 2025
 ● Co facilitated a 10-week software engineering program at BVLC, enhancing practical skills for over 100 students through applied
   learning in the fields of software engineering, user experience design, and venture capital, outside traditional classroom settings.
 ● Mentored teams through weekly check-ins, code reviews, and project demos, strengthening collaboration, and delivery skills
CERTIFICATIONS & PROFESSIONAL SKILLS
Honors/ Awards: Presidential Scholar, 2026 Academic Gold Medal, My HBCU Matters Scholar, UNCF Scholar, CFA Scholar
Cloud & Backend: C2, RDS, API Gateway, SNS/SQS, EventBridge, Step Functions, CloudFormation
Programming Languages: Java, Python, Swift, HTML, CSS, JavaScript, C++, SQL
Core Skills: Problem-Solving, Design Thinking, Effective Communication, Streamliner, Learn, Highly Organized, Willing to Ensures
Accountability, Research Skills, Organizational Planning Skills, Collaboration, Leadership Skills, Flexible, Technical Documentation
Certifications: AWS Academy Cloud Foundations (Amazon Web Services), Software Engineering Certificate (Duke University), Cs50
(Harvard University), Fundamentals of Swift (Apple), Development of Swift (Apple), AI/ML 100 (Apple), AI/ML 200 (Apple), Client
Service of IT (Bloomberg), Certificate of Power BI (Coursera), Certified Tutor (National Teaching Association)
`,
};

export const getMeeting = (id: string) => PAST_MEETINGS.find((m) => m.id === id);
export const getForm = (id: string) => FORMS.find((f) => f.id === id);
