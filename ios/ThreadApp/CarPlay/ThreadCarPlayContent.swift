import CarPlay
import UIKit

/// What Thread shows on a CarPlay screen, built from the live session. Kept apart from the scene delegate so it
/// can be exercised without a car.
@MainActor
enum ThreadCarPlayContent {
    struct Handlers {
        var readAloud: (String) -> Void
        var review: (DemoAction) -> Void
        var react: () -> Void
        var toggleMute: () -> Void
        var toggleHand: () -> Void
    }

    /// A demo on standby shows nothing here or in the moments, since its whole script counts as "visible" then.
    private static func showsMeetingContent(_ m: ThreadSessionManager) -> Bool {
        m.isMeetingActive || m.isDemoTimelineShown || !m.isDemoMode
    }

    static func pendingActions(_ m: ThreadSessionManager) -> [DemoAction] {
        showsMeetingContent(m) ? m.visibleActions.filter { $0.status == "staged" } : []
    }

    /// Newest first.
    static func recentMoments(_ m: ThreadSessionManager) -> [DemoMoment] {
        showsMeetingContent(m) ? Array(m.visibleMoments.suffix(4).reversed()) : []
    }

    static func sendsSomething(_ action: DemoAction) -> Bool {
        action.link?.hasPrefix("mailto:") == true || action.emailTo != nil || action.kind == "reply"
    }

    static func nowSections(_ m: ThreadSessionManager, handlers: Handlers) -> [CPListSection] {
        let live = m.isMeetingActive
        let status = CPListItem(
            text: live ? m.meetingTitle : "No live meeting",
            detailText: live ? "\(m.currentSpeaker.name) · \(m.meetingPlatform)" : "Thread follows your next call",
            image: UIImage(systemName: live ? "waveform" : "moon.zzz")
        )
        status.handler = { _, done in
            handlers.readAloud(m.voiceRecap)
            done()
        }
        var sections = [CPListSection(items: [status], header: live ? "LIVE NOW · TAP FOR A RECAP" : "THREAD", sectionIndexTitle: nil)]

        let moments = recentMoments(m)
        if !moments.isEmpty {
            let items = moments.map { moment -> CPListItem in
                let item = CPListItem(
                    text: moment.headline ?? moment.type.capitalized,
                    detailText: moment.takeaway,
                    image: UIImage(systemName: symbol(forMoment: moment.type))
                )
                item.handler = { _, done in
                    handlers.readAloud("\(moment.speaker): \(moment.takeaway)")
                    done()
                }
                return item
            }
            sections.append(CPListSection(items: items, header: "LATEST · TAP TO HEAR", sectionIndexTitle: nil))
        }

        if live {
            let react = CPListItem(text: "Send a thumbs up", detailText: "Reacts in the meeting", image: UIImage(systemName: "hand.thumbsup.fill"))
            react.handler = { _, done in
                handlers.react()
                done()
            }
            let mute = CPListItem(
                text: m.isMutedInMeeting ? "Unmute" : "Mute",
                detailText: m.isMutedInMeeting ? "You're muted in the meeting" : "Your mic is on in the meeting",
                image: UIImage(systemName: m.isMutedInMeeting ? "mic.slash.fill" : "mic.fill")
            )
            mute.handler = { _, done in
                handlers.toggleMute()
                done()
            }
            let hand = CPListItem(
                text: m.isHandRaisedInMeeting ? "Lower hand" : "Raise hand",
                detailText: m.isHandRaisedInMeeting ? "Your hand is raised" : nil,
                image: UIImage(systemName: "hand.raised.fill")
            )
            hand.handler = { _, done in
                handlers.toggleHand()
                done()
            }
            sections.append(CPListSection(items: [react, mute, hand], header: "IN THE MEETING", sectionIndexTitle: nil))
        }
        return clamp(sections)
    }

    static func approvalSections(_ m: ThreadSessionManager, handlers: Handlers) -> [CPListSection] {
        let pending = pendingActions(m)
        guard !pending.isEmpty else {
            let empty = CPListItem(text: "Nothing to approve", detailText: "Emails, reminders and forms wait here for you", image: UIImage(systemName: "checkmark.circle"))
            return [CPListSection(items: [empty], header: nil, sectionIndexTitle: nil)]
        }
        let items = pending.map { action -> CPListItem in
            let item = CPListItem(text: action.label, detailText: action.detail, image: UIImage(systemName: symbol(forAction: action)))
            item.handler = { _, done in
                handlers.review(action)
                done()
            }
            return item
        }
        return clamp([CPListSection(items: items, header: "TAP TO REVIEW", sectionIndexTitle: nil)])
    }

    /// Nothing leaves the car without a second tap: emails get "Send", everything else "Approve".
    static func confirmation(for action: DemoAction, approve: @escaping () -> Void, cancel: @escaping () -> Void) -> CPAlertTemplate {
        let sends = sendsSomething(action)
        return CPAlertTemplate(
            titleVariants: ["\(sends ? "Send" : "Approve") “\(action.label)”?", action.label],
            actions: [
                CPAlertAction(title: sends ? "Send" : "Approve", style: .default) { _ in approve() },
                CPAlertAction(title: "Not now", style: .cancel) { _ in cancel() },
            ]
        )
    }

    /// Only these change what a CarPlay list shows; the scene redraws when this string changes.
    static func signature(_ m: ThreadSessionManager) -> String {
        [
            m.meetingTitle, m.meetingPlatform, m.currentSpeaker.name,
            "\(m.isMeetingActive)", "\(m.isMutedInMeeting)", "\(m.isHandRaisedInMeeting)",
            recentMoments(m).map(\.id).joined(separator: ","),
            pendingActions(m).map { "\($0.id):\($0.label)" }.joined(separator: ","),
        ].joined(separator: "|")
    }

    /// CarPlay shows only the first `maximumItemCount` items across the first `maximumSectionCount` sections.
    static func clamp(_ sections: [CPListSection]) -> [CPListSection] {
        var left = Int(CPListTemplate.maximumItemCount)
        var out: [CPListSection] = []
        for section in sections.prefix(Int(CPListTemplate.maximumSectionCount)) where left > 0 {
            let items = Array(section.items.prefix(left))
            left -= items.count
            out.append(items.count == section.items.count ? section : CPListSection(items: items, header: section.header, sectionIndexTitle: section.sectionIndexTitle))
        }
        return out
    }

    private static func symbol(forMoment type: String) -> String {
        switch type.uppercased() {
        case "DEADLINE": return "calendar.badge.exclamationmark"
        case "OPPORTUNITY": return "star.fill"
        case "RESOURCE": return "link"
        case "REQUIREMENT": return "checklist"
        case "EVENT": return "calendar"
        case "DECISION": return "checkmark.seal.fill"
        default: return "sparkles"
        }
    }

    private static func symbol(forAction action: DemoAction) -> String {
        if sendsSomething(action) { return "envelope.fill" }
        switch action.kind {
        case "calendar", "reminder": return "calendar"
        case "apply": return "doc.text.fill"
        default: return "checkmark.circle"
        }
    }
}
