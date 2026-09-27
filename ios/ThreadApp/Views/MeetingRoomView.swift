import SwiftUI

/// The meeting join / launch screen that appears when the user taps "Join with Thread" —
/// either from a system notification or from an agent command.
/// Gives the feel of entering a meeting room while Thread's VM bot spins up silently.
public struct MeetingRoomView: View {
    let event: UpcomingMeetingEvent
    var onDismiss: () -> Void

    @ObservedObject private var manager = ThreadSessionManager.shared
    @State private var phase: JoinPhase = .ready
    @State private var stepIndex: Int = 0

    private let steps = [
        "Launching Cloud VM...",
        "Authenticating as you...",
        "Joining \(["waiting room", "meeting"][0])...",
        "Activating AI copilot..."
    ]

    public enum JoinPhase {
        case ready       // User hasn't tapped yet
        case connecting  // Animated connection steps
        case joined      // Done — transition to cockpit
    }

    public var body: some View {
        ZStack {
            // Background
            Color(red: 0.04, green: 0.06, blue: 0.08).ignoresSafeArea()
            RadialGradient(
                colors: [platformColor.opacity(0.15), Color.clear],
                center: .top,
                startRadius: 60,
                endRadius: 420
            ).ignoresSafeArea()

            VStack(spacing: 0) {
                // Close handle
                Capsule()
                    .fill(Color.white.opacity(0.18))
                    .frame(width: 36, height: 4)
                    .padding(.top, 12)

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 28) {

                        // Platform icon + meeting info
                        meetingHeader

                        // Connection steps (visible only while connecting)
                        if phase == .connecting || phase == .joined {
                            connectionSteps
                        }

                        // What Thread will do
                        capabilitiesGrid

                        // CTA buttons
                        actionButtons

                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 22)
                    .padding(.top, 24)
                    .padding(.bottom, 50)
                }
            }
        }
        .onChange(of: phase) { newPhase in
            if newPhase == .connecting { runConnectionSequence() }
        }
    }

    // MARK: - Meeting Header

    private var meetingHeader: some View {
        VStack(spacing: 16) {
            // Platform logo circle
            ZStack {
                Circle()
                    .fill(platformColor.opacity(0.12))
                    .frame(width: 72, height: 72)
                    .overlay(Circle().stroke(platformColor.opacity(0.3), lineWidth: 1.5))

                if phase == .connecting {
                    Circle()
                        .stroke(platformColor.opacity(0.25), lineWidth: 1)
                        .frame(width: 96, height: 96)
                        .scaleEffect(phase == .connecting ? 1.15 : 1.0)
                        .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: phase == .connecting)
                }

                Image(systemName: platformIcon)
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundColor(platformColor)
            }

            VStack(spacing: 6) {
                Text(event.title)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 10) {
                    Label(event.platform, systemImage: platformIcon)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(platformColor)

                    Text("·")
                        .foregroundColor(.secondary)

                    Label(formattedTime, systemImage: "clock.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    // MARK: - Connection Steps

    private var connectionSteps: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Array(steps.enumerated()), id: \.offset) { idx, step in
                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(stepColor(idx).opacity(0.15))
                            .frame(width: 24, height: 24)
                        if idx < stepIndex {
                            Image(systemName: "checkmark")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.green)
                        } else if idx == stepIndex {
                            Circle()
                                .fill(platformColor)
                                .frame(width: 8, height: 8)
                        } else {
                            Circle()
                                .fill(Color.white.opacity(0.15))
                                .frame(width: 8, height: 8)
                        }
                    }
                    Text(step)
                        .font(.system(size: 13, weight: idx <= stepIndex ? .semibold : .regular))
                        .foregroundColor(idx <= stepIndex ? .white : .white.opacity(0.35))
                    Spacer()
                }
                .animation(.easeInOut(duration: 0.3), value: stepIndex)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white.opacity(0.04))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.08), lineWidth: 1))
        )
    }

    // MARK: - Capabilities Grid

    private var capabilitiesGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("THREAD WILL")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundColor(.secondary)
                .tracking(1)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                capabilityPill(icon: "text.bubble.fill", label: "Live Transcript", color: .cyan)
                capabilityPill(icon: "target",           label: "Action Items",   color: .orange)
                capabilityPill(icon: "chart.bar.xaxis",  label: "Auto-Vote Polls", color: .purple)
                capabilityPill(icon: "qrcode.viewfinder", label: "Decode Slides",  color: .green)
                capabilityPill(icon: "calendar.badge.plus", label: "Stage Deadlines", color: .blue)
                capabilityPill(icon: "envelope.badge.fill", label: "Draft Emails",  color: .pink)
            }
        }
    }

    private func capabilityPill(icon: String, label: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(color)
                .frame(width: 20)
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.white.opacity(0.85))
                .lineLimit(1)
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(color.opacity(0.08))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(color.opacity(0.2), lineWidth: 1))
        )
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        VStack(spacing: 12) {
            if phase == .ready {
                Button(action: {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                        phase = .connecting
                    }
                }) {
                    HStack(spacing: 10) {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 16, weight: .bold))
                        Text("Launch Meeting Intelligence")
                            .font(.system(size: 15, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        LinearGradient(colors: [platformColor, platformColor.opacity(0.7)],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                    .foregroundColor(.white)
                    .cornerRadius(14)
                    .shadow(color: platformColor.opacity(0.3), radius: 10, y: 4)
                }

                Button(action: {
                    // Open meeting URL manually on device
                    if let urlStr = event.joinUrl, let url = URL(string: urlStr) {
                        UIApplication.shared.open(url)
                    }
                    onDismiss()
                }) {
                    Text("Join manually instead →")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.secondary)
                }

            } else if phase == .connecting {
                // Animated connecting state
                HStack(spacing: 10) {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: platformColor))
                        .scaleEffect(0.85)
                    Text("Thread is joining on your behalf...")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white.opacity(0.75))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.white.opacity(0.06))
                .cornerRadius(14)

            } else if phase == .joined {
                Button(action: {
                    manager.joinMeetingOnBehalfOfUser(meetingUrl: event.joinUrl, title: event.title)
                    onDismiss()
                }) {
                    HStack(spacing: 10) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 16, weight: .bold))
                        Text("Open Cockpit →")
                            .font(.system(size: 15, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(14)
                }
            }

            // Always available: Cancel
            if phase != .joined {
                Button(action: onDismiss) {
                    Text("Cancel")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    // MARK: - Helpers

    private func runConnectionSequence() {
        stepIndex = 0
        for i in 0..<steps.count {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.9) {
                withAnimation { stepIndex = i }
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + Double(steps.count) * 0.9) {
            withAnimation { phase = .joined }
        }
    }

    private func stepColor(_ idx: Int) -> Color {
        idx < stepIndex ? .green : (idx == stepIndex ? platformColor : .white)
    }

    private var platformIcon: String {
        event.platform.lowercased().contains("zoom") ? "video.fill" : "circle.grid.2x2.fill"
    }

    private var platformColor: Color {
        event.platform.lowercased().contains("zoom") ? .blue : .green
    }

    private var formattedTime: String {
        guard let date = ISO8601DateFormatter().date(from: event.start) else { return event.start }
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f.string(from: date)
    }
}
