import SwiftUI

public struct CockpitView: View {
    @ObservedObject var manager = ThreadSessionManager.shared
    @State private var showingDynamicIslandAlert = false

    public init() {}

    public var body: some View {
        NavigationView {
            ZStack {
                // Background ambient dark glow
                Color(red: 0.04, green: 0.06, blue: 0.08)
                    .ignoresSafeArea()

                RadialGradient(
                    colors: [Color.blue.opacity(0.12), Color.clear],
                    center: .topLeading,
                    startRadius: 50,
                    endRadius: 400
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        // Header Bar
                        GlassCard {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack(spacing: 6) {
                                        Circle()
                                            .fill(Color.green)
                                            .frame(width: 8, height: 8)
                                        Text("LIVE INTELLIGENCE")
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundColor(.green)
                                    }
                                    Text(manager.snapshot.meetingTitle)
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(.white)
                                }
                                Spacer()
                                Button(action: {
                                    manager.startLiveActivity()
                                    showingDynamicIslandAlert = true
                                }) {
                                    HStack(spacing: 4) {
                                        Image(systemName: "circle.circle")
                                        Text("Dynamic Island")
                                    }
                                    .font(.system(size: 11, weight: .semibold))
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(Color.blue.opacity(0.2))
                                    .foregroundColor(.blue)
                                    .cornerRadius(8)
                                }
                            }
                        }

                        // Active Speaker & Understanding
                        GlassCard {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Circle()
                                        .fill(Color.blue.opacity(0.3))
                                        .frame(width: 32, height: 32)
                                        .overlay(
                                            Text(String(manager.snapshot.speaker.prefix(2)).uppercased())
                                                .font(.system(size: 12, weight: .bold))
                                                .foregroundColor(.blue)
                                        )
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(manager.snapshot.speaker)
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundColor(.white)
                                        Text("Active Speaker")
                                            .font(.system(size: 11))
                                            .foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    // Animated Waveform Indicator
                                    HStack(spacing: 3) {
                                        ForEach(0..<4) { i in
                                            RoundedRectangle(cornerRadius: 1)
                                                .fill(Color.blue)
                                                .frame(width: 3, height: CGFloat(8 + (i % 3) * 6))
                                        }
                                    }
                                }

                                if let moment = manager.snapshot.latestMoment {
                                    VStack(alignment: .leading, spacing: 4) {
                                        MomentTag(moment.type)
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

                        // Agent Action Queue
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text("AGENT ACTION QUEUE")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("\(manager.snapshot.actions.filter { $0.status == "staged" }.count) awaiting")
                                    .font(.system(size: 10, weight: .semibold))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.orange.opacity(0.2))
                                    .foregroundColor(.orange)
                                    .cornerRadius(6)
                            }

                            ForEach(manager.snapshot.actions) { action in
                                GlassCard {
                                    VStack(alignment: .leading, spacing: 8) {
                                        HStack(alignment: .top) {
                                            Image(systemName: action.status == "executed" ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                                                .foregroundColor(action.status == "executed" ? .green : .orange)
                                                .font(.system(size: 14))
                                                .padding(.top, 2)
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(action.label)
                                                    .font(.system(size: 13, weight: .semibold))
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
                                                let generator = UIImpactFeedbackGenerator(style: .medium)
                                                generator.impactOccurred()
                                                Task {
                                                    await manager.approveAction(id: action.id)
                                                }
                                            }) {
                                                Text("Approve & Execute")
                                                    .font(.system(size: 12, weight: .bold))
                                                    .frame(maxWidth: .infinity)
                                                    .padding(.vertical, 8)
                                                    .background(Color.blue)
                                                    .foregroundColor(.white)
                                                    .cornerRadius(8)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Live Transcript
                        VStack(alignment: .leading, spacing: 10) {
                            Text("LIVE TRANSCRIPT")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.secondary)

                            GlassCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    ForEach(manager.transcriptHistory, id: \.text) { item in
                                        HStack(alignment: .top, spacing: 8) {
                                            Text(item.speaker + ":")
                                                .font(.system(size: 12, weight: .bold))
                                                .foregroundColor(.blue)
                                            Text(item.text)
                                                .font(.system(size: 12))
                                                .foregroundColor(.white.opacity(0.85))
                                        }
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                    .padding(16)
                }
            }
            .navigationBarHidden(true)
            .alert(isPresented: $showingDynamicIslandAlert) {
                Alert(
                    title: Text("Dynamic Island Active"),
                    message: Text("Thread is now streaming live 3-word summaries and 1-tap approvals directly to your Dynamic Island and Lock Screen."),
                    dismissButton: .default(Text("Got it"))
                )
            }
        }
    }
}
