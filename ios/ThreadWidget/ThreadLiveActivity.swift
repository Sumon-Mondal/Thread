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
                    SpeakerAvatar(name: state.speaker, size: 34)
                        .padding(.leading, 4)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    MeetingClock(state: state, size: 12)
                        .padding(.trailing, 4)
                }

                // Below the camera: who is speaking, on which platform, and what kind of moment it is
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 1) {
                        Text(state.speaker)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        MeetingContextLine(state: state, includeBrand: false)
                            .font(.system(size: 11))
                            .lineLimit(1)
                    }
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(gist(state))
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white)
                            .lineLimit(2)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        ApproveButton(state: state)
                    }
                    .padding(.horizontal, 4)
                    .padding(.top, 2)
                }
            } compactLeading: {
                HStack(spacing: 4) {
                    Circle()
                        .fill(state.isPaused ? Color.orange : Color.green)
                        .frame(width: 6, height: 6)
                    Text(firstName(state.speaker))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }
                .padding(.leading, 2)
            } compactTrailing: {
                Text(state.isPaused ? "Paused" : state.shortHeadline)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(state.isPaused ? .orange : .cyan)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .frame(maxWidth: 84, alignment: .trailing)
                    .padding(.trailing, 2)
            } minimal: {
                Text(speakerInitials(state.speaker))
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(state.isPaused ? .orange : .cyan)
            }
        }
    }
}

// Lock Screen banner: speaker row with the clock, the live gist, then the one-tap approval
struct LockScreenLiveActivityView: View {
    let state: ThreadActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                SpeakerAvatar(name: state.speaker, size: 30)
                VStack(alignment: .leading, spacing: 1) {
                    Text(state.isPaused ? "Paused · \(state.speaker)" : state.speaker)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    MeetingContextLine(state: state, includeBrand: true)
                        .font(.system(size: 11))
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                MeetingClock(state: state, size: 13)
            }

            Text(gist(state))
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.white.opacity(0.95))
                .lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)

            ApproveButton(state: state, prefix: "Approve: ")
        }
        .padding(14)
    }
}

/// "Thread · Google Meet · Resource", with the moment type in its colour (or "Paused" in orange).
private struct MeetingContextLine: View {
    let state: ThreadActivityAttributes.ContentState
    let includeBrand: Bool

    var body: some View {
        let base = Text(includeBrand ? "Thread · \(state.meetingPlatform)" : state.meetingPlatform)
            .foregroundColor(.white.opacity(0.55))
        if state.isPaused {
            return base + Text(" · Paused").foregroundColor(.orange)
        }
        if let type = state.latestMomentType {
            return base + Text(" · \(type.capitalized)").foregroundColor(momentColor(type))
        }
        return base
    }
}

private struct ApproveButton: View {
    let state: ThreadActivityAttributes.ContentState
    var prefix: String = ""

    var body: some View {
        if let label = state.stagedActionLabel, !state.isActionExecuted,
           let id = state.stagedActionId, let url = URL(string: "threadapp://approve?id=\(id)") {
            Link(destination: url) {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill")
                    Text(prefix + label)
                        .lineLimit(1)
                }
                .font(.system(size: 12, weight: .semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(Color.cyan.opacity(0.18))
                .foregroundColor(.cyan)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
        }
    }
}

private struct SpeakerAvatar: View {
    let name: String
    let size: CGFloat

    var body: some View {
        Circle()
            .fill(Color.white.opacity(0.12))
            .frame(width: size, height: size)
            .overlay(
                Text(speakerInitials(name))
                    .font(.system(size: size * 0.38, weight: .semibold))
                    .foregroundColor(.white)
            )
    }
}

/// Running meeting timer, or the frozen time while paused. A fixed width keeps the live timer
/// from claiming all the space, which would squeeze out everything next to it.
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
                    .foregroundColor(.cyan)
            }
        }
        .font(.system(size: size, weight: .semibold, design: .monospaced))
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

// Same palette as the app's MomentTag so a moment reads the same colour everywhere.
private func momentColor(_ type: String) -> Color {
    switch type.uppercased() {
    case "OPPORTUNITY": return Color(red: 0.0, green: 0.85, blue: 0.98)
    case "DEADLINE": return Color(red: 0.98, green: 0.30, blue: 0.35)
    case "RESOURCE": return Color(red: 0.18, green: 0.48, blue: 1.0)
    case "REQUIREMENT": return Color(red: 0.52, green: 0.32, blue: 0.98)
    case "EVENT": return Color(red: 1.0, green: 0.65, blue: 0.15)
    case "DECISION": return Color(red: 0.85, green: 0.38, blue: 0.85)
    default: return Color(red: 0.0, green: 0.85, blue: 0.98)
    }
}
