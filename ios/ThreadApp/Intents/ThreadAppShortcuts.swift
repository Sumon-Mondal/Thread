import AppIntents
import Foundation

// Siri phrases for Thread. They work hands-free anywhere Siri does, including CarPlay, where Siri speaks the
// dialog through the car's speakers; no CarPlay entitlement is involved.

struct WhatDidIMissIntent: AppIntent {
    static let title: LocalizedStringResource = "What Did I Miss"
    static let description = IntentDescription("Hear what's happening in your meeting and what's waiting for your approval.")

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let manager = ThreadSessionManager.shared
        await manager.refreshBeforeSpeaking()
        return .result(dialog: IntentDialog(stringLiteral: manager.voiceRecap))
    }
}

struct AskThreadIntent: AppIntent {
    static let title: LocalizedStringResource = "Ask Thread"
    static let description = IntentDescription("Ask Thread's agent a question about your meeting.")

    @Parameter(title: "Question", requestValueDialog: "What would you like to ask about your meeting?")
    var question: String

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let manager = ThreadSessionManager.shared
        await manager.refreshBeforeSpeaking()
        let reply = await manager.sendAgentMessage(prompt: question).reply
        return .result(dialog: IntentDialog(stringLiteral: ThreadSessionManager.spoken(reply)))
    }
}

struct ApproveNextActionIntent: AppIntent {
    static let title: LocalizedStringResource = "Approve Next Thread Action"
    static let description = IntentDescription("Approve the next email, reminder or form Thread has waiting for you, after you confirm it.")

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let manager = ThreadSessionManager.shared
        await manager.refreshBeforeSpeaking()
        guard let next = ThreadCarPlayContent.pendingActions(manager).first else {
            return .result(dialog: "Nothing is waiting for your approval.")
        }
        let sends = ThreadCarPlayContent.sendsSomething(next)
        try await requestConfirmation(actionName: sends ? .send : .do, dialog: IntentDialog(stringLiteral: "\(sends ? "Send" : "Approve") \(next.label)?"))
        manager.approveAction(id: next.id)
        return .result(dialog: IntentDialog(stringLiteral: "Done. \(next.label)."))
    }
}

struct ThreadAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: WhatDidIMissIntent(),
            phrases: ["What did I miss in \(.applicationName)", "Catch me up with \(.applicationName)", "\(.applicationName) recap"],
            shortTitle: "What Did I Miss",
            systemImageName: "text.bubble"
        )
        AppShortcut(
            intent: AskThreadIntent(),
            phrases: ["Ask \(.applicationName)", "Ask \(.applicationName) about my meeting"],
            shortTitle: "Ask Thread",
            systemImageName: "bubble.left.and.text.bubble.right"
        )
        AppShortcut(
            intent: ApproveNextActionIntent(),
            phrases: ["Approve the next \(.applicationName) action", "Approve with \(.applicationName)"],
            shortTitle: "Approve Next",
            systemImageName: "checkmark.circle"
        )
    }
}

extension ThreadSessionManager {
    /// A short spoken catch-up for drivers: what's live, the latest two moments, and what needs approval.
    var voiceRecap: String {
        let pending = ThreadCarPlayContent.pendingActions(self)
        let moments = Array(ThreadCarPlayContent.recentMoments(self).prefix(2).reversed())
        guard isMeetingActive || !moments.isEmpty || !pending.isEmpty else {
            return "There's no live meeting right now. Thread will follow your next call."
        }
        var parts = [isMeetingActive ? "\(meetingTitle) is live, and \(currentSpeaker.name) is speaking." : "From \(meetingTitle):"]
        parts += moments.map { "\($0.speaker): \($0.takeaway)" }
        switch pending.count {
        case 0: parts.append("Nothing needs your approval.")
        case 1: parts.append("One action is waiting for you: \(pending[0].label).")
        default: parts.append("\(pending.count) actions are waiting, starting with \(pending[0].label).")
        }
        return parts.joined(separator: " ")
    }

    /// Siri can launch Thread in the background with nothing synced yet, so pull the latest meeting first.
    func refreshBeforeSpeaking() async {
        guard !isDemoMode else { return }
        await fetchRemoteState()
    }

    /// Agent replies are written for the screen; drop the markdown and keep what's comfortable to hear.
    static func spoken(_ reply: String) -> String {
        let plain = reply
            .replacingOccurrences(of: "[*#`_>]", with: "", options: .regularExpression)
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard plain.count > 320 else { return plain }
        let sentences = plain.components(separatedBy: ". ")
        var out = ""
        for s in sentences {
            if out.count + s.count > 300 { break }
            out += s.hasSuffix(".") ? "\(s) " : "\(s). "
        }
        return out.isEmpty ? String(plain.prefix(300)) + "…" : out.trimmingCharacters(in: .whitespaces)
    }
}
