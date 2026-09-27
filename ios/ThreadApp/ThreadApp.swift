import SwiftUI
import ActivityKit
import UserNotifications

@main
struct ThreadApp: App {
    @StateObject private var sessionManager = ThreadSessionManager.shared

    init() {
        // Clear any stale live activities
        Task {
            for activity in Activity<ThreadActivityAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
        // Register notification categories & request permission
        ThreadNotificationManager.shared.setup()
    }

    @AppStorage("Thread_selectedTab") private var selectedTab: Int = 0

    var body: some Scene {
        WindowGroup {
            TabView(selection: $selectedTab) {
                CockpitView()
                    .tabItem {
                        Label("Cockpit", systemImage: "waveform.badge.magnifyingglass")
                    }
                    .tag(0)

                AgentView()
                    .tabItem {
                        Label("Agent", systemImage: "sparkles")
                    }
                    .tag(1)

                NavigationView {
                    IntegrationsView()
                }
                .tabItem {
                    Label("Connectors", systemImage: "link.badge.plus")
                }
                .tag(2)

                SettingsView()
                    .tabItem {
                        Label("Settings", systemImage: "gearshape.fill")
                    }
                    .tag(3)
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
