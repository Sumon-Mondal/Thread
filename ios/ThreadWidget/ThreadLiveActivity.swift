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
            DynamicIsland {
                // Expanded View
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.blue.opacity(0.3))
                            .frame(width: 22, height: 22)
                            .overlay(
                                Text(String(context.state.speaker.prefix(2)).uppercased())
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.blue)
                            )
                        Text(context.state.speaker)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }
                    .padding(.leading, 4)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 6, height: 6)
                        Text(formatClock(context.state.elapsedSeconds))
                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                            .foregroundColor(.secondary)
                    }
                    .padding(.trailing, 4)
                }

                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading, spacing: 3) {
                        if let type = context.state.latestMomentType {
                            Text(type.uppercased())
                                .font(.system(size: 9, weight: .bold))
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(momentColor(type).opacity(0.2))
                                .foregroundColor(momentColor(type))
                                .cornerRadius(4)
                        }
                        Text(context.state.latestMomentTakeaway ?? context.state.shortHeadline)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white.opacity(0.9))
                            .lineLimit(2)
                    }
                    .padding(.vertical, 4)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    if let actionLabel = context.state.stagedActionLabel, !context.state.isActionExecuted {
                        Link(destination: URL(string: "threadapp://approve?id=\(context.state.stagedActionId ?? "")")!) {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 12))
                                Text(actionLabel)
                                    .font(.system(size: 12, weight: .bold))
                                    .lineLimit(1)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                        .padding(.top, 2)
                    } else {
                        HStack {
                            Image(systemName: "waveform")
                                .font(.system(size: 11))
                                .foregroundColor(.blue)
                            Text("Thread listening and taking action notes…")
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }
                        .padding(.top, 2)
                    }
                }
            } compactLeading: {
                // Compact Leading: Animated waveform or Thread T mark
                HStack(spacing: 2) {
                    RoundedRectangle(cornerRadius: 1)
                        .fill(Color.blue)
                        .frame(width: 2, height: 10)
                    RoundedRectangle(cornerRadius: 1)
                        .fill(Color.blue)
                        .frame(width: 2, height: 14)
                    RoundedRectangle(cornerRadius: 1)
                        .fill(Color.blue)
                        .frame(width: 2, height: 8)
                }
                .padding(.leading, 4)
            } compactTrailing: {
                // Compact Trailing: 3-5 word live summary
                Text(context.state.shortHeadline)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color(red: 0.6, green: 0.8, blue: 1.0))
                    .lineLimit(1)
                    .padding(.trailing, 4)
            } minimal: {
                // Minimal (when multiple activities exist)
                Circle()
                    .fill(Color.green)
                    .frame(width: 10, height: 10)
            }
        }
    }
}

// Lock Screen Banner View
struct LockScreenLiveActivityView: View {
    let state: ThreadActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                HStack(spacing: 6) {
                    Text("THREAD")
                        .font(.system(size: 10, weight: .black))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.3))
                        .foregroundColor(.blue)
                        .cornerRadius(4)
                    Text(state.meetingTitle)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }
                Spacer()
                Text(formatClock(state.elapsedSeconds))
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(.secondary)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    if let type = state.latestMomentType {
                        Text(type)
                            .font(.system(size: 9, weight: .bold))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(momentColor(type).opacity(0.25))
                            .foregroundColor(momentColor(type))
                            .cornerRadius(4)
                    }
                    Text(state.speaker)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                }
                Text(state.latestMomentTakeaway ?? state.shortHeadline)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white)
                    .lineLimit(2)
            }

            if let action = state.stagedActionLabel, !state.isActionExecuted {
                Link(destination: URL(string: "threadapp://approve?id=\(state.stagedActionId ?? "")")!) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Approve: \(action)")
                            .font(.system(size: 12, weight: .bold))
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
            }
        }
        .padding(14)
        .background(Color(red: 0.07, green: 0.10, blue: 0.14))
    }
}

private func momentColor(_ type: String) -> Color {
    switch type.uppercased() {
    case "OPPORTUNITY": return Color.blue
    case "DEADLINE": return Color.red
    case "RESOURCE": return Color.teal
    case "DECISION": return Color.purple
    default: return Color.orange
    }
}

private func formatClock(_ seconds: Int) -> String {
    let m = seconds / 60
    let s = seconds % 60
    return String(format: "%02d:%02d", m, s)
}
