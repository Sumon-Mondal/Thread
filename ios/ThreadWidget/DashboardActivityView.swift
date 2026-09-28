import SwiftUI
import WidgetKit

/// The small Live Activity. CarPlay's Dashboard (iOS 26+) and the Apple Watch Smart Stack draw this card, so it
/// carries one glanceable headline and the thing that needs the driver, not the Lock Screen's detail.
struct DashboardActivityView: View {
    let state: ThreadActivityAttributes.ContentState

    private var awaitingApproval: String? {
        guard let label = state.stagedActionLabel, !label.isEmpty, !state.isActionExecuted else { return nil }
        return label
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 5) {
                Circle()
                    .fill(state.isPaused ? Color.orange : Color.green)
                    .frame(width: 7, height: 7)
                Text(state.isPaused ? "PAUSED" : "LIVE")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(state.isPaused ? Color.orange : Color.green)
                    .fixedSize()
                Text(state.meetingPlatform)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.6))
                    .lineLimit(1)
                Spacer(minLength: 4)
                DashboardClock(state: state)
            }

            Text(state.shortHeadline)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            if let label = awaitingApproval {
                Text("Approve: \(label)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color(red: 1.0, green: 0.76, blue: 0.22))
                    .lineLimit(1)
            } else {
                Text(state.speaker)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.75))
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

private struct DashboardClock: View {
    let state: ThreadActivityAttributes.ContentState

    var body: some View {
        Group {
            if state.isPaused {
                Text(String(format: "%d:%02d", state.elapsedSeconds / 60, state.elapsedSeconds % 60))
            } else {
                Text(state.startDate, style: .timer)
            }
        }
        .font(.system(size: 12, weight: .bold, design: .monospaced))
        .foregroundStyle(.white.opacity(0.85))
        .multilineTextAlignment(.trailing)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        // A running timer Text otherwise claims every point of width it's offered.
        .frame(width: 52, alignment: .trailing)
    }
}
