# Contact Center Platform

A full-stack contact center platform built on **Spring Boot 3** and **React 18**. It supports inbound and outbound voice calling via the Twilio Programmable Voice SDK, agent management, outbound campaign dialing with configurable recycling, work type queues with DNIS/TFN numbering plans, visual call flow (IVR) design, and a real-time agent presence system.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [WebSocket Signaling](#websocket-signaling)

---

## Architecture

```
Browser (React 18 / Vite)
  │
  ├── REST (HTTPS)           ──►  Spring Boot API  ──►  SQL Server (Azure)
  │
  ├── WebSocket (/ws/signal) ──►  SignalingHandler  (WebRTC offer/answer/ICE relay)
  │
  └── Twilio Voice SDK  ──►  Twilio Cloud
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
             Inbound PSTN               Outbound campaigns
          (route by DNIS to            (CampaignDialerService
           WorkType agents)             @Scheduled every 30s)
```

- **In-app calls** use WebRTC (peer-to-peer audio after signaling handshake).
- **PSTN calls** route through Twilio; audio flows via Twilio's infrastructure.
- **Inbound routing** matches the dialed number (DNIS) to a WorkType and rings only the agents staffed in that queue. Falls back to all online agents if the queue is empty.
- **Outbound campaigns** are driven by a 30-second scheduler that dials contacts according to the campaign's dialing mode and uses the WorkType's DNIS as the outbound caller ID.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3, Spring Security, Spring Data JPA |
| Auth | JWT (JJWT), stateless sessions |
| Database | Microsoft SQL Server (Azure SQL), Hibernate (DDL auto-update) |
| Real-time | Spring WebSocket (`TextWebSocketHandler`) |
| Voice | Twilio Programmable Voice SDK (browser + REST) |
| Frontend | React 18, Vite 4, React Router 6, Tailwind CSS, Lucide icons |
| CI/CD | GitHub Actions → Azure App Service |

---

## Features

### Agent Experience
- **Profile dropdown** — embedded dialpad, contacts manager, and settings panel accessible from the navbar avatar button (no separate pages needed).
- **Profile picture** — upload a photo from the profile dropdown; stored as a base64 data URL in the database and displayed everywhere immediately.
- **Agent status** — ONLINE / BUSY / OFFLINE with live presence tracking; inbound calls only ring ONLINE agents.
- **Embedded dialpad** — full keypad with name/number lookup, active call controls (mute, hang up), and recent call history.
- **Contacts** — add, search, and delete personal contacts; click-to-dial directly into the embedded dialpad.
- **In-app calls** — call other agents by username via WebRTC (no PSTN cost).

### Outbound Campaigns
- **Dialing modes**: PREVIEW (agent-initiated), POWER (1 call/cycle), PREDICTIVE (3 calls/cycle), BLASTER (all contacts at once).
- **Recycling**: configurable multi-pass recycling — choose how many passes, the inter-pass wait time, and which outcomes to recycle (no-answer, busy, voicemail, hard-failed). Optionally reset attempt counts each pass.
- **Auto-completion**: campaign automatically marks itself COMPLETED when all contacts reach a terminal state (COMPLETED or FAILED) and no further recycling is possible.
- **Per-campaign dialing mode** can be changed live from the campaign detail UI.
- **CSV contact upload** — paste name/phone rows to bulk-import contacts.
- **Contact list** shows status, last call outcome, and attempt count for every contact.

### Work Types & Numbering Plan
- **Work Types** are queues that agents are staffed in. Campaigns are linked to a work type for routing.
- **DNIS / TFN** — assign an E.164 Twilio number to each work type. Outbound campaign calls use this as the caller ID. Inbound calls to this number route to agents staffed in that queue.
- **Call Flow assignment** — link a call flow (IVR) to a work type's number for inbound call handling.
- **Agent staffing** — add/remove agents from a work type via a modal from the admin UI.

### Call Flows (IVR Builder)
- Visual node-based IVR designer built on React Flow; the entire graph (nodes + edges) is stored as JSON.
- Call flows are assigned to work types so inbound calls on a DNIS execute the correct flow.

### Admin Panel (ADMIN / SUPERVISOR roles)
- **Users** — create, edit, delete agents; assign roles (ADMIN / SUPERVISOR / AGENT).
- **Work Types** — manage queues, numbering plans, call flow assignments, and agent staffing.
- **Campaigns** — create campaigns with recycling configuration; monitor contact progress; activate, pause, and recycle passes.
- **Call Flows** — design and manage IVR flows.
- **Integrations** — manage third-party integration configurations.
- **Diagnostics** — view system events log, health dashboard (errors, warnings, active campaigns, online agents, pending contacts), and a manual dialer trigger endpoint for debugging.

### Security
- Stateless JWT authentication; all API calls include `Authorization: Bearer <token>`.
- Role-based access control via Spring `@PreAuthorize` (`ADMIN`, `SUPERVISOR`, `AGENT`).
- Twilio webhook endpoints are public (Twilio's servers POST to them without tokens).
- The dialer debug trigger endpoint (`/api/admin/diagnostics/trigger-dialer`) is public for browser-based testing; should be removed or secured before production.

---

## Project Structure

```
test-app/
├── frontend/                        # React 18 + Vite SPA
│   └── src/
│       ├── App.jsx                  # Router setup
│       ├── components/
│       │   ├── Layout.jsx           # App shell (sidebar + navbar + outlet)
│       │   ├── Navbar.jsx           # Top bar with embedded dialpad/contacts/settings dropdown
│       │   ├── Sidebar.jsx          # Left nav (Dashboard, Agents, Admin)
│       │   ├── IncomingCallModal.jsx
│       │   └── admin/AdminLayout.jsx
│       ├── context/
│       │   └── CallContext.jsx      # Twilio Device, WebRTC, call state, contacts, history
│       ├── lib/
│       │   └── api.js               # Fetch wrapper (injects JWT header)
│       └── pages/
│           ├── DashboardPage.jsx
│           ├── DialpadPage.jsx      # Full-page dialpad (standalone route, still accessible)
│           ├── ContactsPage.jsx     # Full-page contacts (standalone route)
│           ├── AgentsPage.jsx
│           ├── SettingsPage.jsx
│           └── admin/
│               ├── AdminUsersPage.jsx
│               ├── AdminWorkTypesPage.jsx    # DNIS + call flow + agent staffing
│               ├── AdminCampaignsPage.jsx    # Campaigns + recycling config
│               ├── AdminCallFlowsPage.jsx    # Visual IVR builder
│               ├── AdminIntegrationsPage.jsx
│               └── AdminDiagnosticsPage.jsx
│
└── src/main/java/com/nmckibben/testapp/
    ├── TestAppApplication.java
    ├── config/
    │   ├── SecurityConfig.java          # JWT filter, public paths, CSRF off
    │   ├── TwilioConfig.java            # Initializes Twilio SDK from env vars
    │   └── WebSocketConfig.java         # Registers /ws/signal
    ├── controller/
    │   ├── AuthController.java          # /api/auth/login, /register
    │   ├── UserController.java          # /api/users/me, /online, /status, /me/avatar, /me/profile
    │   ├── ContactController.java       # /api/contacts CRUD + search
    │   ├── CallRecordController.java    # /api/calls history
    │   ├── WorkTypeController.java      # /api/admin/work-types CRUD + agent staffing
    │   ├── CampaignController.java      # /api/admin/campaigns CRUD + contacts + stats
    │   ├── CallFlowController.java      # /api/admin/call-flows CRUD
    │   ├── TwilioController.java        # Token + TwiML webhooks (voice, worktype, campaign)
    │   ├── DiagnosticsController.java   # /api/admin/diagnostics/events, /health
    │   ├── DialerDebugController.java   # /api/admin/diagnostics/trigger-dialer (public)
    │   ├── AdminController.java         # /api/admin/users CRUD
    │   ├── IntegrationController.java   # /api/admin/integrations CRUD
    │   └── SpaController.java           # Catch-all → index.html for React Router
    ├── dto/
    │   ├── UserDto.java                 # User response (includes avatarData)
    │   ├── AuthResponse.java
    │   ├── LoginRequest.java / RegisterRequest.java
    │   ├── ContactDto.java
    │   └── CallRecordDto.java
    ├── entity/
    │   ├── User.java                    # id, username, displayName, password, phoneNumber, status, role, avatarData
    │   ├── WorkType.java                # id, name, defaultDialingMode, dnis, callFlow FK, agents (M2M)
    │   ├── Campaign.java                # id, name, dialingMode, status, workType FK, callFlow FK,
    │   │                                #   maxAttempts, retryDelayMinutes,
    │   │                                #   maxRecycles, currentRecycle, recycleIntervalMinutes,
    │   │                                #   recycleOnNoAnswer/Busy/Failed/Voicemail,
    │   │                                #   resetAttemptsOnRecycle, lastRecycledAt
    │   ├── CampaignContact.java         # id, campaign FK, name, phoneNumber, status, attempts,
    │   │                                #   lastAttemptAt, lastCallStatus, disposition, notes
    │   ├── CallFlow.java                # id, name, triggerNumber, flowJson (React Flow canvas), active
    │   ├── CallRecord.java              # Call history
    │   ├── Contact.java                 # Personal contacts
    │   ├── SystemEvent.java             # Audit / event log
    │   └── Integration.java
    ├── repository/                      # Spring Data JPA repositories
    │   ├── WorkTypeRepository.java      # + findByDnis(String)
    │   └── CampaignContactRepository.java  # + findRecyclable(campaignId, callStatuses)
    ├── service/
    │   ├── UserService.java             # register, findBy*, updateStatus, updateAvatar, updateProfile
    │   ├── WorkTypeService.java         # CRUD + setAgents
    │   ├── CampaignDialerService.java   # @Scheduled dialer + recycling engine + handleCallStatus
    │   ├── CampaignService.java
    │   ├── CallFlowService.java
    │   ├── EventLogService.java
    │   └── ...
    ├── security/
    │   ├── JwtAuthenticationFilter.java
    │   ├── JwtTokenProvider.java
    │   └── UserDetailsServiceImpl.java
    └── websocket/
        ├── SignalingHandler.java        # WebRTC offer/answer/ICE relay
        └── SignalingMessage.java
```

---

## Prerequisites

- Java 17+
- Maven 3.8+
- Node 18+ (for frontend dev build)
- Microsoft SQL Server (local or Azure SQL)
- Twilio account with:
  - A purchased phone number
  - A TwiML App with Voice Request URL pointing to `/api/twilio/voice`
  - An API Key (SID + Secret)

---

## Configuration

All secrets are injected via environment variables. Create `src/main/resources/application-local.properties` (gitignored) or set them in your deployment environment.

| Variable | Description |
|---|---|
| `DATASOURCE_URL` | JDBC URL e.g. `jdbc:sqlserver://host:1433;databaseName=db;encrypt=true` |
| `DATASOURCE_USERNAME` | SQL Server username |
| `DATASOURCE_PASSWORD` | SQL Server password |
| `JWT_SECRET` | Random string ≥ 32 characters for signing JWTs |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (`AC…`) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_API_KEY_SID` | API Key SID (`SK…`) |
| `TWILIO_API_KEY_SECRET` | API Key Secret |
| `TWILIO_TWIML_APP_SID` | TwiML App SID (`AP…`) |
| `TWILIO_PHONE_NUMBER` | Default Twilio number in E.164, e.g. `+15550001234` |
| `APP_BASE_URL` | Public HTTPS base URL of the app, e.g. `https://yourapp.azurewebsites.net` |

`APP_BASE_URL` is critical for outbound campaigns — it is used to construct the TwiML and status-callback URLs that Twilio's servers call back on.

---

## Running Locally

```bash
# 1. Start the backend
./mvnw spring-boot:run
# Starts on http://localhost:8080
# Hibernate auto-creates / migrates tables on first run

# 2. Start the frontend (separate terminal)
cd frontend
npm install
npm run dev
# Vite proxy forwards /api/* to localhost:8080
# Open http://localhost:5173
```

For local Twilio testing, use [ngrok](https://ngrok.com/) to expose port 8080 and set `APP_BASE_URL` and the TwiML App webhook URL to the ngrok HTTPS URL.

---

## Deployment

The project is deployed to **Azure App Service** via **GitHub Actions** CI/CD. The workflow:

1. Builds the React frontend (`npm run build` in `/frontend`).
2. Copies the built assets into `src/main/resources/static/`.
3. Compiles the Spring Boot JAR (`./mvnw package`).
4. Deploys the JAR to Azure App Service.

Spring Boot serves the React SPA via `SpaController` (catch-all → `index.html`) alongside all API routes.

Environment variables are configured in **Azure App Service → Configuration → Application settings**.

---

## API Reference

All endpoints require `Authorization: Bearer <token>` except where noted as **public**.

### Auth (public)

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ username, displayName, password, phoneNumber }` | Create account. Returns JWT + UserDto. |
| `POST` | `/api/auth/login` | `{ username, password }` | Authenticate. Returns JWT + UserDto. Sets status ONLINE. |

### Users

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | — | Current user's profile (includes `avatarData`). |
| `GET` | `/api/users/online` | — | All users with status `ONLINE`. |
| `GET` | `/api/users/search?q=` | — | Search by username or display name. |
| `GET` | `/api/users/phone/{number}` | — | Look up user by phone number. |
| `PUT` | `/api/users/status?status=` | — | Update own status (`ONLINE` / `BUSY` / `OFFLINE`). |
| `PUT` | `/api/users/me/avatar` | `{ avatarData }` | Save profile picture as base64 data URL. |
| `PUT` | `/api/users/me/profile` | `{ displayName, phoneNumber }` | Update own display name and phone number. |

### Contacts

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/contacts` | — | List own contacts. |
| `GET` | `/api/contacts/search?name=` | — | Search contacts by name. |
| `POST` | `/api/contacts` | `{ name, phoneNumber }` | Add a contact. |
| `DELETE` | `/api/contacts/{id}` | — | Remove a contact. |

### Call Records

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/calls` | Own call history (newest first). |
| `POST` | `/api/calls/{calleeId}` | Create an in-app call record. |
| `POST` | `/api/calls/pstn` | Create a PSTN call record. |
| `PUT` | `/api/calls/{callId}/status?status=` | Update call status. |

### Twilio (public — called by Twilio servers)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/twilio/token` | Access token for Twilio Voice browser SDK. |
| `POST` | `/api/twilio/voice` | Main TwiML webhook. Routes: client calls → direct, DNIS match → WorkType queue, outbound PSTN → pass-through, fallback → simulring. |
| `POST` | `/api/twilio/voice/status` | Voice status callback (acknowledged). |
| `POST` | `/api/twilio/worktype/{id}/voice` | TwiML for outbound campaign calls — rings agents staffed in the specified WorkType. |
| `POST` | `/api/twilio/campaign/{id}/voice` | Fallback TwiML for campaigns with no WorkType. |
| `POST` | `/api/twilio/campaign/{id}/status` | Campaign call status callback — updates `CampaignContact.status` and `lastCallStatus`. |

### Work Types (ADMIN / SUPERVISOR)

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/admin/work-types` | — | List all work types. |
| `POST` | `/api/admin/work-types` | WorkType JSON | Create a work type. |
| `PUT` | `/api/admin/work-types/{id}` | WorkType JSON | Update (including `dnis` and `callFlow`). |
| `DELETE` | `/api/admin/work-types/{id}` | — | Delete. |
| `PUT` | `/api/admin/work-types/{id}/agents` | `{ userIds: [1,2,3] }` | Replace agent staffing list. |

### Campaigns (ADMIN / SUPERVISOR)

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/admin/campaigns` | — | List all campaigns. |
| `POST` | `/api/admin/campaigns` | Campaign JSON | Create campaign (includes recycling fields). |
| `PUT` | `/api/admin/campaigns/{id}` | Campaign JSON | Update campaign (mode, recycling config, etc.). |
| `PUT` | `/api/admin/campaigns/{id}/status` | `{ status }` | Set campaign status (ACTIVE / PAUSED / etc.). |
| `GET` | `/api/admin/campaigns/{id}/contacts` | — | List all contacts for a campaign. |
| `GET` | `/api/admin/campaigns/{id}/stats` | — | Contact count by status (total, pending, completed, failed, dnc). |
| `POST` | `/api/admin/campaigns/{id}/contacts` | `{ name, phoneNumber }` | Add a contact. |
| `DELETE` | `/api/admin/campaigns/contacts/{id}` | — | Remove a contact. |

### Call Flows (ADMIN)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/call-flows` | List all call flows. |
| `POST` | `/api/admin/call-flows` | Create. |
| `PUT` | `/api/admin/call-flows/{id}` | Update (including `flowJson` canvas). |
| `DELETE` | `/api/admin/call-flows/{id}` | Delete. |

### Diagnostics (ADMIN / SUPERVISOR)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/diagnostics/events` | Paginated system event log. |
| `GET` | `/api/admin/diagnostics/health` | Health snapshot (errors, warnings, active campaigns, online agents, pending contacts). |
| `GET` | `/api/admin/diagnostics/trigger-dialer` | **Public.** Manually fire the dialer scheduler. Accepts `?setMode=POWER` to override all active campaign modes before firing. |

---

## Data Model

### Campaign recycling fields

| Field | Default | Description |
|---|---|---|
| `maxRecycles` | 0 | Number of recycle passes after the initial pass. 0 = disabled. |
| `currentRecycle` | 0 | Which pass we're on (0 = first pass). |
| `recycleIntervalMinutes` | 60 | Cooldown between passes. |
| `recycleOnNoAnswer` | true | Recycle contacts that were not answered. |
| `recycleOnBusy` | true | Recycle contacts that returned busy. |
| `recycleOnVoicemail` | false | Recycle contacts that went to voicemail. |
| `recycleOnFailed` | false | Recycle contacts that had a hard Twilio failure. |
| `resetAttemptsOnRecycle` | true | Reset each contact's attempt counter at the start of each pass. |
| `lastRecycledAt` | null | Timestamp of the last recycle; used for cooldown enforcement. |

### WorkType numbering plan fields

| Field | Description |
|---|---|
| `dnis` | E.164 Twilio number assigned to this queue (e.g. `+18005551234`). Used as outbound caller ID and for inbound DNIS routing. |
| `callFlow` | FK to CallFlow — the IVR to execute when an inbound call arrives on `dnis`. |

### CampaignContact status lifecycle

```
PENDING → IN_PROGRESS → COMPLETED
                      → FAILED (maxAttempts reached)
                      → PENDING (retried after busy/no-answer, or recycled)
                      → DNC (do-not-call, set manually)
```

`lastCallStatus` stores the raw Twilio outcome (`completed`, `busy`, `no-answer`, `canceled`, `failed`) used by the recycling engine to decide which contacts qualify for the next pass.

---

## WebSocket Signaling

Connect to `wss://<host>/ws/signal?token=<jwt>`. The server validates the JWT on connection.

All messages use this JSON envelope:

```json
{ "type": "<type>", "to": 123, "from": 456, "payload": {} }
```

`from` is set by the server from the authenticated user identity.

| Type | Direction | Description |
|---|---|---|
| `call-request` | client ↔ server ↔ client | Notify callee of an incoming call. |
| `call-accept` | client ↔ server ↔ client | Callee accepts; caller sends WebRTC offer. |
| `call-reject` | client ↔ server ↔ client | Callee rejects. |
| `offer` | client ↔ server ↔ client | WebRTC SDP offer. |
| `answer` | client ↔ server ↔ client | WebRTC SDP answer. |
| `ice-candidate` | client ↔ server ↔ client | Trickle ICE candidate. |
| `hang-up` | client ↔ server ↔ client | Either party ends the call. |
