import SwiftUI

@main
struct ThreadApp: App {
    @StateObject private var sessionManager = ThreadSessionManager.shared

    var body: some Scene {
        WindowGroup {
            TabView {
                CockpitView()
                    .tabItem {
                        Label("Cockpit", systemImage: "waveform.badge.magnifyingglass")
                    }

                AgentView()
                    .tabItem {
                        Label("Agent", systemImage: "sparkles")
                    }
            }
            .accentColor(.blue)
            .preferredColorScheme(.dark)
            // Handle 1-Tap Approvals coming directly from the Dynamic Island!
            .onOpenURL { url in
                handleDeepLink(url)
            }
        }
    }

    private func handleDeepLink(_ url: URL) {
        guard url.scheme == "threadapp" else { return }

        if url.host == "approve" {
            let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            if let actionId = components?.queryItems?.first(where: { $0.name == "id" })?.value {
                Task {
                    let generator = UINotificationFeedbackGenerator()
                    generator.notificationOccurred(.success)
                    await sessionManager.approveAction(id: actionId)
                }
            }
        }
    }
}
