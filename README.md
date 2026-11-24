# 🕉️ AUM — Privacy-First Messaging & Social Media Application
### *Proudly Make in India 🇮🇳 | Sovereign End-to-End Encrypted Architecture*

---

## 🌟 Executive Overview

**AUM** is a next-generation privacy-first social media and messaging application designed around **user data sovereignty**, **end-to-end encryption (E2EE)**, and **three user-selectable storage modes**. 

Unlike conventional social media platforms (WhatsApp, Telegram, Instagram) that retain user content, metadata, and media indefinitely on centralized foreign servers, AUM establishes a sovereign paradigm where **the sender's and recipient's devices act as the primary storage and delivery source**, minimizing cloud exposure to zero by default.

---

## 🛡️ Core Product Differentiator: The 3 Storage Modes

AUM provides three user-selectable storage choices during onboarding, changeable at any time through a secure, transparent migration flow:

| Capability | Mode 1: Local Device Storage (Default) | Mode 2: Local Storage + Encrypted Backup | Mode 3: Paid Encrypted Cloud Storage |
| :--- | :--- | :--- | :--- |
| **Primary Working Store** | **Local Device Only** | **Local Device** | **Encrypted Cloud Store** (local cache) |
| **Persistent Cloud Content** | **None (Zero)** | Client-encrypted backup snapshots | Encrypted messages & media |
| **Delivery Model** | **Sender-Side Queue / P2P WebRTC** | Direct delivery when online | Real-time cloud sync & offline delivery |
| **Recipient Offline Behaviour** | Held safely on sender's device until recipient reconnects | Held safely on sender's device | Delivered via cloud without sender staying online |
| **"My Pending Transfers"** | ✅ Dedicated active screen with retry/cancel | ✅ Active screen for pending transfers | Not needed (cloud buffers ciphertext) |
| **Commercial Tier** | **Free (Default)** | Optional backup tier | Paid subscription |

---

## 📲 Feature Suite

### 1. 💬 End-to-End Encrypted Messaging (1:1 & Groups)
- **Content Types**: Text, High-Resolution Photos, 1080p Videos, Voice Notes with live waveforms, and mixed media.
- **Delivery State Ticks**:
  - 🕒 **Pending (Clock)**: Recipient is offline; message is queued in sender's local storage (*Mode 1*).
  - ✓ **Sent (Single check)**: Relayed via peer signaling.
  - ✓✓ **Delivered (Double check)**: Received and verified by recipient device.
  - ✓✓ **Read (Double blue check)**: Viewed by recipient.
- **Reactions & Starred Messages**: Quick emoji reactions (👍, ❤️, 😂, 😮, 😢, 🙏, 🔥) and favoriting.
- **Safety Numbers**: 12-digit visual cryptographic fingerprints (e.g. `4820 9183 2049`) for verified out-of-band contact authentication (AES-GCM 256 / SHA-256).

### 2. 📞 Audio & Video Calling (WebRTC)
- **1-on-1 Audio Calls** & **1-on-1 Video Calls** with real-time peer-to-peer WebRTC transport.
- **Group Calls** with multi-party signaling coordination.
- **In-Call Controls**: Microphone mute/unmute, Camera toggle, Flip camera, Audio route switcher, and Live call duration timer.
- **Synthesized Ringtones**: Built-in Web Audio API oscillator melodies for incoming calls and outgoing ringback tones (no external audio files required).
- **Call History**: Complete logs of incoming, outgoing, and missed calls with one-tap redial.

### 3. ⏳ "My Pending Transfers" (Sender-Side Queue)
- A dedicated screen showcasing AUM's signature feature: undelivered media and messages awaiting offline recipients are transparently listed with file size, recipient, status, and manual retry or cancel actions.

### 4. 🎬 Daily Moments Feed (Reels / Stories)
- A vertical, chronological stream of photos and videos received from accepted contacts today.
- Automatically archives into standard conversation history at midnight.
- Likes, quick emoji reactions, and 1-tap "Reply in Private Chat".

### 5. ⭕ 24-Hour Status Updates (Stories)
- Ephemeral stories with auto-advancing progress timers (6 seconds per story).
- Support for Photo stories and vibrant Gradient Text stories (Saffron Aura, Sovereign Bharat, Deep Space).
- Contact privacy filters and live viewer counter.

### 6. 👥 Sovereign Social Graph & Discovery
- Discover contacts by username, phone number (+91...), or email.
- Mutual friend requests (Incoming / Outgoing with Accept / Reject).
- Blocking mechanism preventing messages, calls, presence, and requests.

### 7. 🇮🇳 Make in India Aesthetic & Experience
- Saffron, amber, and gold modern accents with deep obsidian dark mode.
- Interactive **Mobile Simulator Frame** toggle to test the app as an iPhone 16 / Pixel 9 native mobile experience directly in the desktop browser.
- **Demo Account Switcher** (Aarav Sharma, Priya Patel, Vikram Malhotra, Ananya Iyer) enabling instant perspective switching to test live 1:1 chats, pending queues, and calling.

---

## 🏗️ Codebase Structure

```
AUM-Messaging-App/
├── server/                                # Node.js / TypeScript Backend
│   ├── src/
│   │   ├── types.ts                      # Core entity definitions matching specifications
│   │   ├── index.ts                      # Express HTTP + WebSocket Server & Static Host
│   │   ├── db/
│   │   │   └── storage.ts                # Relational file database with realistic Indian demo seeds
│   │   ├── middleware/
│   │   │   └── auth.ts                   # JWT token authentication
│   │   ├── routes/
│   │   │   ├── auth.routes.ts            # Registration, login, OTP simulation, storage mode switcher
│   │   │   ├── user.routes.ts            # Profile, search, settings, blocklist
│   │   │   ├── contact.routes.ts         # Friend requests & accepted contacts
│   │   │   ├── message.routes.ts         # Chats, delivery receipts, pending transfers queue
│   │   │   ├── call.routes.ts            # Call sessions, history, and WebRTC metadata
│   │   │   ├── group.routes.ts           # Group creation and broadcasts
│   │   │   ├── feed.routes.ts            # Daily feed items & reactions
│   │   │   ├── status.routes.ts          # 24-hour stories & viewer tracking
│   │   │   └── storage.routes.ts         # Storage metrics, backup snapshots, cache clearing
│   │   └── websocket/
│   │       └── gateway.ts                # Real-time WebSocket: presence, messaging, WebRTC calling
│   └── package.json
│
├── client/                                # React 19 + TypeScript + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── types/                        # Client-side domain models
│   │   ├── crypto/
│   │   │   └── e2ee.ts                   # AES-GCM 256 Web Crypto API engine & safety fingerprints
│   │   ├── webrtc/
│   │   │   └── callEngine.ts             # WebRTC media manager, canvas fallback & ringtone synth
│   │   ├── services/
│   │   │   ├── api.ts                    # Typed API client
│   │   │   └── socket.ts                 # WebSocket client with auto-reconnect & presence events
│   │   ├── context/
│   │   │   ├── AuthContext.tsx           # Authentication & demo perspective switcher
│   │   │   ├── ChatContext.tsx           # Messaging, delivery states, pending transfers
│   │   │   ├── CallContext.tsx           # Active calls, incoming call modal, WebRTC video
│   │   │   └── SocialContext.tsx         # Contacts, Daily Feed, 24h Status, Backups
│   │   ├── components/
│   │   │   ├── layout/                   # Header, Navigation, Mobile Chassis Frame
│   │   │   ├── chat/                     # ChatList, ChatWindow, PendingTransfersModal
│   │   │   ├── calling/                  # ActiveCallModal, IncomingCallModal, CallHistoryTab
│   │   │   ├── feed/                     # DailyFeedReels & Moment Creator
│   │   │   ├── status/                   # StoryViewerModal & StoryCreatorModal
│   │   │   ├── contacts/                 # ContactsModal & User Search
│   │   │   ├── groups/                   # CreateGroupModal & BroadcastModal
│   │   │   ├── storage/                  # StorageSettingsModal & Backup Manager
│   │   │   └── settings/                 # SettingsModal & Privacy Controls
│   │   ├── App.tsx                       # Root Application
│   │   └── index.css                     # Tailwind CSS v4 styling & animations
│   ├── vite.config.ts
│   └── package.json
│
├── AUM-Social-Media-App-Design-ChatGPT-Chat.docx
├── Privacy_First_Messaging_App_Final_Architecture_Review.docx
├── Privacy_First_Messaging_App_Updated_Architecture_with_Calling.docx
└── README.md
```

---

## 🚀 Running the Application

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24.18.0)
- **npm** (v10+)

### 2. Quick Start (Single Command)

The backend server is configured to serve both the REST API, WebSocket gateway, and the compiled frontend single-page application from port `5000`:

```bash
# Start backend server (starts on http://localhost:5000)
cd server
npm start
```

Now open **`http://localhost:5000`** in any web browser!

### 3. Development Mode (Hot Reloading)

If you wish to make live frontend modifications with Vite Hot Module Replacement (HMR):

```bash
# Terminal 1: Backend Server
cd server
npm run dev

# Terminal 2: Frontend Vite Dev Server
cd client
npm run dev
```

Frontend dev server runs at **`http://localhost:3000`**.

---

## 👥 Pre-Configured Demo Accounts

You can switch between any of these accounts in 1 click using the top-right profile dropdown:

1. **Aarav Sharma (`usr_aarav`)**:
   - Role: Tech Architect
   - Storage Mode: **Local Device Storage (Mode 1)**
   - Pre-loaded with chats, pending transfer demonstration, and contacts.
2. **Priya Patel (`usr_priya`)**:
   - Role: Digital Artist & Designer
   - Storage Mode: **Local Storage + Encrypted Cloud Backup (Mode 2)**
   - Pre-loaded with Daily Feed moments and active Status updates.
3. **Vikram Malhotra (`usr_vikram`)**:
   - Role: Researcher
   - Storage Mode: **Paid Encrypted Cloud Storage (Mode 3)**
4. **Ananya Iyer (`usr_ananya`)**:
   - Role: Classical Vocalist & Researcher
   - Has a pending friend request to Aarav Sharma.

---

## 🇮🇳 License & Attribution
Designed and built adhering to the architectural requirements defined in the **AUM Architecture Review** and **Make in India Sovereign Digital Privacy Roadmap**.
Distributed under the Apache 2.0 License.
