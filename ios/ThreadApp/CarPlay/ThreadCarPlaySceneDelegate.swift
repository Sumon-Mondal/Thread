import Foundation
import UIKit
import CarPlay
import Combine

public class ThreadCarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
    public var interfaceController: CPInterfaceController?
    private var cancellables = Set<AnyCancellable>()
    private var liveMeetingTemplate: CPListTemplate?
    private var actionQueueTemplate: CPListTemplate?
    private var tabBarTemplate: CPTabBarTemplate?

    public func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController
    ) {
        self.interfaceController = interfaceController
        ThreadSessionManager.shared.isCarPlayConnected = true
        ThreadSessionManager.shared.isDrivingMode = true

        setupCarPlayInterface()
        observeSessionChanges()
    }

    public func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnectInterfaceController interfaceController: CPInterfaceController
    ) {
        self.interfaceController = nil
        cancellables.removeAll()
        ThreadSessionManager.shared.isCarPlayConnected = false
    }

    private func setupCarPlayInterface() {
        guard let interfaceController = interfaceController else { return }

        let meeting = buildLiveMeetingTemplate()
        let actions = buildActionQueueTemplate()

        self.liveMeetingTemplate = meeting
        self.actionQueueTemplate = actions

        let tabBar = CPTabBarTemplate(templates: [meeting, actions])
        self.tabBarTemplate = tabBar

        interfaceController.setRootTemplate(tabBar, animated: true, completion: nil)
    }

    private func observeSessionChanges() {
        let manager = ThreadSessionManager.shared

        // Refresh templates when state updates
        manager.$currentSpeaker
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in self?.refreshCarPlayTemplates() }
            .store(in: &cancellables)

        manager.$actions
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in self?.refreshCarPlayTemplates() }
            .store(in: &cancellables)

        manager.$allMoments
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in self?.refreshCarPlayTemplates() }
            .store(in: &cancellables)
    }

    public func refreshCarPlayTemplates() {
        guard interfaceController != nil else { return }

        let meeting = buildLiveMeetingTemplate()
        self.liveMeetingTemplate = meeting

        let actions = buildActionQueueTemplate()
        self.actionQueueTemplate = actions

        if let tabBar = tabBarTemplate {
            tabBar.updateTemplates([meeting, actions])
        }
    }

    // MARK: - Template Builders

    private func buildLiveMeetingTemplate() -> CPListTemplate {
        let manager = ThreadSessionManager.shared
        var sections: [CPListSection] = []

        // 1. Current Meeting & Speaker Status
        let speakerName = manager.currentSpeaker.name
        let topicText = manager.meetingTitle.isEmpty ? "Nova Dynamics Discovery Day" : manager.meetingTitle
        let callItem = CPListItem(
            text: "🎙 \(speakerName)",
            detailText: "\(topicText) · Google Meet / Zoom",
            image: UIImage(systemName: "waveform")
        )
        callItem.handler = { (_: CPSelectableListItem, completion: @escaping () -> Void) in
            manager.speakLatestTakeaway()
            completion()
        }

        let statusSection = CPListSection(items: [callItem], header: "LIVE MEETING STATUS", sectionIndexTitle: nil)
        sections.append(statusSection)

        // 2. Safe In-Car 1-Tap Quick Reactions
        let thumbsUpItem = CPListItem(
            text: "👍 React \"Thumbs Up\" to Call",
            detailText: "Sends reaction live to Google Meet / Zoom",
            image: UIImage(systemName: "hand.thumbsup.fill")
        )
        thumbsUpItem.handler = { (_: CPSelectableListItem, completion: @escaping () -> Void) in
            manager.sendReactionInMeeting("👍")
            completion()
        }

        let speakTakeawayItem = CPListItem(
            text: "🔊 Read Latest Takeaway Aloud",
            detailText: "Speaks the current key topic through car speakers",
            image: UIImage(systemName: "speaker.wave.2.fill")
        )
        speakTakeawayItem.handler = { (_: CPSelectableListItem, completion: @escaping () -> Void) in
            manager.speakLatestTakeaway()
            completion()
        }

        let muteItem = CPListItem(
            text: manager.isMutedInMeeting ? "🎙 Unmute Call" : "🔇 Mute Call",
            detailText: manager.isMutedInMeeting ? "Currently muted in meeting" : "Microphone active",
            image: UIImage(systemName: manager.isMutedInMeeting ? "mic.slash.fill" : "mic.fill")
        )
        muteItem.handler = { (_: CPSelectableListItem, completion: @escaping () -> Void) in
            manager.toggleMuteInMeeting()
            completion()
        }

        let handItem = CPListItem(
            text: manager.isHandRaisedInMeeting ? "Lower Hand in Call" : "✋ Raise Hand in Call",
            detailText: manager.isHandRaisedInMeeting ? "Hand is currently raised" : "Tap to get speaker's attention",
            image: UIImage(systemName: "hand.raised.fill")
        )
        handItem.handler = { (_: CPSelectableListItem, completion: @escaping () -> Void) in
            manager.raiseHandInMeeting()
            completion()
        }

        let controlsSection = CPListSection(
            items: [thumbsUpItem, speakTakeawayItem, muteItem, handItem],
            header: "SAFE DRIVING CONTROLS",
            sectionIndexTitle: nil
        )
        sections.append(controlsSection)

        // 3. Key Moments (Tap to Hear Aloud)
        let visible = manager.visibleMoments.suffix(4)
        if !visible.isEmpty {
            let momentItems = visible.map { moment -> CPListItem in
                let spoken = moment.takeaway
                let item = CPListItem(
                    text: moment.speaker,
                    detailText: spoken,
                    image: UIImage(systemName: "sparkles")
                )
                item.handler = { (_: CPSelectableListItem, completion: @escaping () -> Void) in
                    manager.speakAloud(spoken)
                    completion()
                }
                return item
            }
            let momentsSection = CPListSection(
                items: Array(momentItems),
                header: "RECENT TOPICS · TAP TO LISTEN",
                sectionIndexTitle: nil
            )
            sections.append(momentsSection)
        }

        let template = CPListTemplate(title: "Thread · Driving", sections: sections)
        template.tabImage = UIImage(systemName: "car.fill")
        return template
    }

    private func buildActionQueueTemplate() -> CPListTemplate {
        let manager = ThreadSessionManager.shared
        let pending = manager.actions.filter { $0.status == "staged" }

        var items: [CPListItem] = []

        if pending.isEmpty {
            let empty = CPListItem(
                text: "No Staged Actions",
                detailText: "Thread will stage emails & forms when spoken",
                image: UIImage(systemName: "checkmark.circle.fill")
            )
            items.append(empty)
        } else {
            for action in pending {
                let iconName: String
                switch action.kind {
                case "email", "reply": iconName = "envelope.fill"
                case "calendar", "reminder": iconName = "calendar"
                default: iconName = "doc.text.fill"
                }

                let item = CPListItem(
                    text: action.label,
                    detailText: action.detail ?? "Tap to 1-tap approve via CarPlay",
                    image: UIImage(systemName: iconName)
                )
                item.handler = { [weak self] (_: CPSelectableListItem, completion: @escaping () -> Void) in
                    manager.approveAction(id: action.id)
                    manager.speakAloud("Approved: \(action.label)")
                    self?.refreshCarPlayTemplates()
                    completion()
                }
                items.append(item)
            }
        }

        let section = CPListSection(items: items, header: "STAGED ACTIONS · 1-TAP APPROVAL", sectionIndexTitle: nil)
        let template = CPListTemplate(title: "Action Queue", sections: [section])
        template.tabImage = UIImage(systemName: "tray.full.fill")
        return template
    }
}
