import Foundation

struct LiveMoment: Codable, Hashable { let type: String; let takeaway: String }
struct LiveAction: Codable, Hashable, Identifiable { let id: String; let label: String; let status: String }

struct LiveState: Codable {
    var meetingTitle: String?
    var playing: Bool
    var elapsed: Int?
    var speaker: String?
    var lastLine: String?
    var momentCount: Int?
    var latestMoment: LiveMoment?
    var actions: [LiveAction]?
    var updatedAt: String?

    static let placeholder = LiveState(meetingTitle: "No meeting connected", playing: false, elapsed: 0,
        speaker: nil, lastLine: nil, momentCount: 0,
        latestMoment: nil,
        actions: [], updatedAt: nil)
}

enum LiveFeed {
    // Configure a published, authenticated companion endpoint before shipping native targets.
    static let url = URL(string: "https://project--51f06c23-f68d-49c7-8a46-ff0969ec8881.lovable.app/api/live-state")!
    /// Sends Approve / Later from the watch back to the web app, which applies it on its next sync.
    static func send(_ command: String, actionId: String? = nil) async {
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        var body: [String: String] = ["command": command]
        if let actionId { body["actionId"] = actionId }
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: req)
    }
    static func fetch() async -> LiveState {
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let s = try? JSONDecoder().decode(LiveState.self, from: data) else { return .placeholder }
        return s
    }
}

func clock(_ s: Int?) -> String { let v = s ?? 0; return String(format: "%d:%02d", v / 60, v % 60) }
