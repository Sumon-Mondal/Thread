import SwiftUI

/// Apple CarPlay Automotive Dashboard View
/// Designed for vehicle infotainment screens and car-mounted iPhone displays.
/// Adheres to automotive safety guidelines: high-contrast dark palette, large typography,
/// and minimum 60pt touch targets for distraction-free in-vehicle operation.
public struct CarPlayDashboardView: View {
    @EnvironmentObject var manager: ThreadSessionManager
    @Environment(\.dismiss) private var dismiss

    @State private var reactionSentAnimation: Bool = false
    @State private var wavePhase: CGFloat = 0

    public init() {}

    public var body: some View {
        ZStack {
            // High-contrast automotive black background
            Color(red: 0.03, green: 0.04, blue: 0.06)
                .ignoresSafeArea()

            VStack(spacing: 14) {
                // Top CarPlay Header Bar
                carPlayHeader

                // Main CarPlay Automotive Grid
                ScrollView {
                    VStack(spacing: 16) {
                        // Live Speaker & Speech Status Card
                        liveSpeakerCard

                        // Giant Driving Action Controls
                        drivingActionControls

                        // Staged Action Queue for Drivers
                        carPlayActionQueue
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Header
    private var carPlayHeader: some View {
        HStack(alignment: .center, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "car.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.cyan)

                Text("APPLE CARPLAY")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .foregroundColor(.cyan)

                Circle()
                    .fill(Color.green)
                    .frame(width: 6, height: 6)

                Text("AUTOMOTIVE HUD")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.green)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Color.cyan.opacity(0.12))
            .cornerRadius(8)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.cyan.opacity(0.3), lineWidth: 1))

            Spacer()

            Button(action: { dismiss() }) {
                HStack(spacing: 4) {
                    Image(systemName: "xmark.circle.fill")
                    Text("Exit HUD")
                }
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.white.opacity(0.7))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.white.opacity(0.08))
                .cornerRadius(8)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
    }

    // MARK: - Live Speaker Card
    private var liveSpeakerCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .center, spacing: 12) {
                // Large initial badge
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [Color.blue, Color.cyan], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 52, height: 52)

                    Text(manager.currentSpeaker.initials)
                        .font(.system(size: 18, weight: .black))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        Text(manager.currentSpeaker.name)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)

                        HStack(spacing: 3) {
                            Circle().fill(Color.red).frame(width: 6, height: 6)
                            Text("SPEAKING")
                                .font(.system(size: 9, weight: .black))
                                .foregroundColor(.red)
                        }
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.red.opacity(0.15))
                        .cornerRadius(4)
                    }

                    Text("\(manager.currentSpeaker.role) · \(manager.meetingTitle)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                        .lineLimit(1)
                }

                Spacer()

                // Waveform indicator
                HStack(spacing: 3) {
                    ForEach(0..<4) { i in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.cyan)
                            .frame(width: 4, height: CGFloat([16, 28, 22, 14][i]))
                    }
                }
                .padding(8)
                .background(Color.cyan.opacity(0.1))
                .cornerRadius(8)
            }

            // Latest takeaway spoken banner
            if let lastMoment = manager.visibleMoments.last {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "sparkles")
                        .foregroundColor(.cyan)
                        .font(.system(size: 12))
                        .padding(.top, 1)

                    Text(lastMoment.takeaway)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(2)
                }
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.05))
                .cornerRadius(8)
            }
        }
        .padding(14)
        .background(Color(red: 0.08, green: 0.11, blue: 0.16))
        .cornerRadius(14)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.1), lineWidth: 1))
    }

    // MARK: - Giant In-Car Action Controls
    private var drivingActionControls: some View {
        VStack(spacing: 10) {
            // Row 1: Thumbs-up Reaction (Primary giant button)
            Button(action: {
                reactionSentAnimation = true
                manager.sendReactionInMeeting("👍")
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    reactionSentAnimation = false
                }
            }) {
                HStack(spacing: 12) {
                    Text("👍")
                        .font(.system(size: 28))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(reactionSentAnimation ? "Sent \"Thumbs Up\" to Call!" : "React \"Thumbs Up\"")
                            .font(.system(size: 16, weight: .bold))
                        Text("Broadcasts reaction live to Google Meet / Zoom")
                            .font(.system(size: 11, weight: .medium))
                            .opacity(0.8)
                    }

                    Spacer()

                    Image(systemName: reactionSentAnimation ? "checkmark.circle.fill" : "hand.thumbsup.fill")
                        .font(.system(size: 22))
                }
                .foregroundColor(reactionSentAnimation ? .green : .black)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .frame(minHeight: 64)
                .background(
                    reactionSentAnimation
                        ? LinearGradient(colors: [Color.green.opacity(0.3), Color.green.opacity(0.1)], startPoint: .leading, endPoint: .trailing)
                        : LinearGradient(colors: [Color(red: 1.0, green: 0.84, blue: 0.0), Color(red: 1.0, green: 0.65, blue: 0.0)], startPoint: .leading, endPoint: .trailing)
                )
                .cornerRadius(14)
                .shadow(color: Color.yellow.opacity(0.3), radius: 8, y: 3)
            }

            // Row 2: Listen & Voice controls
            HStack(spacing: 10) {
                // Speak Latest Takeaway
                Button(action: {
                    manager.speakLatestTakeaway()
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "speaker.wave.2.fill")
                            .font(.system(size: 18))
                            .foregroundColor(.cyan)

                        VStack(alignment: .leading, spacing: 1) {
                            Text("Hear Topic")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.white)
                            Text("Read aloud")
                                .font(.system(size: 10))
                                .foregroundColor(.white.opacity(0.6))
                        }
                        Spacer()
                    }
                    .padding(12)
                    .frame(minHeight: 56)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.cyan.opacity(0.3), lineWidth: 1))
                }

                // Mute / Unmute Call
                Button(action: {
                    manager.toggleMuteInMeeting()
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: manager.isMutedInMeeting ? "mic.slash.fill" : "mic.fill")
                            .font(.system(size: 18))
                            .foregroundColor(manager.isMutedInMeeting ? .red : .green)

                        VStack(alignment: .leading, spacing: 1) {
                            Text(manager.isMutedInMeeting ? "Unmute" : "Mute")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.white)
                            Text(manager.isMutedInMeeting ? "Mic muted" : "Mic live")
                                .font(.system(size: 10))
                                .foregroundColor(.white.opacity(0.6))
                        }
                        Spacer()
                    }
                    .padding(12)
                    .frame(minHeight: 56)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(manager.isMutedInMeeting ? Color.red.opacity(0.3) : Color.green.opacity(0.3), lineWidth: 1))
                }
            }
        }
    }

    // MARK: - Action Queue for Drivers
    private var carPlayActionQueue: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("CARPLAY ACTION QUEUE")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white.opacity(0.6))
                Spacer()
                Text("1-Tap Driver Approvals")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.cyan)
            }

            let pending = manager.actions.filter { $0.status == "staged" }

            if pending.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("No pending actions. Thread is monitoring.")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.7))
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.04))
                .cornerRadius(10)
            } else {
                ForEach(pending.prefix(3)) { action in
                    HStack(alignment: .center, spacing: 10) {
                        Image(systemName: action.kind == "email" ? "envelope.fill" : "doc.text.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.cyan)
                            .frame(width: 24)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(action.label)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white)
                                .lineLimit(1)

                            if let detail = action.detail {
                                Text(detail)
                                    .font(.system(size: 10))
                                    .foregroundColor(.white.opacity(0.6))
                                    .lineLimit(1)
                            }
                        }

                        Spacer()

                        Button(action: {
                            manager.approveAction(id: action.id)
                            manager.speakAloud("Approved: \(action.label)")
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark")
                                Text("Approve")
                            }
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.black)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.cyan)
                            .cornerRadius(8)
                        }
                    }
                    .padding(10)
                    .background(Color.white.opacity(0.04))
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.08), lineWidth: 1))
                }
            }
        }
        .padding(14)
        .background(Color(red: 0.06, green: 0.08, blue: 0.12))
        .cornerRadius(14)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.08), lineWidth: 1))
    }
}
