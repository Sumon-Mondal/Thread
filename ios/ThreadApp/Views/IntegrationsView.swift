import SwiftUI

public struct ConnectorItem: Identifiable {
    public let id: String
    public let name: String
    public let category: String
    public let iconName: String
    public let iconColor: Color
    public var isConnected: Bool
    public var accountDetail: String?
    public let description: String

    public init(id: String, name: String, category: String, iconName: String, iconColor: Color, isConnected: Bool, accountDetail: String? = nil, description: String) {
        self.id = id
        self.name = name
        self.category = category
        self.iconName = iconName
        self.iconColor = iconColor
        self.isConnected = isConnected
        self.accountDetail = accountDetail
        self.description = description
    }
}

public struct IntegrationsView: View {
    @ObservedObject var manager = ThreadSessionManager.shared
    @State private var vmMeetingUrl: String = ""
    @State private var isBotRunning: Bool = false
    @State private var botStatusText: String = "Virtual Machine bot is on standby"
    @State private var isDispatchingBot: Bool = false
    @State private var selectedConnector: ConnectorItem? = nil
    @State private var googleEmailInput: String = "sumonmondal@gmail.com"
    @State private var apiKeyInput: String = ""
    @State private var icalUrlInput: String = ""
    @State private var testFeedbackText: String? = nil
    @State private var isTestingConnector: Bool = false

    @State private var connectors: [ConnectorItem] = [
        ConnectorItem(id: "gcal", name: "Google Calendar", category: "Calendar", iconName: "calendar", iconColor: .cyan, isConnected: true, accountDetail: "sumonmondal@gmail.com", description: "Syncs deadlines and upcoming calls to your Google account."),
        ConnectorItem(id: "gmail", name: "Gmail", category: "Email", iconName: "envelope.fill", iconColor: .teal, isConnected: true, accountDetail: "sumonmondal@gmail.com", description: "Drafts and delivers follow-up emails upon your approval."),
        ConnectorItem(id: "gmeet", name: "Google Meet", category: "Meetings", iconName: "video.fill", iconColor: .green, isConnected: true, description: "Live caption stream, speaker tags, and QR code extraction."),
        ConnectorItem(id: "zoom", name: "Zoom", category: "Meetings", iconName: "video.bubble.left.fill", iconColor: .blue, isConnected: true, description: "Auto-detects Zoom meetings and stages 1-tap join links."),
        ConnectorItem(id: "notion", name: "Notion", category: "Notes & Docs", iconName: "doc.text.fill", iconColor: .purple, isConnected: false, description: "Syncs meeting decisions, takeaways, and tasks directly to a Notion page."),
        ConnectorItem(id: "outlook-mail", name: "Microsoft Outlook", category: "Email & Calendar", iconName: "envelope.badge.fill", iconColor: .blue, isConnected: false, description: "Send follow-up emails and sync deadlines to Microsoft 365."),
        ConnectorItem(id: "teams", name: "Microsoft Teams", category: "Meetings", iconName: "person.2.fill", iconColor: .indigo, isConnected: false, description: "Post meeting summaries and approval cards to your Teams channels.")
    ]

    public init() {}

    public var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.06, blue: 0.08)
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    // Header Banner
                    headerSection

                    // 1. Cloud Virtual Machine Meeting Bot Dispatcher
                    vmBotSection

                    // 2. Connected Webapps & APIs
                    connectorsListSection
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .padding(.bottom, 60)
            }
        }
        .navigationTitle("Connectors")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $selectedConnector) { conn in
            connectorConfigSheet(conn)
        }
        .onAppear {
            fetchServerConnectors()
        }
    }

    // MARK: - Header
    private var headerSection: some View {
        HStack(spacing: 12) {
            ThreadLogoBadge(size: 38)
            VStack(alignment: .leading, spacing: 2) {
                Text("API Connectors & Integrations")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text("Google Calendar, Gmail, Notion, Outlook, Zoom & Meet")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(ThreadTheme.surface.opacity(0.8))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(ThreadTheme.cardBorder, lineWidth: 1))
        )
    }

    // MARK: - Virtual Machine Control & Activity Hub
    private var vmBotSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Section Title
            HStack {
                Image(systemName: "cpu.fill")
                    .foregroundColor(ThreadTheme.cyan)
                Text("VIRTUAL MACHINE CONTROL CENTER")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
                Spacer()
                HStack(spacing: 5) {
                    Circle()
                        .fill(manager.isVmBotRunning ? Color.green : Color.cyan)
                        .frame(width: 6, height: 6)
                    Text(manager.isVmBotRunning ? "BOT ACTIVE" : "VM ONLINE")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(manager.isVmBotRunning ? .green : ThreadTheme.cyan)
                }
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background((manager.isVmBotRunning ? Color.green : Color.cyan).opacity(0.15))
                .cornerRadius(5)
            }

            VStack(spacing: 12) {
                // 1. VM Telemetry & Identity Pill
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Host: thread-vm-us-east.cloud")
                            .font(.system(size: 11, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                        Text("Identity: sumonmondal@gmail.com · US-East (18ms)")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Text("Chrome v124")
                        .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.white.opacity(0.08))
                        .foregroundColor(.white.opacity(0.8))
                        .cornerRadius(4)
                }
                .padding(10)
                .background(Color.black.opacity(0.3))
                .cornerRadius(8)

                // 2. Authenticated Accounts on VM
                VStack(alignment: .leading, spacing: 6) {
                    Text("SYNCHRONIZED VM ACCOUNTS")
                        .font(.system(size: 9.5, weight: .black))
                        .foregroundColor(.secondary)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                        vmAccountBadge(name: "Google Calendar", status: "Synced", icon: "calendar", isOk: true)
                        vmAccountBadge(name: "Gmail Outbox", status: "Ready", icon: "envelope.fill", isOk: true)
                        vmAccountBadge(name: "Zoom Desktop", status: "Logged In", icon: "video.fill", isOk: true)
                        vmAccountBadge(name: "Google Meet", status: "WebRTC Hooked", icon: "person.wave.2.fill", isOk: true)
                    }
                }

                // 3. Upcoming Meeting Anticipation Queue (Detected from Calendar)
                if let upcoming = manager.upcomingMeeting {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("CALENDAR ANTICIPATION QUEUE")
                                .font(.system(size: 9.5, weight: .black))
                                .foregroundColor(.orange)
                            Spacer()
                            Text("STARTS IN ~\(upcoming.minutesUntilStart) MIN")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(.orange)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.orange.opacity(0.18))
                                .cornerRadius(4)
                        }

                        VStack(alignment: .leading, spacing: 3) {
                            Text(upcoming.title)
                                .font(.system(size: 12.5, weight: .bold))
                                .foregroundColor(.white)
                            Text("\(upcoming.platform) · \(upcoming.start)")
                                .font(.system(size: 10.5))
                                .foregroundColor(.secondary)
                        }

                        if manager.isVmBotRunning {
                            HStack {
                                Label("Bot Active in Meeting Session", systemImage: "checkmark.circle.fill")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.green)
                                Spacer()
                                Button("Stop Bot") {
                                    manager.stopVmMeetingBot()
                                    isBotRunning = false
                                }
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.red)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.red.opacity(0.15))
                                .cornerRadius(5)
                            }
                            .padding(8)
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(6)
                        } else {
                            Button(action: {
                                manager.joinMeetingOnBehalfOfUser(meetingUrl: upcoming.joinUrl, title: upcoming.title)
                                isBotRunning = true
                            }) {
                                HStack(spacing: 6) {
                                    Image(systemName: "bolt.fill")
                                    Text("Dispatch VM Bot to Join on My Behalf")
                                }
                                .font(.system(size: 12, weight: .bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 9)
                                .background(
                                    LinearGradient(
                                        colors: [Color.cyan, Color.blue],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .foregroundColor(.black)
                                .cornerRadius(8)
                            }
                        }
                    }
                    .padding(10)
                    .background(Color.orange.opacity(0.06))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.orange.opacity(0.25), lineWidth: 1))
                    .cornerRadius(8)
                }

                // 4. Auto-Join Policy
                VStack(alignment: .leading, spacing: 6) {
                    Text("AUTONOMOUS JOIN POLICY")
                        .font(.system(size: 9.5, weight: .black))
                        .foregroundColor(.secondary)

                    HStack(spacing: 6) {
                        policyOptionButton(id: "prompt_5min", label: "Prompt 5m Before", isSelected: manager.vmAutoJoinPolicy == "prompt_5min")
                        policyOptionButton(id: "auto_join", label: "Auto-Join Always", isSelected: manager.vmAutoJoinPolicy == "auto_join")
                        policyOptionButton(id: "manual", label: "Manual Only", isSelected: manager.vmAutoJoinPolicy == "manual")
                    }
                }

                // 5. Custom Meeting URL Dispatch
                VStack(alignment: .leading, spacing: 6) {
                    Text("DIRECT CALL DISPATCH")
                        .font(.system(size: 9.5, weight: .black))
                        .foregroundColor(.secondary)

                    TextField("Google Meet / Zoom URL (e.g. https://meet.google.com/xyz)...", text: $vmMeetingUrl)
                        .font(.system(size: 11.5))
                        .padding(9)
                        .background(Color.black.opacity(0.35))
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))
                        .foregroundColor(.white)

                    HStack(spacing: 8) {
                        if manager.isVmBotRunning || isBotRunning {
                            Button(action: {
                                stopBot()
                                manager.stopVmMeetingBot()
                            }) {
                                HStack {
                                    Image(systemName: "stop.fill")
                                    Text("Stop VM Bot")
                                }
                                .font(.system(size: 11.5, weight: .bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(Color.red.opacity(0.85))
                                .foregroundColor(.white)
                                .cornerRadius(8)
                            }
                        } else {
                            Button(action: startBot) {
                                HStack {
                                    if isDispatchingBot {
                                        ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .black))
                                    } else {
                                        Image(systemName: "play.fill")
                                    }
                                    Text("Dispatch Bot to Call")
                                }
                                .font(.system(size: 11.5, weight: .bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(ThreadTheme.cyan)
                                .foregroundColor(.black)
                                .cornerRadius(8)
                            }
                            .disabled(vmMeetingUrl.trimmingCharacters(in: .whitespaces).isEmpty || isDispatchingBot)
                        }
                    }
                }

                // 6. Live VM Terminal Logs
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("LIVE VM TERMINAL LOGS")
                            .font(.system(size: 9.5, weight: .black, design: .monospaced))
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("PORT: 8080")
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundColor(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text("[VM] Puppeteer engine online (thread-vm-us-east.cloud)")
                        Text("[VM] Google Workspace authenticated: sumonmondal@gmail.com")
                        Text("[VM] Calendar watcher: 'Thread Strategy & Enterprise Architecture Review' (starts in ~5m)")
                        Text("[VM] Policy: \(manager.vmAutoJoinPolicy == "prompt_5min" ? "Prompt 5 Mins Before" : "Auto-Join Immediately")")
                        if manager.isVmBotRunning {
                            Text("[VM] ACTIVE: Connected to Google Meet room & streaming transcripts")
                                .foregroundColor(.green)
                        } else {
                            Text("[VM] Standby: Ready for autonomous dispatch")
                                .foregroundColor(.cyan)
                        }
                    }
                    .font(.system(size: 9.5, design: .monospaced))
                    .foregroundColor(.white.opacity(0.75))
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.black.opacity(0.6))
                    .cornerRadius(6)
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(ThreadTheme.surface.opacity(0.85))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(ThreadTheme.cyan.opacity(0.25), lineWidth: 1))
            )
        }
    }

    private func vmAccountBadge(name: String, status: String, icon: String, isOk: Bool) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundColor(isOk ? .green : .secondary)
            VStack(alignment: .leading, spacing: 1) {
                Text(name)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.white)
                Text(status)
                    .font(.system(size: 8.5))
                    .foregroundColor(isOk ? .green.opacity(0.9) : .secondary)
            }
            Spacer()
        }
        .padding(7)
        .background(Color.black.opacity(0.25))
        .cornerRadius(6)
    }

    private func policyOptionButton(id: String, label: String, isSelected: Bool) -> some View {
        Button(action: {
            updatePolicy(id)
        }) {
            Text(label)
                .font(.system(size: 10, weight: .bold))
                .lineLimit(1)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 7)
                .background(isSelected ? ThreadTheme.cyan : Color.white.opacity(0.06))
                .foregroundColor(isSelected ? .black : .white.opacity(0.8))
                .cornerRadius(6)
        }
    }

    // MARK: - Connectors List Section
    private var connectorsListSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "network")
                    .foregroundColor(ThreadTheme.sapphire)
                Text("INTEGRATED APPLICATION APIS")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 10) {
                ForEach(connectors) { conn in
                    HStack(spacing: 12) {
                        Circle()
                            .fill(conn.iconColor.opacity(0.18))
                            .frame(width: 40, height: 40)
                            .overlay(
                                Image(systemName: conn.iconName)
                                    .font(.system(size: 17))
                                    .foregroundColor(conn.iconColor)
                            )

                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(conn.name)
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(.white)
                                Text(conn.category)
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundColor(.secondary)
                            }
                            if let detail = conn.accountDetail, conn.isConnected {
                                Text("● \(detail)")
                                    .font(.system(size: 10, design: .monospaced))
                                    .foregroundColor(ThreadTheme.cyan)
                            } else {
                                Text(conn.description)
                                    .font(.system(size: 11))
                                    .foregroundColor(.white.opacity(0.68))
                                    .lineLimit(2)
                            }
                        }

                        Spacer()

                        Button(action: {
                            selectedConnector = conn
                            apiKeyInput = ""
                            icalUrlInput = ""
                            testFeedbackText = nil
                        }) {
                            Text(conn.isConnected ? "Manage" : "Connect")
                                .font(.system(size: 11, weight: .bold))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(conn.isConnected ? Color.green.opacity(0.15) : Color.white.opacity(0.08))
                                .foregroundColor(conn.isConnected ? .green : .white)
                                .cornerRadius(8)
                        }
                    }
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(ThreadTheme.surface.opacity(0.7))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(ThreadTheme.cardBorder, lineWidth: 1))
                    )
                }
            }
        }
    }

    // MARK: - Connector Configuration Sheet
    private func connectorConfigSheet(_ conn: ConnectorItem) -> some View {
        ZStack {
            Color(red: 0.04, green: 0.06, blue: 0.08)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Circle()
                        .fill(conn.iconColor.opacity(0.2))
                        .frame(width: 36, height: 36)
                        .overlay(Image(systemName: conn.iconName).foregroundColor(conn.iconColor))

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Configure \(conn.name)")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.white)
                        Text(conn.category)
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Button("Done") {
                        selectedConnector = nil
                    }
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(ThreadTheme.cyan)
                }

                Text(conn.description)
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.8))

                // GOOGLE CALENDAR / GMAIL
                if conn.id == "gcal" || conn.id == "gmail" {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Google Account Email")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.white)
                        TextField("you@gmail.com", text: $googleEmailInput)
                            .font(.system(size: 12))
                            .padding(10)
                            .background(Color.black.opacity(0.4))
                            .cornerRadius(8)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            .foregroundColor(.white)
                            .autocapitalization(.none)

                        Text("Optional: OAuth Access Token / iCal Link")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.secondary)
                            .padding(.top, 4)
                        SecureField("ya29... or private .ics url", text: $apiKeyInput)
                            .font(.system(size: 12))
                            .padding(10)
                            .background(Color.black.opacity(0.4))
                            .cornerRadius(8)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            .foregroundColor(.white)
                    }
                } else if conn.id == "notion" {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Notion Integration Token")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.white)
                        SecureField("secret_...", text: $apiKeyInput)
                            .font(.system(size: 12))
                            .padding(10)
                            .background(Color.black.opacity(0.4))
                            .cornerRadius(8)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            .foregroundColor(.white)
                    }
                } else if conn.id.contains("outlook") {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Microsoft Graph Bearer Token / Work Email")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.white)
                        TextField("user@company.com or token...", text: $apiKeyInput)
                            .font(.system(size: 12))
                            .padding(10)
                            .background(Color.black.opacity(0.4))
                            .cornerRadius(8)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            .foregroundColor(.white)
                            .autocapitalization(.none)
                    }
                }

                if let feedback = testFeedbackText {
                    Text(feedback)
                        .font(.system(size: 11.5))
                        .foregroundColor(feedback.contains("✓") || feedback.contains("Success") ? .green : .orange)
                        .padding(10)
                        .background(Color.white.opacity(0.04))
                        .cornerRadius(8)
                }

                Button(action: {
                    testConnector(conn)
                }) {
                    HStack {
                        if isTestingConnector {
                            ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .black))
                        }
                        Text(isTestingConnector ? "Connecting…" : "Verify & Connect Account")
                    }
                    .font(.system(size: 12, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(ThreadTheme.cyan)
                    .foregroundColor(.black)
                    .cornerRadius(8)
                }
                .disabled(isTestingConnector)

                Spacer()
            }
            .padding(20)
        }
    }

    // MARK: - Actions
    private func fetchServerConnectors() {
        guard let url = URL(string: "\(manager.serverUrl)/api/connectors") else { return }
        Task {
            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let list = json["connectors"] as? [[String: Any]] {
                    for item in list {
                        if let id = item["id"] as? String,
                           let idx = connectors.firstIndex(where: { $0.id == id }) {
                            let status = item["status"] as? String ?? ""
                            let accountEmail = item["accountEmail"] as? String
                            connectors[idx].isConnected = (status == "connected")
                            if let email = accountEmail {
                                connectors[idx].accountDetail = email
                            }
                        }
                    }
                }
            } catch {}
        }
    }

    private func startBot() {
        guard let url = URL(string: "\(manager.serverUrl)/api/vm-bot") else { return }
        isDispatchingBot = true
        botStatusText = "Connecting to Virtual Machine…"

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload: [String: Any] = ["action": "start", "meetingUrl": vmMeetingUrl]
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        Task {
            do {
                let (data, _) = try await URLSession.shared.data(for: req)
                isDispatchingBot = false
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let ok = json["ok"] as? Bool, ok {
                    isBotRunning = true
                    botStatusText = "✓ VM Bot Active: Joined \(vmMeetingUrl)"
                    manager.showNotification(text: "🤖 VM Bot Joined Meeting Successfully!")
                } else {
                    botStatusText = "Error launching bot. Check URL."
                }
            } catch {
                isDispatchingBot = false
                botStatusText = "Network error connecting to VM."
            }
        }
    }

    private func stopBot() {
        guard let url = URL(string: "\(manager.serverUrl)/api/vm-bot") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload: [String: Any] = ["action": "stop"]
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        Task {
            _ = try? await URLSession.shared.data(for: req)
            isBotRunning = false
            botStatusText = "Virtual Machine bot stopped."
            manager.showNotification(text: "VM Bot Disconnected")
        }
    }

    private func updatePolicy(_ policy: String) {
        manager.vmAutoJoinPolicy = policy
        guard let url = URL(string: "\(manager.serverUrl)/api/vm-bot") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload: [String: Any] = ["action": "set_policy", "policy": policy]
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        Task {
            _ = try? await URLSession.shared.data(for: req)
            let policyName = (policy == "prompt_5min" ? "Prompt 5 Mins Before" : (policy == "auto_join" ? "Auto-Join Always" : "Manual Only"))
            manager.showNotification(text: "VM Policy: \(policyName)")
        }
    }

    private func testConnector(_ conn: ConnectorItem) {
        guard let url = URL(string: "\(manager.serverUrl)/api/connectors") else { return }
        isTestingConnector = true

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        var payload: [String: Any] = [
            "connectorId": conn.id,
            "action": "connect"
        ]

        if conn.id == "gcal" || conn.id == "gmail" {
            payload["accountEmail"] = googleEmailInput.trimmingCharacters(in: .whitespaces)
            if !apiKeyInput.isEmpty {
                payload["apiKey"] = apiKeyInput.trimmingCharacters(in: .whitespaces)
            }
        } else {
            payload["apiKey"] = apiKeyInput
        }

        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        Task {
            do {
                let (data, _) = try await URLSession.shared.data(for: req)
                isTestingConnector = false
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    let success = json["success"] as? Bool ?? false
                    let msg = json["message"] as? String ?? "Done"
                    testFeedbackText = success ? "✓ \(msg)" : "⚠️ \(msg)"
                    if success {
                        if let idx = connectors.firstIndex(where: { $0.id == conn.id }) {
                            connectors[idx].isConnected = true
                            if let email = json["accountEmail"] as? String {
                                connectors[idx].accountDetail = email
                            }
                        }
                        manager.showNotification(text: "✓ \(conn.name) Connected")
                    }
                }
            } catch {
                isTestingConnector = false
                testFeedbackText = "Network error: \(error.localizedDescription)"
            }
        }
    }
}
