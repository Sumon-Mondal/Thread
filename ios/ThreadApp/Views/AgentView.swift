import SwiftUI
import UniformTypeIdentifiers
import Speech
import AVFoundation

public struct AgentChatMessage: Identifiable {
    public let id: String
    public let role: String // "user" | "agent"
    public var text: String
    public var steps: [String]?
    public var emailCard: AgentEmailCard?
    public var calendarCard: AgentCalendarCard?
    public var formCard: AgentFormCard?
    public var qrCard: AgentQrCard?
    public var batchCard: AgentBatchCard?
    public var vmBotCard: AgentVmBotCard?
    public let timestamp: Date

    public init(
        id: String = UUID().uuidString,
        role: String,
        text: String,
        steps: [String]? = nil,
        emailCard: AgentEmailCard? = nil,
        calendarCard: AgentCalendarCard? = nil,
        formCard: AgentFormCard? = nil,
        qrCard: AgentQrCard? = nil,
        batchCard: AgentBatchCard? = nil,
        vmBotCard: AgentVmBotCard? = nil,
        timestamp: Date = Date()
    ) {
        self.id = id
        self.role = role
        self.text = text
        self.steps = steps
        self.emailCard = emailCard
        self.calendarCard = calendarCard
        self.formCard = formCard
        self.qrCard = qrCard
        self.batchCard = batchCard
        self.vmBotCard = vmBotCard
        self.timestamp = timestamp
    }
}

public struct AgentVmBotCard {
    public let meetingTitle: String
    public let platform: String
    public let joinUrl: String
    public let minutesUntilStart: Int
    public var isJoined: Bool = false

    public init(
        meetingTitle: String,
        platform: String,
        joinUrl: String,
        minutesUntilStart: Int = 5,
        isJoined: Bool = false
    ) {
        self.meetingTitle = meetingTitle
        self.platform = platform
        self.joinUrl = joinUrl
        self.minutesUntilStart = minutesUntilStart
        self.isJoined = isJoined
    }
}

public struct AgentQrCard {
    public let label: String
    public let url: String
    public let via: String
    public let meetingTitle: String
}

public struct AgentBatchCard {
    public let meetingTitle: String
    public let recipients: [String]
    public let subject: String
    public let body: String
    public var isDispatched: Bool = false
}

public struct AgentEmailCard {
    public let to: String
    public let subject: String
    public let body: String
    public var isSent: Bool = false
}

public struct AgentCalendarCard {
    public let title: String
    public let start: String
    public let notes: String
    public var isAdded: Bool = false
}

public struct AgentFormCard {
    public let formId: String
    public let submitTo: String
    public let fields: [String: String]
    public var isSubmitted: Bool = false
}

public struct AgentView: View {
    @ObservedObject var manager = ThreadSessionManager.shared
    @State private var inputText = ""
    @State private var messages: [AgentChatMessage] = [
        AgentChatMessage(
            role: "agent",
            text: "I'm Thread's autonomous meeting agent. Tell me what you need—I can read your resume, auto-fill applications, draft follow-up emails, or schedule calendar events as you talk."
        )
    ]
    @State private var isDocumentPickerPresented = false
    @State private var attachedFileName: String? = "Sumon_Mondal_Resume.pdf"
    @State private var attachedResumeText: String = """
    Sumon Mondal
    Boston, MA · sumonmondal0701@gmail.com
    Northeastern University — B.S. in Computer Science & AI (Expected Dec 2027, GPA: 3.9)
    Skills: Python, Distributed Systems, Swift, PyTorch, Docker, TypeScript, Go
    Experience: Software Engineering Intern, ML Systems Research
    Projects: Distributed AI Inference Gateway, Real-Time Audio Streaming Pipeline
    """
    @State private var isThinking = false
    @State private var isDictating = false
    @State private var speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    @State private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    @State private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    public init() {}

    public var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.06, blue: 0.08)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header Bar
                headerBar

                // Chat Log
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 14) {
                            ForEach($messages) { $msg in
                                chatBubble(for: $msg)
                                    .id(msg.id)
                            }

                            if isThinking {
                                thinkingIndicator
                            }
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 14)
                    }
                    .onChange(of: messages.count) { _ in
                        if let last = messages.last {
                            withAnimation {
                                proxy.scrollTo(last.id, anchor: .bottom)
                            }
                        }
                    }
                }

                // Quick Prompt Chips
                quickPromptChips

                // Input Bar with Voice Dictation & Send
                inputBar
            }
        }
        .sheet(isPresented: $isDocumentPickerPresented) {
            DocumentPicker(attachedFileName: $attachedFileName, attachedText: $attachedResumeText)
        }
    }

    // MARK: - Header
    private var headerBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("Thread Agent")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    Circle()
                        .fill(agentStatusColor)
                        .frame(width: 6, height: 6)
                    Text(agentStatusLabel)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(agentStatusColor)
                }
                Text(agentStatusDetail)
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
            Spacer()

            Button(action: {
                isDocumentPickerPresented = true
            }) {
                HStack(spacing: 5) {
                    Image(systemName: "doc.badge.plus")
                        .font(.system(size: 10, weight: .semibold))
                    Text("Add resume")
                        .font(.system(size: 11, weight: .semibold))
                }
                .padding(.horizontal, 9)
                .padding(.vertical, 5)
                .background(Color.white.opacity(0.06))
                .foregroundColor(.white.opacity(0.8))
                .cornerRadius(8)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(red: 0.06, green: 0.08, blue: 0.12).opacity(0.95))
    }

    // MARK: - Chat Bubble
    @ViewBuilder
    private func chatBubble(for msg: Binding<AgentChatMessage>) -> some View {
        let isUser = msg.wrappedValue.role == "user"
        HStack(alignment: .top, spacing: 8) {
            if isUser { Spacer() }

            if !isUser {
                ThreadLogoBadge(size: 26)
            }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 8) {
                Text(msg.wrappedValue.text)
                    .font(.system(size: 13.5))
                    .foregroundColor(isUser ? .white : .white.opacity(0.95))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(isUser ? Color.blue : Color.white.opacity(0.08))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(isUser ? Color.blue.opacity(0.5) : Color.white.opacity(0.12), lineWidth: 1)
                            )
                    )

                // Optional Steps
                if let steps = msg.wrappedValue.steps, !steps.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(steps, id: \.self) { step in
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 11))
                                    .foregroundColor(.green)
                                Text(step)
                                    .font(.system(size: 11))
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(10)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(8)
                }

                // Interactive Email Card
                if msg.wrappedValue.emailCard != nil {
                    emailCardView(for: msg)
                }

                // Interactive Calendar Card
                if msg.wrappedValue.calendarCard != nil {
                    calendarCardView(for: msg)
                }

                // Interactive Form Card
                if msg.wrappedValue.formCard != nil {
                    formCardView(for: msg)
                }

                // Interactive QR Code Card
                if msg.wrappedValue.qrCard != nil {
                    qrCardView(for: msg)
                }

                // Interactive Batch Minutes Card
                if msg.wrappedValue.batchCard != nil {
                    batchCardView(for: msg)
                }

                // Interactive Cloud VM Meeting Bot Card
                if msg.wrappedValue.vmBotCard != nil {
                    vmBotCardView(for: msg)
                }
            }
            .frame(maxWidth: 320, alignment: isUser ? .trailing : .leading)

            if !isUser { Spacer() }
        }
    }

    // MARK: - Email Card View
    private func emailCardView(for msg: Binding<AgentChatMessage>) -> some View {
        guard let email = msg.wrappedValue.emailCard else { return AnyView(EmptyView()) }
        return AnyView(
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "envelope.badge.fill")
                        .foregroundColor(.teal)
                    Text("EMAIL DRAFT")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.teal)
                    Spacer()
                    if email.isSent {
                        Text("SENT")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.green)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.15))
                            .cornerRadius(4)
                    }
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text("To: \(email.to)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.white)
                    Text("Subject: \(email.subject)")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }

                Text(email.body)
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.85))
                    .lineLimit(4)
                    .padding(8)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(6)

                Button(action: {
                    if !email.isSent {
                        msg.wrappedValue.emailCard?.isSent = true
                        Task {
                            if await manager.executeDirectEmail(to: email.to, subject: email.subject, body: email.body) {
                                manager.completeQueuedAction(emailTo: email.to)
                            } else {
                                msg.wrappedValue.emailCard?.isSent = false
                            }
                        }
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: email.isSent ? "checkmark.circle.fill" : "paperplane.fill")
                        Text(email.isSent ? "Sent via Gmail" : "Send Now via Gmail")
                    }
                    .font(.system(size: 12, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(email.isSent ? Color.green.opacity(0.2) : Color.teal)
                    .foregroundColor(email.isSent ? .green : .white)
                    .cornerRadius(8)
                }
                .disabled(email.isSent)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(red: 0.08, green: 0.12, blue: 0.16))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.teal.opacity(0.3), lineWidth: 1))
            )
        )
    }

    // MARK: - Calendar Card View
    private func calendarCardView(for msg: Binding<AgentChatMessage>) -> some View {
        guard let ev = msg.wrappedValue.calendarCard else { return AnyView(EmptyView()) }
        return AnyView(
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "calendar.badge.clock")
                        .foregroundColor(.cyan)
                    Text("CALENDAR MILESTONE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.cyan)
                    Spacer()
                    if ev.isAdded {
                        Text("SCHEDULED")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.green)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.15))
                            .cornerRadius(4)
                    }
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(ev.title)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                    Text(friendlyDate(ev.start))
                        .font(.system(size: 11))
                        .foregroundColor(.cyan)
                    if !ev.notes.isEmpty {
                        Text(ev.notes)
                            .font(.system(size: 10.5))
                            .foregroundColor(.secondary)
                    }
                }

                Button(action: {
                    if !ev.isAdded {
                        msg.wrappedValue.calendarCard?.isAdded = true
                        Task {
                            if await manager.executeDirectCalendarEvent(title: ev.title, start: ev.start, durationMin: 60, notes: ev.notes) {
                                manager.completeQueuedAction(eventTitled: ev.title)
                            } else {
                                msg.wrappedValue.calendarCard?.isAdded = false
                            }
                        }
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: ev.isAdded ? "checkmark.circle.fill" : "calendar.badge.plus")
                        Text(ev.isAdded ? "Added to Google Calendar" : "Add to Google Calendar")
                    }
                    .font(.system(size: 12, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(ev.isAdded ? Color.green.opacity(0.2) : Color.cyan)
                    .foregroundColor(ev.isAdded ? .green : .black)
                    .cornerRadius(8)
                }
                .disabled(ev.isAdded)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(red: 0.06, green: 0.11, blue: 0.16))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.cyan.opacity(0.3), lineWidth: 1))
            )
        )
    }

    // MARK: - Form Card View
    private func formCardView(for msg: Binding<AgentChatMessage>) -> some View {
        guard let form = msg.wrappedValue.formCard else { return AnyView(EmptyView()) }
        return AnyView(
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "doc.text.viewfinder")
                        .foregroundColor(.purple)
                    Text("AUTO-FILLED APPLICATION")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.purple)
                    Spacer()
                    Text("\(form.fields.count) Fields Matched")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.purple)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.purple.opacity(0.15))
                        .cornerRadius(4)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Target: \(form.formId.uppercased()) Portal")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                    ForEach(Array(form.fields.keys.prefix(3)), id: \.self) { key in
                        HStack {
                            Text("\(key.replacingOccurrences(of: "_", with: " ").capitalized):")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.secondary)
                            Text(form.fields[key] ?? "")
                                .font(.system(size: 10))
                                .foregroundColor(.white)
                                .lineLimit(1)
                        }
                    }
                }

                Button(action: {
                    if !form.isSubmitted {
                        msg.wrappedValue.formCard?.isSubmitted = true
                        manager.showNotification(text: "✓ Application Submitted to \(form.submitTo)")
                        let generator = UINotificationFeedbackGenerator()
                        generator.notificationOccurred(.success)
                        if let idx = manager.actions.firstIndex(where: { $0.id.contains(form.formId) || $0.label.contains("Application") }) {
                            manager.actions[idx].status = "executed"
                        }
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: form.isSubmitted ? "checkmark.circle.fill" : "checkmark.seal.fill")
                        Text(form.isSubmitted ? "Submitted Successfully" : "Submit Application")
                    }
                    .font(.system(size: 12, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(form.isSubmitted ? Color.green.opacity(0.2) : Color.purple)
                    .foregroundColor(form.isSubmitted ? .green : .white)
                    .cornerRadius(8)
                }
                .disabled(form.isSubmitted)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(red: 0.10, green: 0.08, blue: 0.16))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.purple.opacity(0.3), lineWidth: 1))
            )
        )
    }

    // MARK: - QR Card View
    private func qrCardView(for msg: Binding<AgentChatMessage>) -> some View {
        guard let qr = msg.wrappedValue.qrCard else { return AnyView(EmptyView()) }
        return AnyView(
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "qrcode.viewfinder")
                        .foregroundColor(.cyan)
                    Text("MEETING RESOURCE / QR CODE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.cyan)
                    Spacer()
                    Text(qr.via)
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(.secondary)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(qr.label)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                    Text("Destination: \(qr.url)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.cyan)
                }

                Button(action: {
                    inputText = "Auto-fill the application with my resume"
                    sendMessage()
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "bolt.fill")
                        Text("⚡ Auto-Fill Application with Resume")
                    }
                    .font(.system(size: 12, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color.purple)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(red: 0.08, green: 0.12, blue: 0.16))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.cyan.opacity(0.3), lineWidth: 1))
            )
        )
    }

    // MARK: - Batch Minutes Card View
    private func batchCardView(for msg: Binding<AgentChatMessage>) -> some View {
        guard let batch = msg.wrappedValue.batchCard else { return AnyView(EmptyView()) }
        return AnyView(
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "envelope.badge.shield.half.filled")
                        .foregroundColor(.teal)
                    Text("BATCH MINUTES DISPATCH")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.teal)
                    Spacer()
                    Text(batch.isDispatched ? "✓ DISPATCHED" : "\(batch.recipients.count) ATTENDEES")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(batch.isDispatched ? .green : .teal)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(batch.isDispatched ? Color.green.opacity(0.15) : Color.teal.opacity(0.15))
                        .cornerRadius(4)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(batch.subject)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                    Text("Recipients (\(batch.recipients.count)): \(batch.recipients.prefix(3).joined(separator: ", "))...")
                        .font(.system(size: 10.5))
                        .foregroundColor(.secondary)
                }

                Text(batch.body)
                    .font(.system(size: 10.5))
                    .foregroundColor(.white.opacity(0.85))
                    .lineLimit(4)
                    .padding(8)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(6)

                Button(action: {
                    if !batch.isDispatched {
                        msg.wrappedValue.batchCard?.isDispatched = true
                        Task {
                            _ = await manager.executeBatchMinutesDispatch(batch: AgentBatchPayload(
                                recipients: batch.recipients,
                                meetingTitle: batch.meetingTitle,
                                subject: batch.subject,
                                body: batch.body
                            ))
                        }
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: batch.isDispatched ? "checkmark.circle.fill" : "paperplane.fill")
                        Text(batch.isDispatched ? "Dispatched in Background" : "Send Minutes to All \(batch.recipients.count) in Background")
                    }
                    .font(.system(size: 12, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(batch.isDispatched ? Color.green.opacity(0.2) : Color.teal)
                    .foregroundColor(batch.isDispatched ? .green : .white)
                    .cornerRadius(8)
                }
                .disabled(batch.isDispatched)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(red: 0.08, green: 0.12, blue: 0.16))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.teal.opacity(0.3), lineWidth: 1))
            )
        )
    }

    // MARK: - VM Bot Card View
    private func vmBotCardView(for msg: Binding<AgentChatMessage>) -> some View {
        guard let vm = msg.wrappedValue.vmBotCard else { return AnyView(EmptyView()) }
        return AnyView(
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "cpu.fill")
                        .foregroundColor(.cyan)
                    Text("VIRTUAL MACHINE MEETING BOT")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.cyan)
                    Spacer()
                    if vm.isJoined || manager.isVmBotRunning {
                        Text("ACTIVE ON VM")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.green)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.15))
                            .cornerRadius(4)
                    } else {
                        Text("STARTS IN ~\(vm.minutesUntilStart)M")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.orange)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.15))
                            .cornerRadius(4)
                    }
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(vm.meetingTitle)
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundColor(.white)
                    HStack(spacing: 8) {
                        Label(vm.platform, systemImage: "video.fill")
                        Label("Host: sumonmondal@gmail.com", systemImage: "person.circle")
                    }
                    .font(.system(size: 10.5))
                    .foregroundColor(.secondary)
                }

                Text(vm.isJoined || manager.isVmBotRunning ? "Thread VM Bot is actively connected on your behalf from your Cloud VM (thread-vm-us-east.cloud). Live transcripts, minute gists, and meeting action items are streaming to your Cockpit." : "Meeting detected on Google Calendar. Thread can join on your behalf from your authenticated Cloud Virtual Machine.")
                    .font(.system(size: 10.5))
                    .foregroundColor(.white.opacity(0.85))
                    .padding(8)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(6)

                if vm.isJoined || manager.isVmBotRunning {
                    Button(action: {
                        manager.stopVmMeetingBot()
                        msg.wrappedValue.vmBotCard?.isJoined = false
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: "stop.fill")
                            Text("Stop VM Meeting Bot")
                        }
                        .font(.system(size: 12, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.red.opacity(0.85))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                } else {
                    Button(action: {
                        msg.wrappedValue.vmBotCard?.isJoined = true
                        manager.joinMeetingOnBehalfOfUser(meetingUrl: vm.joinUrl, title: vm.meetingTitle)
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: "bolt.fill")
                            Text("Join Call on My Behalf (VM Bot)")
                        }
                        .font(.system(size: 12, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(ThreadTheme.cyan)
                        .foregroundColor(.black)
                        .cornerRadius(8)
                    }
                }
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(red: 0.06, green: 0.10, blue: 0.15))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.cyan.opacity(0.35), lineWidth: 1))
            )
        )
    }

    // MARK: - Thinking Indicator
    private var thinkingIndicator: some View {
        HStack(spacing: 8) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .cyan))
            Text("Thread is reasoning across meeting context & resume…")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }

    // MARK: - Attachment Chip
    private func attachmentChip(fileName: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "doc.fill")
                .foregroundColor(.blue)
            Text(fileName)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.white)
            Spacer()
            Text("Active Document")
                .font(.system(size: 10))
                .foregroundColor(.cyan)
            Button(action: { attachedFileName = nil }) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 6)
        .background(Color.blue.opacity(0.12))
    }

    // MARK: - Quick Prompt Chips
    private var quickPromptChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                Button(action: {
                    inputText = "Join the upcoming meeting on my behalf"
                    sendMessage()
                }) {
                    Text("⚡ Join Call (VM)")
                        .font(.system(size: 11, weight: .black))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.cyan.opacity(0.18))
                        .foregroundColor(.cyan)
                        .cornerRadius(6)
                }

                Button(action: {
                    inputText = "What was the QR code shared in the meeting?"
                    sendMessage()
                }) {
                    Text("🔗 QR Code?")
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.blue.opacity(0.18))
                        .foregroundColor(.cyan)
                        .cornerRadius(6)
                }

                Button(action: {
                    inputText = "Send a follow up email to Sarah thanking her and attaching my resume"
                    sendMessage()
                }) {
                    Text("✉️ Email Sarah")
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.teal.opacity(0.18))
                        .foregroundColor(.teal)
                        .cornerRadius(6)
                }

                Button(action: {
                    inputText = "Send the last meeting minutes to all 10 attendees on the roster"
                    sendMessage()
                }) {
                    Text("📋 Minutes to 10")
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.green.opacity(0.18))
                        .foregroundColor(.green)
                        .cornerRadius(6)
                }

                Button(action: {
                    inputText = "Auto-fill the internship application link with my resume"
                    sendMessage()
                }) {
                    Text("⚡ Auto-fill App")
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.purple.opacity(0.18))
                        .foregroundColor(.purple)
                        .cornerRadius(6)
                }

                Button(action: {
                    inputText = "just send it"
                    sendMessage()
                }) {
                    Text("🚀 Just Send It")
                        .font(.system(size: 11, weight: .black))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.green.opacity(0.18))
                        .foregroundColor(.green)
                        .cornerRadius(6)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
        }
    }

    // MARK: - Input Bar
    private var inputBar: some View {
        HStack(spacing: 8) {
            Button(action: { isDocumentPickerPresented = true }) {
                Image(systemName: "paperclip")
                    .font(.system(size: 18))
                    .foregroundColor(.secondary)
            }

            // Dictation Button
            Button(action: toggleDictation) {
                Image(systemName: isDictating ? "mic.fill" : "mic")
                    .font(.system(size: 18))
                    .foregroundColor(isDictating ? .red : .secondary)
            }

            TextField("e.g. 'Email Sarah', 'add deadline', or 'just send it'…", text: $inputText)
                .font(.system(size: 13))
                .padding(10)
                .background(Color.white.opacity(0.06))
                .cornerRadius(10)
                .foregroundColor(.white)
                .onSubmit {
                    sendMessage()
                }

            Button(action: sendMessage) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 26))
                    .foregroundColor(inputText.trimmingCharacters(in: .whitespaces).isEmpty ? .secondary : .blue)
            }
            .disabled(inputText.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(12)
        .background(Color(red: 0.07, green: 0.10, blue: 0.14))
    }

    // MARK: - Voice Dictation
    private func toggleDictation() {
        if isDictating {
            stopDictation()
        } else {
            startDictation()
        }
    }

    private func startDictation() {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            Task { @MainActor in
                guard authStatus == .authorized else {
                    manager.showNotification(text: "Microphone permission required for dictation")
                    return
                }
                do {
                    recognitionTask?.cancel()
                    recognitionTask = nil

                    let audioSession = AVAudioSession.sharedInstance()
                    try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
                    try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

                    recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
                    guard let req = recognitionRequest else { return }
                    req.shouldReportPartialResults = true

                    let inputNode = audioEngine.inputNode
                    inputNode.removeTap(onBus: 0)
                    inputNode.installTap(onBus: 0, bufferSize: 1024, format: inputNode.outputFormat(forBus: 0)) { buffer, _ in
                        req.append(buffer)
                    }

                    audioEngine.prepare()
                    try audioEngine.start()
                    isDictating = true

                    recognitionTask = speechRecognizer?.recognitionTask(with: req) { result, error in
                        Task { @MainActor in
                            if let result = result {
                                self.inputText = result.bestTranscription.formattedString
                            }
                            if error != nil || (result?.isFinal ?? false) {
                                self.stopDictation()
                            }
                        }
                    }
                } catch {
                    manager.showNotification(text: "Dictation error: \(error.localizedDescription)")
                }
            }
        }
    }

    private func stopDictation() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        isDictating = false
    }

    // MARK: - Send Message & Handle Conversational Agent
    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        inputText = ""
        stopDictation()

        messages.append(AgentChatMessage(role: "user", text: text))
        let lower = text.lowercased()

        // 0. Direct Meeting Join on VM Commands: "yes", "join", "join meeting", "join on my behalf", "join call", "start vm bot"
        let isJoinPrompt = lower == "yes" || lower == "yes please" || lower == "yes, join" || lower == "yes join" ||
            lower == "join" || lower.contains("join on my behalf") || lower.contains("join meeting") ||
            lower.contains("join call") || lower.contains("join the call") || lower.contains("join the upcoming") ||
            lower.contains("dispatch vm") || lower.contains("start bot")

        if isJoinPrompt {
            let upcoming = manager.upcomingMeeting
            let title = upcoming?.title ?? "Thread Strategy & Enterprise Architecture Review"
            let url = upcoming?.joinUrl ?? "https://meet.google.com/xyz-qwer-vbn"
            let platform = upcoming?.platform ?? "Google Meet"
            let mins = upcoming?.minutesUntilStart ?? 5

            manager.joinMeetingOnBehalfOfUser(meetingUrl: url, title: title)

            let botCard = AgentVmBotCard(
                meetingTitle: title,
                platform: platform,
                joinUrl: url,
                minutesUntilStart: mins,
                isJoined: true
            )

            messages.append(AgentChatMessage(
                role: "agent",
                text: "🚀 Connected! I've dispatched Thread's Virtual Machine bot to join '\(title)' (\(platform)) on your behalf from your cloud instance (thread-vm-us-east.cloud · sumonmondal@gmail.com). I am now capturing real-time speaker audio, generating minute-by-minute gists, extracting presentation links, and staging action items in your Cockpit.",
                steps: [
                    "Launched Puppeteer headless browser on thread-vm-us-east.cloud",
                    "Authenticated with Google Workspace (sumonmondal@gmail.com)",
                    "Joined \(platform) audio room & hooked live WebRTC stream",
                    "Activated Dynamic Island & Cockpit real-time meeting copilot"
                ],
                vmBotCard: botCard
            ))
            return
        }

        // Stop VM Bot command: "stop bot", "leave meeting", "disconnect bot"
        if lower.contains("stop bot") || lower.contains("stop vm") || lower.contains("leave meeting") || lower.contains("disconnect bot") {
            manager.stopVmMeetingBot()
            messages.append(AgentChatMessage(
                role: "agent",
                text: "⏹ Stopped Virtual Machine Meeting Bot. The bot has safely disconnected from the call room, saved transcripts and gists, and returned to standby."
            ))
            return
        }

        // Live poll: "vote yes", "vote no", or the option's name
        if lower.hasPrefix("vote") || lower.contains("poll") {
            if let poll = manager.activePoll {
                let option = poll.options.first(where: { lower.contains($0.lowercased()) })
                    ?? (lower.contains(" no") ? poll.options.first(where: { $0.lowercased().hasPrefix("no") }) : nil)
                    ?? poll.options.first ?? "Yes"
                manager.voteOnPoll(option: option)
                messages.append(AgentChatMessage(role: "agent", text: "Voted \"\(option)\" on: \(poll.question)"))
            } else {
                messages.append(AgentChatMessage(role: "agent", text: "There's no live poll right now."))
            }
            return
        }

        // Detected application form: "fill it up", "submit application"
        if lower.contains("fill it up") || lower.contains("submit application") || lower.contains("submit form") {
            Task {
                let submitted = await manager.submitActiveForm()
                messages.append(AgentChatMessage(
                    role: "agent",
                    text: submitted ? "Filled in and submitted the application from your profile." : "There's no application form waiting right now."
                ))
            }
            return
        }

        // 1. Direct Execution Commands: "just send it", "send it", "send email"
        if lower.contains("just send it") || lower == "send it" || lower == "send now" || lower == "dispatch" {
            // Find most recent email draft
            if let lastEmailIdx = messages.lastIndex(where: { $0.emailCard != nil && !($0.emailCard?.isSent ?? false) }) {
                if let card = messages[lastEmailIdx].emailCard {
                    messages[lastEmailIdx].emailCard?.isSent = true
                    Task {
                        let sent = await manager.executeDirectEmail(to: card.to, subject: card.subject, body: card.body)
                        if sent {
                            manager.completeQueuedAction(emailTo: card.to)
                        } else {
                            messages[lastEmailIdx].emailCard?.isSent = false
                        }
                        messages.append(AgentChatMessage(
                            role: "agent",
                            text: sent
                                ? "Sent the email to \(card.to)\(manager.isDemoMode ? " (demo — not actually delivered)" : ""). It's marked done in the Cockpit queue."
                                : "I couldn't send the email to \(card.to). It's still waiting in your queue."
                        ))
                    }
                    return
                }
            } else if let stagedEmailAction = manager.nextStagedEmailAction {
                manager.approveAction(id: stagedEmailAction.id)
                messages.append(AgentChatMessage(
                    role: "agent",
                    text: "Approved from your queue: \(stagedEmailAction.label)."
                ))
                return
            }
        }

        // 2. Direct Calendar Commands: "add to calendar", "schedule it", "add deadline"
        if lower.contains("add to calendar") || lower.contains("schedule it") || lower.contains("add deadline") {
            if let lastCalIdx = messages.lastIndex(where: { $0.calendarCard != nil && !($0.calendarCard?.isAdded ?? false) }) {
                if let card = messages[lastCalIdx].calendarCard {
                    messages[lastCalIdx].calendarCard?.isAdded = true
                    Task {
                        let added = await manager.executeDirectCalendarEvent(title: card.title, start: card.start, durationMin: 60, notes: card.notes)
                        if added {
                            manager.completeQueuedAction(eventTitled: card.title)
                        } else {
                            messages[lastCalIdx].calendarCard?.isAdded = false
                        }
                        messages.append(AgentChatMessage(
                            role: "agent",
                            text: added
                                ? "Added '\(card.title)' to your calendar\(manager.isDemoMode ? " (demo — not actually synced)" : "")."
                                : "I couldn't add '\(card.title)' to your calendar. It's still waiting in your queue."
                        ))
                    }
                    return
                }
            } else if let stagedCalAction = manager.nextStagedCalendarAction {
                manager.approveAction(id: stagedCalAction.id)
                messages.append(AgentChatMessage(
                    role: "agent",
                    text: "Approved from your queue: \(stagedCalAction.label)."
                ))
                return
            }
        }

        // 3. Delegate to Agent API with Live Context & Resume
        isThinking = true
        Task {
            let res = await manager.sendAgentMessage(prompt: text, resumeText: attachedResumeText)
            isThinking = false

            var emailCard: AgentEmailCard? = nil
            if let em = res.email {
                emailCard = AgentEmailCard(to: em.to, subject: em.subject, body: em.body, isSent: false)
            }

            var calCard: AgentCalendarCard? = nil
            if let ev = res.events?.first {
                calCard = AgentCalendarCard(title: ev.title, start: ev.start, notes: ev.notes ?? "", isAdded: false)
            }

            var formCard: AgentFormCard? = nil
            if let fm = res.form {
                var fieldDict: [String: String] = [:]
                if let fields = fm.fields {
                    for (k, v) in fields {
                        fieldDict[k] = v.value
                    }
                }
                formCard = AgentFormCard(formId: fm.formId, submitTo: fm.submitTo ?? "", fields: fieldDict, isSubmitted: false)
            }

            var qrCard: AgentQrCard? = nil
            if let qr = res.qrCard {
                qrCard = AgentQrCard(label: qr.label, url: qr.url, via: qr.via, meetingTitle: qr.meetingTitle)
            }

            var batchCard: AgentBatchCard? = nil
            if let b = res.batch {
                batchCard = AgentBatchCard(meetingTitle: b.meetingTitle, recipients: b.recipients, subject: b.subject, body: b.body, isDispatched: false)
                if text.lowercased().contains("send") || text.lowercased().contains("dispatch") {
                    batchCard?.isDispatched = true
                    Task {
                        _ = await manager.executeBatchMinutesDispatch(batch: b)
                    }
                }
            }

            messages.append(AgentChatMessage(
                role: "agent",
                text: res.reply,
                steps: res.steps.isEmpty ? nil : res.steps,
                emailCard: emailCard,
                calendarCard: calCard,
                formCard: formCard,
                qrCard: qrCard,
                batchCard: batchCard
            ))
        }
    }
}

// iOS Native Document Picker for Resumes (PDF / DOCX / TXT)
struct DocumentPicker: UIViewControllerRepresentable {
    @Binding var attachedFileName: String?
    @Binding var attachedText: String

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.pdf, .text, .plainText, .data], asCopy: true)
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: DocumentPicker

        init(_ parent: DocumentPicker) {
            self.parent = parent
        }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            guard let url = urls.first else { return }
            parent.attachedFileName = url.lastPathComponent
            if let str = try? String(contentsOf: url, encoding: .utf8) {
                parent.attachedText = str
            }
        }
    }
}

// MARK: - Agent status & formatting
extension AgentView {
    /// Reflects where the last answer came from, so the header never claims a connection that isn't there.
    var agentStatusLabel: String {
        switch manager.agentServerReachable {
        case .some(true): return "ONLINE"
        case .some(false): return "ON-DEVICE"
        case .none: return "READY"
        }
    }

    var agentStatusColor: Color {
        switch manager.agentServerReachable {
        case .some(true): return .green
        case .some(false): return .orange
        case .none: return .cyan
        }
    }

    var agentStatusDetail: String {
        switch manager.agentServerReachable {
        case .some(true): return "Answering with Thread AI"
        case .some(false): return "Server unreachable · answering from this meeting"
        case .none: return "Ask about this meeting"
        }
    }

    /// "2026-10-18T23:59:00" → "Sun, Oct 18 · 11:59 PM"
    func friendlyDate(_ iso: String) -> String {
        var date = ISO8601DateFormatter().date(from: iso)
        if date == nil {
            let local = DateFormatter()
            local.locale = Locale(identifier: "en_US_POSIX")
            local.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
            date = local.date(from: iso)
        }
        guard let date else { return iso }
        let out = DateFormatter()
        out.dateFormat = "EEE, MMM d · h:mm a"
        return out.string(from: date)
    }
}
