# Electrical Safety Approval Assistant (POC)

A proof-of-concept AI agent that speeds up **first-pass** review of electrical safety submissions — built to show
what's possible, not as a certified compliance tool.

> ## Read this first
>
> - **The rule set is fake.** `src/data/rules.json` contains 15 illustrative, clearly-labelled placeholder rules
>   written for this demo. Every citation ends in `[PLACEHOLDER — verify actual clause]`. It is **not** verified
>   Canadian Electrical Code text and must not be relied on for a real review.
> - **The tool never approves anything.** AI output is decision support. A submission only reaches `Approved` when a
>   human clicks the sign-off button, and every generated letter states that the named licensed engineer makes the
>   final determination.
> - **Not production-hardened.** No auth, no PII handling guarantees, no rate limiting. It runs on an isolated port
>   behind Nginx for demo purposes only.

## What it does

1. **Submission intake** — upload a panel schedule, single-line diagram or load calculation (PDF or image) with
   project name, submitter and date.
2. **Extraction** — Claude reads the document (vision for images/scans, native PDF handling for text PDFs) and returns
   structured JSON: project details, panels, circuits, load calculations, documents present, missing documents, and
   anything it could not read.
3. **Compliance screen** — the extracted data is checked against the placeholder rule set; each rule comes back as
   `pass` / `fail` / `insufficient_data` with an explanation, the extracted value it relied on, and the rule citation.
4. **Reviewer triage** — each flagged finding can be marked *Confirmed issue*, *False positive — dismiss*, or
   *Waived — proceed anyway* (note required). Submission status follows the triage:
   `Pending Review → Deficiencies Found → Resubmission Requested → Approved`.
5. **Letter generation** — drafts an approval letter (no confirmed issues) or a deficiency notice (listing each
   confirmed issue, its citation and what is required to resubmit), downloadable as plain text to paste onto
   letterhead.

Graceful degradation: if extraction or the compliance screen fails, or the document is unreadable, the app says so on
the submission page instead of inventing data.

## Stack

Next.js 14 (App Router) · TypeScript · Prisma + PostgreSQL · Tailwind · Zod · Anthropic Claude (`claude-sonnet-4-6`,
server-side only) · Docker Compose

## Local development

```bash
npm install
cp .env.example .env          # set ANTHROPIC_API_KEY, point DATABASE_URL at your Postgres
npx prisma db push
npm run dev                   # http://localhost:3000
```

## Docker

```bash
cp .env.example .env          # set ANTHROPIC_API_KEY (never commit .env)
docker compose up -d --build
```

The app container runs `prisma db push` on boot, so the schema is created automatically. Uploaded files live in the
`uploads` volume (`UPLOAD_DIR=/data/uploads`) and survive rebuilds.

## Deployment (OCI Ampere VM)

Mirrors the conventions of the other apps on the VM: loopback-only container ports, host Nginx terminating TLS via
certbot, secrets in an uncommitted `.env` next to the compose file.

| Setting | Value |
| --- | --- |
| App port | `127.0.0.1:3004` (3000–3003 are taken by other apps) |
| Postgres port | `127.0.0.1:5436` (5433–5435 are taken) |
| Compose project | `electrical-poc` (own containers, volumes and network) |
| URL | `https://electrical-poc.140.238.131.77.nip.io` |
| Nginx vhost | `deploy/nginx-electrical-poc.conf` → `/etc/nginx/sites-available/electrical-poc` |

This POC uses its **own** Postgres container — it does not touch the Supabase project or any other database on the VM.

```bash
cd ~/electrical-approval-poc
git pull
docker compose up -d --build
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude API key. Server-side only; never sent to the browser. |
| `ANTHROPIC_MODEL` | Model id (default `claude-sonnet-4-6`). |
| `DATABASE_URL` | Postgres connection string. |
| `UPLOAD_DIR` | Directory for stored uploads (`/data/uploads` in Docker). |
| `REVIEWING_ENGINEER` | Name printed on generated letters as the signing engineer. |

## Out of scope for this POC

Real CEC/ESA rule database integration · multi-user auth and roles · billing · client-facing submission portal ·
mobile app · autonomous approval · production security hardening.
