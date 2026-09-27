import SwiftUI

@main
struct ThreadWatchApp: App {
    var body: some Scene { WindowGroup { WatchRoot() } }
}

@MainActor final class WatchModel: ObservableObject {
    @Published var state = LiveState.placeholder
    private var task: Task<Void, Never>?
    func start() {
        task?.cancel()
        task = Task { while !Task.isCancelled { state = await LiveFeed.fetch(); try? await Task.sleep(for: .seconds(3)) } }
    }
}

struct WatchRoot: View {
    @StateObject private var model = WatchModel()
    var body: some View {
        TabView {
            LiveGlance(s: model.state)
            MomentAlert(s: model.state)
            ActionList(s: model.state)
        }
        .tabViewStyle(.verticalPage)
        .onAppear { model.start() }
    }
}

struct LiveGlance: View {
    let s: LiveState
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Label(s.playing ? "LIVE · \(clock(s.elapsed))" : "PAUSED", systemImage: "waveform")
                .font(.caption2.bold()).foregroundStyle(s.playing ? .red : .secondary)
            Text(s.meetingTitle ?? "No meeting").font(.headline).lineLimit(2)
            Text(s.speaker ?? "").font(.caption).foregroundStyle(.teal)
            Text(s.lastLine ?? "").font(.caption2).foregroundStyle(.secondary).lineLimit(4)
        }.padding(.horizontal, 4)
    }
}

struct MomentAlert: View {
    let s: LiveState
    @State private var status: String?
    var body: some View {
        if let m = s.latestMoment {
            VStack(alignment: .leading, spacing: 6) {
                Text(m.type).font(.caption2.bold()).foregroundStyle(.teal)
                Text(m.takeaway).font(.body).lineLimit(4)
                if let status { Text(status).font(.caption).foregroundStyle(.teal) } else {
                    Button("Approve") { status = "Approved"; Task { await LiveFeed.send("approve") } }.tint(.teal)
                    Button("Later") { status = "Reminder set"; Task { await LiveFeed.send("later") } }
                }
            }
        } else { Text("No moments yet").foregroundStyle(.secondary) }
    }
}

struct ActionList: View {
    let s: LiveState
    var body: some View {
        List(s.actions ?? []) { a in
            Label(a.label, systemImage: a.status == "executed" ? "checkmark.circle.fill" : "circle").font(.caption)
        }
    }
}
