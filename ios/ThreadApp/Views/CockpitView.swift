import SwiftUI

public struct CockpitView: View {
    @ObservedObject var manager = ThreadSessionManager.shared
    @ObservedObject var speechManager = SpeechRecognizerManager.shared

    @State private var selectedFilter: String = "ALL"
    @State private var expandedMomentId: String? = nil
    @State private var showingIslandAlert = false
    @State private var showingSettingsSheet = false
    @State private var selectedMomentForAgent: DemoMoment? = nil
    @State private var showingMeetingControlsSheet = false
    @State private var showingVmScreenSheet = false
    @State private var selectedFormIndex: Int = 0

    public init() {}

    private let filterOptions = [
        ("ALL", "All"),
        ("OPPORTUNITY", "Opportunities"),
        ("RESOURCE", "Resources"),
        ("DEADLINE", "Deadlines"),
        ("REQUIREMENT", "Requirements"),
        ("EVENT", "Events")
    ]

    public var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.06, blue: 0.08)
                .ignoresSafeArea()

            RadialGradient(
                colors: [Color.blue.opacity(0.12), Color.purple.opacity(0.06), Color.clear],
                center: .topLeading,
                startRadius: 40,
                endRadius: 500
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                headerBar

                demoModeIndicatorBanner
                drivingModeBanner

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        drivingModeActionDeck

                        // The live session stays one row on home; the full VM surface lives in the sheet.
                        if manager.isVmBotRunning || manager.isMeetingActive {
                            LiveSessionRow(
                                onOpen: { showingMeetingControlsSheet = true },
                                onOpenVmScreen: { showingVmScreenSheet = true }
                            )
                        } else {
                            vmStandbyRow
                        }

                        meetingPollCard
                        formAutoFillCard

                        if manager.isMeetingActive {
                            activeMeetingCockpitContent
                        } else if manager.isDemoMode && manager.isDemoEnded {
                            endedMeetingContent
                        } else {
                            standbyExecutiveDashboard
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .padding(.bottom, 90)
                }
                // Floats over the content so toasts never push the page down.
                .overlay(alignment: .top) {
                    if let bannerText = manager.notificationBannerText {
                        notificationToast(text: bannerText)
                            .allowsHitTesting(false)
                    }
                }
            }
        }
        .onAppear {
            if manager.isMeetingActive {
                manager.startLiveActivity()
            } else {
                manager.endLiveActivity()
            }
        }
        // Meeting room join sheet — triggered by notification tap or agent command
        .sheet(item: $manager.pendingMeetingToJoin) { event in
            MeetingRoomView(event: event) {
                manager.pendingMeetingToJoin = nil
            }
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
        .alert(isPresented: $showingIslandAlert) {
            Alert(
                title: Text("Dynamic Island & Live Activity"),
                message: Text("Thread is streaming 3-word live summaries, urgent milestones, and 1-tap action buttons directly to your Dynamic Island and Lock Screen."),
                dismissButton: .default(Text("Got It"))
            )
        }
        .sheet(isPresented: $showingSettingsSheet) {
            SettingsView()
        }
        .sheet(isPresented: $showingMeetingControlsSheet) {
            MeetingControlsSheet()
        }
        .sheet(isPresented: $showingVmScreenSheet) {
            VirtualMachineScreenSheet()
        }
        .sheet(item: $selectedMomentForAgent) { moment in
            AgentMomentInspectorSheet(moment: moment)
        }
        .onAppear {
            if ProcessInfo.processInfo.arguments.contains("-Thread_openVmScreen") {
                showingVmScreenSheet = true
            }
        }
    }

    // MARK: - Header Bar

    private var headerBar: some View {
        HStack(alignment: .center, spacing: 0) {
            // Leading: App Logo & Brand Title
            HStack(spacing: 9) {
                ThreadLogoBadge(size: 32)

                VStack(alignment: .leading, spacing: 1) {
                    Text(manager.isMinimalHome ? "Thread" : "THREAD")
                        .font(.system(size: manager.isMinimalHome ? 15 : 13.5, weight: manager.isMinimalHome ? .semibold : .black, design: .rounded))
                        .foregroundColor(.white)
                        .tracking(manager.isMinimalHome ? 0 : 0.5)
                    if !manager.isMinimalHome {
                        Text("Executive Assistant")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(ThreadTheme.cyan)
                    }
                }
            }

            Spacer()

            HStack(spacing: 6) {
                // Compact status dot + label
                HStack(spacing: 4) {
                    Circle()
                        .fill(manager.isMeetingActive ? Color.green : (speechManager.isRecording ? Color.red : Color.cyan))
                        .frame(width: 5, height: 5)
                    Text(manager.isMeetingActive ? (manager.isDemoMode ? "DEMO" : "LIVE") : (manager.isDemoTimelineShown ? "ENDED" : "STANDBY"))
                        .font(.system(size: 9, weight: .heavy, design: .rounded))
                        .foregroundColor(manager.isMeetingActive ? .green : .cyan)
                }
                .padding(.horizontal, 7)
                .padding(.vertical, 4)
                .background((manager.isMeetingActive ? Color.green : Color.cyan).opacity(0.10))
                .cornerRadius(6)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke((manager.isMeetingActive ? Color.green : Color.cyan).opacity(0.22), lineWidth: 1))

                // Driving Mode — on minimal home this lives in Settings only, unless already on
                if !manager.isMinimalHome || manager.isDrivingMode {
                    Button(action: {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            manager.isDrivingMode.toggle()
                        }
                    }) {
                        Image(systemName: manager.isDrivingMode ? "car.fill" : "car")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(manager.isDrivingMode ? .yellow : .white.opacity(0.4))
                            .frame(width: 30, height: 30)
                            .background((manager.isDrivingMode ? Color.yellow : Color.white).opacity(0.08))
                            .clipShape(Circle())
                    }
                }

                // Settings
                Button(action: { showingSettingsSheet = true }) {
                    Image(systemName: "gearshape.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.white.opacity(0.4))
                        .frame(width: 30, height: 30)
                        .background(Color.white.opacity(0.06))
                        .clipShape(Circle())
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            Color.black.opacity(0.55)
                .background(.ultraThinMaterial)
        )
        .overlay(
            Rectangle()
                .fill(Color.white.opacity(0.06))
                .frame(height: 1),
            alignment: .bottom
        )
    }

    // MARK: - Notification Toast
    private func notificationToast(text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "bell.badge.fill")
                .foregroundColor(.cyan)
                .font(.system(size: 12))
            Text(text)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.white)
            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color(red: 0.08, green: 0.12, blue: 0.18))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.cyan.opacity(0.4), lineWidth: 1))
        )
        .padding(.horizontal, 16)
        .padding(.top, 4)
        .transition(.move(edge: .top).combined(with: .opacity))
    }

    // MARK: - Demo Presenter Strip
    /// One line of presenter controls: clock and headline, then Pause/Resume, Next and End (or Replay/Exit once ended).
    private var demoModeIndicatorBanner: some View {
        Group {
            if manager.isDemoTimelineShown {
                HStack(spacing: 8) {
                    Circle()
                        .fill(manager.isDemoEnded ? ThreadTheme.textMuted : (manager.isDemoPaused ? ThreadTheme.warning : ThreadTheme.success))
                        .frame(width: 6, height: 6)

                    Text(demoClockLabel)
                        .font(.system(size: 12, weight: .semibold, design: .monospaced))
                        .foregroundColor(ThreadTheme.textPrimary)
                        .lineLimit(1)
                        .fixedSize()

                    Text(manager.isDemoEnded ? endedSummary : manager.shortHeadline)
                        .font(.system(size: 12))
                        .foregroundColor(ThreadTheme.textMuted)
                        .lineLimit(1)
                        .truncationMode(.tail)

                    Spacer(minLength: 4)

                    if manager.isDemoEnded {
                        demoTextButton("Replay") { manager.startDemoMeeting() }
                        demoTextButton("Exit", tint: ThreadTheme.textMuted) {
                            withAnimation { manager.stopDemoMeeting() }
                        }
                    } else {
                        demoIconButton(manager.isDemoPaused ? "play.fill" : "pause.fill",
                                       label: manager.isDemoPaused ? "Resume" : "Pause") {
                            manager.toggleDemoPlayback()
                        }
                        demoIconButton("forward.fill", label: "Next") {
                            manager.advanceToNextMilestone()
                        }
                        demoTextButton("End", tint: ThreadTheme.liveRecording) {
                            withAnimation { manager.endDemoMeeting() }
                        }
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.white.opacity(0.04))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(ThreadTheme.cardBorder, lineWidth: 1))
                )
                .padding(.horizontal, 16)
                .padding(.top, 6)
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }

    private var demoClockLabel: String {
        if manager.isDemoEnded { return "Ended" }
        let clock = ThreadSessionManager.clock(manager.elapsed)
        return manager.isDemoPaused ? "Paused \(clock)" : clock
    }

    private var endedSummary: String {
        let awaiting = manager.visibleActions.filter { $0.status == "staged" }.count
        return awaiting == 0 ? "All actions done" : "\(awaiting) awaiting approval"
    }

    private func demoIconButton(_ systemImage: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(ThreadTheme.textSecondary)
                .frame(width: 30, height: 28)
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .accessibilityLabel(label)
    }

    private func demoTextButton(_ title: String, tint: Color = ThreadTheme.cyan, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(tint)
                .padding(.horizontal, 10)
                .frame(height: 28)
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }

    // MARK: - Driving Mode Banner
    private var drivingModeBanner: some View {
        Group {
            if manager.isDrivingMode {
                HStack(spacing: 8) {
                    Image(systemName: "car.side.fill")
                        .foregroundColor(.yellow)
                        .font(.system(size: 13, weight: .bold))
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Driving mode")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                        Text(manager.isAmbientListeningEnabled ? "New moments are read aloud · tap or say \"just send it\"" : "New moments are read aloud · tap to respond")
                            .font(.system(size: 9.5))
                            .foregroundColor(.yellow.opacity(0.9))
                    }
                    Spacer()
                    Button(action: {
                        manager.isDrivingMode = false
                    }) {
                        Text("Exit ✕")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white.opacity(0.8))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 3)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(4)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 7)
                .background(Color.yellow.opacity(0.12))
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }

    // MARK: - Driving Mode Large Action Deck
    private var drivingModeActionDeck: some View {
        Group {
            if manager.isDrivingMode {
                VStack(alignment: .leading, spacing: 10) {
                    Text("HANDS-FREE")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.yellow)

                    HStack(spacing: 10) {
                        // 1-Tap Read Meeting Summary Aloud
                        Button(action: {
                            let summary = manager.latestMoment?.takeaway ?? "The meeting discussion is currently active."
                            manager.speakAloud("Latest meeting update: \(summary)")
                            manager.showNotification(text: "🔊 \(summary)")
                        }) {
                            VStack(spacing: 6) {
                                Image(systemName: "speaker.wave.3.fill")
                                    .font(.system(size: 20))
                                Text("Speak Summary")
                                    .font(.system(size: 12, weight: .bold))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.yellow.opacity(0.18))
                            .foregroundColor(.yellow)
                            .cornerRadius(10)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.yellow.opacity(0.4), lineWidth: 1))
                        }

                        // 1-Tap Quick Approve Next Staged Action
                        Button(action: {
                            if let first = manager.visibleActions.first(where: { $0.status == "staged" }) {
                                manager.approveAction(id: first.id)
                            } else {
                                manager.speakAloud("No pending actions right now.")
                                manager.showNotification(text: "No pending actions")
                            }
                        }) {
                            VStack(spacing: 6) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 20))
                                Text("Execute Next")
                                    .font(.system(size: 12, weight: .bold))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.green.opacity(0.18))
                            .foregroundColor(.green)
                            .cornerRadius(10)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.green.opacity(0.4), lineWidth: 1))
                        }
                    }
                }
            }
        }
    }

    // MARK: - Live Meeting Poll Card (Zoom / Meet Polls)
    private var meetingPollCard: some View {
        Group {
            if let poll = manager.activePoll {
                GlassCard {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            HStack(spacing: 6) {
                                Image(systemName: "chart.bar.xaxis")
                                    .foregroundColor(.orange)
                                Text("LIVE MEETING POLL · ZOOM / MEET")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.orange)
                            }
                            Spacer()
                            if poll.isAnswered {
                                Text("VOTED ✓")
                                    .font(.system(size: 9, weight: .black))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.green.opacity(0.2))
                                    .foregroundColor(.green)
                                    .cornerRadius(4)
                            } else {
                                Text("VOTE NOW")
                                    .font(.system(size: 9, weight: .black))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.orange.opacity(0.2))
                                    .foregroundColor(.orange)
                                    .cornerRadius(4)
                            }
                        }

                        Text(poll.question)
                            .font(.system(size: 13.5, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(2)

                        // 1-Tap Option Buttons
                        VStack(spacing: 8) {
                            ForEach(poll.options, id: \.self) { opt in
                                Button(action: {
                                    manager.voteOnPoll(option: opt)
                                }) {
                                    HStack {
                                        Text(opt)
                                            .font(.system(size: 12.5, weight: .bold))
                                        Spacer()
                                        if poll.selectedOption == opt {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(.green)
                                        } else {
                                            Image(systemName: "arrow.right.circle")
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 10)
                                    .background(
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(poll.selectedOption == opt ? Color.green.opacity(0.18) : Color.white.opacity(0.06))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 8)
                                                    .stroke(poll.selectedOption == opt ? Color.green.opacity(0.5) : Color.white.opacity(0.1), lineWidth: 1)
                                            )
                                    )
                                    .foregroundColor(.white)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Live Application Form Auto-Fill Card
    private var stagedFormActions: [DemoAction] {
        manager.visibleActions.filter {
            $0.status == "staged" && (
                $0.label.contains("Auto-fill") ||
                $0.label.contains("Application") ||
                $0.label.contains("RSVP") ||
                $0.label.contains("Proposal") ||
                $0.id.hasPrefix("form-") ||
                $0.id.contains("link-")
            )
        }
    }

    private func shortFormTitle(_ action: DemoAction) -> String {
        if action.id.contains("swe") { return "SWE 2027" }
        if action.id.contains("qna") { return "Q&A RSVP" }
        if action.id.contains("sustainability") { return "Sustainability" }
        return action.label.replacingOccurrences(of: "Auto-fill ", with: "")
    }

    private var formAutoFillCard: some View {
        Group {
            let forms = stagedFormActions
            if !forms.isEmpty {
                let activeIdx = min(max(0, selectedFormIndex), forms.count - 1)
                let formAction = forms[activeIdx]

                GlassCard {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            HStack(spacing: 6) {
                                Image(systemName: "doc.badge.arrow.up.fill")
                                    .foregroundColor(ThreadTheme.cyan)
                                Text("LIVE FORMS DETECTED (\(forms.count))")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(ThreadTheme.cyan)
                            }
                            Spacer()
                            Text("READY TO SIGN")
                                .font(.system(size: 9, weight: .bold))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.green.opacity(0.2))
                                .foregroundColor(.green)
                                .cornerRadius(4)
                        }

                        // Form Tab Pills if multiple forms detected
                        if forms.count > 1 {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(Array(forms.enumerated()), id: \.element.id) { idx, item in
                                        Button(action: {
                                            withAnimation(.easeInOut(duration: 0.18)) {
                                                selectedFormIndex = idx
                                            }
                                        }) {
                                            HStack(spacing: 5) {
                                                Circle()
                                                    .fill(activeIdx == idx ? ThreadTheme.cyan : Color.white.opacity(0.4))
                                                    .frame(width: 5, height: 5)
                                                Text(shortFormTitle(item))
                                                    .font(.system(size: 11, weight: activeIdx == idx ? .bold : .medium))
                                            }
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 5)
                                            .background(activeIdx == idx ? ThreadTheme.cyan.opacity(0.2) : Color.white.opacity(0.06))
                                            .foregroundColor(activeIdx == idx ? ThreadTheme.cyan : .white.opacity(0.75))
                                            .cornerRadius(12)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 12)
                                                    .stroke(activeIdx == idx ? ThreadTheme.cyan.opacity(0.5) : Color.clear, lineWidth: 1)
                                            )
                                        }
                                    }
                                }
                                .padding(.vertical, 2)
                            }
                        }

                        Text(formAction.label)
                            .font(.system(size: 13.5, weight: .bold))
                            .foregroundColor(.white)

                        if let detail = formAction.detail {
                            Text(detail)
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }

                        // Candidate profile prefill details
                        HStack(spacing: 12) {
                            if formAction.id.contains("swe") {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Applicant")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("Shumon Mondal")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                Divider().frame(height: 24).background(Color.white.opacity(0.1))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Role / GPA")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("SWE Intern (3.9)")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                Divider().frame(height: 24).background(Color.white.opacity(0.1))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Resume")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("Matched (8 fields)")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.green)
                                }
                            } else if formAction.id.contains("qna") {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Attendee")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("Shumon Mondal")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                Divider().frame(height: 24).background(Color.white.opacity(0.1))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Schedule")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("Thu 4:00 PM")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                Divider().frame(height: 24).background(Color.white.opacity(0.1))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Topic")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("AI / Systems")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.cyan)
                                }
                            } else if formAction.id.contains("sustainability") {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Project Lead")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("Shumon Mondal")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                Divider().frame(height: 24).background(Color.white.opacity(0.1))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Grant Request")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("$1,500 Funding")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                Divider().frame(height: 24).background(Color.white.opacity(0.1))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Scope")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("IoT Sensors")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.green)
                                }
                            } else {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Applicant")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("Shumon Mondal")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                Divider().frame(height: 24).background(Color.white.opacity(0.1))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Profile")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("Northeastern CS")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.white)
                                }
                                Divider().frame(height: 24).background(Color.white.opacity(0.1))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Fields")
                                        .font(.system(size: 9.5))
                                        .foregroundColor(.secondary)
                                    Text("Pre-Filled")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.green)
                                }
                            }
                        }
                        .padding(8)
                        .background(Color.white.opacity(0.04))
                        .cornerRadius(6)

                        // 1-Tap Auto-fill & Submit button
                        Button(action: {
                            Task {
                                _ = await manager.submitActiveForm(id: formAction.id)
                            }
                        }) {
                            HStack {
                                Image(systemName: "paperplane.fill")
                                Text("Auto-fill & Submit \(shortFormTitle(formAction))")
                            }
                            .font(.system(size: 12.5, weight: .bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(ThreadTheme.cyan)
                            .foregroundColor(.black)
                            .cornerRadius(8)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Upcoming Meeting Anticipation Card
    private func upcomingMeetingAnticipationCard(upcoming: UpcomingMeetingEvent) -> some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.orange)
                            .frame(width: 8, height: 8)
                        Text("UPCOMING MEETING · STARTS IN ~\(upcoming.minutesUntilStart) MIN")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .foregroundColor(.orange)
                    }
                    Spacer()
                    Text(upcoming.platform)
                        .font(.system(size: 9.5, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.orange.opacity(0.18))
                        .foregroundColor(.orange)
                        .cornerRadius(4)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(upcoming.title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)

                    HStack(spacing: 12) {
                        Label("Starts \(upcoming.start)", systemImage: "clock.fill")
                        Label("Host: sumonmondal@gmail.com", systemImage: "person.crop.circle.badge.checkmark")
                    }
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                }

                Text("Detected on your synchronized Google Calendar & Cloud Virtual Machine. Would you like Thread to autonomously join on your behalf, extract live notes, and fulfill action items?")
                    .font(.system(size: 11.5))
                    .lineSpacing(2)
                    .foregroundColor(.white.opacity(0.85))

                HStack(spacing: 10) {
                    Button(action: {
                        manager.joinMeetingOnBehalfOfUser(meetingUrl: upcoming.joinUrl, title: upcoming.title)
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: "bolt.fill")
                            Text("Yes, Join on My Behalf")
                        }
                        .font(.system(size: 12.5, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            LinearGradient(
                                colors: [Color.cyan, Color.blue],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.black)
                        .cornerRadius(8)
                    }

                    Button(action: {
                        if let idx = manager.upcomingMeeting {
                            var mut = idx
                            mut.isDismissed = true
                            manager.upcomingMeeting = mut
                        }
                    }) {
                        Text("Dismiss")
                            .font(.system(size: 12, weight: .semibold))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Color.white.opacity(0.08))
                            .foregroundColor(.white.opacity(0.8))
                            .cornerRadius(8)
                    }
                }
            }
        }
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.orange.opacity(0.4), lineWidth: 1)
        )
    }

    // MARK: - Waiting For Meeting Standby Card
    private var waitingForMeetingCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "network.badge.shield.half.filled")
                    .font(.system(size: 20))
                    .foregroundColor(ThreadTheme.cyan)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Connected Meeting Standby")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                    Text("Synced with Google Meet, Zoom, Teams & Calendar")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
                Spacer()
            }

            Text("Thread acts as your autonomous meeting copilot. Connect a live call via the Chrome Extension or Cloud VM Bot to capture transcripts, track action items, and execute follow-ups.")
                .font(.system(size: 11))
                .lineSpacing(3)
                .foregroundColor(.white.opacity(0.75))
                .frame(maxWidth: .infinity, alignment: .leading)

            // Connectors status row
            HStack(spacing: 8) {
                Label("Meet & Zoom", systemImage: "video.fill")
                Spacer()
                Label("Calendar", systemImage: "calendar")
                Spacer()
                Label("Notion", systemImage: "doc.text.fill")
            }
            .font(.system(size: 10, weight: .semibold))
            .foregroundColor(.secondary)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.white.opacity(0.04))
            .cornerRadius(6)

            // Presentation Demonstration Card
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "sparkles")
                        .foregroundColor(.yellow)
                        .font(.system(size: 13, weight: .bold))
                    Text("LIVE CALL DEMONSTRATION")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundColor(.yellow)
                    Spacer()
                    Text("Judge Demo")
                        .font(.system(size: 9.5, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.yellow.opacity(0.18))
                        .foregroundColor(.yellow)
                        .cornerRadius(4)
                }

                Text("Simulate an active Google Meet / Zoom meeting to demonstrate Thread's real-time capabilities: Dynamic Island live gist, slide QR decoding, minute-by-minute notes, and action fulfillment.")
                    .font(.system(size: 11))
                    .lineSpacing(2)
                    .foregroundColor(.white.opacity(0.85))

                Button(action: {
                    withAnimation(.spring()) {
                        manager.startDemoMeeting()
                    }
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "play.circle.fill")
                            .font(.system(size: 15, weight: .bold))
                        Text("Start Live Demo Meeting")
                            .font(.system(size: 13, weight: .bold))
                        Spacer()
                        Text("Activates Dynamic Island ✦")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.black.opacity(0.75))
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(
                            colors: [Color.yellow, Color.orange],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .foregroundColor(.black)
                    .cornerRadius(10)
                    .shadow(color: Color.yellow.opacity(0.25), radius: 6, y: 2)
                }
            }
            .padding(12)
            .background(Color.yellow.opacity(0.06))
            .cornerRadius(10)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.yellow.opacity(0.25), lineWidth: 1))

            // In-Room Microphone section: Only show if explicitly enabled with consent in Settings
            if manager.isAmbientListeningEnabled {
                Button(action: {
                    speechManager.toggleRecording()
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: speechManager.isRecording ? "stop.fill" : "mic.fill")
                        Text(speechManager.isRecording ? "Stop In-Room Mic" : "Start In-Room Mic (Consent Confirmed)")
                    }
                    .font(.system(size: 12, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 9)
                    .background(speechManager.isRecording ? Color.red : ThreadTheme.cyan)
                    .foregroundColor(speechManager.isRecording ? .white : .black)
                    .cornerRadius(8)
                }
            } else {
                HStack(spacing: 8) {
                    Image(systemName: "hand.raised.shield.fill")
                        .foregroundColor(ThreadTheme.cyan)
                        .font(.system(size: 14))
                    VStack(alignment: .leading, spacing: 1) {
                        Text("In-Room Audio Privacy Protected")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                        Text("Microphone transcription requires attendee consent. Opt in via Settings.")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Button(action: { showingSettingsSheet = true }) {
                        Text("Settings")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(ThreadTheme.cyan)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(ThreadTheme.cyan.opacity(0.12))
                            .cornerRadius(5)
                    }
                }
                .padding(8)
                .background(Color.white.opacity(0.03))
                .cornerRadius(8)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(ThreadTheme.surface.opacity(0.85))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(ThreadTheme.cardBorder, lineWidth: 1))
        )
    }

    // MARK: - Active Speaker Stage
    private var activeSpeakerStage: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 12) {
                    Circle()
                        .fill((speechManager.isRecording ? Color.red : manager.currentSpeaker.color).opacity(0.25))
                        .frame(width: 44, height: 44)
                        .overlay(
                            Image(systemName: speechManager.isRecording ? "mic.fill" : (manager.isConnectedToMeeting ? "waveform" : "person.crop.circle.fill"))
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(speechManager.isRecording ? .red : manager.currentSpeaker.color)
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        Text(speechManager.isRecording ? "In-Room Microphone" : manager.currentSpeaker.name)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                        Text(speechManager.isRecording ? "Live Audio Capture" : manager.currentSpeaker.role)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    if manager.isAmbientListeningEnabled {
                        // Mic Toggle Button (Only when enabled in settings)
                        Button(action: {
                            speechManager.toggleRecording()
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: speechManager.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                                Text(speechManager.isRecording ? "Stop" : "Mic")
                                    .font(.system(size: 11, weight: .bold))
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(speechManager.isRecording ? Color.red.opacity(0.2) : Color.white.opacity(0.08))
                            .foregroundColor(speechManager.isRecording ? .red : .white)
                            .cornerRadius(6)
                        }
                    } else {
                        // Consent Enforced Shield
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark.shield.fill")
                                .font(.system(size: 10))
                                .foregroundColor(ThreadTheme.cyan)
                            Text("Consent Enforced")
                                .font(.system(size: 9.5, weight: .semibold))
                                .foregroundColor(ThreadTheme.cyan.opacity(0.9))
                        }
                        .padding(.horizontal, 6)
                        .padding(.vertical, 4)
                        .background(ThreadTheme.cyan.opacity(0.1))
                        .cornerRadius(6)
                    }

                    // Animated Equalizer Waveform
                    HStack(spacing: 3) {
                        ForEach(0..<5) { i in
                            RoundedRectangle(cornerRadius: 1.5)
                                .fill(speechManager.isRecording ? Color.red : (manager.isConnectedToMeeting ? manager.currentSpeaker.color : Color.secondary.opacity(0.4)))
                                .frame(width: 3, height: CGFloat(8 + (i * 4) % 18))
                        }
                    }
                }

                // Live Streaming Audio Speech Bubble (if Mic is recording)
                if speechManager.isRecording && !speechManager.liveTranscript.isEmpty {
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "quote.opening")
                            .font(.system(size: 9))
                            .foregroundColor(.cyan)
                        Text(speechManager.liveTranscript)
                            .font(.system(size: 12))
                            .foregroundColor(.cyan)
                            .lineLimit(2)
                    }
                    .padding(8)
                    .background(Color.cyan.opacity(0.08))
                    .cornerRadius(6)
                }

                // Latest Key Takeaway Callout
                if let moment = manager.latestMoment {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            MomentTag(moment.type)
                            Spacer()
                            Text(formatClock(moment.timeSec))
                                .font(.system(size: 10, design: .monospaced))
                                .foregroundColor(.secondary)
                        }
                        Text(moment.takeaway)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white.opacity(0.95))
                    }
                    .padding(10)
                    .background(Color.white.opacity(0.04))
                    .cornerRadius(8)
                }
            }
        }
    }

    // MARK: - Gemini Vision Slide & QR Card
    private var geminiVisionSlideCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 11))
                        Text("Gemini Vision · Screen Share")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundColor(.teal)

                    Spacer()

                    Text("QR DETECTED")
                        .font(.system(size: 9, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.teal.opacity(0.2))
                        .foregroundColor(.teal)
                        .cornerRadius(4)
                }

                HStack(alignment: .top, spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.white.opacity(0.08))
                            .frame(width: 68, height: 68)

                        Image(systemName: "qrcode")
                            .font(.system(size: 40))
                            .foregroundColor(.teal.opacity(0.9))

                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.teal.opacity(0.4), lineWidth: 1)
                            .frame(width: 68, height: 68)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(manager.visionSlide.title)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                        Text(manager.visionSlide.subtitle)
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)

                        ForEach(manager.visionSlide.bullets, id: \.self) { bullet in
                            HStack(alignment: .top, spacing: 4) {
                                Text("•").foregroundColor(.teal)
                                Text(bullet)
                                    .font(.system(size: 10))
                                    .foregroundColor(.white.opacity(0.8))
                            }
                        }
                    }
                }

                HStack {
                    Image(systemName: "link")
                        .font(.system(size: 10))
                        .foregroundColor(.teal)
                    Text(manager.visionSlide.qrUrl)
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(.teal)
                        .lineLimit(1)
                    Spacer()
                }
                .padding(6)
                .background(Color.teal.opacity(0.1))
                .cornerRadius(6)
            }
        }
    }

    // MARK: - Action Queue Section
    private var actionQueueSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("AGENT ACTION QUEUE")
                    .font(.system(size: 11, weight: .black))
                    .foregroundColor(.secondary)
                Spacer()
                let awaiting = manager.visibleActions.filter { $0.status == "staged" }.count
                Text("\(awaiting) AWAITING")
                    .font(.system(size: 10, weight: .bold))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(awaiting > 0 ? Color.orange.opacity(0.2) : Color.green.opacity(0.2))
                    .foregroundColor(awaiting > 0 ? .orange : .green)
                    .cornerRadius(6)
            }

            if manager.visibleActions.isEmpty {
                GlassCard {
                    HStack(spacing: 12) {
                        Image(systemName: "sparkles.rectangle.stack")
                            .font(.system(size: 20))
                            .foregroundColor(.secondary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("No Pending Actions")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white)
                            Text("Thread stages actions when deadlines, emails, or links are spoken.")
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }
            } else {
                ForEach(manager.visibleActions) { action in
                    if manager.isMinimalHome {
                        compactActionRow(action)
                    } else {
                        GlassCard {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(alignment: .top) {
                                    Image(systemName: action.status == "executed" ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                                        .foregroundColor(action.status == "executed" ? .green : .orange)
                                        .font(.system(size: 15))
                                        .padding(.top, 2)

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(action.label)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(.white)
                                        if let detail = action.detail {
                                            Text(detail)
                                                .font(.system(size: 11))
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                    Spacer()
                                }

                                if action.status == "staged" {
                                    Button(action: {
                                        manager.approveAction(id: action.id)
                                    }) {
                                        HStack {
                                            Image(systemName: "bolt.fill")
                                            Text("Execute Action")
                                        }
                                        .font(.system(size: 12, weight: .bold))
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 9)
                                        .background(Color.blue)
                                        .foregroundColor(.white)
                                        .cornerRadius(8)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /// Minimal home: one line per action with a small Approve pill instead of a full-width button.
    private func compactActionRow(_ action: DemoAction) -> some View {
        let staged = action.status == "staged"
        return HStack(spacing: 10) {
            Image(systemName: staged ? "circle.dashed" : "checkmark.circle.fill")
                .font(.system(size: 15))
                .foregroundColor(staged ? ThreadTheme.warning : ThreadTheme.success)

            VStack(alignment: .leading, spacing: 2) {
                Text(action.label)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(staged ? ThreadTheme.textPrimary : ThreadTheme.textSecondary)
                    .lineLimit(2)
                if let detail = action.detail {
                    Text(detail)
                        .font(.system(size: 11))
                        .foregroundColor(ThreadTheme.textMuted)
                        .lineLimit(1)
                }
            }

            Spacer(minLength: 8)

            if staged {
                Button(action: { manager.approveAction(id: action.id) }) {
                    Text("Execute")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(ThreadTheme.background)
                        .padding(.horizontal, 12)
                        .frame(height: 30)
                        .background(ThreadTheme.cyan)
                        .clipShape(Capsule())
                }
                .accessibilityLabel("Approve \(action.label)")
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.04))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(ThreadTheme.cardBorder, lineWidth: 1))
        )
    }

    // MARK: - Meeting Notes & Minute-by-Minute Timeline Section
    private var semanticMomentsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("MEETING NOTES & TIMELINE")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(.white)
                    Text("Minute-by-minute gist · Press & hold (1s) to query Agent")
                        .font(.system(size: 9.5, weight: .medium))
                        .foregroundColor(ThreadTheme.cyan)
                }
                Spacer()
                Text("\(manager.visibleMoments.count) NOTES")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.secondary)
            }

            if manager.visibleMoments.isEmpty {
                GlassCard {
                    HStack(spacing: 12) {
                        Image(systemName: "note.text")
                            .font(.system(size: 20))
                            .foregroundColor(.secondary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("No Meeting Notes Yet")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white)
                            Text("Spoken dialog will synthesize into a minute-by-minute gist with opportunities & deadlines cataloged here.")
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(filterOptions, id: \.0) { key, label in
                            let count = key == "ALL" ? manager.visibleMoments.count : manager.visibleMoments.filter { $0.type == key }.count
                            Button(action: {
                                selectedFilter = key
                            }) {
                                Text("\(label) (\(count))")
                                    .font(.system(size: 10, weight: .bold))
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(selectedFilter == key ? Color.white.opacity(0.18) : Color.white.opacity(0.05))
                                    .foregroundColor(selectedFilter == key ? .white : .secondary)
                                    .cornerRadius(6)
                            }
                        }
                    }
                }

                let momentsToShow = selectedFilter == "ALL" ? manager.visibleMoments : manager.visibleMoments.filter { $0.type == selectedFilter }

                ForEach(momentsToShow) { moment in
                    let isOpen = expandedMomentId == moment.id
                    GlassCard {
                        VStack(alignment: .leading, spacing: 7) {
                            HStack(spacing: 6) {
                                // Minute Timestamp (e.g. 05:11) — plain on the minimal home, a pill on standard
                                if manager.isMinimalHome {
                                    Text(formatClock(moment.timeSec))
                                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                                        .foregroundColor(ThreadTheme.textMuted)
                                } else {
                                    HStack(spacing: 3) {
                                        Image(systemName: "clock")
                                            .font(.system(size: 8.5))
                                        Text(formatClock(moment.timeSec))
                                            .font(.system(size: 10.5, weight: .black, design: .monospaced))
                                    }
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2.5)
                                    .background(Color.cyan.opacity(0.18))
                                    .foregroundColor(.cyan)
                                    .cornerRadius(4)
                                }

                                // Semantic Category Tag (OPPORTUNITY / DEADLINE / RESOURCE / DECISION)
                                MomentTag(moment.type)

                                Spacer()

                                // 1-Tap Agent Query Button
                                Button(action: {
                                    let gen = UIImpactFeedbackGenerator(style: .medium)
                                    gen.impactOccurred()
                                    selectedMomentForAgent = moment
                                }) {
                                    HStack(spacing: 4) {
                                        Image(systemName: "sparkles")
                                            .font(.system(size: 9, weight: .bold))
                                        Text("Ask Agent")
                                            .font(.system(size: 10, weight: .bold))
                                    }
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3.5)
                                    .background(Color.cyan.opacity(0.15))
                                    .foregroundColor(.cyan)
                                    .cornerRadius(5)
                                }
                            }

                            // The Minute's Gist in Few Words
                            Text(moment.takeaway)
                                .font(.system(size: 12.5, weight: .bold))
                                .foregroundColor(.white.opacity(0.95))
                                .lineSpacing(2)

                            // Speaker & 1-Second Hold Hint
                            HStack(spacing: 6) {
                                Text(moment.speaker)
                                    .font(.system(size: 10.5, weight: .semibold))
                                    .foregroundColor(.secondary)

                                // The section header already explains press & hold; minimal skips the per-card hint
                                if !manager.isMinimalHome {
                                    Text("·")
                                        .foregroundColor(.secondary)

                                    HStack(spacing: 3) {
                                        Image(systemName: "hand.tap.fill")
                                            .font(.system(size: 8.5))
                                        Text("Hold 1s for Agent AI")
                                            .font(.system(size: 9.5))
                                    }
                                    .foregroundColor(.cyan.opacity(0.85))
                                }

                                Spacer()

                                Button(action: {
                                    withAnimation(.spring()) {
                                        if expandedMomentId == moment.id {
                                            expandedMomentId = nil
                                        } else {
                                            expandedMomentId = moment.id
                                        }
                                    }
                                }) {
                                    Text(isOpen ? "Less ▴" : "Details ▾")
                                        .font(.system(size: 10, weight: .medium))
                                        .foregroundColor(.secondary)
                                }
                            }

                            if isOpen {
                                VStack(alignment: .leading, spacing: 6) {
                                    Divider().background(Color.white.opacity(0.08))
                                    Text(moment.detail)
                                        .font(.system(size: 11))
                                        .foregroundColor(.white.opacity(0.8))
                                        .lineSpacing(2)

                                    if !moment.matchedSkills.isEmpty {
                                        HStack(spacing: 4) {
                                            ForEach(moment.matchedSkills, id: \.self) { skill in
                                                Text("\(skill) ✓")
                                                    .font(.system(size: 9, weight: .bold))
                                                    .padding(.horizontal, 6)
                                                    .padding(.vertical, 2)
                                                    .background(Color.green.opacity(0.15))
                                                    .foregroundColor(.green)
                                                    .cornerRadius(4)
                                            }
                                        }
                                        .padding(.top, 2)
                                    }
                                }
                                .padding(.top, 2)
                            }
                        }
                    }
                    .contentShape(Rectangle())
                    .onLongPressGesture(minimumDuration: 1.0) {
                        let generator = UIImpactFeedbackGenerator(style: .medium)
                        generator.impactOccurred()
                        self.selectedMomentForAgent = moment
                    }
                }
            }
        }
    }

    // MARK: - Live Transcript Section
    private var transcriptSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("LIVE TRANSCRIPT")
                    .font(.system(size: 11, weight: .black))
                    .foregroundColor(.secondary)
                Spacer()
                Text("SCRIBE · REAL-TIME")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.secondary)
            }

            GlassCard {
                if manager.visibleTranscript.isEmpty {
                    HStack(spacing: 12) {
                        Image(systemName: "waveform.badge.magnifyingglass")
                            .font(.system(size: 18))
                            .foregroundColor(.secondary)
                        Text("Spoken dialog from your meeting will stream here.")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                } else {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(manager.visibleTranscript) { item in
                            HStack(alignment: .top, spacing: 8) {
                                Text(item.speaker + ":")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(item.speaker == "Michael Torres" ? .purple : (item.speaker == "Priya Nair" ? .teal : .blue))
                                    .frame(width: 80, alignment: .leading)

                                Text(item.text)
                                    .font(.system(size: 11))
                                    .foregroundColor(.white.opacity(0.85))
                                    .lineSpacing(2)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private func formatClock(_ sec: Int) -> String {
        let m = sec / 60
        let s = sec % 60
        return String(format: "%02d:%02d", m, s)
    }

    private var vmStandbyRow: some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .medium)
            gen.impactOccurred()
            showingVmScreenSheet = true
        }) {
            HStack(spacing: 10) {
                Image(systemName: "macwindow.on.rectangle")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(ThreadTheme.cyan)

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text("Virtual Machine Screen")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(ThreadTheme.textPrimary)
                        Text("REMOTE VIEW")
                            .font(.system(size: 8, weight: .black))
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1)
                            .background(Color.white.opacity(0.08))
                            .foregroundColor(ThreadTheme.cyan)
                            .cornerRadius(3)
                    }
                    Text("Inspect remote browser, test touch takeover, or dispatch VM")
                        .font(.system(size: 11))
                        .foregroundColor(ThreadTheme.textMuted)
                        .lineLimit(1)
                }

                Spacer(minLength: 6)

                Text("View")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(ThreadTheme.textSecondary)
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(ThreadTheme.textMuted)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.04))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(ThreadTheme.cardBorder, lineWidth: 1))
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Standby Executive Dashboard (No meeting active)
    @ViewBuilder
    private var standbyExecutiveDashboard: some View {
        if manager.isMinimalHome {
            minimalStandby
        } else {
            standardStandby
        }
    }

    // MARK: - Minimal Standby (Settings → Home screen → Minimal)
    @ViewBuilder
    private var minimalStandby: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("On standby")
                .font(.system(size: 22, weight: .semibold))
                .foregroundColor(ThreadTheme.textPrimary)

            Text("Thread watches your calendar and joins the moment a meeting starts.")
                .font(.system(size: 13))
                .foregroundColor(ThreadTheme.textSecondary)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 6)

        // Connectors on one quiet line instead of a 2×2 grid of tiles
        HStack(spacing: 0) {
            let calConnected = (manager.vmAccounts["Calendar"] ?? "").contains("Synced")
            connectorChip(label: "Meet / Zoom", ready: true)
            connectorChip(label: "Calendar", ready: calConnected)
            connectorChip(label: "Gmail", ready: true)
            connectorChip(label: "Notion", ready: true)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.04))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(ThreadTheme.cardBorder, lineWidth: 1))
        )

        micRow
    }

    /// In-room mic in a single row: status plus the one action that applies.
    private var micRow: some View {
        HStack(spacing: 10) {
            Image(systemName: manager.isAmbientListeningEnabled ? "mic.fill" : "mic.slash")
                .font(.system(size: 13))
                .foregroundColor(manager.isAmbientListeningEnabled ? ThreadTheme.cyan : ThreadTheme.textMuted)

            Text(manager.isAmbientListeningEnabled ? "In-room mic ready" : "In-room mic off")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(ThreadTheme.textSecondary)

            Spacer()

            if manager.isAmbientListeningEnabled {
                Button(action: { speechManager.toggleRecording() }) {
                    Text(speechManager.isRecording ? "Stop" : "Start")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(speechManager.isRecording ? ThreadTheme.liveRecording : ThreadTheme.cyan)
                }
            } else {
                Button(action: { showingSettingsSheet = true }) {
                    Text("Settings")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(ThreadTheme.textMuted)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.04))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(ThreadTheme.cardBorder, lineWidth: 1))
        )
    }

    private func connectorChip(label: String, ready: Bool) -> some View {
        HStack(spacing: 5) {
            Circle()
                .fill(ready ? ThreadTheme.success : ThreadTheme.warning)
                .frame(width: 5, height: 5)
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(ThreadTheme.textSecondary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Standard Standby (Settings → Home screen → Standard)
    @ViewBuilder
    private var standardStandby: some View {
        // Connected Ecosystem 2×2 Grid
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "network.badge.shield.half.filled")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(ThreadTheme.cyan)
                    Text("CONNECTED ECOSYSTEM")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundColor(ThreadTheme.cyan)
                    Spacer()
                    Text("STANDBY")
                        .font(.system(size: 9, weight: .heavy, design: .rounded))
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.white.opacity(0.06))
                        .cornerRadius(5)
                }

                Text("Thread monitors your calendar and meeting platforms. The moment a meeting begins, the AI copilot activates.")
                    .font(.system(size: 11))
                    .lineSpacing(3)
                    .foregroundColor(.white.opacity(0.65))

                // 2×2 connector grid
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ecosystemTile(icon: "video.fill", label: "Zoom / Meet", status: "Ready", color: .green)
                    let calConnected = (manager.vmAccounts["Calendar"] ?? "").contains("Synced")
                    ecosystemTile(icon: "calendar", label: "Google Calendar", status: calConnected ? "Synced" : "Tap to Link", color: calConnected ? .green : .orange)
                    ecosystemTile(icon: "envelope.fill", label: "Gmail", status: "Ready", color: .blue)
                    ecosystemTile(icon: "doc.text.fill", label: "Notion / Drive", status: "Ready", color: .purple)
                }
            }
        }

        // (Demo launcher is in Settings → Demo Pitch Controller)

        // Autonomous Capabilities Overview (4 rows)
        GlassCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "cpu.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(ThreadTheme.cyan)
                    Text("AUTONOMOUS CAPABILITIES")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundColor(ThreadTheme.cyan)
                }
                Divider().background(Color.white.opacity(0.08))
                capabilityRow(icon: "waveform", color: .green, title: "Live Transcript & Speaker ID", desc: "Real-time speech-to-text with per-speaker attribution")
                capabilityRow(icon: "qrcode.viewfinder", color: .blue, title: "Slide & QR Code Capture", desc: "Extracts QR codes, emails and links from screen shares")
                capabilityRow(icon: "calendar.badge.plus", color: .purple, title: "Calendar & Email Actions", desc: "Stages deadlines, follow-ups, and meeting summaries")
                capabilityRow(icon: "hand.tap.fill", color: .orange, title: "Poll & Form Auto-Fill", desc: "Votes on live polls and fills forms on your behalf")
            }
        }

        // In-Room Audio / Privacy Card
        GlassCard {
            HStack(spacing: 12) {
                Image(systemName: "hand.raised.shield.fill")
                    .font(.system(size: 22))
                    .foregroundColor(ThreadTheme.cyan)
                VStack(alignment: .leading, spacing: 3) {
                    Text("In-Room Audio Privacy")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)
                    Text(manager.isAmbientListeningEnabled
                         ? "In-room mic active — attendee consent confirmed."
                         : "Microphone off. Enable in Settings after getting attendee consent.")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
                Spacer()
                if manager.isAmbientListeningEnabled {
                    Button(action: { speechManager.toggleRecording() }) {
                        Text(speechManager.isRecording ? "Stop" : "Start")
                            .font(.system(size: 11, weight: .bold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(speechManager.isRecording ? Color.red : ThreadTheme.cyan)
                            .foregroundColor(speechManager.isRecording ? .white : .black)
                            .cornerRadius(8)
                    }
                } else {
                    Button(action: { showingSettingsSheet = true }) {
                        Text("Settings")
                            .font(.system(size: 11, weight: .bold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(ThreadTheme.cyan.opacity(0.15))
                            .foregroundColor(ThreadTheme.cyan)
                            .cornerRadius(8)
                    }
                }
            }
        }
    }

    // MARK: - Ecosystem Tile Helper
    private func ecosystemTile(icon: String, label: String, status: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(color)
                .frame(width: 28, height: 28)
                .background(color.opacity(0.12))
                .cornerRadius(8)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                Text(status)
                    .font(.system(size: 9.5, weight: .medium))
                    .foregroundColor(color)
            }
            Spacer()
        }
        .padding(10)
        .background(Color.white.opacity(0.04))
        .cornerRadius(10)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(color.opacity(0.2), lineWidth: 1))
    }

    // MARK: - Capability Row Helper
    private func capabilityRow(icon: String, color: Color, title: String, desc: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(color)
                .frame(width: 32, height: 32)
                .background(color.opacity(0.12))
                .cornerRadius(9)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white)
                Text(desc)
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
    }

    // MARK: - Active Meeting Cockpit (meeting is live)
    @ViewBuilder
    private var activeMeetingCockpitContent: some View {
        // 1. Active Speaker Stage, Mic Listener & Equalizer
        activeSpeakerStage

        // 2. Gemini Vision Slide & QR Card (Screen Share)
        if manager.screenShareActive {
            geminiVisionSlideCard
        }

        // 3. Agent Action Queue
        actionQueueSection

        // 4. Semantic Moments (Filterable)
        semanticMomentsSection

        // 5. Live Streaming Transcript
        transcriptSection
    }

    // MARK: - Ended Demo Meeting (review what Thread captured)
    @ViewBuilder
    private var endedMeetingContent: some View {
        actionQueueSection
        semanticMomentsSection
        transcriptSection
    }

} // end CockpitView
