# test-app

A Spring Boot voice-calling application that lets registered users make audio calls to each other in-browser (via WebRTC) and to real phone numbers (via Twilio). Inbound calls to your Twilio number ring all online users simultaneously.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Call Flows](#call-flows)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [API Reference](#api-reference)
- [WebSocket Signaling Protocol](#websocket-signaling-protocol)

---

## Architecture

```
Browser (HTML/JS)
  │
  ├── REST (HTTP/HTTPS)  ──►  Spring Boot API  ──►  SQL Server DB
  │
  ├── WebSocket (/ws/signal)  ──►  SignalingHandler  (relays WebRTC offers/answers/ICE)
  │
  └── Twilio Voice SDK  ──►  Twilio Cloud  ──►  /api/twilio/voice (TwiML webhook)
```

- **In-app calls** use WebRTC for direct peer-to-peer audio after the signaling handshake completes.
- **PSTN calls** (to/from real phone numbers) are brokered entirely by Twilio; audio flows through Twilio's infrastructure.
- **Inbound calls** to your Twilio number simulring every user whose status is `ONLINE`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3, Spring Security |
| Auth | JWT (JJWT library) |
| Database | Microsoft SQL Server, Spring Data JPA / Hibernate |
| Real-time | Spring WebSocket (`TextWebSocketHandler`) |
| PSTN calling | Twilio Programmable Voice SDK |
| Frontend | Vanilla HTML/CSS/JS, WebRTC |

---

## Call Flows

### In-App Call (WebRTC)

```
Caller                     Server (SignalingHandler)               Callee
  │                                │                                  │
  ├─ POST /api/calls/{calleeId} ──►│                                  │
  │                                │                                  │
  ├─ WS: call-request ────────────►├─ forward ──────────────────────►│
  │                                │                                  │
  │◄───────────────────────────────┤◄─ call-accept ──────────────────┤
  │                                │                                  │
  ├─ WS: offer ───────────────────►├─ forward ──────────────────────►│
  │◄───────────────────────────────┤◄─ answer ───────────────────────┤
  │                                │                                  │
  ├─ WS: ice-candidate ───────────►├─ forward ──────────────────────►│
  │◄───────────────────────────────┤◄─ ice-candidate ────────────────┤
  │                                │                                  │
  │◄══════════════════════ WebRTC audio (peer-to-peer) ══════════════►│
```

### Outbound PSTN Call (Twilio)

```
Browser  ──── Twilio Voice SDK ────►  Twilio Cloud
                                          │
                        POST /api/twilio/voice?To=+1555…
                                          │
                              ◄─── TwiML: <Dial><Number>…
                                          │
                                    PSTN destination
```

### Inbound PSTN Call

```
External phone  ──►  Twilio Cloud  ──►  POST /api/twilio/voice
                                              │
                                   GET /api/users/online
                                              │
                               TwiML: simulring all ONLINE users
                                              │
                                   First user to answer wins
```

---

## Project Structure

```
src/main/java/com/nmckibben/testapp/
├── TestAppApplication.java          # Entry point
├── config/
│   ├── SecurityConfig.java          # Spring Security, JWT filter wiring
│   ├── TwilioConfig.java            # Initializes the Twilio SDK
│   └── WebSocketConfig.java         # Registers /ws/signal endpoint
├── controller/
│   ├── AuthController.java          # POST /api/auth/login, /register
│   ├── CallRecordController.java    # Call history CRUD
│   ├── ContactController.java       # Contacts CRUD + search
│   ├── TwilioController.java        # Token + TwiML webhook
│   └── UserController.java          # User lookup, online list, status
├── dto/                             # Request/response transfer objects
├── entity/                          # JPA entities: User, Contact, CallRecord, CallStatus
├── repository/                      # Spring Data JPA repositories
├── security/
│   ├── JwtAuthenticationFilter.java # Reads Bearer token from each request
│   ├── JwtTokenProvider.java        # Generates and validates JWTs
│   └── UserDetailsServiceImpl.java  # Loads users for Spring Security
├── service/                         # Business logic: UserService, ContactService, CallRecordService
└── websocket/
    ├── SignalingHandler.java         # WebSocket message router for WebRTC signaling
    └── SignalingMessage.java         # Signaling message envelope

src/main/resources/
├── application.properties           # Config (all secrets via env vars)
├── application-local.properties     # Local overrides (gitignored)
└── static/
    ├── index.html                   # Login / registration page
    ├── app.html                     # Main app UI
    ├── css/style.css
    └── js/
        ├── auth.js                  # Login/register form logic
        ├── app.js                   # Main UI controller
        ├── signaling.js             # WebSocket wrapper (Signaling class)
        └── webrtc.js                # WebRTC peer connection (WebRTCClient class)
```

---

## Prerequisites

- Java 17+
- Maven 3.8+
- A running Microsoft SQL Server instance
- A [Twilio account](https://www.twilio.com/) with:
  - A phone number
  - A TwiML App configured with your server's `/api/twilio/voice` URL as the Voice Request URL
  - An API Key (SID + Secret)

---

## Configuration

All secrets are injected via environment variables. Create an `application-local.properties` file (already gitignored) or set the following in your environment:

| Environment Variable | Description |
|---|---|
| `DATASOURCE_URL` | JDBC URL, e.g. `jdbc:sqlserver://localhost:1433;databaseName=testapp` |
| `DATASOURCE_USERNAME` | SQL Server username |
| `DATASOURCE_PASSWORD` | SQL Server password |
| `JWT_SECRET` | A long random string used to sign JWTs (min 32 chars) |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID (starts with `AC`) |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_API_KEY_SID` | Twilio API Key SID (starts with `SK`) |
| `TWILIO_API_KEY_SECRET` | Twilio API Key Secret |
| `TWILIO_TWIML_APP_SID` | TwiML App SID (starts with `AP`) |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number in E.164 format, e.g. `+15550001234` |
| `TWILIO_DEFAULT_CLIENT` | Default client identity for inbound routing (optional) |

**Example `application-local.properties`:**
```properties
DATASOURCE_URL=jdbc:sqlserver://localhost:1433;databaseName=testapp;encrypt=false
DATASOURCE_USERNAME=sa
DATASOURCE_PASSWORD=YourPassword123
JWT_SECRET=change-me-to-a-long-random-secret-string
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_api_key_secret
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15550001234
TWILIO_DEFAULT_CLIENT=defaultuser
```

---

## Running Locally

```bash
# Clone the repo
git clone <repo-url>
cd test-app

# Set environment variables (or create application-local.properties)

# Build and run
./mvnw spring-boot:run

# The app starts on http://localhost:8080
```

Hibernate will auto-create the database tables on first run (`spring.jpa.hibernate.ddl-auto=update`).

---

## API Reference

All endpoints except `/api/auth/**`, `/api/twilio/voice`, and static files require a `Authorization: Bearer <token>` header.

### Auth

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ username, displayName, password, phoneNumber }` | Create a new account. Returns JWT + user. |
| `POST` | `/api/auth/login` | `{ username, password }` | Authenticate. Returns JWT + user. Sets status to ONLINE. |

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users/me` | Returns the authenticated user's profile. |
| `GET` | `/api/users/online` | Lists all users with status `ONLINE`. |
| `GET` | `/api/users/search?q=<query>` | Search users by username or display name. |
| `GET` | `/api/users/phone/{number}` | Look up a user by phone number. |
| `PUT` | `/api/users/status?status=<status>` | Update the authenticated user's status (e.g. `ONLINE`, `OFFLINE`). |

### Contacts

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/contacts` | — | List all contacts for the authenticated user. |
| `GET` | `/api/contacts/search?name=<name>` | — | Search contacts by name. |
| `POST` | `/api/contacts` | `{ name, phoneNumber }` | Add a new contact. |
| `DELETE` | `/api/contacts/{contactId}` | — | Remove a contact. |

### Calls

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/calls/{calleeId}` | — | Initiate an in-app call record to another user. |
| `POST` | `/api/calls/pstn` | `{ calleeNumber }` | Initiate a PSTN call record. |
| `PUT` | `/api/calls/{callId}/status?status=<status>` | — | Update a call's status. Valid values: `INITIATED`, `RINGING`, `ANSWERED`, `MISSED`, `REJECTED`, `ENDED`. |
| `GET` | `/api/calls` | — | Get the authenticated user's call history (newest first). |

### Twilio

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/twilio/token` | Returns a Twilio Access Token for the browser Voice SDK. |
| `POST` | `/api/twilio/voice` | TwiML webhook called by Twilio. Routes outbound/inbound calls. |
| `POST` | `/api/twilio/voice/status` | Twilio status callback (acknowledged, no-op). |

---

## WebSocket Signaling Protocol

Connect to `ws[s]://<host>/ws/signal?token=<jwt>`.

The server validates the JWT on connection. If invalid, the socket is closed immediately.

All messages are JSON with this envelope:

```json
{
  "type": "<message-type>",
  "to": 123,
  "from": 456,
  "payload": { ... }
}
```

`from` is set by the server based on the authenticated user — clients do not need to include it.

### Message Types

| Type | Direction | Payload | Description |
|---|---|---|---|
| `call-request` | client → server → client | `null` | Notify the callee of an incoming call. |
| `call-accept` | client → server → client | `null` | Callee accepts; caller proceeds to send an offer. |
| `call-reject` | client → server → client | `null` | Callee rejects the call. |
| `offer` | client → server → client | SDP offer object | WebRTC offer from caller to callee. |
| `answer` | client → server → client | SDP answer object | WebRTC answer from callee to caller. |
| `ice-candidate` | client → server → client | ICE candidate object | Trickle ICE candidate exchange. |
| `hang-up` | client → server → client | `null` | Either party ends the call. |
