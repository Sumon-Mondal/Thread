import CarPlay
import Combine
import UIKit

/// Thread on a CarPlay screen: the live meeting and the approval queue. CarPlay only lists the app once Apple grants
/// a CarPlay entitlement, and each category allows different templates, so the root falls back from tabs to a single
/// list to a voice screen instead of failing when a layout isn't allowed.
@MainActor
public class ThreadCarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
    private var interfaceController: CPInterfaceController?
    private var nowTemplate: CPListTemplate?
    private var approvalsTemplate: CPListTemplate?
    private var usesSingleList = false
    private var lastSignature = ""
    private var cancellables = Set<AnyCancellable>()

    private var manager: ThreadSessionManager { .shared }

    public func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController
    ) {
        self.interfaceController = interfaceController
        manager.isCarPlayConnected = true
        manager.isDrivingMode = true
        showTabs()
        manager.objectWillChange
            .throttle(for: .seconds(1), scheduler: RunLoop.main, latest: true)
            .receive(on: RunLoop.main) // objectWillChange fires before the new value is stored
            .sink { [weak self] _ in self?.refreshIfChanged() }
            .store(in: &cancellables)
    }

    public func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnectInterfaceController interfaceController: CPInterfaceController
    ) {
        self.interfaceController = nil
        nowTemplate = nil
        approvalsTemplate = nil
        cancellables.removeAll()
        manager.isCarPlayConnected = false
    }

    // MARK: - Root, with fallbacks

    private func showTabs() {
        let now = CPListTemplate(title: "Now", sections: [])
        now.tabImage = UIImage(systemName: "waveform")
        let approvals = CPListTemplate(title: "Approvals", sections: [])
        approvals.tabImage = UIImage(systemName: "checkmark.circle")
        nowTemplate = now
        approvalsTemplate = approvals
        usesSingleList = false
        refresh()
        interfaceController?.setRootTemplate(CPTabBarTemplate(templates: [now, approvals]), animated: false) { [weak self] ok, _ in
            if !ok { self?.showSingleList() }
        }
    }

    private func showSingleList() {
        let list = CPListTemplate(title: "Thread", sections: [])
        nowTemplate = list
        approvalsTemplate = nil
        usesSingleList = true
        refresh()
        interfaceController?.setRootTemplate(list, animated: false) { [weak self] ok, _ in
            if !ok { self?.showVoiceScreen() }
        }
    }

    private func showVoiceScreen() {
        nowTemplate = nil
        let ready = CPVoiceControlState(
            identifier: "ready",
            titleVariants: ["Say “Hey Siri, ask Thread”", "Ask Thread"],
            image: UIImage(systemName: "waveform"),
            repeats: false
        )
        if #available(iOS 26.4, *) {
            let recap = CPButton(image: UIImage(systemName: "text.bubble.fill") ?? UIImage()) { [weak self] _ in
                guard let self else { return }
                self.speak(self.manager.voiceRecap)
            }
            recap.title = "Recap"
            let approve = CPButton(image: UIImage(systemName: "checkmark.circle.fill") ?? UIImage()) { [weak self] _ in
                self?.reviewNext()
            }
            approve.title = "Approve next"
            ready.actionButtons = [recap, approve]
        }
        let voice = CPVoiceControlTemplate(voiceControlStates: [ready])
        interfaceController?.setRootTemplate(voice, animated: false) { _, _ in }
    }

    // MARK: - Content

    private func refreshIfChanged() {
        guard ThreadCarPlayContent.signature(manager) != lastSignature else { return }
        refresh()
    }

    private func refresh() {
        lastSignature = ThreadCarPlayContent.signature(manager)
        let handlers = ThreadCarPlayContent.Handlers(
            readAloud: { [weak self] text in self?.speak(text) },
            review: { [weak self] action in self?.review(action) },
            react: { ThreadSessionManager.shared.sendReactionInMeeting("👍") },
            toggleMute: { ThreadSessionManager.shared.toggleMuteInMeeting() },
            toggleHand: { ThreadSessionManager.shared.raiseHandInMeeting() }
        )
        let now = ThreadCarPlayContent.nowSections(manager, handlers: handlers)
        let approvals = ThreadCarPlayContent.approvalSections(manager, handlers: handlers)
        let pending = !ThreadCarPlayContent.pendingActions(manager).isEmpty
        if usesSingleList {
            // One list: what needs the driver goes first.
            nowTemplate?.updateSections(ThreadCarPlayContent.clamp(pending ? approvals + now : now))
        } else {
            nowTemplate?.updateSections(now)
            approvalsTemplate?.updateSections(approvals)
            approvalsTemplate?.showsTabBadge = pending
        }
    }

    // MARK: - Approvals

    private func review(_ action: DemoAction) {
        guard let controller = interfaceController, controller.presentedTemplate == nil else { return }
        let alert = ThreadCarPlayContent.confirmation(
            for: action,
            approve: { [weak self] in
                ThreadSessionManager.shared.approveAction(id: action.id)
                self?.speak(ThreadCarPlayContent.sendsSomething(action) ? "Sending. \(action.label)." : "Done. \(action.label).")
                self?.dismissAlert()
            },
            cancel: { [weak self] in self?.dismissAlert() }
        )
        controller.presentTemplate(alert, animated: true) { _, _ in }
    }

    private func reviewNext() {
        if let next = ThreadCarPlayContent.pendingActions(manager).first {
            review(next)
        } else {
            speak("Nothing needs your approval.")
        }
    }

    private func dismissAlert() {
        interfaceController?.dismissTemplate(animated: true) { _, _ in }
    }

    private func speak(_ text: String) {
        manager.speakAloud(text, force: true)
    }
}
