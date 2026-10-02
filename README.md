# Cashy Oversight: Case Assessment and Decision Monitor

Two connected web apps built for the [Cashy Oversight Challenge](https://maldonam.github.io/public/) (UNHCR Innovation × University of Trento). They tackle the challenge's core question: how do we make sure caseworkers keep overriding an AI targeting recommendation when it is wrong, and how can the institution see when they stop?

| App                  | Route         | Who uses it                       | What it does                                                                            |
| -------------------- | ------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| **Case assessment**  | `/`           | Caseworkers                       | Review a household and decide to include or exclude it _before_ seeing the AI's opinion |
| **Decision monitor** | `/supervisor` | Supervisors, information managers | See how operators and Cashy decide together, measured against an independent reference  |

## Why two apps

Most oversight tooling acts on the person at the moment of decision (explanations, warnings, responsible-AI statements). Cashy Oversight adds the part that is usually missing: instruments that act on the **record**.

- The **case assessment** app shapes how the decision is made: the caseworker commits to a judgment first, then sees what the AI thinks.
- The **decision monitor** makes the outcome visible: it records every decision, compares it with a reference, and flags when override behaviour starts to drift.

## Case assessment (`/`)

- **Case queue** with _To assess_ and _Completed_ tabs, search by ID or country, and a progress bar for the session.
- **Evidence grouped by direction**: factors "in favour of inclusion" and "in favour of exclusion", sorted by relevance. The interface states that factors do not point to a decision on their own and that weighing them is up to the caseworker.
- **Decision before AI opinion**: the caseworker writes a comment and chooses include or exclude. The AI opinion, when available, appears only after submission.
- **Training exercises** mixed into the queue: already-closed cases whose correct answer and a detailed explanation are shown right after the decision.
- Language selector and operation badge (e.g. _Italy operation_).

## Decision monitor (`/supervisor`)

Sections: **Overview**, **Decisions**, **Interviews**, **Equity and blind spots**, **Process drift**. Filters by country, office and operator. Results can be exported to CSV. The header shows the Cashy model version under review and the date range covered.

### Overview metrics

| Metric                                  | Definition                                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Final decision accuracy                 | Verified decisions that match the reference, after the operator has seen Cashy. Shown next to _Operator alone_ (before seeing Cashy) and _Cashy alone_ |
| Appropriate override rate (main metric) | Share of Cashy errors that the operator corrected                                                                                                      |
| Over-reliance rate                      | Share of Cashy errors that the operator followed. Together with the appropriate override rate it accounts for all Cashy errors                         |
| Changed after seeing Cashy              | Decisions that differ from the operator's initial assessment, split by direction, with median time to decide                                           |
| Process drift                           | Number of signals raised across monitored offices, and how many offices are on watch                                                                   |

### Four ways operators and Cashy interact

Every verified decision falls in exactly one cell. **H** is the operator's decision, **AI** is Cashy's recommendation, **Y** is the reference.

|                              | Operator follows Cashy (H = AI) | Operator overrides Cashy (H ≠ AI) |
| ---------------------------- | ------------------------------- | --------------------------------- |
| **Cashy was right** (AI = Y) | Appropriate reliance            | Harmful override                  |
| **Cashy was wrong** (AI ≠ Y) | Over-reliance                   | Appropriate override              |

Reliance is always reported as these four cells, never as a single agreement rate. Proportions come with 95% confidence intervals.

### Reading the numbers

- "Correct" means agreement with the **independent reference determination**, the standard caseworkers are accountable to. It is not ground truth about a household's need.
- Figures in the screenshots come from demo data.

## Tech stack

- [React](https://react.dev/) with [React Router](https://reactrouter.com/) (`react-router-dom`)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- The decision monitor is code-split with `React.lazy` and `Suspense`, so caseworkers do not download it

## Getting started

Requires Node.js and npm.

```bash
git clone <repo-url>
cd <repo-folder>
npm install
npm run dev
```

Open the local URL printed in the terminal, then visit:

- `/` for the case assessment
- `/supervisor` for the decision monitor

To build for production:

```bash
npm run build
```

The app uses `BrowserRouter`, so the host must serve `index.html` for unknown paths. Without that fallback, opening `/supervisor` directly returns a 404.

## Project structure

```
src/
├── App.jsx              # Router and page shell; mounts the three routes
├── pages/
│   ├── Dashboard.jsx    # Case assessment (/)
└── supervisor/
    └── App.jsx          # Decision monitor (/supervisor), lazy-loaded
```

## Data and ethics

- **Synthetic data only.** No real household or caseworker is represented anywhere in the repo.
- Operator-level views exist to spot process drift. They are not meant to rank or evaluate individual caseworkers, and operators should appear under pseudonymous IDs only.
- Households never see or contest the decision made about them, so the monitor is designed to surface wrong recommendations at the institution level.
