# Agent Setup Service — Discovery Questionnaire

Use this in the first paid session with the client. Goal: gather everything needed to design their agent system.

---

## 1. Team & Roles

- How many developers on the team?
- What are the roles? (frontend, backend, fullstack, QA, PM, DevOps)
- Approximate seniority breakdown? (senior / mid / junior)
- Who makes architectural decisions?
- Who onboards new developers today, and how long does it take?

## 2. Client Portfolio (for agencies)

- How many active client projects right now?
- How many developers per project typically?
- Do developers work on one project at a time or multiple?
- How often do developers switch between client projects?
- Do you have an internal project template or starter kit?
- Do different clients require different stacks, or is there a standard?
- How do you handle client-specific constraints? (compliance, deployment, technology mandates)
- What happens to knowledge when a project ends or a developer rotates off?

## 3. Tech Stack(s)

- Frontend framework(s) & language(s) used across projects?
- Backend framework(s) & language(s)?
- Database(s)?
- Hosting / deployment platforms? (varies per client?)
- CI/CD pipeline? (GitHub Actions, CircleCI, etc.)
- Monorepo or multi-repo? (per client or shared?)
- Key third-party services / APIs common across projects?

## 4. Current Workflow

- Do they use PRs? What's the review process?
- Branch strategy? (gitflow, trunk-based, feature branches)
- How do they track tasks? (Jira, Linear, GitHub Issues, etc.)
- How do they communicate? (Slack, Teams, Discord, WhatsApp)
- Do they have coding standards documented anywhere?
- Do they have architecture decision records (ADRs)?
- Any existing AI tool usage? (Copilot, Cursor, ChatGPT, Claude)

## 5. Pain Points

- What slows the team down the most day-to-day?
- Where do bugs most commonly come from?
- What knowledge is "stuck in someone's head" and not documented?
- What happens when a key developer is out sick or on vacation?
- What's the most annoying repetitive task?
- How long does it take a new hire to make their first meaningful PR?

## 6. Knowledge & Standards

- Are there unwritten rules about how to write code in this codebase?
- Are there known gotchas or footguns in the codebase?
- Are there integrations that behave unexpectedly?
- What are the top 5 things you wish every developer knew before touching the code?
- Any compliance or security constraints? (HIPAA, SOC2, GDPR, etc.)

## 7. Goals & Expectations

- What does success look like in 30 days?
- What does success look like in 90 days?
- Are they looking to ship faster, reduce bugs, improve consistency, or all three?
- Budget range for setup vs. ongoing maintenance?
- Who will be the internal champion / point of contact?

---

## Post-Discovery Deliverable

After this session, you deliver:
1. A summary of findings
2. A recommended agent setup plan (what to build, in what order)
3. A quote for setup + monthly maintenance
4. Timeline (typically 1-2 weeks for setup, 2-4 weeks for tuning)
