# 🚀 Google Play Store Listing & Submission Guide: AUM

**App Title**: `AUM: Private Chat & Call`  
**Package Name**: `in.aum.messaging`  
**Publisher**: The Competitive Edge / Bapanayya  
**Category**: Communication / Social  
**Content Rating**: Everyone (PEGI 3 / IARC 3+)  
**Privacy Policy URL**: [https://bapanayya.github.io/AUM-Messaging-App/privacy-policy.html](https://bapanayya.github.io/AUM-Messaging-App/privacy-policy.html)  

---

## 📋 Store Metadata (Ready to Copy-Paste into Google Play Console)

### 1. App Title (Max 30 characters)
```text
AUM: Private Chat & Call
```
*(Length: 24 characters)*

---

### 2. Short Description (Max 80 characters)
```text
Sovereign E2EE messaging, video calls & 3 storage modes. Proudly Made in India.
```
*(Length: 79 characters)*

---

### 3. Full Description (Max 4000 characters)
```text
🇮🇳 AUM — Sovereign Privacy-First Messaging & Social Media
Designed and engineered around absolute user data sovereignty, audited end-to-end encryption (E2EE), and user-selectable storage modes. Proudly Made in India.

Unlike conventional messaging and social media platforms that store your private chats, photos, videos, and personal moments indefinitely on central foreign servers, AUM establishes a sovereign communication paradigm where your device acts as the primary storage and delivery source.

🌟 CORE INNOVATION: 3 USER-SELECTABLE STORAGE MODES
AUM gives you full ownership of where your personal data lives:

1. Mode 1: Local Device Storage (Default & 100% Free)
• Messages, photographs, and videos are saved solely on your device.
• Zero cloud content storage exists on central servers.
• If your recipient is offline, pending transfers remain stored safely on your device and are delivered peer-to-peer the moment both of you are back online.
• Active "My Pending Transfers" screen allows you to inspect, retry, or cancel queued outgoing files anytime.

2. Mode 2: Local Storage + Encrypted Cloud Backup
• Your device remains your primary working store.
• Client-side encrypted backup snapshots can be created on-demand or on a daily schedule to safeguard against device loss or damage.
• Backups can only be decrypted locally by your device keys.

3. Mode 3: Paid Encrypted Cloud Storage
• For users wanting seamless multi-device real-time synchronization.
• Offline recipients can receive content even when your phone is turned off.
• Payloads remain end-to-end encrypted; our servers only see opaque ciphertext.

🔒 KEY FEATURES:

💬 End-to-End Encrypted Messaging (1:1 & Groups)
• Share high-resolution photos, 1080p videos, and voice notes with live audio waveforms.
• 4-tier delivery receipts: Pending (queued locally) 🕒, Sent ✓, Delivered ✓✓, and Read (blue ticks) ✓✓.
• Quick emoji reactions, starring, and message deletion controls.
• 12-digit visual cryptographic safety numbers for verified out-of-band peer verification (AES-GCM 256 / SHA-256).

📞 Encrypted WebRTC Voice & Video Calling
• High-definition 1-to-1 audio and video calls.
• Multi-party group calling signaling.
• Peer-to-peer encrypted media flow with zero call recording on central servers.
• Built-in microphone mute, camera flip, and connection quality indicators.

🎬 Daily Moments Feed (Reels / Social)
• A chronological daily stream of photos and videos received from your accepted contacts today.
• Automatically archives safely into regular chat history at midnight.
• React with emojis and reply directly in private chat with a single tap.

⭕ 24-Hour Status Updates (Stories)
• Share photo stories or beautiful gradient text updates that disappear after 24 hours.
• Granular privacy controls: share with all accepted contacts or selected friends.
• Live viewer counters and view tracking.

👥 Sovereign Social Discovery & Contact Security
• Search contacts by username, phone (+91...), or email.
• Mutual friend request authorization prevents unwanted spam and cold messages.
• Complete blocking system that halts messages, calls, presence, and requests.

🛡️ ZERO TRACKING PLEDGE
• Zero third-party ad networks or data broker trackers.
• Zero behavioral profiling or location harvesting.
• Fully compliant with the Indian Digital Personal Data Protection (DPDP) Act 2023 and GDPR.

Experience true digital freedom. Reclaim your privacy with AUM!
```

---

## 🔒 Google Play Console Data Safety Questionnaire Answers

| Data Type | Collected? | Shared? | Purpose | Ephemeral? | Encrypted in Transit? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Personal Info (Name, Phone, Email)** | Yes | No | Account management & discovery | No | Yes |
| **Messages (Text, Photos, Videos)** | No (Mode 1) / Yes (Mode 3) | No | App functionality (E2EE) | Yes | Yes (E2EE) |
| **Audio/Voice Notes & Calls** | Temporary | No | Real-time WebRTC communications | Yes (Not recorded) | Yes |
| **Contacts** | Optional | No | Friend discovery (Mutual consent) | No | Yes |
| **Device ID** | Yes | No | Push notification & session routing | No | Yes |
| **Financial / Payment Info** | No | No | N/A | N/A | N/A |
| **Location** | No | No | N/A | N/A | N/A |

*All data is encrypted in transit using TLS 1.3 / DTLS-SRTP (WebRTC) and AES-GCM 256.*  
*Users can request full account and data deletion at any time.*

---

## 📱 Store Assets Checklist

- [x] App Icon: `assets/playstore/app-icon.png` (512x512 PNG, 32-bit, no transparency)
- [x] Feature Graphic: `assets/playstore/feature-graphic.png` (1024x500 PNG)
- [x] Phone Screenshots: `assets/playstore/screenshots/` (5 HD 1080x1920 PNGs)
- [x] Privacy Policy: `privacy-policy.html`
- [x] Production Upload Keystore: `android/app/upload-keystore.jks`
- [x] Android targetSdkVersion: **36** (Compliant with Google Play 2026 Android 14/15/16 policy)
- [x] Android minSdkVersion: **24** (Play Store automatic security protection compliant)
