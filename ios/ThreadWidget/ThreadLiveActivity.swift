import ActivityKit
import SwiftUI
import WidgetKit

public struct ThreadLiveActivity: Widget {
    public init() {}

    public var body: some WidgetConfiguration {
        ActivityConfiguration(for: ThreadActivityAttributes.self) { context in
            // Lock Screen / Notification Center banner
            LockScreenLiveActivityView(state: context.state)
                .activityBackgroundTint(Color(red: 0.05, green: 0.07, blue: 0.10))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            let state = context.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    SpeakerAvatar(name: state.speaker, size: 36)
                        .padding(.leading, 6)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 3) {
                        MeetingClock(state: state, size: 12)
                        HStack(spacing: 3) {
                            Circle()
                                .fill(state.isPaused ? Color.orange : Color.green)
                                .frame(width: 5, height: 5)
                            Text(state.isPaused ? "PAUSED" : "LIVE")
                                .font(.system(size: 8, weight: .bold))
                                .foregroundColor(state.isPaused ? .orange : .green)
                        }
                    }
                    .padding(.trailing, 6)
                }

                // Below the camera: speaker name, platform, and moment tag
                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(state.speaker)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        MeetingContextLine(state: state, includeBrand: true)
                            .font(.system(size: 10.5))
                            .lineLimit(1)
                    }
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 8) {
                        // High-contrast Gist container
                        VStack(alignment: .leading, spacing: 3) {
                            Text(state.shortHeadline)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.white)
                                .lineLimit(1)
                            if !state.liveSummary.isEmpty && state.liveSummary != state.shortHeadline {
                                Text(state.liveSummary)
                                    .font(.system(size: 11))
                                    .foregroundColor(.white.opacity(0.75))
                                    .lineLimit(2)
                            }
                        }
                        .padding(.horizontal, 4)

                        ActionButton(state: state)
                    }
                    .padding(.horizontal, 4)
                    .padding(.top, 4)
                }
            } compactLeading: {
                HStack(spacing: 4) {
                    Circle()
                        .fill(state.isPaused ? Color.orange : Color.green)
                        .frame(width: 6, height: 6)
                    Text(firstName(state.speaker))
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }
                .padding(.leading, 4)
            } compactTrailing: {
                Text(state.isPaused ? "Paused" : state.shortHeadline)
                    .font(.system(size: 11.5, weight: .bold))
                    .foregroundColor(state.isPaused ? .orange : Color(red: 0.0, green: 0.85, blue: 0.98))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .frame(maxWidth: 88, alignment: .trailing)
                    .padding(.trailing, 4)
            } minimal: {
                Text(speakerInitials(state.speaker))
                    .font(.system(size: 10, weight: .black))
                    .foregroundColor(state.isPaused ? .orange : Color(red: 0.0, green: 0.85, blue: 0.98))
            }
        }
    }
}

// MARK: - Lock Screen & macOS Sequoia Mirrored Live Activity Banner
struct LockScreenLiveActivityView: View {
    let state: ThreadActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            // Top Header: App Branding, Platform Badge, and Live Timer
            HStack(spacing: 8) {
                // Thread AI Gradient Pill
                HStack(spacing: 4) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 9, weight: .bold))
                    Text("THREAD AI")
                        .font(.system(size: 9.5, weight: .black))
                }
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background(
                    LinearGradient(
                        colors: [Color.cyan.opacity(0.28), Color.blue.opacity(0.18)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .foregroundColor(Color(red: 0.0, green: 0.92, blue: 1.0))
                .cornerRadius(6)
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(Color.cyan.opacity(0.4), lineWidth: 0.8)
                )

                // Platform Capsule
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 5, height: 5)
                    Text(state.meetingPlatform)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 2.5)
                .background(Color.white.opacity(0.06))
                .cornerRadius(5)

                Spacer()

                // Audio waveform bars + monospaced clock
                HStack(spacing: 5) {
                    HStack(spacing: 2) {
                        RoundedRectangle(cornerRadius: 1).fill(Color.cyan).frame(width: 2, height: 8)
                        RoundedRectangle(cornerRadius: 1).fill(Color.cyan).frame(width: 2, height: 12)
                        RoundedRectangle(cornerRadius: 1).fill(Color.cyan).frame(width: 2, height: 6)
                    }
                    MeetingClock(state: state, size: 12)
                }
            }

            // Speaker & Semantic Moment Tag
            HStack(spacing: 8) {
                SpeakerAvatar(name: state.speaker, size: 26)

                Text(state.isPaused ? "Paused · \(state.speaker)" : state.speaker)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                if let type = state.latestMomentType {
                    Text(type.uppercased())
                        .font(.system(size: 8.5, weight: .black))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(momentColor(type).opacity(0.22))
                        .foregroundColor(momentColor(type))
                        .cornerRadius(4)
                        .overlay(
                            RoundedRectangle(cornerRadius: 4)
                                .stroke(momentColor(type).opacity(0.5), lineWidth: 0.8)
                        )
                } else {
                    Text("SPEAKING")
                        .font(.system(size: 8.5, weight: .bold))
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Color.white.opacity(0.06))
                        .foregroundColor(.secondary)
                        .cornerRadius(4)
                }

                Spacer()
            }

            // Gist / Intelligence Content Box
            VStack(alignment: .leading, spacing: 3) {
                Text(state.shortHeadline)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                if !state.liveSummary.isEmpty && state.liveSummary != state.shortHeadline {
                    Text(state.liveSummary)
                        .font(.system(size: 11.5))
                        .foregroundColor(.white.opacity(0.8))
                        .lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(9)
            .background(Color.white.opacity(0.04))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.white.opacity(0.08), lineWidth: 0.8)
            )

            // Executive 1-Tap Action Button or Live Indicator
            ActionButton(state: state)
        }
        .padding(14)
        .background(
            ZStack {
                Color(red: 0.05, green: 0.07, blue: 0.10)
                RadialGradient(
                    colors: [Color.cyan.opacity(0.10), Color.clear],
                    center: .topLeading,
                    startRadius: 20,
                    endRadius: 280
                )
            }
        )
    }
}

/// Meeting platform and moment metadata line
private struct MeetingContextLine: View {
    let state: ThreadActivityAttributes.ContentState
    let includeBrand: Bool

    var body: some View {
        let base = Text(includeBrand ? "Thread · \(state.meetingPlatform)" : state.meetingPlatform)
            .foregroundColor(.white.opacity(0.6))
        if state.isPaused {
            return base + Text(" · Paused").foregroundColor(.orange)
        }
        if let type = state.latestMomentType {
            return base + Text(" · \(type.capitalized)").foregroundColor(momentColor(type))
        }
        return base
    }
}

private struct ActionButton: View {
    let state: ThreadActivityAttributes.ContentState

    private func cleanActionLabel(_ raw: String) -> String {
        var s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.lowercased().hasPrefix("approve:") {
            s = String(s.dropFirst(8)).trimmingCharacters(in: .whitespacesAndNewlines)
        } else if s.lowercased().hasPrefix("approve ") {
            s = String(s.dropFirst(8)).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return s
    }

    private func actionIcon(for label: String) -> String {
        let l = label.lowercased()
        if l.contains("email") || l.contains("mail") { return "paperplane.fill" }
        if l.contains("qr") || l.contains("code") { return "qrcode.viewfinder" }
        if l.contains("chat") || l.contains("link") { return "link.circle.fill" }
        if l.contains("reminder") || l.contains("calendar") || l.contains("rsvp") { return "calendar.badge.clock" }
        if l.contains("apply") || l.contains("form") { return "doc.text.fill" }
        return "bolt.fill"
    }

    var body: some View {
        if let rawLabel = state.stagedActionLabel, !state.isActionExecuted,
           let id = state.stagedActionId, let url = URL(string: "threadapp://approve?id=\(id)") {
            let label = cleanActionLabel(rawLabel)
            Link(destination: url) {
                HStack(spacing: 6) {
                    Image(systemName: actionIcon(for: label))
                        .font(.system(size: 12, weight: .bold))
                    Text(label)
                        .font(.system(size: 12, weight: .bold))
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(
                    LinearGradient(
                        colors: [Color(red: 0.0, green: 0.85, blue: 0.98), Color(red: 0.0, green: 0.65, blue: 0.98)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .foregroundColor(.black)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                .shadow(color: Color.cyan.opacity(0.35), radius: 6, x: 0, y: 2)
            }
        } else if state.isActionExecuted {
            HStack(spacing: 5) {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundColor(.green)
                Text("Action Executed by Agent")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.green)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
            .background(Color.green.opacity(0.12))
            .cornerRadius(6)
        } else {
            HStack(spacing: 6) {
                Image(systemName: "waveform")
                    .font(.system(size: 10))
                    .foregroundColor(Color(red: 0.0, green: 0.85, blue: 0.98))
                Text("Gemini Agent monitoring audio & shared slides")
                    .font(.system(size: 10.5))
                    .foregroundColor(.white.opacity(0.55))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
        }
    }
}

private struct SpeakerAvatar: View {
    let name: String
    let size: CGFloat

    var body: some View {
        Circle()
            .fill(
                LinearGradient(
                    colors: [Color.blue.opacity(0.5), Color.purple.opacity(0.4)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(width: size, height: size)
            .overlay(
                Text(speakerInitials(name))
                    .font(.system(size: size * 0.40, weight: .bold))
                    .foregroundColor(.white)
            )
            .overlay(
                Circle()
                    .stroke(Color.white.opacity(0.18), lineWidth: 0.8)
            )
    }
}

/// Running meeting timer, or the frozen time while paused.
private struct MeetingClock: View {
    let state: ThreadActivityAttributes.ContentState
    let size: CGFloat

    var body: some View {
        Group {
            if state.isPaused {
                Text(String(format: "%d:%02d", state.elapsedSeconds / 60, state.elapsedSeconds % 60))
                    .foregroundColor(.orange)
            } else {
                Text(state.startDate, style: .timer)
                    .foregroundColor(Color(red: 0.0, green: 0.9, blue: 1.0))
            }
        }
        .font(.system(size: size, weight: .bold, design: .monospaced))
        .multilineTextAlignment(.trailing)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        .frame(width: size * 3.8, alignment: .trailing)
    }
}

private func gist(_ state: ThreadActivityAttributes.ContentState) -> String {
    state.liveSummary.isEmpty ? state.shortHeadline : state.liveSummary
}

private func firstName(_ name: String) -> String {
    name.split(separator: " ").first.map(String.init) ?? "Call"
}

private func speakerInitials(_ name: String) -> String {
    let parts = name.split(separator: " ").compactMap { $0.first }
    if parts.count >= 2 {
        return "\(parts[0])\(parts[1])".uppercased()
    } else if let first = parts.first {
        return String(first).uppercased()
    }
    return "TH"
}

// Palette for semantic moments
private func momentColor(_ type: String) -> Color {
    switch type.uppercased() {
    case "OPPORTUNITY": return Color(red: 0.0, green: 0.85, blue: 0.98)
    case "DEADLINE": return Color(red: 0.98, green: 0.30, blue: 0.35)
    case "RESOURCE": return Color(red: 0.18, green: 0.55, blue: 1.0)
    case "REQUIREMENT": return Color(red: 0.58, green: 0.38, blue: 0.98)
    case "EVENT": return Color(red: 1.0, green: 0.65, blue: 0.15)
    case "DECISION": return Color(red: 0.88, green: 0.38, blue: 0.88)
    default: return Color(red: 0.0, green: 0.85, blue: 0.98)
    }
}
