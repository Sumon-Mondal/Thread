import Foundation
import Combine
import ActivityKit

public struct LiveMomentItem: Codable, Identifiable, Hashable {
    public let id: String
    public let type: String
    public let takeaway: String
    public let speaker: String?
    public let timeSec: Int?
    public let link: String?
}

public struct LiveActionItem: Codable, Identifiable, Hashable {
    public let id: String
    public let label: String
    public var status: String
    public let detail: String?
    public let link: String?
}

public struct LiveSnapshot: Codable {
    public var meetingTitle: String
    public var playing: Bool
    public var elapsed: Int
    public var speaker: String
    public var lastLine: String
    public var shortHeadline: String?
    public var source: String?
    public var momentCount: Int
    public var latestMoment: LiveMomentItem?
    public var actions: [LiveActionItem]
    public var updatedAt: String?
}

@MainActor
public class ThreadSessionManager: ObservableObject {
    public static let shared = ThreadSessionManager()

    @Published public var snapshot: LiveSnapshot = LiveSnapshot(
        meetingTitle: "Nova Dynamics — Discovery Day",
        playing: true,
        elapsed: 42,
        speaker: "Sarah Chen",
        lastLine: "Our Summer 2027 Software Engineering internship applications officially open today.",
        shortHeadline: "Internships Open",
        source: "web",
        momentCount: 3,
        latestMoment: LiveMomentItem(id: "m1", type: "OPPORTUNITY", takeaway: "Summer 2027 SWE internship applications open today.", speaker: "Sarah Chen", timeSec: 18, link: "/apply/internship-app"),
        actions: [
            LiveActionItem(id: "a1", label: "Save application portal link", status: "executed", detail: "Extracted from slide QR code", link: "/apply/internship-app"),
            LiveActionItem(id: "a2", label: "Stage deadline reminder — Oct 18", status: "staged", detail: "Hard cutoff announced by Sarah", link: nil),
            LiveActionItem(id: "a3", label: "Draft thank-you email to Sarah Chen", status: "staged", detail: "Ready to send via connected Gmail", link: nil)
        ],
        updatedAt: nil
    )

    @Published public var transcriptHistory: [(speaker: String, text: String)] = [
        ("Sarah Chen", "Welcome everyone to Nova Dynamics Discovery Day!"),
        ("Sarah Chen", "Quick housekeeping — this session is being recorded."),
        ("Sarah Chen", "Our Summer 2027 Software Engineering internship applications officially open today.")
    ]

    @Published public var serverUrl: String = "https://project--51f06c23-f68d-49c7-8a46-ff0969ec8881.lovable.app"
    private var cancellables = Set<AnyCancellable>()
    private var syncTimer: Timer?
    private var liveActivity: Any? = nil // Activity<ThreadActivityAttributes>

    public init() {
        startSync()
    }

    public func startSync() {
        syncTimer?.invalidate()
        syncTimer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                await self?.fetchRemoteState()
            }
        }
    }

    public func fetchRemoteState() async {
        guard let url = URL(string: "\(serverUrl)/api/live-state") else { return }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            if let decoded = try? JSONDecoder().decode(LiveSnapshot.self, from: data) {
                self.snapshot = decoded
                updateLiveActivity()
            }
        } catch {
            // Offline fallback to current state
        }
    }

    public func approveAction(id: String) async {
        if let idx = snapshot.actions.firstIndex(where: { $0.id == id }) {
            snapshot.actions[idx].status = "executed"
        }

        guard let url = URL(string: "\(serverUrl)/api/live-state") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: String] = ["command": "approve", "actionId": id]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: req)
        updateLiveActivity()
    }

    // Dynamic Island Activity Management
    public func startLiveActivity() {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        let attributes = ThreadActivityAttributes(sessionId: UUID().uuidString)
        let firstStaged = snapshot.actions.first(where: { $0.status == "staged" })
        let state = ThreadActivityAttributes.ContentState(
            meetingTitle: snapshot.meetingTitle,
            speaker: snapshot.speaker,
            elapsedSeconds: snapshot.elapsed,
            shortHeadline: snapshot.shortHeadline ?? "Live Call",
            latestMomentType: snapshot.latestMoment?.type,
            latestMomentTakeaway: snapshot.latestMoment?.takeaway,
            stagedActionId: firstStaged?.id,
            stagedActionLabel: firstStaged?.label,
            isActionExecuted: false
        )

        do {
            let activity = try Activity<ThreadActivityAttributes>.request(
                attributes: attributes,
                content: .init(state: state, staleDate: nil)
            )
            self.liveActivity = activity
        } catch {
            print("Failed to start Live Activity: \(error)")
        }
    }

    public func updateLiveActivity() {
        guard let activity = liveActivity as? Activity<ThreadActivityAttributes> else { return }
        let firstStaged = snapshot.actions.first(where: { $0.status == "staged" })
        let updatedState = ThreadActivityAttributes.ContentState(
            meetingTitle: snapshot.meetingTitle,
            speaker: snapshot.speaker,
            elapsedSeconds: snapshot.elapsed,
            shortHeadline: snapshot.shortHeadline ?? "Live Call",
            latestMomentType: snapshot.latestMoment?.type,
            latestMomentTakeaway: snapshot.latestMoment?.takeaway,
            stagedActionId: firstStaged?.id,
            stagedActionLabel: firstStaged?.label,
            isActionExecuted: firstStaged == nil
        )

        Task {
            await activity.update(.init(state: updatedState, staleDate: nil))
        }
    }
}
