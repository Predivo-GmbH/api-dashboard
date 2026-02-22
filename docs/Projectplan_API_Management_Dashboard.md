# Predivo GmbH — Project Plan: API Management Dashboard

**Application URL:** apis.predivo.ch
**Version:** 1.0
**Date:** February 2026
**Classification:** Confidential

---

## 1. Executive Summary

The API Management Dashboard is an internal web application for Predivo GmbH, hosted at apis.predivo.ch. Its purpose is to provide a centralized overview of all APIs used across all projects. The application enables monitoring of API consumption, costs, quotas, and renewal deadlines.

Security is a top priority: API keys and secrets are stored encrypted and cannot be viewed in plain text. Access to the application is password-protected and secured through multiple layers of defense.

---

## 2. Project Goals

- Central inventory of all APIs used across Predivo projects (arivioo, TubeSwap, etc.)
- Clear dashboard with consumption data per project and API
- Real-time status monitoring of all API connections (active, error, rate-limited)
- Tracking of API quotas and remaining calls/credits
- Notifications for upcoming renewals or limit exceedances
- Secure storage of all API keys and credentials
- Password-protected access with comprehensive security measures
- Track which user/account owns each API key

---

## 3. Technical Architecture

### 3.1 Tech Stack

| Component        | Technology                                              |
|------------------|---------------------------------------------------------|
| Frontend         | Next.js 15 (App Router) with TypeScript & Tailwind CSS  |
| Backend / API    | Next.js API Routes (Server Actions)                     |
| Database         | PostgreSQL (Supabase or self-hosted)                    |
| ORM              | Prisma                                                  |
| Authentication   | NextAuth.js with Credentials Provider + TOTP (2FA)      |
| Secret Management| AES-256-GCM encryption (server-side)                    |
| Hosting          | Vercel or Docker on own server                          |
| Monitoring       | Cron jobs for health checks + email notifications       |

### 3.2 Architecture Overview

The application follows a three-tier architecture: The frontend communicates exclusively via authenticated API routes with the backend. The data layer stores all sensitive information encrypted in the PostgreSQL database. A separate cron service performs regular health checks and updates consumption data.

---

## 4. Security Concept

### 4.1 Authentication & Access Control

- Password-protected login with bcrypt-hashed passwords (min. 12 characters, complexity requirements)
- Optional two-factor authentication (TOTP) via authenticator app
- Session-based authentication with HttpOnly, Secure, SameSite=Strict cookies
- Automatic session timeout after 30 minutes of inactivity
- Rate limiting on login attempts (max. 5 attempts, then 15-minute lockout)
- IP-based access restriction (optional, e.g. Swiss IPs only or VPN)

### 4.2 API Secret Management

- All API keys and secrets are encrypted with AES-256-GCM in the database
- Master encryption key is held as an environment variable, never in the database
- Secrets are displayed masked in the frontend only (e.g. `sk-****7f3a`), never in plain text
- Decryption occurs exclusively server-side and only for authorized API calls
- Audit log for every secret access (who, when, which action)
- Optional key rotation management with reminder function

### 4.3 Application Security

- HTTPS-only with TLS 1.3 (enforced via HSTS header)
- Content Security Policy (CSP) headers to prevent XSS attacks
- CSRF tokens for all mutating operations
- Input validation and sanitization on server and client side (Zod schema validation)
- SQL injection protection via Prisma ORM (parameterized queries)
- Regular dependency updates and security audits (npm audit)
- No API secrets in logs, error messages, or client responses

### 4.4 Infrastructure Security

- Database accessible only via internal network (no public access)
- Regular encrypted database backups
- Separate environments for development, staging, and production
- Environment variables via secure deployment pipeline (e.g. Vercel Secrets)

---

## 5. Functional Requirements

### 5.1 Dashboard

The central dashboard provides an overview of all registered APIs with their current status (green/yellow/red), consumption in the current period, and remaining quotas. Important warnings such as upcoming renewals or high consumption are displayed prominently.

### 5.2 API Management

Each API can be registered with the following information:

- Name and provider
- Description and documentation link
- Assigned project (e.g. arivioo, TubeSwap)
- API type (REST, GraphQL, etc.)
- Base URL
- API key/secret (encrypted)
- **Account owner / registered user** (who holds the account)
- Billing model (pay-per-use, monthly, yearly)
- Quota limits and current consumption
- Renewal date and cost per period

### 5.3 Project Overview

Grouping of all APIs by project with an aggregate view of costs and consumption per project. This allows a quick assessment of which project consumes the most API resources.

### 5.4 Monitoring & Alerts

- Automatic health checks: regular ping tests of all stored API endpoints
- Consumption warnings: notification at 80% and 95% of quota
- Renewal reminders: email 30, 14, and 7 days before expiration
- Error tracking: logging of API errors and downtime
- Cost overview: monthly and yearly cost trends per API and project

### 5.5 Reporting

Exportable reports in CSV and PDF format with consumption history, cost trends, and status overview. Filterable by project, time period, and API provider.

---

## 6. Data Model (Core Entities)

| Entity        | Key Fields                                                  | Description                          |
|---------------|-------------------------------------------------------------|--------------------------------------|
| User          | id, email, passwordHash, totpSecret, role                   | Application users with login & 2FA   |
| Project       | id, name, description, status                               | Predivo projects (arivioo, TubeSwap) |
| ApiEntry      | id, name, provider, baseUrl, projectId, **accountOwner**    | Registered API with assignment       |
| ApiCredential | id, apiEntryId, encryptedKey, encryptedSecret, iv           | Encrypted API credentials            |
| UsageRecord   | id, apiEntryId, period, callCount, cost                     | Consumption data per period          |
| Subscription  | id, apiEntryId, plan, renewalDate, limit, cost              | Subscription info and renewal        |
| AuditLog      | id, userId, action, target, timestamp                       | Complete audit trail                 |
| HealthCheck   | id, apiEntryId, status, responseTime, checkedAt             | Health check results                 |

---

## 7. Phase Plan

### Phase 1: Foundation & Security (Week 1–2)

| Nr.  | Task                                                        | Duration | Priority |
|------|-------------------------------------------------------------|----------|----------|
| 1.1  | Project setup (Next.js, TypeScript, Tailwind, Prisma)       | 2 days   | High     |
| 1.2  | Create and migrate database schema                          | 1 day    | High     |
| 1.3  | Implement authentication (login, sessions, 2FA)             | 3 days   | High     |
| 1.4  | Encryption service for API secrets (AES-256-GCM)            | 2 days   | High     |
| 1.5  | Security headers and middleware (CSP, HSTS, CSRF)           | 1 day    | High     |
| 1.6  | Rate limiting and brute-force protection                    | 1 day    | High     |

### Phase 2: Core Features (Week 3–4)

| Nr.  | Task                                                        | Duration | Priority |
|------|-------------------------------------------------------------|----------|----------|
| 2.1  | Dashboard UI with status overview and charts                | 3 days   | High     |
| 2.2  | API management (CRUD for APIs and credentials)              | 3 days   | High     |
| 2.3  | Project management and assignment                           | 2 days   | High     |
| 2.4  | Consumption tracking and quota display                      | 2 days   | High     |

### Phase 3: Monitoring & Alerts (Week 5–6)

| Nr.  | Task                                                        | Duration | Priority |
|------|-------------------------------------------------------------|----------|----------|
| 3.1  | Health check service (cron-based)                           | 2 days   | Medium   |
| 3.2  | Email notifications (renewal, limits)                       | 2 days   | Medium   |
| 3.3  | Consumption warnings and threshold logic                    | 1 day    | Medium   |
| 3.4  | Audit log implementation                                    | 1 day    | High     |
| 3.5  | Cost overview and trend analysis                            | 2 days   | Medium   |

### Phase 4: Reporting & Polish (Week 7–8)

| Nr.  | Task                                                        | Duration | Priority |
|------|-------------------------------------------------------------|----------|----------|
| 4.1  | CSV and PDF export                                          | 2 days   | Low      |
| 4.2  | Filter and search functionality                             | 1 day    | Medium   |
| 4.3  | Responsive design and UI polish                             | 2 days   | Medium   |
| 4.4  | Testing (unit, integration, security)                       | 3 days   | High     |
| 4.5  | Deployment and DNS setup (apis.predivo.ch)                  | 1 day    | High     |
| 4.6  | Documentation and user guide                                | 1 day    | Low      |

---

## 8. Timeline Overview

| Phase   | Timeframe  | Milestone                            |
|---------|------------|--------------------------------------|
| Phase 1 | Week 1–2   | Secure foundation with login         |
| Phase 2 | Week 3–4   | Functional MVP with dashboard        |
| Phase 3 | Week 5–6   | Monitoring and alerting active       |
| Phase 4 | Week 7–8   | Go-live at apis.predivo.ch           |

**Total duration:** Approximately 8 weeks at full-time development, proportionally longer at part-time.

---

## 9. Initial API Inventory

| API                  | Provider     | Project        | Type  | Account Owner     |
|----------------------|-------------|----------------|-------|-------------------|
| YouTube Data API     | Google       | TubeSwap       | REST  | *(to be filled)*  |
| Google OAuth 2.0     | Google       | TubeSwap       | OAuth | *(to be filled)*  |
| Claude API           | Anthropic    | arivioo / Int. | REST  | *(to be filled)*  |
| OpenAI API           | OpenAI       | Internal       | REST  | *(to be filled)*  |
| Google Gemini API    | Google       | Internal       | REST  | *(to be filled)*  |
| Firecrawl API        | Firecrawl    | Internal       | REST  | *(to be filled)*  |
| Zyte API             | Zyte         | Scraping       | REST  | *(to be filled)*  |
| Browserless API      | Browserless  | Scraping       | REST  | *(to be filled)*  |
| Resend API           | Resend       | All            | REST  | *(to be filled)*  |
| Supabase             | Supabase     | All            | REST  | *(to be filled)*  |

> **Note:** The "Account Owner" column should be filled in with the name or email of the person who registered/owns the respective API account. This field is tracked in the application as `accountOwner` on the `ApiEntry` entity.

---

## 10. Next Steps

1. Review and approve project plan
2. Finalize tech stack (hosting decision: Vercel vs. Docker)
3. Create repository and start project setup
4. Prepare DNS entry for apis.predivo.ch
5. Compile complete API list across all Predivo projects and fill in account owners
6. Begin Phase 1: Foundation and security mechanisms
