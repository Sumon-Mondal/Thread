import SwiftUI

/// Virtual Machine Screen Sheet
/// Gives the user a live visual of the headless browser running inside the cloud Virtual Machine,
/// with interactive touch takeover, meeting controls, in-call chat, and agent vision telemetry.
public struct VirtualMachineScreenSheet: View {
    @ObservedObject private var manager = ThreadSessionManager.shared
    @Environment(\.dismiss) private var dismiss

    @State private var isTakeoverActive: Bool = false
    @State private var touchLocation: CGPoint? = nil
    @State private var chatMessage: String = ""
    @State private var isChatExpanded: Bool = false
    @State private var selectedReaction: String? = nil
    @State private var isScanningVision: Bool = true
    @State private var isCameraMuted: Bool = true
    @State private var snapshotFlash: Bool = false

    public init() {}

    public var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.03, green: 0.05, blue: 0.07).ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        // 1. VM Hardware & Network Status Bar
                        vmStatusBar

                        // 2. Interactive Virtual Machine Display Canvas
                        vmDisplayCanvas

                        // 3. Takeover Mode Toggle & Touch Indicator
                        takeoverControlBar

                        // 4. Quick Meeting Action Buttons
                        quickMeetingActions

                        // 5. In-Meeting VM Chat Dispatcher
                        inMeetingChatSection

                        // 6. Cloud VM Specs & Diagnostics
                        vmTelemetrySection
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .padding(.bottom, 40)
                }

                // Camera flash effect when snapshot is taken
                if snapshotFlash {
                    Color.white.opacity(0.4)
                        .ignoresSafeArea()
                        .transition(.opacity)
                }
            }
            .navigationTitle("Virtual Machine Screen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(ThreadTheme.cyan)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - VM Status Bar
    private var vmStatusBar: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(Color.green)
                .frame(width: 7, height: 7)
                .overlay(
                    Circle()
                        .stroke(Color.green.opacity(0.4), lineWidth: 4)
                        .scaleEffect(1.3)
                )

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 5) {
                    Text("thread-vm-us-east.cloud")
                        .font(.system(size: 10.5, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    Text("PORT 5900")
                        .font(.system(size: 8, weight: .bold, design: .monospaced))
                        .padding(.horizontal, 4)
                        .padding(.vertical, 1)
                        .background(Color.white.opacity(0.08))
                        .foregroundColor(Color.cyan)
                        .cornerRadius(3)
                }
                Text("Headless Chromium 128 · 1920×1080 · 24ms ping")
                    .font(.system(size: 9))
                    .foregroundColor(.white.opacity(0.55))
                    .lineLimit(1)
            }

            Spacer()

            Button(action: captureSnapshot) {
                HStack(spacing: 4) {
                    Image(systemName: "camera.viewfinder")
                        .font(.system(size: 10, weight: .bold))
                    Text("Snapshot")
                        .font(.system(size: 10, weight: .bold))
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 5)
                .background(Color.white.opacity(0.08))
                .foregroundColor(.white)
                .cornerRadius(6)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.white.opacity(0.03))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.06), lineWidth: 1))
        )
    }

    // MARK: - Interactive Virtual Machine Display
    private var vmDisplayCanvas: some View {
        VStack(spacing: 0) {
            // macOS / Browser Window Frame Chrome
            HStack(spacing: 6) {
                HStack(spacing: 4) {
                    Circle().fill(Color.red.opacity(0.8)).frame(width: 8, height: 8)
                    Circle().fill(Color.yellow.opacity(0.8)).frame(width: 8, height: 8)
                    Circle().fill(Color.green.opacity(0.8)).frame(width: 8, height: 8)
                }
                .padding(.leading, 6)

                Spacer()

                // Address bar
                HStack(spacing: 5) {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 8))
                        .foregroundColor(.green)
                    Text("meet.google.com/xyz-qwer-vbn")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 2.5)
                .background(Color.black.opacity(0.4))
                .cornerRadius(6)

                Spacer()

                // Frame rate pill
                Text("60 FPS")
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .foregroundColor(.cyan)
                    .padding(.trailing, 6)
            }
            .padding(.vertical, 6)
            .background(Color(red: 0.12, green: 0.14, blue: 0.18))

            // Main Meeting Screen Content
            ZStack(alignment: .bottom) {
                // Background meeting video / slide display
                ZStack {
                    Color(red: 0.08, green: 0.10, blue: 0.14)

                    if manager.screenShareActive {
                        // Slide presentation view
                        slidePresentationView
                    } else {
                        // Active speaker camera view
                        speakerCameraView
                    }
                }
                .frame(height: 220)
                .clipped()

                // Touch feedback ripple
                if let pt = touchLocation {
                    Circle()
                        .stroke(Color.cyan, lineWidth: 2)
                        .background(Circle().fill(Color.cyan.opacity(0.25)))
                        .frame(width: 44, height: 44)
                        .position(pt)
                        .transition(.opacity)
                }

                // Gemini Vision Detection overlay badge
                if isScanningVision {
                    VStack {
                        HStack {
                            HStack(spacing: 4) {
                                Image(systemName: "sparkles")
                                    .font(.system(size: 9))
                                Text("Gemini Vision · Active OCR & Audio")
                                    .font(.system(size: 9, weight: .bold))
                            }
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(Color.cyan.opacity(0.85))
                            .foregroundColor(.black)
                            .cornerRadius(4)
                            .shadow(color: Color.cyan.opacity(0.4), radius: 4)

                            Spacer()

                            if isTakeoverActive {
                                Text("MANUAL TOUCH TAKEOVER")
                                    .font(.system(size: 8.5, weight: .bold))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.orange)
                                    .foregroundColor(.black)
                                    .cornerRadius(4)
                            }
                        }
                        .padding(8)
                        Spacer()
                    }
                }

                // Meeting Toolbar at bottom of VM window
                vmMeetingBottomToolbar
            }
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        guard isTakeoverActive else { return }
                        touchLocation = value.location
                    }
                    .onEnded { _ in
                        guard isTakeoverActive else { return }
                        let gen = UIImpactFeedbackGenerator(style: .light)
                        gen.impactOccurred()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            withAnimation { touchLocation = nil }
                        }
                    }
            )
        }
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isTakeoverActive ? Color.orange.opacity(0.7) : Color.white.opacity(0.12), lineWidth: 1.2)
        )
        .shadow(color: isTakeoverActive ? Color.orange.opacity(0.2) : Color.black.opacity(0.5), radius: 10)
    }

    // MARK: - Slide Presentation in VM
    private var slidePresentationView: some View {
        ZStack {
            Color(red: 0.05, green: 0.07, blue: 0.10)

            VStack(spacing: 6) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(manager.visionSlide.title)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                        Text(manager.visionSlide.subtitle)
                            .font(.system(size: 10))
                            .foregroundColor(.cyan)
                    }

                    Spacer()

                    // QR Code box with AI green detection box
                    ZStack {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.white)
                            .frame(width: 52, height: 52)
                            .overlay(
                                Image(systemName: "qrcode")
                                    .font(.system(size: 34))
                                    .foregroundColor(.black)
                            )

                        // Vision detection green border
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.green, lineWidth: 1.5)
                            .frame(width: 58, height: 58)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.top, 10)

                // Bullet points
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(manager.visionSlide.bullets, id: \.self) { bullet in
                        HStack(spacing: 5) {
                            Circle().fill(Color.cyan).frame(width: 3.5, height: 3.5)
                            Text(bullet)
                                .font(.system(size: 9.5))
                                .foregroundColor(.white.opacity(0.85))
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 14)

                Spacer()
            }
        }
    }

    // MARK: - Speaker Camera View in VM
    private var speakerCameraView: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.10, green: 0.12, blue: 0.18), Color(red: 0.04, green: 0.06, blue: 0.09)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(spacing: 8) {
                // Speaker Avatar with audio waveform
                Circle()
                    .fill(LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 56, height: 56)
                    .overlay(
                        Text(manager.currentSpeaker.initials)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                    )
                    .overlay(
                        Circle().stroke(Color.cyan.opacity(0.6), lineWidth: 2)
                    )

                VStack(spacing: 2) {
                    Text(manager.currentSpeaker.name)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)
                    Text(manager.currentSpeaker.role)
                        .font(.system(size: 10))
                        .foregroundColor(.white.opacity(0.6))
                }

                // Live caption bar
                if !manager.shortHeadline.isEmpty {
                    Text("“\(manager.liveSummary.isEmpty ? manager.shortHeadline : manager.liveSummary)”")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(Color(red: 0.9, green: 0.95, blue: 1.0))
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .padding(.horizontal, 20)
                }
            }
        }
    }

    // MARK: - VM Meeting Bottom Toolbar
    private var vmMeetingBottomToolbar: some View {
        HStack(spacing: 12) {
            vmToolbarButton(
                icon: manager.isMutedInMeeting ? "mic.slash.fill" : "mic.fill",
                color: manager.isMutedInMeeting ? .red : .white,
                label: manager.isMutedInMeeting ? "Muted" : "Mic"
            ) {
                manager.toggleMuteInMeeting()
            }

            vmToolbarButton(
                icon: isCameraMuted ? "video.slash.fill" : "video.fill",
                color: isCameraMuted ? .red : .white,
                label: isCameraMuted ? "Cam Off" : "Cam On"
            ) {
                isCameraMuted.toggle()
                let gen = UIImpactFeedbackGenerator(style: .light)
                gen.impactOccurred()
            }

            vmToolbarButton(
                icon: "hand.raised.fill",
                color: manager.isHandRaisedInMeeting ? .yellow : .white,
                label: "Hand"
            ) {
                manager.raiseHandInMeeting()
            }

            vmToolbarButton(
                icon: "message.fill",
                color: isChatExpanded ? .cyan : .white,
                label: "Chat"
            ) {
                withAnimation { isChatExpanded.toggle() }
            }

            Spacer()

            Button(action: {
                manager.leaveMeetingViaVM()
                dismiss()
            }) {
                Image(systemName: "phone.down.fill")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 26, height: 26)
                    .background(Color.red)
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.black.opacity(0.75))
    }

    private func vmToolbarButton(icon: String, color: Color, label: String, action: @escaping () -> Void) -> some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .light)
            gen.impactOccurred()
            action()
        }) {
            HStack(spacing: 3) {
                Image(systemName: icon)
                    .font(.system(size: 9))
                Text(label)
                    .font(.system(size: 8.5, weight: .medium))
            }
            .foregroundColor(color)
            .padding(.horizontal, 6)
            .padding(.vertical, 4)
            .background(Color.white.opacity(0.12))
            .cornerRadius(4)
        }
    }

    // MARK: - Takeover Control Bar
    private var takeoverControlBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(isTakeoverActive ? "Interactive Touch Takeover" : "Autonomous Pilot Mode")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(isTakeoverActive ? .orange : .white)
                Text(isTakeoverActive
                     ? "Tap anywhere on the VM screen to click, scroll, and interact."
                     : "Gemini Agent is autonomously watching audio & video feeds.")
                    .font(.system(size: 10.5))
                    .foregroundColor(.secondary)
            }

            Spacer()

            Toggle("", isOn: $isTakeoverActive)
                .labelsHidden()
                .toggleStyle(SwitchToggleStyle(tint: .orange))
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(isTakeoverActive ? Color.orange.opacity(0.10) : Color.white.opacity(0.04))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(isTakeoverActive ? Color.orange.opacity(0.4) : Color.white.opacity(0.08), lineWidth: 1))
        )
    }

    // MARK: - Quick Meeting Actions
    private var quickMeetingActions: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("QUICK VM ACTIONS")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.secondary)

            HStack(spacing: 8) {
                actionTile(icon: "hand.thumbsup.fill", label: "React 👍") {
                    manager.sendReactionInMeeting("👍")
                    showFeedback("Sent 👍 to meeting")
                }

                actionTile(icon: "hand.wave.fill", label: "React 👋") {
                    manager.sendReactionInMeeting("👋")
                    showFeedback("Sent 👋 to meeting")
                }

                actionTile(icon: "sparkles", label: "Scan OCR") {
                    captureSnapshot()
                }

                actionTile(icon: "person.crop.circle.badge.plus", label: "Admit All") {
                    showFeedback("Dispatched VM click: Admit all guests")
                }
            }
        }
    }

    private func actionTile(icon: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .medium)
            gen.impactOccurred()
            action()
        }) {
            VStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                Text(label)
                    .font(.system(size: 10, weight: .semibold))
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(Color.white.opacity(0.05))
            .foregroundColor(.white)
            .cornerRadius(10)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.08), lineWidth: 1))
        }
    }

    // MARK: - In-Meeting VM Chat Dispatcher
    private var inMeetingChatSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("DISPATCH CHAT MESSAGE TO VM")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.secondary)

            HStack(spacing: 8) {
                TextField("Type message into Google Meet chat…", text: $chatMessage)
                    .font(.system(size: 12))
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(8)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))

                Button(action: sendChatToVm) {
                    HStack(spacing: 4) {
                        Image(systemName: "paperplane.fill")
                            .font(.system(size: 11))
                        Text("Send")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(chatMessage.isEmpty ? Color.white.opacity(0.1) : Color.cyan)
                    .foregroundColor(chatMessage.isEmpty ? .secondary : .black)
                    .cornerRadius(8)
                }
                .disabled(chatMessage.isEmpty)
            }
        }
    }

    // MARK: - VM Telemetry Section
    private var vmTelemetrySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("VIRTUAL MACHINE TELEMETRY")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.secondary)

            VStack(spacing: 0) {
                telemetryRow(label: "Cloud VM Host", value: "thread-vm-us-east.cloud")
                telemetryDivider
                telemetryRow(label: "Browser Engine", value: "Chromium 128.0 (Headless Linux x86_64)")
                telemetryDivider
                telemetryRow(label: "Meeting Code", value: "xyz-qwer-vbn (Google Meet)")
                telemetryDivider
                telemetryRow(label: "Audio Loopback", value: "PulseAudio ALSA virtual sink (48kHz)")
                telemetryDivider
                telemetryRow(label: "Autonomous Policy", value: manager.vmAutoJoinPolicy == "auto_join" ? "Auto-Join Upcoming Calls" : "Prompt 5 Min Before")
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.03))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
            )
        }
    }

    private func telemetryRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.8))
        }
        .padding(.vertical, 8)
    }

    private var telemetryDivider: some View {
        Rectangle()
            .fill(Color.white.opacity(0.06))
            .frame(height: 1)
    }

    // MARK: - Actions
    private func captureSnapshot() {
        withAnimation(.easeInOut(duration: 0.15)) {
            snapshotFlash = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            withAnimation(.easeInOut(duration: 0.2)) {
                snapshotFlash = false
            }
        }
        let gen = UINotificationFeedbackGenerator()
        gen.notificationOccurred(.success)
        manager.showNotification(text: "📸 VM Screen captured & analyzed by Gemini Vision")
    }

    private func sendChatToVm() {
        let msg = chatMessage.trimmingCharacters(in: .whitespaces)
        guard !msg.isEmpty else { return }
        manager.sendChatToMeeting(msg)
        chatMessage = ""
        showFeedback("Dispatched message to Google Meet chat")
    }

    private func showFeedback(_ text: String) {
        manager.showNotification(text: text)
        let gen = UIImpactFeedbackGenerator(style: .medium)
        gen.impactOccurred()
    }
}
