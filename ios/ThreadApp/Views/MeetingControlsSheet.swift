import SwiftUI

/// One-line summary of the live session on the Cockpit home screen.
/// The full VM surface never sits on home — tapping this opens `MeetingControlsSheet`.
public struct LiveSessionRow: View {
    @ObservedObject private var manager = ThreadSessionManager.shared
    var onOpen: () -> Void

    public init(onOpen: @escaping () -> Void) {
        self.onOpen = onOpen
    }

    public var body: some View {
        Button(action: onOpen) {
            HStack(spacing: 10) {
                Circle()
                    .fill(manager.isVmBotRunning ? ThreadTheme.success : ThreadTheme.cyan)
                    .frame(width: 6, height: 6)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(ThreadTheme.textPrimary)
                        .lineLimit(1)
                    Text(subtitle)
                        .font(.system(size: 11))
                        .foregroundColor(ThreadTheme.textMuted)
                        .lineLimit(1)
                }

                Spacer(minLength: 8)

                Text("Controls")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(ThreadTheme.textSecondary)
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(ThreadTheme.textMuted)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.04))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(ThreadTheme.cardBorder, lineWidth: 1))
            )
        }
        .buttonStyle(.plain)
    }

    private var title: String {
        let name = manager.upcomingMeeting?.title ?? manager.meetingTitle
        return name.isEmpty ? "Live session" : name
    }

    private var subtitle: String {
        if manager.isVmBotRunning {
            return "Thread is in the call · \(manager.meetingPlatform)"
        }
        return "\(manager.meetingPlatform) · \(manager.currentSpeaker.name)"
    }
}

/// Everything the user needs to reach into the live meeting: mute, hand, chat, reactions,
/// leave, and the VM session detail. Presented as a sheet so home stays a single row.
public struct MeetingControlsSheet: View {
    @ObservedObject private var manager = ThreadSessionManager.shared
    @Environment(\.dismiss) private var dismiss

    @State private var chatDraft = ""
    @FocusState private var chatFocused: Bool

    public init() {}

    public var body: some View {
        NavigationView {
            ZStack {
                ThreadTheme.background.ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        sessionHeader

                        if manager.showMeetingControls {
                            controlGrid
                            chatComposer
                        } else {
                            controlsDisabledNotice
                        }

                        if manager.isVmBotRunning {
                            sessionDetail
                            endSessionButton
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Meeting")
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

    // MARK: - Session Header

    private var sessionHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Circle()
                    .fill(manager.isVmBotRunning ? ThreadTheme.success : ThreadTheme.cyan)
                    .frame(width: 6, height: 6)
                Text(manager.isVmBotRunning ? "Thread is in the call" : "Live session")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(manager.isVmBotRunning ? ThreadTheme.success : ThreadTheme.cyan)
                Spacer()
                Text(manager.meetingPlatform)
                    .font(.system(size: 11))
                    .foregroundColor(ThreadTheme.textMuted)
            }

            Text(manager.upcomingMeeting?.title ?? manager.meetingTitle)
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(ThreadTheme.textPrimary)
                .fixedSize(horizontal: false, vertical: true)

            if !manager.liveSummary.isEmpty {
                Text(manager.liveSummary)
                    .font(.system(size: 12))
                    .foregroundColor(ThreadTheme.textSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Controls

    private var controlGrid: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("Controls")

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                controlTile(
                    icon: manager.isMutedInMeeting ? "mic.slash.fill" : "mic.fill",
                    label: manager.isMutedInMeeting ? "Unmute" : "Mute",
                    active: manager.isMutedInMeeting
                ) {
                    manager.toggleMuteInMeeting()
                }

                controlTile(
                    icon: "hand.raised.fill",
                    label: manager.isHandRaisedInMeeting ? "Lower" : "Hand",
                    active: manager.isHandRaisedInMeeting
                ) {
                    manager.raiseHandInMeeting()
                }

                controlTile(icon: "hand.thumbsup.fill", label: "React", active: false) {
                    manager.sendReactionInMeeting("👍")
                }
            }

            Button(action: {
                manager.leaveMeetingViaVM()
                dismiss()
            }) {
                HStack(spacing: 8) {
                    Image(systemName: "phone.down.fill")
                        .font(.system(size: 12, weight: .semibold))
                    Text("Leave meeting")
                        .font(.system(size: 13, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(ThreadTheme.liveRecording.opacity(0.12))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(ThreadTheme.liveRecording.opacity(0.3), lineWidth: 1))
                )
                .foregroundColor(ThreadTheme.liveRecording)
            }
        }
    }

    private func controlTile(icon: String, label: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        }) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .medium))
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(active ? ThreadTheme.cyan.opacity(0.14) : Color.white.opacity(0.04))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(active ? ThreadTheme.cyan.opacity(0.35) : ThreadTheme.cardBorder, lineWidth: 1)
                    )
            )
            .foregroundColor(active ? ThreadTheme.cyan : ThreadTheme.textSecondary)
        }
        .buttonStyle(.plain)
    }

    private var chatComposer: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("Say something in chat")

            HStack(spacing: 8) {
                TextField("Message the meeting…", text: $chatDraft)
                    .font(.system(size: 13))
                    .foregroundColor(ThreadTheme.textPrimary)
                    .focused($chatFocused)
                    .submitLabel(.send)
                    .onSubmit(sendChat)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.white.opacity(0.04))
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(ThreadTheme.cardBorder, lineWidth: 1))
                    )

                Button(action: sendChat) {
                    Image(systemName: "arrow.up")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(canSend ? ThreadTheme.background : ThreadTheme.textMuted)
                        .frame(width: 38, height: 38)
                        .background(canSend ? ThreadTheme.cyan : Color.white.opacity(0.06))
                        .clipShape(Circle())
                }
                .disabled(!canSend)
            }
        }
    }

    private var controlsDisabledNotice: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Controls are off")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(ThreadTheme.textPrimary)
            Text("Thread is handling this meeting on its own. Turn on Meeting controls in Settings to mute, raise a hand, react, or send chat yourself.")
                .font(.system(size: 12))
                .foregroundColor(ThreadTheme.textSecondary)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.04))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(ThreadTheme.cardBorder, lineWidth: 1))
        )
    }

    // MARK: - VM Session Detail

    private var sessionDetail: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("Session")

            VStack(spacing: 0) {
                detailRow(label: "Status", value: manager.vmBotStatusText)
                divider
                detailRow(label: "Account", value: manager.vmAccounts["Google Account"] ?? "—")
                divider
                detailRow(label: "Host", value: "thread-vm-us-east.cloud")
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.04))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(ThreadTheme.cardBorder, lineWidth: 1))
            )
        }
    }

    private func detailRow(label: String, value: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(label)
                .font(.system(size: 12))
                .foregroundColor(ThreadTheme.textMuted)
            Spacer(minLength: 8)
            Text(value)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(ThreadTheme.textSecondary)
                .multilineTextAlignment(.trailing)
                .lineLimit(2)
        }
        .padding(.vertical, 11)
    }

    private var divider: some View {
        Rectangle()
            .fill(ThreadTheme.cardBorderSubtle)
            .frame(height: 1)
    }

    private var endSessionButton: some View {
        Button(action: {
            manager.stopVmMeetingBot()
            dismiss()
        }) {
            Text("Stop Thread in this meeting")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(ThreadTheme.textSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
        }
    }

    // MARK: - Helpers

    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(ThreadTheme.textMuted)
    }

    private var canSend: Bool {
        !chatDraft.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private func sendChat() {
        let message = chatDraft.trimmingCharacters(in: .whitespaces)
        guard !message.isEmpty else { return }
        manager.sendChatToMeeting(message)
        chatDraft = ""
        chatFocused = false
    }
}
