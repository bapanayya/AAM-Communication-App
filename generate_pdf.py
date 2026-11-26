import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(HexColor("#64748B"))
        
        # Don't draw running header on cover/page 1
        if self._pageNumber > 1:
            self.drawString(40, 755, "AAM — Sovereign Messaging, Calling & Ads Broadcasting • Technical Architecture")
            self.setStrokeColor(HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(40, 747, 572, 747)

        # Footer on all pages
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 30, page_text)
        self.drawString(40, 30, "AAM Platform Documentation • Proudly Make in India 🇮🇳 • Confidential & Private")
        self.setStrokeColor(HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)
        
        self.restoreState()

def create_aam_pdf(output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=55,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=HexColor('#0F172A'),
        alignment=TA_LEFT,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=HexColor('#D97706'),
        alignment=TA_LEFT,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'SectionHeading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionHeading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=HexColor('#334155'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=HexColor('#1E293B')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=HexColor('#1E293B')
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=HexColor('#0F172A')
    )

    story = []

    # ------------------ HEADER / BANNER ------------------
    logo_path = os.path.abspath("client/public/aam-icon.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.abspath("client/public/aam-logo.jpg")

    banner_data = [
        [
            Image(logo_path, width=64, height=64) if os.path.exists(logo_path) else "",
            [
                Paragraph("AAM: Sovereign Messaging, Video Calling & Ads Broadcasting", title_style),
                Paragraph("MESSAGING • AUDIO &amp; VIDEO CALLING • ADS BROADCASTING", subtitle_style),
                Paragraph("<b>Proudly Make in India 🇮🇳</b> &nbsp;|&nbsp; Target SDK 36 (Android 15) &nbsp;|&nbsp; AES-GCM 256 E2EE &nbsp;|&nbsp; WebRTC P2P", ParagraphStyle('Sub', fontName='Helvetica', fontSize=8.5, textColor=HexColor('#64748B')))
            ]
        ]
    ]
    banner_table = Table(banner_data, colWidths=[75, 457])
    banner_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=HexColor("#D97706"), spaceAfter=12))

    # ------------------ SECTION 1: EXECUTIVE VISION ------------------
    story.append(Paragraph("1. Executive Overview &amp; The Sovereign Data Paradigm", h1_style))
    story.append(Paragraph(
        "Modern digital communication has long been dominated by centralized platforms that store user message graphs, "
        "interaction metadata, and private media indefinitely on foreign server clusters. <b>AAM</b> fundamentally "
        "re-engineers this paradigm by establishing a <b>sovereign, device-first architecture</b> where the user's personal hardware "
        "acts as the primary storage and delivery engine.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Core Pillars of AAM:</b>", body_style
    ))
    story.append(Paragraph("• <b>Zero Central Plaintext Storage:</b> In the default mode, 0 bytes of message content or personal photos reside on central servers.", bullet_style))
    story.append(Paragraph("• <b>Sender-Side Offline Queue:</b> If a recipient is offline, undelivered files are kept safely on the sender's device rather than stored on a remote server.", bullet_style))
    story.append(Paragraph("• <b>Zero Surveillance &amp; No Trackers:</b> Free of third-party advertising trackers, data brokers, telemetry cookies, and auction SDKs.", bullet_style))
    story.append(Paragraph("• <b>Make in India &amp; Legal Compliance:</b> Fully aligned with the Indian Digital Personal Data Protection (DPDP) Act 2023 and GDPR data minimization requirements.", bullet_style))

    story.append(Spacer(1, 8))

    # ------------------ SECTION 2: THE 3 STORAGE MODES ------------------
    story.append(Paragraph("2. Core Innovation: The 3 User-Selectable Storage Modes", h1_style))
    story.append(Paragraph(
        "AAM gives every user complete sovereignty over where their personal data lives. Users select their preferred tier during onboarding and can seamlessly switch at any time:",
        body_style
    ))

    modes_table_data = [
        [
            Paragraph("Evaluation Dimension", table_header_style),
            Paragraph("Mode 1: Local Device (Default)", table_header_style),
            Paragraph("Mode 2: Local + Encrypted Backup", table_header_style),
            Paragraph("Mode 3: Paid Encrypted Cloud Sync", table_header_style)
        ],
        [
            Paragraph("Primary Working Store", table_cell_bold),
            Paragraph("<b>Local Device Only</b> (Hardware sandbox)", table_cell_style),
            Paragraph("<b>Local Device</b> with snapshot backup", table_cell_style),
            Paragraph("<b>Encrypted Cloud Sync</b> + Local cache", table_cell_style)
        ],
        [
            Paragraph("Persistent Central Data", table_cell_bold),
            Paragraph("<b>Zero (0 Bytes)</b>", table_cell_style),
            Paragraph("Client-encrypted ciphertext snapshot blobs", table_cell_style),
            Paragraph("E2EE encrypted ciphertext stream buffer", table_cell_style)
        ],
        [
            Paragraph("Recipient Offline Behavior", table_cell_bold),
            Paragraph("Held safely on sender's device queue", table_cell_style),
            Paragraph("Held safely on sender's device queue", table_cell_style),
            Paragraph("Buffered in cloud for asynchronous pickup", table_cell_style)
        ],
        [
            Paragraph("Sender Online Requirement", table_cell_bold),
            Paragraph("Sender reconnects to finish delivery", table_cell_style),
            Paragraph("Sender reconnects to finish delivery", table_cell_style),
            Paragraph("Delivered even if sender phone is off", table_cell_style)
        ],
        [
            Paragraph("'My Pending Transfers'", table_cell_bold),
            Paragraph("<b>Active primary management screen</b>", table_cell_style),
            Paragraph("<b>Active primary management screen</b>", table_cell_style),
            Paragraph("Automatic cloud handling (Not needed)", table_cell_style)
        ],
        [
            Paragraph("Commercial Tier", table_cell_bold),
            Paragraph("<b>100% Free Forever</b>", table_cell_style),
            Paragraph("Optional backup safety tier", table_cell_style),
            Paragraph("Paid Subscription", table_cell_style)
        ]
    ]

    modes_table = Table(modes_table_data, colWidths=[110, 140, 140, 142])
    modes_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#0F172A')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#F8FAFC')])
    ]))
    story.append(modes_table)
    story.append(Spacer(1, 10))

    # ------------------ SECTION 3: CHARACTERISTIC FEATURES ------------------
    story.append(Paragraph("3. Exhaustive Characteristic Feature Suite", h1_style))

    story.append(Paragraph("A. End-to-End Encrypted (E2EE) Messaging (1:1 &amp; Groups)", h2_style))
    story.append(Paragraph(
        "• <b>Military-Grade Cryptography:</b> Messages and attachments are encrypted with AES-GCM 256-bit keys derived via PBKDF2/SHA-256.<br/>"
        "• <b>12-Digit Visual Safety Numbers:</b> Out-of-band verification fingerprints (e.g. <code>4820 9183 2049</code>) to authenticate contacts.<br/>"
        "• <b>4-Tier Delivery Receipts:</b> Pending (Clock) 🕒 (queued locally on sender device), Sent ✓, Delivered ✓✓, and Read (Blue) ✓✓.<br/>"
        "• <b>Rich Media &amp; Voice Notes:</b> Text, HD photos, 1080p video, and interactive voice notes with live Web Audio waveform visualization.<br/>"
        "• <b>Reactions &amp; Starring:</b> 1-tap emoji reactions (👍, ❤️, 😂, 😮, 😢, 🙏, 🔥), starring, search, and message revocation.",
        body_style
    ))

    story.append(Paragraph("B. Battery-Optimized Peer-to-Peer Voice &amp; Video Calling (WebRTC)", h2_style))
    story.append(Paragraph(
        "• <b>Direct P2P Encrypted Media:</b> Audio and video transmit directly between devices over DTLS-SRTP with zero server eavesdropping.<br/>"
        "• <b>Opus DTX (Discontinuous Transmission):</b> Automatically pauses audio packet transmission during silence, reducing transmitter radio drain by up to 40%.<br/>"
        "• <b>In-Band FEC (Forward Error Correction):</b> Resists 20–30% packet loss without jitter or audio distortion.<br/>"
        "• <b>Free Multi-STUN &amp; Private Coturn Relay:</b> Primary hole punching via Google &amp; Cloudflare public STUN; fallback to private Coturn TURN server on Oracle Cloud (Port 3478).<br/>"
        "• <b>Procedural Audio Ringtones:</b> Built-in Web Audio API oscillator melodies for incoming and ringback tones (0 external MP3 downloads).",
        body_style
    ))

    story.append(Paragraph("C. 'My Pending Transfers' (Sender-Side Queue)", h2_style))
    story.append(Paragraph(
        "The flagship manifestation of Mode 1 data sovereignty: when a recipient is offline, outgoing media files are stored locally on the sender's device rather than deposited on a cloud server. Senders can inspect file size, recipient, timestamp, and trigger manual retry or cancel.",
        body_style
    ))

    story.append(Paragraph("D. Daily Moments Feed &amp; 24-Hour Ephemeral Stories", h2_style))
    story.append(Paragraph(
        "• <b>Daily Moments:</b> Chronological timeline of media shared by accepted contacts today. Automatically folds into private chat histories at midnight.<br/>"
        "• <b>24-Hour Stories:</b> Disappearing updates featuring vibrant gradient text (<i>Saffron Aura, Sovereign Bharat, Deep Space</i>) or photos with 6-second auto-advancing progress timers and viewer tracking.",
        body_style
    ))

    story.append(Paragraph("E. Sovereign Ads Space (Vertical Full-Screen Showcase)", h2_style))
    story.append(Paragraph(
        "A full-screen vertical swipeable showcase enabling users, artisans, and local businesses to broadcast advertisements directly to their accepted contacts. Features double-tap heart likes, share counter, custom price tags, category chips, and a prominent <b>'Inquire on Chat'</b> button initiating an instant, encrypted 1:1 conversation with the advertiser.",
        body_style
    ))

    story.append(Paragraph("F. Sovereign Social Graph &amp; Handshake Discovery", h2_style))
    story.append(Paragraph(
        "Search contacts by unique username (<code>@aarav</code>), phone (<code>+91...</code>), or email. Communication is blocked until mutual friend requests are explicitly accepted, preventing cold spam. Complete 1-tap blocking halts presence heartbeats, calls, and messages.",
        body_style
    ))

    story.append(Spacer(1, 8))

    # ------------------ SECTION 4: FULL TECHNOLOGY STACK ------------------
    story.append(Paragraph("4. Technical Stack &amp; Infrastructure Specifications", h1_style))

    tech_table_data = [
        [
            Paragraph("System Layer", table_header_style),
            Paragraph("Technologies Used", table_header_style),
            Paragraph("Role &amp; Architectural Implementation", table_header_style)
        ],
        [
            Paragraph("Frontend Client", table_cell_bold),
            Paragraph("React 19, TypeScript 5.8, Vite 5, Tailwind CSS v4, Lucide React", table_cell_style),
            Paragraph("Single-page reactive UI, state management, concurrent hooks, and touch-optimized responsive layout.", table_cell_style)
        ],
        [
            Paragraph("Hardware &amp; Web APIs", table_cell_bold),
            Paragraph("Web Crypto API (SubtleCrypto), Web Audio API, WebRTC APIs", table_cell_style),
            Paragraph("Hardware-accelerated AES-GCM 256 encryption, procedural tone synthesis, and direct peer-to-peer audio/video streaming.", table_cell_style)
        ],
        [
            Paragraph("Mobile Platform", table_cell_bold),
            Paragraph("Capacitor 6, Android SDK 36 (Android 15), Java 21 LTS", table_cell_style),
            Paragraph("Cross-platform bridge, native Android build (compileSdkVersion 36, targetSdkVersion 36, minSdkVersion 24), production keystore signing.", table_cell_style)
        ],
        [
            Paragraph("Backend &amp; Gateway", table_cell_bold),
            Paragraph("Node.js 22 LTS, Express.js, WebSocket (ws), PM2, bcryptjs", table_cell_style),
            Paragraph("Real-time signaling gateway, presence heartbeats, transient encrypted envelope relay, and salted password security.", table_cell_style)
        ],
        [
            Paragraph("Sovereign Offline Store", table_cell_bold),
            Paragraph("mockStorage.ts, localStorage, IndexedDB engine", table_cell_style),
            Paragraph("Client-side sovereign database engine ensuring 100% offline standalone functionality on GitHub Pages and mobile devices.", table_cell_style)
        ],
        [
            Paragraph("Cloud &amp; STUN/TURN", table_cell_bold),
            Paragraph("Oracle Cloud Infrastructure (Mumbai VM), Coturn 4.5", table_cell_style),
            Paragraph("Always Free Ampere A1 (4 OCPUs, 24 GB RAM, 200 GB NVMe, 10 TB/mo free bandwidth) hosting backend &amp; private TURN relay.", table_cell_style)
        ],
        [
            Paragraph("DevOps &amp; CI/CD", table_cell_bold),
            Paragraph("GitHub Actions (deploy.yml, android-build.yml), GitHub Pages", table_cell_style),
            Paragraph("Two-stage web deployment pipeline and automated Android release AAB/APK compilation with release signing.", table_cell_style)
        ]
    ]

    tech_table = Table(tech_table_data, colWidths=[100, 160, 272])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#0F172A')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#F8FAFC')])
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 10))

    # ------------------ SECTION 5: SECURE DATA STORAGE & ORACLE CLOUD ------------------
    story.append(Paragraph("5. Secure User Data Storage &amp; Oracle Cloud Architecture", h1_style))
    story.append(Paragraph(
        "Handling user credentials and sensitive personally identifiable information (PII) adheres to strict cryptographic standards:",
        body_style
    ))
    story.append(Paragraph("• <b>Passwords:</b> Salted one-way hashing using <b>Argon2id / bcrypt</b> with cost factor ≥ 12. Passwords are never stored in plaintext or reversible encryption.", bullet_style))
    story.append(Paragraph("• <b>Phone Numbers &amp; Email IDs (Blind Indexing):</b> To allow contact discovery without exposing plaintext, the server stores an HMAC-SHA256 blind index for search, while encrypting the actual string at rest via AES-256-GCM.", bullet_style))
    story.append(Paragraph("• <b>Names &amp; Profiles:</b> Encrypted on disk using PostgreSQL <code>pgcrypto</code> and encrypted block volumes.", bullet_style))
    story.append(Paragraph("• <b>Location Data:</b> No persistent micro-meter GPS tracking. Coordinates are coarsely truncated (neighborhood/city-level) and managed with automatic Time-To-Live (TTL) deletion.", bullet_style))
    story.append(Paragraph("• <b>Oracle Cloud Always Free Deployment:</b> Live on instance <code>92.4.67.156</code> in <b>India West (Mumbai)</b>, ensuring sovereign domestic data residency under the DPDP Act 2023.", bullet_style))

    story.append(Spacer(1, 8))

    # ------------------ SECTION 6: OPEN SOURCE COMPLIANCE ------------------
    story.append(Paragraph("6. Open Source License Compliance", h1_style))
    story.append(Paragraph(
        "• <b>Purely Permissive Dependencies:</b> All integrated libraries (React, Tailwind CSS, Lucide, Capacitor, Express, WebSockets, bcryptjs, WebRTC) are licensed under permissive terms (MIT, Apache 2.0, BSD, ISC).<br/>"
        "• <b>Zero Copyleft Risk:</b> Contains no GPL, AGPL, or SSPL code. You are never obligated to open-source proprietary backend components or private keys.<br/>"
        "• <b>Attribution Notice:</b> Formal Apache 2.0 <code>LICENSE</code> is present in the repository root, and a user-accessible third-party notices document is published at <code>client/public/licenses.html</code> and linked inside the in-app Settings menu.",
        body_style
    ))

    story.append(Spacer(1, 8))

    # ------------------ SECTION 7: DATA RESIDENCY & EXACT APP FLOW ------------------
    story.append(Paragraph("7. Data Residency Map &amp; Exact Application Flow", h1_style))

    story.append(Paragraph("<b>Where Files Live:</b>", h2_style))
    story.append(Paragraph("1. <b>User Device (Primary Store):</b> Private cryptographic identity keys, full conversation message history, outgoing pending transfers queue, local call logs, and media cache. Private keys never leave the phone.", bullet_style))
    story.append(Paragraph("2. <b>Oracle Cloud VM (<code>92.4.67.156</code>):</b> User directory (usernames, blind index hashes, public keys), mutual contact pairings, and group metadata. 0 persistent chat files in Mode 1.", bullet_style))
    story.append(Paragraph("3. <b>GitHub Repository:</b> Application source code, Capacitor native assets, and automated CI/CD workflows.", bullet_style))

    story.append(Paragraph("<b>Exact End-to-End Application Flow:</b>", h2_style))
    story.append(Paragraph("1. <b>Onboarding:</b> App generates X25519/AES-GCM keys locally on hardware. User chooses Display Name and Storage Mode (Mode 1: Local Device, Mode 2: Backup, Mode 3: Cloud Sync).", bullet_style))
    story.append(Paragraph("2. <b>Mutual Handshake:</b> User searches by @username or phone. Mutual friend request must be accepted before communication begins. 12-digit visual safety numbers verify the contact.", bullet_style))
    story.append(Paragraph("3. <b>E2EE Messaging:</b> Message is encrypted locally. If recipient is online, it is delivered immediately (Sent ✓ -> Delivered ✓✓ -> Read ✓✓). If offline, it stays on the <b>sender's device</b> in 'My Pending Transfers' 🕒 until the contact reconnects.", bullet_style))
    story.append(Paragraph("4. <b>P2P Calling:</b> Device synthesizes ringtone via Web Audio API. Signaling is exchanged over WebSockets. DTLS-SRTP encrypted audio/video flows directly between phones with Opus DTX battery saving.", bullet_style))
    story.append(Paragraph("5. <b>Daily Moments &amp; Ads Space:</b> Photos/videos expire at midnight into regular chats. Full-screen vertical ads allow contacts to like, share, and tap 'Inquire on Chat' for instant E2EE private inquiry.", bullet_style))

    story.append(Spacer(1, 8))

    # ------------------ SECTION 8: GITHUB PAGES 404 RESOLUTION ------------------
    callout_box_data = [
        [
            Paragraph(
                "<b>Resolution for GitHub Pages 404:</b><br/>"
                "GitHub Pages on free tier accounts only publishes for <b>Public repositories</b> (like your other published apps). "
                "Because <code>AUM-Messaging-App</code> is set to Private, GitHub returns a 404.<br/>"
                "<b>Fix in 15 seconds:</b> Open repository Settings → Scroll down to Danger Zone → Click <b>'Change repository visibility'</b> → Select <b>'Make public'</b>. "
                "The web app at <code>https://bapanayya.github.io/AUM-Messaging-App/</code> will instantly become live!",
                callout_style
            )
        ]
    ]
    callout_table = Table(callout_box_data, colWidths=[532])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#FEF3C7')),
        ('BOX', (0, 0), (-1, -1), 1, HexColor('#F59E0B')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(callout_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {output_pdf_path} ({os.path.getsize(output_pdf_path)} bytes)")

if __name__ == '__main__':
    out_pdf = os.path.abspath("AAM_Application_Architecture_and_Flow.pdf")
    create_aam_pdf(out_pdf)
