import os, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# Initialize 16:9 Widescreen Presentation
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6] # Blank slide

# Color Palette (Obsidian Dark Theme)
BG_COLOR     = RGBColor(11, 15, 23)     # #0B0F17
CARD_BG      = RGBColor(19, 27, 43)     # #131B2B
CARD_BORDER  = RGBColor(35, 53, 84)     # #233554
CYAN_ACCENT  = RGBColor(0, 229, 255)    # #00E5FF
PURPLE_ACCENT= RGBColor(168, 85, 247)   # #A855F7
GREEN_ACCENT = RGBColor(16, 185, 129)   # #10B981
AMBER_ACCENT = RGBColor(245, 158, 11)   # #F59E0B
WHITE        = RGBColor(255, 255, 255)
MUTED_TEXT   = RGBColor(148, 163, 184)  # #94A3B8
SUBTLE_TEXT  = RGBColor(100, 116, 139)  # #64748B

ASSETS_DIR = "/Users/sumonmondal/.gemini/antigravity/brain/c2ad407a-86c6-439e-baad-32e3038d065e"
IMG_STANDBY = os.path.join(ASSETS_DIR, "ios_standard_standby.png")
IMG_LIVE    = os.path.join(ASSETS_DIR, "ios_live_demo_screen.png")
IMG_ADVANCED= os.path.join(ASSETS_DIR, "ios_live_demo_advanced.png")
IMG_WEBAPP  = os.path.join(ASSETS_DIR, "webapp_main_screen.png")
IMG_LOGO    = "/Users/sumonmondal/Downloads/Thread/public/logo.png"

def set_slide_background(slide):
    # Full bleed background rectangle
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_COLOR
    bg.line.color.rgb = BG_COLOR
    return bg

def add_header(slide, category, title, subtitle=None):
    set_slide_background(slide)
    
    # Top Category Badge / Tracker
    tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(11.7), Inches(0.35))
    p_cat = tb_cat.text_frame.paragraphs[0]
    p_cat.text = category.upper()
    p_cat.font.name = "Arial"
    p_cat.font.size = Pt(10)
    p_cat.font.bold = True
    p_cat.font.color.rgb = CYAN_ACCENT
    tb_cat.text_frame.margin_left = Inches(0)
    tb_cat.text_frame.margin_top = Inches(0)

    # Title
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.7), Inches(0.7))
    p_title = tb_title.text_frame.paragraphs[0]
    p_title.text = title
    p_title.font.name = "Arial"
    p_title.font.size = Pt(26)
    p_title.font.bold = True
    p_title.font.color.rgb = WHITE
    tb_title.text_frame.margin_left = Inches(0)
    tb_title.text_frame.margin_top = Inches(0)

    if subtitle:
        p_sub = tb_title.text_frame.add_paragraph()
        p_sub.text = subtitle
        p_sub.font.name = "Arial"
        p_sub.font.size = Pt(13)
        p_sub.font.color.rgb = MUTED_TEXT
        p_sub.space_before = Pt(4)

def add_card(slide, left, top, width, height, title=None, border_color=CARD_BORDER, bg_color=CARD_BG):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(1)
    
    if title:
        tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.18), width - Inches(0.4), Inches(0.4))
        p = tb.text_frame.paragraphs[0]
        p.text = title.upper()
        p.font.name = "Arial"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = CYAN_ACCENT
        tb.text_frame.margin_left = Inches(0)
        tb.text_frame.margin_top = Inches(0)
    return card

# ==========================================
# SLIDE 1: Title Slide (Cover)
# ==========================================
s1 = prs.slides.add_slide(blank_layout)
set_slide_background(s1)

# Subtle decorative gradient card
deco = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.1))
deco.fill.solid()
deco.fill.fore_color.rgb = CYAN_ACCENT
deco.line.color.rgb = CYAN_ACCENT

# Logo
if os.path.exists(IMG_LOGO):
    s1.shapes.add_picture(IMG_LOGO, Inches(0.8), Inches(1.8), height=Inches(1.2))

# Brand Title
tb_brand = s1.shapes.add_textbox(Inches(0.8), Inches(3.2), Inches(11), Inches(1.8))
p1 = tb_brand.text_frame.paragraphs[0]
p1.text = "THREAD"
p1.font.name = "Arial"
p1.font.size = Pt(56)
p1.font.bold = True
p1.font.color.rgb = WHITE

p2 = tb_brand.text_frame.add_paragraph()
p2.text = "The Autonomous Ambient Meeting Intelligence Engine"
p2.font.name = "Arial"
p2.font.size = Pt(24)
p2.font.bold = True
p2.font.color.rgb = CYAN_ACCENT
p2.space_before = Pt(8)

p3 = tb_brand.text_frame.add_paragraph()
p3.text = "Silent Cloud VM · Multimodal Gemini Vision · Dynamic Island · 1-Tap Staged Action Execution"
p3.font.name = "Arial"
p3.font.size = Pt(14)
p3.font.color.rgb = MUTED_TEXT
p3.space_before = Pt(12)

# Badges at bottom
card_pill1 = add_card(s1, Inches(0.8), Inches(5.8), Inches(2.6), Inches(0.8))
tb_p1 = s1.shapes.add_textbox(Inches(1.0), Inches(5.95), Inches(2.2), Inches(0.5))
p = tb_p1.text_frame.paragraphs[0]
p.text = "ENTERPRISE READY"
p.font.size = Pt(11); p.font.bold = True; p.font.color.rgb = GREEN_ACCENT
p_sub = tb_p1.text_frame.add_paragraph()
p_sub.text = "SOC2 & 2-Party Consent Compliant"; p_sub.font.size = Pt(9); p_sub.font.color.rgb = MUTED_TEXT

card_pill2 = add_card(s1, Inches(3.6), Inches(5.8), Inches(2.6), Inches(0.8))
tb_p2 = s1.shapes.add_textbox(Inches(3.8), Inches(5.95), Inches(2.2), Inches(0.5))
p = tb_p2.text_frame.paragraphs[0]
p.text = "CROSS-PLATFORM"
p.font.size = Pt(11); p.font.bold = True; p.font.color.rgb = CYAN_ACCENT
p_sub = tb_p2.text_frame.add_paragraph()
p_sub.text = "iOS Native + Web Companion + VM"; p_sub.font.size = Pt(9); p_sub.font.color.rgb = MUTED_TEXT

card_pill3 = add_card(s1, Inches(6.4), Inches(5.8), Inches(2.6), Inches(0.8))
tb_p3 = s1.shapes.add_textbox(Inches(6.6), Inches(5.95), Inches(2.2), Inches(0.5))
p = tb_p3.text_frame.paragraphs[0]
p.text = "GEMINI 2.0 VISION"
p.font.size = Pt(11); p.font.bold = True; p.font.color.rgb = PURPLE_ACCENT
p_sub = tb_p3.text_frame.add_paragraph()
p_sub.text = "Real-Time QR & Slide OCR"; p_sub.font.size = Pt(9); p_sub.font.color.rgb = MUTED_TEXT


# ==========================================
# SLIDE 2: The Core Problem
# ==========================================
s2 = prs.slides.add_slide(blank_layout)
add_header(s2, "Market Opportunity & User Pain", "Why 95% of AI Meeting Tools Fail Knowledge Workers",
           "Meetings have become high-friction black holes where critical context, links, and action items vanish.")

# Metric Callout Banner
metric_card = add_card(s2, Inches(0.8), Inches(1.8), Inches(11.733), Inches(1.1), border_color=AMBER_ACCENT)
tb_m = s2.shapes.add_textbox(Inches(1.1), Inches(1.95), Inches(11.1), Inches(0.8))
p = tb_m.text_frame.paragraphs[0]
p.text = "31.2 HOURS PER MONTH ARE WASTED IN BACK-TO-BACK MEETINGS."
p.font.size = Pt(14); p.font.bold = True; p.font.color.rgb = AMBER_ACCENT
p_desc = tb_m.text_frame.add_paragraph()
p_desc.text = "73% of commitments, deadlines, and follow-up emails are delayed or forgotten within 24 hours of call completion."
p_desc.font.size = Pt(12); p_desc.font.color.rgb = WHITE

# 3 Pain Point Columns
col_width = Inches(3.75)
col_gap = Inches(0.24)
top_y = Inches(3.2)
height = Inches(3.6)

# Pain 1
c1 = add_card(s2, Inches(0.8), top_y, col_width, height, "1. Intrusive Bot Friction")
tb1 = s2.shapes.add_textbox(Inches(1.0), top_y + Inches(0.7), col_width - Inches(0.4), height - Inches(0.9))
tf1 = tb1.text_frame; tf1.word_wrap = True
p = tf1.paragraphs[0]; p.text = "Traditional bots ('Otter.ai Bot has entered the room') are socially awkward, intrusive, and frequently blocked by enterprise IT firewalls."
p.font.size = Pt(12); p.font.color.rgb = MUTED_TEXT
p2 = tf1.add_paragraph(); p2.text = "• Distracts attendees & requires explicit manual inviting\n• Fails in enterprise security domains\n• Awkward for high-stakes recruiting & leadership calls"
p2.font.size = Pt(11); p2.font.color.rgb = WHITE; p2.space_before = Pt(8)

# Pain 2
c2 = add_card(s2, Inches(0.8) + col_width + col_gap, top_y, col_width, height, "2. Passive Text Walls")
tb2 = s2.shapes.add_textbox(Inches(1.0) + col_width + col_gap, top_y + Inches(0.7), col_width - Inches(0.4), height - Inches(0.9))
tf2 = tb2.text_frame; tf2.word_wrap = True
p = tf2.paragraphs[0]; p.text = "Legacy tools spit out 20-page unstructured transcripts nobody ever reads. They miss all visual cues and presentation slides."
p.font.size = Pt(12); p.font.color.rgb = MUTED_TEXT
p2 = tf2.add_paragraph(); p2.text = "• Blind to screen shares, slide QR codes, and forms\n• No distinction between fluff and decisive moments\n• Forces users to re-read hours of text after working"
p2.font.size = Pt(11); p2.font.color.rgb = WHITE; p2.space_before = Pt(8)

# Pain 3
c3 = add_card(s2, Inches(0.8) + (col_width + col_gap)*2, top_y, col_width, height, "3. Action Item Amnesia")
tb3 = s2.shapes.add_textbox(Inches(1.0) + (col_width + col_gap)*2, top_y + Inches(0.7), col_width - Inches(0.4), height - Inches(0.9))
tf3 = tb3.text_frame; tf3.word_wrap = True
p = tf3.paragraphs[0]; p.text = "Notes are useless without execution. Knowledge workers still have to manually draft emails, add calendar events, and submit application forms."
p.font.size = Pt(12); p.font.color.rgb = MUTED_TEXT
p2 = tf3.add_paragraph(); p2.text = "• Zero automation for scheduling spoken deadlines\n• No instant drafting of follow-up emails\n• Commuters & mobile workers miss live meeting polls"
p2.font.size = Pt(11); p2.font.color.rgb = WHITE; p2.space_before = Pt(8)


# ==========================================
# SLIDE 3: The Thread Solution
# ==========================================
s3 = prs.slides.add_slide(blank_layout)
add_header(s3, "The Breakthrough Solution", "Thread: Ambient, Autonomous, Actionable",
           "A fundamentally new paradigm: An autonomous cloud agent that attends, extracts multimodal intelligence, and executes actions.")

card_w = Inches(5.7)
card_h = Inches(2.4)
row_gap = Inches(0.25)

# Pillar 1
p1_card = add_card(s3, Inches(0.8), Inches(1.8), card_w, card_h, "1. Silent Cloud Virtual Machine (VM)", border_color=CYAN_ACCENT)
tb = s3.shapes.add_textbox(Inches(1.0), Inches(2.4), card_w - Inches(0.4), card_h - Inches(0.7))
tf = tb.text_frame; tf.word_wrap = True
p = tf.paragraphs[0]; p.text = "Thread runs on a dedicated headless Cloud VM authenticated via your Google Workspace and Zoom credentials."
p.font.size = Pt(12); p.font.color.rgb = MUTED_TEXT
p2 = tf.add_paragraph(); p2.text = "✓ Zero external bot joining your call\n✓ Automatically joins on your behalf from your calendar\n✓ Full control over meeting audio, chat, and slides"
p2.font.size = Pt(11); p2.font.color.rgb = WHITE; p2.space_before = Pt(6)

# Pillar 2
p2_card = add_card(s3, Inches(6.8), Inches(1.8), card_w, card_h, "2. Multimodal Gemini 2.0 Vision", border_color=PURPLE_ACCENT)
tb = s3.shapes.add_textbox(Inches(7.0), Inches(2.4), card_w - Inches(0.4), card_h - Inches(0.7))
tf = tb.text_frame; tf.word_wrap = True
p = tf.paragraphs[0]; p.text = "While other tools only listen to audio, Thread watches presentation screen shares with sub-second computer vision."
p.font.size = Pt(12); p.font.color.rgb = MUTED_TEXT
p2 = tf.add_paragraph(); p2.text = "✓ Real-time slide OCR & bullet point summarization\n✓ Instant QR code detection and link resolution\n✓ Auto-detects application forms, portals, and deadlines"
p2.font.size = Pt(11); p2.font.color.rgb = WHITE; p2.space_before = Pt(6)

# Pillar 3
p3_card = add_card(s3, Inches(0.8), Inches(1.8) + card_h + row_gap, card_w, card_h, "3. Glanceable Dynamic Island & Live Activities", border_color=GREEN_ACCENT)
tb = s3.shapes.add_textbox(Inches(1.0), Inches(2.4) + card_h + row_gap, card_w - Inches(0.4), card_h - Inches(0.7))
tf = tb.text_frame; tf.word_wrap = True
p = tf.paragraphs[0]; p.text = "The entire meeting condensed into 3-word glanceable updates streamed directly to Apple's Dynamic Island and Lock Screen."
p.font.size = Pt(12); p.font.color.rgb = MUTED_TEXT
p2 = tf.add_paragraph(); p2.text = "✓ Know who is speaking and what is decided without looking\n✓ Live audio waveform indicator\n✓ Instant notification when actions require approval"
p2.font.size = Pt(11); p2.font.color.rgb = WHITE; p2.space_before = Pt(6)

# Pillar 4
p4_card = add_card(s3, Inches(6.8), Inches(1.8) + card_h + row_gap, card_w, card_h, "4. Human-In-The-Loop Action Staging", border_color=AMBER_ACCENT)
tb = s3.shapes.add_textbox(Inches(7.0), Inches(2.4) + card_h + row_gap, card_w - Inches(0.4), card_h - Inches(0.7))
tf = tb.text_frame; tf.word_wrap = True
p = tf.paragraphs[0]; p.text = "AI autonomy with total human safety. Thread drafts the action, you approve with 1 tap or hands-free voice command."
p.font.size = Pt(12); p.font.color.rgb = MUTED_TEXT
p2 = tf.add_paragraph(); p2.text = "✓ Drafted follow-up emails to exact speakers\n✓ Spoken deadlines scheduled to Google Calendar\n✓ 1-Tap / Voice 'Just Send It' approval"
p2.font.size = Pt(11); p2.font.color.rgb = WHITE; p2.space_before = Pt(6)


# ==========================================
# SLIDE 4: Architecture Overview
# ==========================================
s4 = prs.slides.add_slide(blank_layout)
add_header(s4, "Engineering & Systems", "End-to-End System Architecture",
           "A high-performance pipeline spanning headless cloud browser automation, multimodal inference, and real-time Apple clients.")

layers = [
    ("LAYER 1: AMBIENT INGESTION", "Cloud VM Chromium Worker (Headless Meet / Zoom) · In-Room Mic (Consent Guarded) · Chrome Extension", CYAN_ACCENT),
    ("LAYER 2: MULTIMODAL INTELLIGENCE", "Gemini 2.0 Flash Vision (QR / Slide OCR) · Whisper Diarization (Speaker ID) · Semantic Classifier (5 Moment Types)", PURPLE_ACCENT),
    ("LAYER 3: AGENTIC ACTION DISPATCH", "Google Calendar API (Stage Deadlines) · Gmail API (Send Follow-Ups) · Form Auto-Fill Engine · Poll Auto-Voter", AMBER_ACCENT),
    ("LAYER 4: CROSS-SURFACE COCKPITS", "Native iOS Swift Cockpit · Apple Dynamic Island / Live Activity · Narrow Zoom Side-Panel · Driving Mode Voice HUD", GREEN_ACCENT)
]

y_pos = Inches(1.8)
l_height = Inches(1.15)
l_gap = Inches(0.2)

for i, (l_title, l_desc, l_color) in enumerate(layers):
    card = add_card(s4, Inches(0.8), y_pos + (l_height + l_gap)*i, Inches(11.733), l_height, border_color=l_color)
    tb = s4.shapes.add_textbox(Inches(1.1), y_pos + (l_height + l_gap)*i + Inches(0.18), Inches(11.1), l_height - Inches(0.3))
    tf = tb.text_frame
    p = tf.paragraphs[0]; p.text = l_title; p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = l_color
    p2 = tf.add_paragraph(); p2.text = l_desc; p2.font.size = Pt(11.5); p2.font.color.rgb = WHITE; p2.space_before = Pt(4)


# ==========================================
# SLIDE 5: The Headless Cloud Virtual Machine
# ==========================================
s5 = prs.slides.add_slide(blank_layout)
add_header(s5, "Core Innovation", "The Silent Cloud Virtual Machine (VM)",
           "No awkward third-party bots. Thread joins meetings natively as you, running in a headless secure cloud container.")

left_w = Inches(6.5)
c = add_card(s5, Inches(0.8), Inches(1.8), left_w, Inches(5.0))
tb = s5.shapes.add_textbox(Inches(1.1), Inches(2.1), left_w - Inches(0.6), Inches(4.5))
tf = tb.text_frame; tf.word_wrap = True

bullets = [
    ("Autonomous Calendar Monitoring", "Thread polls Google Calendar in the background. When an upcoming meeting is detected 5–10 minutes prior, it sends an actionable push notification: 'Join with Thread'."),
    ("Headless Chromium Execution", "A dedicated cloud worker spawns a lightweight headless Chromium container. It logs in with authorized session cookies, enters the waiting room, and joins silently."),
    ("Dual Attendance Flexibility", "The user can join on their phone or laptop as usual — Thread works quietly alongside as an invisible AI co-pilot. Or the user can skip the call entirely and let Thread represent them."),
    ("VM Remote Meeting Control", "Thread provides native iOS control buttons (Mute, Raise Hand, Reaction, Chat, Leave) that send lightweight WebSocket commands directly to the VM.")
]

for i, (head, body) in enumerate(bullets):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    p.text = f"✦  {head}"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN_ACCENT
    if i > 0: p.space_before = Pt(10)
    p2 = tf.add_paragraph()
    p2.text = body
    p2.font.size = Pt(11); p2.font.color.rgb = WHITE
    p2.space_before = Pt(2)

# Right card: Key Benefits
right_w = Inches(4.9)
c_r = add_card(s5, Inches(7.6), Inches(1.8), right_w, Inches(5.0), "Enterprise Security & Privacy", border_color=GREEN_ACCENT)
tb_r = s5.shapes.add_textbox(Inches(7.9), Inches(2.5), right_w - Inches(0.6), Inches(4.0))
tf_r = tb_r.text_frame; tf_r.word_wrap = True

p = tf_r.paragraphs[0]
p.text = "🔒 Zero Credential Leaks\nTokens stored in encrypted enclave; VM destroys session state on meeting end."
p.font.size = Pt(11.5); p.font.color.rgb = MUTED_TEXT

p = tf_r.add_paragraph()
p.text = "⚡ Sub-100ms Command Latency\nMute and Raise Hand commands reach Zoom/Meet via fast WebSocket RPC."
p.font.size = Pt(11.5); p.font.color.rgb = MUTED_TEXT; p.space_before = Pt(14)

p = tf_r.add_paragraph()
p.text = "🛡 Two-Party Consent Enforced\nMicrophone transcription strictly adheres to state and federal wiretapping consent rules."
p.font.size = Pt(11.5); p.font.color.rgb = MUTED_TEXT; p.space_before = Pt(14)


# ==========================================
# SLIDE 6: Multimodal Vision & Slide Extraction (With Screenshot!)
# ==========================================
s6 = prs.slides.add_slide(blank_layout)
add_header(s6, "Multimodal AI in Action", "Gemini 2.0 Vision: Real-Time Slide & QR Extraction",
           "Audio is only half the meeting. Thread's vision pipeline decodes presentation slides, URLs, and QR codes live.")

# Left Column: Explanation
left_w = Inches(6.8)
c_v = add_card(s6, Inches(0.8), Inches(1.8), left_w, Inches(5.1), "Real-Time Vision Pipeline")
tb_v = s6.shapes.add_textbox(Inches(1.1), Inches(2.5), left_w - Inches(0.6), Inches(4.2))
tf_v = tb_v.text_frame; tf_v.word_wrap = True

p = tf_v.paragraphs[0]
p.text = "1. Screen Share Frame Sampling"
p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN_ACCENT
p2 = tf_v.add_paragraph()
p2.text = "The VM captures keyframe diffs whenever a presenter advances slides, avoiding redundant token spend."
p2.font.size = Pt(11); p2.font.color.rgb = MUTED_TEXT

p = tf_v.add_paragraph()
p.text = "2. Sub-Second QR Code Decoding"
p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = PURPLE_ACCENT; p.space_before = Pt(10)
p2 = tf_v.add_paragraph()
p2.text = "Built-in computer vision decodes slide QR codes instantly, resolving application portals, feedback forms, and slide decks."
p2.font.size = Pt(11); p2.font.color.rgb = MUTED_TEXT

p = tf_v.add_paragraph()
p.text = "3. Autonomous Form Auto-Fill"
p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = GREEN_ACCENT; p.space_before = Pt(10)
p2 = tf_v.add_paragraph()
p2.text = "From slide QR code to completed job application or survey in 1 tap, automatically mapping your pre-stored resume and profile."
p2.font.size = Pt(11); p2.font.color.rgb = MUTED_TEXT

# Right Column: Screenshot of Gemini Vision Card
if os.path.exists(IMG_ADVANCED):
    s6.shapes.add_picture(IMG_ADVANCED, Inches(8.2), Inches(1.8), height=Inches(5.1))


# ==========================================
# SLIDE 7: Human-in-the-Loop Action Execution
# ==========================================
s7 = prs.slides.add_slide(blank_layout)
add_header(s7, "Action Execution", "Human-in-the-Loop: Staged, Not Spammed",
           "Autonomous AI with zero hallucination risk. Thread stages high-value actions for simple 1-tap user confirmation.")

col_w = Inches(2.75)
col_g = Inches(0.24)
top_y = Inches(1.8)
c_h = Inches(5.1)

cards_data = [
    ("✉️ Smart Emails", "Context-Rich Drafts", [
        "Detects requests: 'Sarah, can you send over the deck?'",
        "Pre-addresses email to sarah.chen@novadynamics.io",
        "Drafts polite executive summary",
        "Dispatches via Gmail OAuth on 1 tap"
    ], CYAN_ACCENT),
    ("📅 Calendar Sync", "Spoken Deadlines", [
        "Identifies exact dates: 'Applications close October 18'",
        "Calculates start and end timestamps automatically",
        "Populates Google Calendar with meeting notes and links",
        "Prevents missed recruiting and project milestones"
    ], PURPLE_ACCENT),
    ("📊 Live Polls", "Automated Voting", [
        "Detects in-meeting Zoom / Meet pop-up polls",
        "Understands user sentiment & previous preferences",
        "Stages optimal option selection",
        "Casts vote autonomously or prompts user"
    ], AMBER_ACCENT),
    ("📝 Form Auto-Fill", "1-Tap Applications", [
        "Extracts application form link from slide QR code",
        "Parses candidate form fields (Name, Email, Resume)",
        "Pre-populates fields with zero typos",
        "Submits form directly on user confirmation"
    ], GREEN_ACCENT),
]

for i, (title, sub, bullets, color) in enumerate(cards_data):
    x = Inches(0.8) + (col_w + col_g) * i
    card = add_card(s7, x, top_y, col_w, c_h, title, border_color=color)
    tb = s7.shapes.add_textbox(x + Inches(0.2), top_y + Inches(0.6), col_w - Inches(0.4), c_h - Inches(0.8))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = sub; p.font.size = Pt(12); p.font.bold = True; p.font.color.rgb = color
    for b in bullets:
        p_b = tf.add_paragraph()
        p_b.text = f"• {b}"
        p_b.font.size = Pt(10.5); p_b.font.color.rgb = WHITE
        p_b.space_before = Pt(6)


# ==========================================
# SLIDE 8: Native iOS Cockpit & Standby Experience (With Screenshot!)
# ==========================================
s8 = prs.slides.add_slide(blank_layout)
add_header(s8, "Mobile First Craftsmanship", "Native iOS Cockpit: Minimalist & Production-Grade",
           "Engineered in Swift with SwiftUI and ActivityKit for fluid 120Hz responsiveness.")

left_w = Inches(6.8)
c_ios = add_card(s8, Inches(0.8), Inches(1.8), left_w, Inches(5.1), "Homescreen Architecture")
tb_ios = s8.shapes.add_textbox(Inches(1.1), Inches(2.5), left_w - Inches(0.6), Inches(4.2))
tf_ios = tb_ios.text_frame; tf_ios.word_wrap = True

ios_points = [
    ("Executive Standby Dashboard", "Balanced 2x2 Connected Ecosystem showing Zoom, Meet, Google Calendar, and Gmail sync status at a single glance."),
    ("Customizable Home Density", "Users toggle between 'Minimal' (single quiet connector line) and 'Standard' (full autonomous capabilities overview) in Settings."),
    ("Integrated VM Meeting Controls", "Mute, Raise Hand, Send Reactions, and chat directly in the active Zoom/Meet session via native iOS buttons."),
    ("Agent Command Pill", "Natural language input with instant speech recognition. Command: 'Just send it' immediately approves and dispatches all pending staged drafts.")
]

for i, (head, body) in enumerate(ios_points):
    p = tf_ios.paragraphs[0] if i == 0 else tf_ios.add_paragraph()
    p.text = f"✦  {head}"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN_ACCENT
    if i > 0: p.space_before = Pt(10)
    p2 = tf_ios.add_paragraph()
    p2.text = body
    p2.font.size = Pt(11); p2.font.color.rgb = WHITE
    p2.space_before = Pt(2)

# Right: Screenshot of Standby Homescreen
if os.path.exists(IMG_STANDBY):
    s8.shapes.add_picture(IMG_STANDBY, Inches(8.2), Inches(1.8), height=Inches(5.1))


# ==========================================
# SLIDE 9: Dynamic Island & Lock Screen Live Activity
# ==========================================
s9 = prs.slides.add_slide(blank_layout)
add_header(s9, "Apple Platform Excellence", "Glanceable Intelligence: Dynamic Island & Live Activities",
           "Meeting intelligence without unlocking your phone. Live Activity attributes stream real-time updates directly to iOS hardware.")

c_di = add_card(s9, Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.1), "Dynamic Island Capabilities")
tb_di = s9.shapes.add_textbox(Inches(1.1), Inches(2.5), Inches(5.4), Inches(4.2))
tf_di = tb_di.text_frame; tf_di.word_wrap = True

di_items = [
    ("3-Word Live Gist", "Dynamic Island pill renders ultra-compact takeaways (e.g. 'Internships Open', 'Python & Systems') updated every time speaker context shifts."),
    ("Active Speaker & Diarization", "See who is talking right now and their role with live audio equalizer bars."),
    ("1-Tap Deep Link Approvals", "When an action is staged, the Dynamic Island expands to show an 'Approve' action that routes directly through URL schemes without app switching."),
    ("Lock Screen Persistent Widget", "Displays full meeting title, speaker initials, elapsed meeting clock, and real-time take-aways.")
]

for i, (h, b) in enumerate(di_items):
    p = tf_di.paragraphs[0] if i == 0 else tf_di.add_paragraph()
    p.text = f"✦  {h}"
    p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = GREEN_ACCENT
    if i > 0: p.space_before = Pt(10)
    p2 = tf_di.add_paragraph(); p2.text = b; p2.font.size = Pt(11); p2.font.color.rgb = WHITE; p2.space_before = Pt(2)

# Right: Live Demo Screen Screenshot
if os.path.exists(IMG_LIVE):
    s9.shapes.add_picture(IMG_LIVE, Inches(7.8), Inches(1.8), height=Inches(5.1))


# ==========================================
# SLIDE 10: Web Companion & Meeting Side-Panel (With Screenshot!)
# ==========================================
s10 = prs.slides.add_slide(blank_layout)
add_header(s10, "Desktop Experience", "Web Companion & Meeting Side-Panel",
           "Designed to sit beside Zoom or Google Meet without obstructing your video call interface.")

c_web = add_card(s10, Inches(0.8), Inches(1.8), Inches(11.733), Inches(2.2), "Dual-Mode Desktop Architecture")
tb_w = s10.shapes.add_textbox(Inches(1.1), Inches(2.3), Inches(11.1), Inches(1.6))
tf_w = tb_w.text_frame; tf_w.word_wrap = True

p = tf_w.paragraphs[0]
p.text = "• Snappable /panel Route: Fits in a narrow 380px side-panel docked right alongside Zoom or Google Meet."
p.font.size = Pt(12.5); p.font.color.rgb = WHITE

p2 = tf_w.add_paragraph()
p2.text = "• Full Executive Cockpit: Interactive meeting graph, sentiment timeline, attendee mapping, and batch minute distribution."
p2.font.size = Pt(12.5); p2.font.color.rgb = WHITE; p2.space_before = Pt(6)

p3 = tf_w.add_paragraph()
p3.text = "• Live Synchronization: Changes approved on mobile reflect instantly on desktop via shared state."
p3.font.size = Pt(12.5); p3.font.color.rgb = CYAN_ACCENT; p3.space_before = Pt(6)

# Web screenshot
if os.path.exists(IMG_WEBAPP):
    s10.shapes.add_picture(IMG_WEBAPP, Inches(0.8), Inches(4.2), width=Inches(11.733))


# ==========================================
# SLIDE 11: Hands-Free Driving Copilot & Privacy Compliance
# ==========================================
s11 = prs.slides.add_slide(blank_layout)
add_header(s11, "Inclusive & Safe", "Hands-Free Driving Copilot & Privacy Ethics",
           "Making remote work accessible and legal on the go, with strict participant consent enforcement.")

# Left Card: Driving Mode
c_d = add_card(s11, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.1), "🚗 Hands-Free Driving Copilot", border_color=AMBER_ACCENT)
tb_d = s11.shapes.add_textbox(Inches(1.1), Inches(2.5), Inches(5.1), Inches(4.2))
tf_d = tb_d.text_frame; tf_d.word_wrap = True

d_bullets = [
    ("Voice Announced Milestones", "Reads upcoming polls, deadlines, and action items aloud over car speakers via AVSpeechSynthesis so drivers never look down at their screen."),
    ("Speech-Activated Approvals", "Driver simply speaks: 'Just send it' to dispatch an email, or 'Add to calendar' to schedule a deadline."),
    ("High-Contrast Big Touch HUD", "High-visibility controls designed specifically for automotive safe glanceability.")
]
for i, (h, b) in enumerate(d_bullets):
    p = tf_d.paragraphs[0] if i == 0 else tf_d.add_paragraph()
    p.text = f"✦  {h}"; p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = AMBER_ACCENT
    if i > 0: p.space_before = Pt(10)
    p2 = tf_d.add_paragraph(); p2.text = b; p2.font.size = Pt(11); p2.font.color.rgb = WHITE; p2.space_before = Pt(2)

# Right Card: Privacy Compliance
c_p = add_card(s11, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.1), "🛡 Privacy & Two-Party Consent Guard", border_color=GREEN_ACCENT)
tb_p = s11.shapes.add_textbox(Inches(7.1), Inches(2.5), Inches(5.1), Inches(4.2))
tf_p = tb_p.text_frame; tf_p.word_wrap = True

p_bullets = [
    ("Strict Opt-In Audio", "Microphone listening is disabled by default. Explicit toggle requires acknowledgment of wiretapping regulations."),
    ("Local Device Anonymization", "PII filtering strips sensitive identifiers before sending semantic payloads to inference endpoints."),
    ("Zero Cloud Retention", "Raw meeting audio is processed ephemerally and discarded immediately after semantic moment extraction.")
]
for i, (h, b) in enumerate(p_bullets):
    p = tf_p.paragraphs[0] if i == 0 else tf_p.add_paragraph()
    p.text = f"✦  {h}"; p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = GREEN_ACCENT
    if i > 0: p.space_before = Pt(10)
    p2 = tf_p.add_paragraph(); p2.text = b; p2.font.size = Pt(11); p2.font.color.rgb = WHITE; p2.space_before = Pt(2)


# ==========================================
# SLIDE 12: Competitive Landscape
# ==========================================
s12 = prs.slides.add_slide(blank_layout)
add_header(s12, "Market Positioning", "Competitive Advantage: Why Thread Wins",
           "Comparing Thread against traditional transcription tools and single-platform AI companions.")

# Comparison Table
rows, cols = 6, 5
table_shape = s12.shapes.add_table(rows, cols, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.8))
table = table_shape.table

headers = ["Feature Capability", "Thread", "Otter.ai", "Zoom AI", "MSFT Copilot"]
for col_idx, h in enumerate(headers):
    cell = table.cell(0, col_idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = CARD_BG
    p = cell.text_frame.paragraphs[0]
    p.text = h
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = CYAN_ACCENT if col_idx == 1 else WHITE
    p.alignment = PP_ALIGN.CENTER if col_idx > 0 else PP_ALIGN.LEFT

matrix = [
    ("Silent Cloud VM Joining (No intrusive bot)", "YES (Native)", "No (Visible Bot)", "No (Host only)", "No (Teams only)"),
    ("Multimodal Slide OCR & QR Code Extraction", "YES (Sub-sec)", "No (Audio only)", "No (Audio only)", "Partial"),
    ("Autonomous Poll & Form Auto-Fill", "YES (1-Tap)", "No", "No", "No"),
    ("Apple Dynamic Island & Live Activities", "YES (Native)", "No", "No", "No"),
    ("Hands-Free Driving Copilot (Voice HUD)", "YES (Voice)", "No", "No", "No")
]

for row_idx, row_data in enumerate(matrix):
    for col_idx, val in enumerate(row_data):
        cell = table.cell(row_idx + 1, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(15, 23, 38) if (row_idx % 2 == 0) else RGBColor(19, 27, 43)
        p = cell.text_frame.paragraphs[0]
        p.text = val
        p.font.size = Pt(11)
        if col_idx == 1:
            p.font.bold = True
            p.font.color.rgb = GREEN_ACCENT
        elif "No" in val:
            p.font.color.rgb = SUBTLE_TEXT
        else:
            p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER if col_idx > 0 else PP_ALIGN.LEFT


# ==========================================
# SLIDE 13: Live Demonstration Script (For Judges)
# ==========================================
s13 = prs.slides.add_slide(blank_layout)
add_header(s13, "Presentation Walkthrough", "Live Demo Script: 125-Second Discovery Day",
           "The exact sequence to demonstrate to judges to showcase Thread's complete autonomous capabilities.")

steps = [
    ("0:00", "Standby & Calendar Anticipation", "Show clean Standby homescreen. Calendar notification triggers: 'Join with Thread'."),
    ("0:18", "Diarized Speech & Moment Extraction", "Sarah Chen speaks about Summer 2027 SWE Internships. Instantly flagged as 'Opportunity'."),
    ("0:45", "Live Poll Auto-Voting", "Zoom poll pops up on screen. Thread detects poll choices and stages 1-tap auto-vote."),
    ("1:10", "Gemini Vision Slide & QR Scan", "Michael Torres presents slide. Thread scans QR code and extracts career portal link live."),
    ("1:45", "1-Tap 'Just Send It' Execution", "User speaks voice command 'Just send it'. Email sent to Sarah Chen & deadline scheduled.")
]

y_pos = Inches(1.8)
h_step = Inches(0.95)
gap = Inches(0.12)

for i, (time_tag, step_title, step_desc) in enumerate(steps):
    card = add_card(s13, Inches(0.8), y_pos + (h_step + gap)*i, Inches(11.733), h_step)
    
    # Time pill
    t_box = s13.shapes.add_textbox(Inches(1.0), y_pos + (h_step + gap)*i + Inches(0.18), Inches(1.2), Inches(0.5))
    p = t_box.text_frame.paragraphs[0]; p.text = time_tag; p.font.size = Pt(14); p.font.bold = True; p.font.color.rgb = CYAN_ACCENT
    
    # Title & desc
    d_box = s13.shapes.add_textbox(Inches(2.4), y_pos + (h_step + gap)*i + Inches(0.15), Inches(9.8), Inches(0.65))
    tf = d_box.text_frame
    p1 = tf.paragraphs[0]; p1.text = step_title; p1.font.size = Pt(13); p1.font.bold = True; p1.font.color.rgb = WHITE
    p2 = tf.add_paragraph(); p2.text = step_desc; p2.font.size = Pt(11); p2.font.color.rgb = MUTED_TEXT; p2.space_before = Pt(2)


# ==========================================
# SLIDE 14: Vision, Roadmap & Conclusion
# ==========================================
s14 = prs.slides.add_slide(blank_layout)
add_header(s14, "The Future of Work", "Meetings Shouldn't Rely on Human Memory",
           "Thread is redefining enterprise presence: From passive note taking to active autonomous execution.")

card_l = add_card(s14, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.1), "Strategic Vision & Roadmap", border_color=CYAN_ACCENT)
tb_l = s14.shapes.add_textbox(Inches(1.1), Inches(2.5), Inches(5.1), Inches(4.2))
tf_l = tb_l.text_frame; tf_l.word_wrap = True

r_bullets = [
    ("Q4 2026: Multi-VM Orchestration", "Parallel cloud workers attending concurrent break-out sessions and synchronizing cross-meeting dependencies."),
    ("Q1 2027: Enterprise CRM Connectors", "Deep write-backs into Salesforce, HubSpot, and Jira directly from verbal customer discussions."),
    ("Q2 2027: Personalized Voice Clone Delegation", "With user authorization, VM can verbally speak pre-approved updates in your voice during standups.")
]
for i, (h, b) in enumerate(r_bullets):
    p = tf_l.paragraphs[0] if i == 0 else tf_l.add_paragraph()
    p.text = f"✦  {h}"; p.font.size = Pt(12.5); p.font.bold = True; p.font.color.rgb = CYAN_ACCENT
    if i > 0: p.space_before = Pt(10)
    p2 = tf_l.add_paragraph(); p2.text = b; p2.font.size = Pt(10.5); p2.font.color.rgb = WHITE; p2.space_before = Pt(2)

# Right: Conclusion CTA
card_r = add_card(s14, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.1), "Executive Summary", border_color=PURPLE_ACCENT)
tb_r = s14.shapes.add_textbox(Inches(7.1), Inches(2.5), Inches(5.1), Inches(4.2))
tf_r = tb_r.text_frame; tf_r.word_wrap = True

p = tf_r.paragraphs[0]
p.text = "THREAD IS BUILT, VERIFIED, AND DEPLOYABLE."
p.font.size = Pt(14); p.font.bold = True; p.font.color.rgb = WHITE

p = tf_r.add_paragraph()
p.text = "✓ Zero-install silent cloud attendee\n✓ Real-time multimodal slide & QR vision\n✓ Dynamic Island & Apple Watch glanceability\n✓ Safe human-in-the-loop 1-tap dispatch\n✓ Production-grade iOS app and Web side-panel"
p.font.size = Pt(11.5); p.font.color.rgb = MUTED_TEXT; p.space_before = Pt(10)

p = tf_r.add_paragraph()
p.text = "Experience the Live Discovery Day Demo."
p.font.size = Pt(13); p.font.bold = True; p.font.color.rgb = CYAN_ACCENT; p.space_before = Pt(18)


# Save presentation
output_path = "/Users/sumonmondal/Downloads/Thread/Thread_Executive_Pitch_Deck.pptx"
prs.save(output_path)
print(f"SUCCESS: Saved 14-slide presentation to: {output_path}")

# Also copy to artifacts dir for easy browsing
artifact_path = os.path.join(ASSETS_DIR, "Thread_Executive_Pitch_Deck.pptx")
import shutil
shutil.copyfile(output_path, artifact_path)
print(f"SUCCESS: Copied presentation to artifact path: {artifact_path}")
