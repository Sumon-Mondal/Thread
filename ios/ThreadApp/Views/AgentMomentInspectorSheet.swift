import SwiftUI

public struct InspectorChatMessage: Identifiable, Equatable {
    public let id: String
    public let isUser: Bool
    public let text: String
    public let timestamp: Date
    public var emailPayload: AgentEmailPayload?
    public var calendarPayload: AgentCalendarPayload?
    public var formPayload: AgentFormPayload?
    public var linkPayload: String?

    public init(
        id: String = UUID().uuidString,
        isUser: Bool,
        text: String,
        timestamp: Date = Date(),
        emailPayload: AgentEmailPayload? = nil,
        calendarPayload: AgentCalendarPayload? = nil,
        formPayload: AgentFormPayload? = nil,
        linkPayload: String? = nil
    ) {
        self.id = id
        self.isUser = isUser
        self.text = text
        self.timestamp = timestamp
        self.emailPayload = emailPayload
        self.calendarPayload = calendarPayload
        self.formPayload = formPayload
        self.linkPayload = linkPayload
    }

    public static func == (lhs: InspectorChatMessage, rhs: InspectorChatMessage) -> Bool {
        lhs.id == rhs.id
    }
}

public struct AgentMomentInspectorSheet: View {
    public let moment: DemoMoment
    @ObservedObject var manager = ThreadSessionManager.shared
    @Environment(\.dismiss) private var dismiss

    @State private var inputPrompt: String = ""
    @State private var messages: [InspectorChatMessage] = []
    @State private var isAnalyzing: Bool = false
    @State private var executedActions: Set<String> = []

    public init(moment: DemoMoment) {
        self.moment = moment
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                ThreadTheme.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Top Moment Banner & Minute Gist
                    momentContextBanner

                    Divider().background(Color.white.opacity(0.08))

                    // Conversation / Generative Workspace
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(alignment: .leading, spacing: 14) {
                                // Default Agent greeting
                                agentGreetingCard

                                // Quick Inquiry Prompts
                                quickPromptsView

                                // Chat messages
                                ForEach(messages) { msg in
                                    messageRow(msg)
                                        .id(msg.id)
                                }

                                if isAnalyzing {
                                    HStack(spacing: 8) {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .cyan))
                                            .scaleEffect(0.85)
                                        Text("Thread Agent is analyzing Minute \(formatClock(moment.timeSec))…")
                                            .font(.system(size: 12))
                                            .foregroundColor(.secondary)
                                    }
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(Color.white.opacity(0.04))
                                    .cornerRadius(8)
                                    .id("analyzing_indicator")
                                }
                            }
                            .padding(16)
                        }
                        .onChange(of: messages.count) { _ in
                            if let last = messages.last {
                                withAnimation {
                                    proxy.scrollTo(last.id, anchor: .bottom)
                                }
                            }
                        }
                        .onChange(of: isAnalyzing) { analyzing in
                            if analyzing {
                                withAnimation {
                                    proxy.scrollTo("analyzing_indicator", anchor: .bottom)
                                }
                            }
                        }
                    }

                    Divider().background(Color.white.opacity(0.08))

                    // Bottom Agentic Text Space Bar
                    bottomInputBar
                }
            }
            .navigationTitle("Moment Intelligence")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.cyan)
                }
            }
        }
    }

    // MARK: - Top Moment Banner
    private var momentContextBanner: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                // Minute Timestamp Pill
                HStack(spacing: 4) {
                    Image(systemName: "clock.fill")
                        .font(.system(size: 9))
                    Text(formatClock(moment.timeSec))
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 3.5)
                .background(Color.cyan.opacity(0.2))
                .foregroundColor(.cyan)
                .cornerRadius(5)

                // Moment Type Tag
                MomentTag(moment.type)

                Spacer()

                // Speaker Pill
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.purple.opacity(0.8))
                        .frame(width: 6, height: 6)
                    Text(moment.speaker)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white.opacity(0.9))
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 3.5)
                .background(Color.white.opacity(0.06))
                .cornerRadius(5)
            }

            // The Minute Gist
            VStack(alignment: .leading, spacing: 3) {
                Text("MINUTE GIST")
                    .font(.system(size: 8.5, weight: .heavy))
                    .foregroundColor(.secondary)

                Text("\"\(moment.takeaway)\"")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                    .lineSpacing(2)
            }

            // Details / Scribed excerpt
            if !moment.detail.isEmpty {
                Text(moment.detail)
                    .font(.system(size: 11.5))
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            }
        }
        .padding(14)
        .background(Color(red: 0.08, green: 0.10, blue: 0.14))
    }

    // MARK: - Greeting Card
    private var agentGreetingCard: some View {
        HStack(alignment: .top, spacing: 10) {
            Circle()
                .fill(LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 28, height: 28)
                .overlay(
                    Image(systemName: "sparkles")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text("Thread Autonomous Agent")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.cyan)
                Text("I have contextualized Minute \(formatClock(moment.timeSec)) with \(moment.speaker). Ask me what happened, check for deadlines or email contacts, or tap an action below.")
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.9))
                    .lineSpacing(2)
            }
        }
        .padding(12)
        .background(Color.white.opacity(0.04))
        .cornerRadius(10)
    }

    // MARK: - Quick Prompts
    private var quickPromptsView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                quickPromptPill(title: "💡 What happened?", prompt: "What happened at minute \(formatClock(moment.timeSec))?")
                quickPromptPill(title: "📅 Any deadlines?", prompt: "Were any dates or deadlines mentioned in this minute?")
                quickPromptPill(title: "✉️ Extract contacts", prompt: "Who was mentioned and should I send an email?")
                quickPromptPill(title: "🚀 Take action", prompt: "What action items can you execute for this moment?")
            }
        }
    }

    private func quickPromptPill(title: String, prompt: String) -> some View {
        Button(action: {
            sendPrompt(prompt)
        }) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.cyan.opacity(0.12))
                .foregroundColor(.cyan)
                .cornerRadius(14)
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.cyan.opacity(0.3), lineWidth: 1)
                )
        }
    }

    // MARK: - Message Row
    private func messageRow(_ msg: InspectorChatMessage) -> some View {
        VStack(alignment: msg.isUser ? .trailing : .leading, spacing: 8) {
            HStack {
                if msg.isUser { Spacer() }

                VStack(alignment: msg.isUser ? .trailing : .leading, spacing: 4) {
                    Text(msg.text)
                        .font(.system(size: 12.5))
                        .foregroundColor(.white)
                        .lineSpacing(2)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 9)
                        .background(msg.isUser ? Color.blue.opacity(0.85) : Color.white.opacity(0.07))
                        .cornerRadius(12)

                    Text(msg.isUser ? "You" : "Thread Agent")
                        .font(.system(size: 9.5))
                        .foregroundColor(.secondary)
                }

                if !msg.isUser { Spacer() }
            }

            // Inline Agentic Action Cards
            if !msg.isUser {
                if let event = msg.calendarPayload {
                    calendarActionCard(event: event)
                }
                if let email = msg.emailPayload {
                    emailActionCard(email: email)
                }
                if let link = msg.linkPayload {
                    linkActionCard(url: link)
                }
            }
        }
    }

    // MARK: - Action Cards
    private func calendarActionCard(event: AgentCalendarPayload) -> some View {
        let isDone = executedActions.contains("cal-\(event.title)")
        return GlassCard {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "calendar.badge.clock")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.red)
                    Text("CALENDAR MILESTONE")
                        .font(.system(size: 9.5, weight: .heavy))
                        .foregroundColor(.red)
                    Spacer()
                    if isDone {
                        Text("✓ ADDED")
                            .font(.system(size: 9, weight: .heavy))
                            .foregroundColor(.green)
                    }
                }

                Text(event.title)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)

                Text("Date: \(event.start) · Extracted from Minute \(formatClock(moment.timeSec))")
                    .font(.system(size: 10.5))
                    .foregroundColor(.secondary)

                Button(action: {
                    Task {
                        _ = await manager.executeDirectCalendarEvent(
                            title: event.title,
                            start: event.start,
                            durationMin: event.durationMin ?? 60,
                            notes: event.notes ?? "Scheduled by Thread from Minute \(formatClock(moment.timeSec))"
                        )
                        executedActions.insert("cal-\(event.title)")
                    }
                }) {
                    HStack(spacing: 5) {
                        Image(systemName: isDone ? "checkmark.circle.fill" : "calendar.badge.plus")
                        Text(isDone ? "Added to Google Calendar" : "Add to Google Calendar")
                            .font(.system(size: 11.5, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 7)
                    .background(isDone ? Color.green.opacity(0.3) : Color.red.opacity(0.8))
                    .foregroundColor(.white)
                    .cornerRadius(7)
                }
                .disabled(isDone)
            }
        }
    }

    private func emailActionCard(email: AgentEmailPayload) -> some View {
        let isDone = executedActions.contains("email-\(email.to)")
        return GlassCard {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "envelope.fill")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.cyan)
                    Text("STAGED EMAIL DRAFT")
                        .font(.system(size: 9.5, weight: .heavy))
                        .foregroundColor(.cyan)
                    Spacer()
                    if isDone {
                        Text("✓ DISPATCHED")
                            .font(.system(size: 9, weight: .heavy))
                            .foregroundColor(.green)
                    }
                }

                Text("To: \(email.to)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)

                Text("Subject: \(email.subject)")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.white.opacity(0.85))

                Text(email.body)
                    .font(.system(size: 10.5))
                    .foregroundColor(.secondary)
                    .lineLimit(3)

                Button(action: {
                    Task {
                        _ = await manager.executeDirectEmail(to: email.to, subject: email.subject, body: email.body)
                        executedActions.insert("email-\(email.to)")
                    }
                }) {
                    HStack(spacing: 5) {
                        Image(systemName: isDone ? "checkmark.circle.fill" : "paperplane.fill")
                        Text(isDone ? "Dispatched via Gmail" : "Send Now via Gmail")
                            .font(.system(size: 11.5, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 7)
                    .background(LinearGradient(colors: isDone ? [Color.green.opacity(0.4), Color.green.opacity(0.3)] : [Color.blue, Color.cyan], startPoint: .leading, endPoint: .trailing))
                    .foregroundColor(.white)
                    .cornerRadius(7)
                }
                .disabled(isDone)
            }
        }
    }

    private func linkActionCard(url: String) -> some View {
        let isDone = executedActions.contains("link-\(url)")
        return GlassCard {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "link.badge.plus")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.teal)
                    Text("APPLICATION & RESOURCE PORTAL")
                        .font(.system(size: 9.5, weight: .heavy))
                        .foregroundColor(.teal)
                    Spacer()
                    if isDone {
                        Text("✓ SUBMITTED")
                            .font(.system(size: 9, weight: .heavy))
                            .foregroundColor(.green)
                    }
                }

                Text(url)
                    .font(.system(size: 11.5, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)

                Button(action: {
                    Task {
                        _ = await manager.submitActiveForm()
                        executedActions.insert("link-\(url)")
                    }
                }) {
                    HStack(spacing: 5) {
                        Image(systemName: isDone ? "checkmark.circle.fill" : "doc.badge.arrow.up")
                        Text(isDone ? "Application Auto-filled & Submitted" : "Auto-fill with Candidate Profile & Submit")
                            .font(.system(size: 11.5, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 7)
                    .background(isDone ? Color.green.opacity(0.3) : Color.teal.opacity(0.85))
                    .foregroundColor(.white)
                    .cornerRadius(7)
                }
                .disabled(isDone)
            }
        }
    }

    // MARK: - Bottom Input Bar
    private var bottomInputBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "sparkles")
                .foregroundColor(.cyan)
                .font(.system(size: 14))

            TextField("Ask Agent what happened at \(formatClock(moment.timeSec))…", text: $inputPrompt)
                .font(.system(size: 13))
                .foregroundColor(.white)
                .onSubmit {
                    submitCurrentInput()
                }

            if isAnalyzing {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .cyan))
                    .frame(width: 24, height: 24)
            } else {
                Button(action: submitCurrentInput) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(inputPrompt.trimmingCharacters(in: .whitespaces).isEmpty ? .secondary : .cyan)
                }
                .disabled(inputPrompt.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color(red: 0.07, green: 0.08, blue: 0.11))
        .pushDownToDismissKeyboard()
    }

    private func submitCurrentInput() {
        let trimmed = inputPrompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        inputPrompt = ""
        sendPrompt(trimmed)
    }

    private func sendPrompt(_ text: String) {
        let userMsg = InspectorChatMessage(isUser: true, text: text)
        messages.append(userMsg)
        isAnalyzing = true

        let gen = UIImpactFeedbackGenerator(style: .light)
        gen.impactOccurred()

        Task {
            let result = await manager.queryMomentInspector(moment: moment, prompt: text)
            let agentMsg = InspectorChatMessage(
                isUser: false,
                text: result.reply,
                emailPayload: result.email,
                calendarPayload: result.event,
                formPayload: nil,
                linkPayload: result.link
            )
            isAnalyzing = false
            messages.append(agentMsg)

            let successFeedback = UINotificationFeedbackGenerator()
            successFeedback.notificationOccurred(.success)
        }
    }

    private func formatClock(_ sec: Int) -> String {
        let m = sec / 60
        let s = sec % 60
        return String(format: "%02d:%02d", m, s)
    }
}
