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

- Public landing page and sign-in, with no job listings before sign-in
- Signed-in sidebar workspace with browsable USD or MMK opportunities
- Sign out to return to the public landing page
- View a full job brief and budget details
- Sign in with JWT-backed demo accounts
- Client workspace with job creation draft flow
- Responsive Archer brand UI built with React Router, TanStack Query, and shadcn-compatible primitives

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Client | `client1@archer.local` | `ArcherDemo123!` |
| Freelancer | `freelancer1@archer.local` | `ArcherDemo123!` |

The requested shadcn preset id (`beEhfqy2`) is recorded in `components.json`. The installed CLI build does not support the newer `--preset` flag, so the UI primitives are kept locally and remain compatible with shadcn conventions.
