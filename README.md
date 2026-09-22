# Archer app

The web client for Archer, a two-sided freelance marketplace. It is intentionally independent from `archer-api` and talks to it over HTTP.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The app expects the API at `http://localhost:4000/api/v1` by default. Start the API first, then open the Vite URL (use `http://localhost:5173` so the API CORS allowlist matches).

## Included flows

- Public landing page, sign-up, and sign-in, with no job listings before sign-in
- Client, freelancer, or both-role registration followed by profile setup; profile editing remains available from the sidebar
- Signed-in sidebar workspace with browsable USD or MMK opportunities
- Sign out to return to the public landing page
- View a full job brief and budget details
- Sign in with JWT-backed demo accounts
- Client workspace to create private drafts, edit them, publish to freelancers, review proposals, and close listings
- Freelancer proposals with exact USD/MMK amounts, editing, status tracking, and withdrawal; clients can shortlist, reject, or accept
- Contract workspaces for offer acceptance, linked deliverables, milestone feedback, completion, cancellation, disputes, and activity history
- Responsive Archer brand UI built with React Router, TanStack Query, and shadcn-compatible primitives
- English and Burmese interface switching from every public and authenticated header; the preference persists locally and is sent to the API for localized errors

Profile setup asks clients for a short overview and freelancers for a username, title, overview, and skill. An hourly rate is optional; USD rates are entered in dollars and cents, while MMK rates use whole kyat. You can skip setup and return to it from the workspace reminder or Profile link.

Client jobs stay private as drafts. After creating a draft, use its management page to edit and publish it. The dashboard links back to each owned job; open or paused jobs can be closed. Job budgets are validated as integer cents (USD) or whole kyat (MMK), with no conversion.

The both-role demo account has an owned job with an incoming proposal and a proposal on another client's job. Its dashboard has Client work and Freelancer work views. The administrator demo account is API-only for now; the web admin workspace has not been implemented.

Use the `EN` / `မြန်မာ` selector in the header to change the interface language. The selection is saved in `localStorage`, updates the document language for assistive technology, and changes locale-aware money formatting. User-entered marketplace content and current taxonomy names remain exactly as authored.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Client | `client1@archer.local` | `ArcherDemo123!` |
| Freelancer | `freelancer1@archer.local` | `ArcherDemo123!` |
| Client + freelancer | `both@archer.local` | `ArcherDemo123!` |

The requested shadcn preset id (`beEhfqy2`) is recorded in `components.json`. The installed CLI build does not support the newer `--preset` flag, so the UI primitives are kept locally and remain compatible with shadcn conventions.
