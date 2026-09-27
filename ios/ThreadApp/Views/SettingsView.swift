import SwiftUI
import ActivityKit

public struct SettingsView: View {
    @ObservedObject var manager = ThreadSessionManager.shared
    @State private var showingResetAlert = false
    @State private var showingConsentAlert = false

    public init() {}

    public var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.04, green: 0.06, blue: 0.08)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Header info
                        headerSection

                        // 1. Master Mode Selection (Demo Mode Toggle)
                        demoModeSection

                        // If Demo Mode is enabled, show the Judge Pitch Control Suite
                        if manager.isDemoMode {
                            pitchControlSection
                        }

                        // 2. Real-Life Meeting Connection
                        liveConnectionSection

                        // 3. VM Meeting Control Panel toggle + notification test
                        meetingControlsSection

                        // 4. Hands-Free Driving Copilot (Voice & Big Buttons)
                        drivingModeSection

                        // 4. In-Room Audio & Privacy (Opt-in Consent Toggle)
                        inRoomAudioConsentSection

                        // 5. Connectors & Integrations
                        integrationsNavigationSection

                        // 4. AI & Agent Intelligence
                        aiIntelligenceSection

                        // 4. Dynamic Island & Live Activity
                        dynamicIslandSection

                        // 5. System Reset
                        resetSection
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .padding(.bottom, 60)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Settings")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                }
            }
        }
        .alert(isPresented: $showingResetAlert) {
            Alert(
                title: Text("Reset Session"),
                message: Text("This will clear all staged actions and restore live meeting polling."),
                primaryButton: .destructive(Text("Reset")) {
                    manager.resetDemo()
                    manager.showNotification(text: "Session Reset to Initial State")
                },
                secondaryButton: .cancel()
            )
        }
    }

    // MARK: - Header
    private var headerSection: some View {
        HStack(spacing: 12) {
            ThreadLogoBadge(size: 44)

            VStack(alignment: .leading, spacing: 2) {
                Text("Thread Mobile Assistant")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text("Real-Time Meeting Intelligence · v1.2.0")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(ThreadTheme.surface.opacity(0.75))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(ThreadTheme.cardBorder, lineWidth: 1))
        )
    }

    // MARK: - Demo Mode Section
    private var demoModeSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "sparkles.rectangle.stack.fill")
                    .foregroundColor(.blue)
                Text("OPERATION MODE")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 12) {
                Toggle(isOn: $manager.isDemoMode) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Judge Demo Mode")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                        Text(manager.isDemoMode
                             ? "Active: Simulating Discovery Day pitch scenario for judges."
                             : "Inactive: Listening to real Google Meet & Zoom calls.")
                            .font(.system(size: 11))
                            .foregroundColor(manager.isDemoMode ? .blue : .secondary)
                    }
                }
                .toggleStyle(SwitchToggleStyle(tint: .blue))
                .onChange(of: manager.isDemoMode) { enabled in
                    if enabled {
                        manager.showNotification(text: "🎙 Demo Mode Enabled for Presentation")
                    } else {
                        manager.resetDemo()
                        manager.showNotification(text: "🟢 Real-Life Mode Active")
                    }
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.white.opacity(0.04))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(manager.isDemoMode ? Color.blue.opacity(0.4) : Color.white.opacity(0.08), lineWidth: 1))
            )
        }
    }

    // MARK: - Pitch Controls (Only visible when Demo Mode is ON)
    private var pitchControlSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "play.circle.fill")
                    .foregroundColor(.purple)
                Text("DEMO PITCH CONTROLLER")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 12) {

                // ── Start / End Demo Meeting ──
                if manager.isDemoRunning || manager.isDemoPaused {
                    Button(action: {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                            manager.endDemoMeeting()
                        }
                    }) {
                        HStack(spacing: 10) {
                            Image(systemName: "stop.circle.fill")
                                .font(.system(size: 16, weight: .bold))
                            Text("End Demo Meeting")
                                .font(.system(size: 14, weight: .bold))
                            Spacer()
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .padding(.horizontal, 16)
                        .background(Color.red.opacity(0.85))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                } else {
                    Button(action: {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                            manager.startDemoMeeting()
                        }
                    }) {
                        HStack(spacing: 10) {
                            Image(systemName: "play.circle.fill")
                                .font(.system(size: 16, weight: .bold))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Start Live Demo Meeting")
                                    .font(.system(size: 14, weight: .bold))
                                Text("Activates Dynamic Island & all AI features")
                                    .font(.system(size: 10))
                                    .foregroundColor(.black.opacity(0.6))
                            }
                            Spacer()
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .padding(.horizontal, 16)
                        .background(
                            LinearGradient(colors: [Color.yellow, Color.orange],
                                           startPoint: .leading, endPoint: .trailing)
                        )
                        .foregroundColor(.black)
                        .cornerRadius(12)
                        .shadow(color: Color.yellow.opacity(0.3), radius: 8, y: 3)
                    }
                }

                Divider().background(Color.white.opacity(0.08))

                // Play / Pause + Reset
                HStack(spacing: 8) {
                    Button(action: {
                        manager.toggleDemoPlayback()
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: manager.isDemoRunning ? "pause.fill" : "play.fill")
                            Text(manager.isDemoRunning ? "Pause" : (manager.isDemoPaused ? "Resume" : "Play Demo"))
                        }
                        .font(.system(size: 12, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(manager.isDemoRunning ? Color.amberColor : Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }

                    Button(action: {
                        manager.advanceToNextMilestone()
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: "forward.fill")
                            Text("Next")
                        }
                        .font(.system(size: 12, weight: .semibold))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Color.white.opacity(0.08))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }

                    Button(action: {
                        manager.resetDemo()
                        manager.showNotification(text: "Demo Reset to 0:00")
                    }) {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.system(size: 12, weight: .semibold))
                            .padding(10)
                            .background(Color.white.opacity(0.08))
                            .foregroundColor(.secondary)
                            .cornerRadius(8)
                    }
                }

                // Trigger Recruiter Action Button
                Button(action: {
                    manager.triggerUrgentAction()
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "bolt.fill")
                            .foregroundColor(.amberColor)
                        Text("Trigger Recruiter Action (Lock Screen Alert)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.amberColor.opacity(0.2))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.amberColor.opacity(0.5), lineWidth: 1))
                    )
                }

                // Progress Bar
                VStack(spacing: 4) {
                    HStack {
                        Text("Discovery Day Timeline")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(ThreadSessionManager.clock(manager.elapsed)) / \(ThreadSessionManager.clock(ThreadSessionManager.demoScriptLength))")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundColor(.secondary)
                    }
                    ProgressView(value: min(Double(manager.elapsed) / Double(ThreadSessionManager.demoScriptLength), 1.0))
                        .tint(Color.blue)
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.purple.opacity(0.06))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.purple.opacity(0.25), lineWidth: 1))
            )
        }
    }

    // MARK: - Live Connection Section
    private var liveConnectionSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "network")
                    .foregroundColor(.cyan)
                Text("REAL-LIFE MEETING CONNECTION")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 12) {
                // Server Target
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Sync Server Endpoint")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                        Text(manager.serverUrl == ThreadSessionManager.macServerUrl ? "This Mac (10.11.6.47:8080)" : "Lovable cloud")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(.cyan)
                    }
                    Spacer()
                    Button(action: {
                        if manager.serverUrl == ThreadSessionManager.macServerUrl {
                            manager.serverUrl = ThreadSessionManager.cloudServerUrl
                            manager.showNotification(text: "Server: Lovable cloud")
                        } else {
                            manager.serverUrl = ThreadSessionManager.macServerUrl
                            manager.showNotification(text: "Server: this Mac (port 8080)")
                        }
                    }) {
                        Text("Switch")
                            .font(.system(size: 11, weight: .bold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.white.opacity(0.1))
                            .foregroundColor(.white)
                            .cornerRadius(6)
                    }
                }

                Divider().background(Color.white.opacity(0.08))

                // Chrome Extension & VM Bot
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Chrome Extension Sync")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white)
                        Text("Captures Google Meet / Zoom captions & chat")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Text("ACTIVE")
                        .font(.system(size: 9, weight: .black))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.green.opacity(0.2))
                        .foregroundColor(.green)
                        .cornerRadius(4)
                }

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Cloud VM Bot Worker")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white)
                        Text("Headless meeting joiner & autonomous executor")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Text("READY")
                        .font(.system(size: 9, weight: .black))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.blue.opacity(0.2))
                        .foregroundColor(.blue)
                        .cornerRadius(4)
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.white.opacity(0.04))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.08), lineWidth: 1))
            )
        }
    }

    // MARK: - Screen & Meeting Controls Section
    private var meetingControlsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "rectangle.3.group.fill")
                    .foregroundColor(.cyan)
                Text("SCREEN & MEETING CONTROLS")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 12) {
                // How much the home screen shows
                VStack(alignment: .leading, spacing: 8) {
                    Text("Home screen")
                        .font(.system(size: 13.5, weight: .semibold))
                        .foregroundColor(.white)

                    Picker("Home screen", selection: $manager.homeDensity) {
                        ForEach(ThreadSessionManager.HomeDensity.allCases, id: \.self) { density in
                            Text(density.label).tag(density)
                        }
                    }
                    .pickerStyle(.segmented)

                    Text(manager.isMinimalHome
                         ? "Minimal: only the live session and what needs your decision."
                         : "Standard: adds the connector grid, capability list and privacy detail.")
                        .font(.system(size: 11))
                        .foregroundColor(manager.isMinimalHome ? ThreadTheme.cyan : .secondary)
                }

                Divider().background(Color.white.opacity(0.08))

                Toggle(isOn: $manager.showMeetingControls) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Meeting controls")
                            .font(.system(size: 13.5, weight: .semibold))
                            .foregroundColor(.white)
                        Text(manager.showMeetingControls
                             ? "Tap the live session on home to mute, raise a hand, react, send chat, or leave."
                             : "Off — Thread runs the meeting on its own."  )
                            .font(.system(size: 11))
                            .foregroundColor(manager.showMeetingControls ? ThreadTheme.cyan : .secondary)
                    }
                }
                .toggleStyle(SwitchToggleStyle(tint: ThreadTheme.cyan))

                Divider().background(Color.white.opacity(0.08))

                // Test notification button
                Button(action: {
                    manager.simulateCalendarNotification(
                        title: "Thread Strategy & Architecture Review",
                        platform: "Google Meet",
                        minutesAway: 5
                    )
                    manager.showNotification(text: "📅 Test notification sent — check your lock screen")
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "bell.badge.fill")
                            .foregroundColor(.cyan)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Test Meeting Notification")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white)
                            Text("Fires a real system notification with 'Join with Thread' action")
                                .font(.system(size: 10.5))
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                    .padding(12)
                    .background(Color.white.opacity(0.04))
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.08), lineWidth: 1))
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.white.opacity(0.04))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(manager.showMeetingControls ? ThreadTheme.cyan.opacity(0.4) : Color.white.opacity(0.08), lineWidth: 1))
            )
        }
    }

    // MARK: - Hands-Free Driving Copilot Section
    private var drivingModeSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "car.side.fill")
                    .foregroundColor(.yellow)
                Text("HANDS-FREE DRIVING COPILOT")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 12) {
                Toggle(isOn: $manager.isDrivingMode) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Voice Announcements & Big Buttons")
                            .font(.system(size: 13.5, weight: .semibold))
                            .foregroundColor(.white)
                        Text(manager.isDrivingMode
                             ? "Active: Reads live polls, forms, and deadlines aloud over car speakers."
                             : "Inactive: Standard visual layout.")
                            .font(.system(size: 11))
                            .foregroundColor(manager.isDrivingMode ? .yellow : .secondary)
                    }
                }
                .toggleStyle(SwitchToggleStyle(tint: .yellow))

                if manager.isDrivingMode {
                    HStack(spacing: 8) {
                        Image(systemName: "mic.fill")
                            .foregroundColor(.yellow)
                            .font(.system(size: 12))
                        Text(manager.isAmbientListeningEnabled
                             ? "New moments are read aloud. Say \"just send it\", \"schedule it\", \"summarize\" or \"vote yes\"."
                             : "New moments are read aloud. Voice commands need the in-room mic — turn it on below with attendee consent.")
                            .font(.system(size: 10.5))
                            .foregroundColor(.white.opacity(0.85))
                    }
                    .padding(8)
                    .background(Color.yellow.opacity(0.1))
                    .cornerRadius(6)
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.white.opacity(0.04))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(manager.isDrivingMode ? Color.yellow.opacity(0.4) : Color.white.opacity(0.08), lineWidth: 1))
            )
        }
    }

    // MARK: - In-Room Audio & Compliance Section
    private var inRoomAudioConsentSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "hand.raised.shield.fill")
                    .foregroundColor(manager.isAmbientListeningEnabled ? ThreadTheme.cyan : .secondary)
                Text("IN-ROOM AUDIO & PRIVACY")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 12) {
                // Ethical & Legal Compliance Warning Box
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.amberColor)
                        .font(.system(size: 14))
                        .padding(.top, 2)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Participant Consent Requirement")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                        Text("Recording or transcribing conversations without the explicit knowledge and consent of all participants is unethical and may violate two-party consent wiretapping laws. Always inform all attendees prior to enabling microphone transcription.")
                            .font(.system(size: 10.5))
                            .foregroundColor(.white.opacity(0.75))
                            .lineSpacing(2)
                    }
                }
                .padding(10)
                .background(Color.amberColor.opacity(0.12))
                .cornerRadius(8)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.amberColor.opacity(0.3), lineWidth: 1))

                // The Opt-In Toggle with explicit consent validation
                Toggle(isOn: Binding(
                    get: { manager.isAmbientListeningEnabled },
                    set: { newValue in
                        if newValue {
                            // Require user confirmation of participant consent before activating
                            showingConsentAlert = true
                        } else {
                            manager.isAmbientListeningEnabled = false
                            manager.showNotification(text: "🔒 In-Room Audio Disabled")
                        }
                    }
                )) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("In-Room Microphone Transcription")
                            .font(.system(size: 13.5, weight: .semibold))
                            .foregroundColor(.white)
                        Text(manager.isAmbientListeningEnabled
                             ? "Active: Transcribing room audio with confirmed consent."
                             : "Disabled: Audio is strictly private and never recorded.")
                            .font(.system(size: 11))
                            .foregroundColor(manager.isAmbientListeningEnabled ? ThreadTheme.cyan : .secondary)
                    }
                }
                .toggleStyle(SwitchToggleStyle(tint: ThreadTheme.cyan))
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.white.opacity(0.04))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(manager.isAmbientListeningEnabled ? ThreadTheme.cyan.opacity(0.4) : Color.white.opacity(0.08), lineWidth: 1)
                    )
            )
            .alert(isPresented: $showingConsentAlert) {
                Alert(
                    title: Text("All-Parties Consent Confirmation"),
                    message: Text("Have all individuals in the room or on this audio feed been notified and given explicit consent to AI recording and transcription?"),
                    primaryButton: .default(Text("Yes, All Consented")) {
                        manager.isAmbientListeningEnabled = true
                        manager.showNotification(text: "🎙 In-Room Microphone Enabled (Consent Confirmed)")
                        let generator = UINotificationFeedbackGenerator()
                        generator.notificationOccurred(.success)
                    },
                    secondaryButton: .cancel(Text("Cancel")) {
                        manager.isAmbientListeningEnabled = false
                    }
                )
            }
        }
    }

    // MARK: - Connectors & Integrations Navigation Section
    private var integrationsNavigationSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "link.badge.plus")
                    .foregroundColor(ThreadTheme.cyan)
                Text("CONNECTORS & INTEGRATIONS")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }

            NavigationLink(destination: IntegrationsView()) {
                HStack(spacing: 12) {
                    Circle()
                        .fill(ThreadTheme.cyan.opacity(0.18))
                        .frame(width: 40, height: 40)
                        .overlay(
                            Image(systemName: "network.badge.shield.half.filled")
                                .font(.system(size: 18))
                                .foregroundColor(ThreadTheme.cyan)
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text("Manage App Connectors")
                                .font(.system(size: 13.5, weight: .bold))
                                .foregroundColor(.white)
                            Text("7 ACTIVE")
                                .font(.system(size: 8.5, weight: .bold))
                                .foregroundColor(.green)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(Color.green.opacity(0.15))
                                .cornerRadius(4)
                        }
                        Text("Notion, Google Calendar, Gmail, Outlook, Zoom, Teams & VM Bot")
                            .font(.system(size: 10.5))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.secondary)
                }
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(ThreadTheme.surface.opacity(0.85))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(ThreadTheme.cardBorder, lineWidth: 1))
                )
            }
        }
    }

    // MARK: - AI & Agent Intelligence
    private var aiIntelligenceSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "cpu")
                    .foregroundColor(.teal)
                Text("AI ENGINE & AGENT")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 10) {
                HStack {
                    Text("LLM Model")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white)
                    Spacer()
                    Text("OpenAI gpt-4o-mini")
                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                        .foregroundColor(.teal)
                }

                HStack {
                    Text("Fallback Engine")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white)
                    Spacer()
                    Text("Deterministic Agent")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.secondary)
                }

                HStack {
                    Text("Action Execution")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white)
                    Spacer()
                    Text("In-Meeting Chat · Email · Calendar")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.white.opacity(0.04))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.08), lineWidth: 1))
            )
        }
    }

    // MARK: - Dynamic Island & Live Activity
    private var dynamicIslandSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "capsule.portrait.fill")
                    .foregroundColor(.indigo)
                Text("DYNAMIC ISLAND & LIVE ACTIVITY")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Live Activity Status")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                        Text("Streaming live timeline & 1-tap approvals")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Button(action: {
                        manager.startLiveActivity()
                        manager.showNotification(text: "Live Activity Restarted on Dynamic Island")
                        let generator = UINotificationFeedbackGenerator()
                        generator.notificationOccurred(.success)
                    }) {
                        Text("Restart")
                            .font(.system(size: 11, weight: .bold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.blue.opacity(0.2))
                            .foregroundColor(.blue)
                            .cornerRadius(6)
                    }
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.white.opacity(0.04))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.08), lineWidth: 1))
            )
        }
    }

    // MARK: - Reset Section
    private var resetSection: some View {
        Button(action: {
            showingResetAlert = true
        }) {
            HStack {
                Image(systemName: "arrow.counterclockwise.circle")
                Text("Reset All Meeting State & Cache")
            }
            .font(.system(size: 12, weight: .semibold))
            .foregroundColor(.red.opacity(0.85))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.red.opacity(0.08))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.red.opacity(0.2), lineWidth: 1))
            )
        }
    }
}

private extension Color {
    static let amberColor = Color(red: 0.95, green: 0.65, blue: 0.15)
}
