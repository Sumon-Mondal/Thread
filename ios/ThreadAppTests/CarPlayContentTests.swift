import CarPlay
import XCTest
@testable import ThreadApp

/// What the CarPlay screens and Siri say, driven through the real demo meeting.
@MainActor
final class CarPlayContentTests: XCTestCase {
    private let manager = ThreadSessionManager.shared
    private var wasDemoMode = false
    private var spoken: [String] = []
    private var reviewed: [String] = []

    private var handlers: ThreadCarPlayContent.Handlers {
        ThreadCarPlayContent.Handlers(
            readAloud: { [unowned self] in spoken.append($0) },
            review: { [unowned self] in reviewed.append($0.id) },
            react: {},
            toggleMute: {},
            toggleHand: {}
        )
    }

    override func setUp() async throws {
        wasDemoMode = manager.isDemoMode
        manager.isDemoMode = true
        manager.resetDemo()
        spoken = []
        reviewed = []
    }

    override func tearDown() async throws {
        manager.resetDemo()
        manager.isDemoMode = wasDemoMode
    }

    private func texts(_ section: CPListSection?) -> [String] {
        section?.items.compactMap(\.text) ?? []
    }

    private func playDemo(until seconds: Int) {
        manager.startDemoMeeting()
        while manager.elapsed < seconds, manager.isDemoRunning {
            manager.advanceToNextMilestone()
        }
    }

    func testStandbyShowsNoMeetingAndNoScriptSpoilers() {
        let now = ThreadCarPlayContent.nowSections(manager, handlers: handlers)
        XCTAssertEqual(now.count, 1, "no moments or meeting controls before a call")
        XCTAssertEqual(texts(now.first), ["No live meeting"])
        XCTAssertEqual(texts(ThreadCarPlayContent.approvalSections(manager, handlers: handlers).first), ["Nothing to approve"])
        XCTAssertEqual(manager.voiceRecap, "There's no live meeting right now. Thread will follow your next call.")
    }

    func testLiveDemoShowsMeetingLatestMomentsControlsAndApprovals() throws {
        playDemo(until: 70)
        print("CARPLAY limits outside a car: items=\(CPListTemplate.maximumItemCount) sections=\(CPListTemplate.maximumSectionCount) tabs=\(CPTabBarTemplate.maximumTabCount)")

        let now = ThreadCarPlayContent.nowSections(manager, handlers: handlers)
        XCTAssertEqual(now.map(\.header), ["LIVE NOW · TAP FOR A RECAP", "LATEST · TAP TO HEAR", "IN THE MEETING"])
        let status = try XCTUnwrap(now[0].items.first as? CPListItem)
        XCTAssertEqual(status.text, manager.meetingTitle)
        XCTAssertEqual(status.detailText, "\(manager.currentSpeaker.name) · \(manager.meetingPlatform)")

        // Latest moments are newest first and only what has been said so far.
        let latest = now[1].items.compactMap { $0 as? CPListItem }
        let expected = Array(manager.visibleMoments.suffix(4).reversed())
        XCTAssertEqual(latest.map(\.detailText), expected.map(\.takeaway))
        XCTAssertTrue(expected.allSatisfy { $0.timeSec <= max(manager.elapsed, 18) })
        XCTAssertEqual(texts(now[2]), ["Send a thumbs up", "Mute", "Raise hand"])

        // Tapping the status row reads the recap aloud.
        status.handler?(status) {}
        XCTAssertEqual(spoken, [manager.voiceRecap])
        XCTAssertTrue(spoken[0].hasPrefix("\(manager.meetingTitle) is live"), spoken[0])

        // Approvals list exactly what's staged so far, and tapping one opens a review instead of approving.
        let pending = ThreadCarPlayContent.pendingActions(manager)
        XCTAssertFalse(pending.isEmpty, "the demo stages a deadline reminder by 1:06")
        XCTAssertTrue(pending.allSatisfy { $0.timeSec <= manager.elapsed && $0.status == "staged" })
        let approvals = ThreadCarPlayContent.approvalSections(manager, handlers: handlers)
        XCTAssertEqual(texts(approvals.first), pending.map(\.label))
        let first = try XCTUnwrap(approvals.first?.items.first as? CPListItem)
        first.handler?(first) {}
        XCTAssertEqual(reviewed, [pending[0].id])
        XCTAssertEqual(manager.visibleActions.first { $0.id == pending[0].id }?.status, "staged", "a tap alone must not approve")
    }

    func testEmailsAskToSendAndOthersToApprove() {
        let email = DemoAction(id: "t-email", label: "Send follow-up email to Sarah Chen", status: "staged", timeSec: 0, link: "mailto:sarah@example.com")
        let reminder = DemoAction(id: "t-rem", label: "Set deadline reminder — Oct 18", status: "staged", timeSec: 0, kind: "reminder")
        var approved = 0
        let send = ThreadCarPlayContent.confirmation(for: email, approve: { approved += 1 }, cancel: {})
        XCTAssertEqual(send.actions.map(\.title), ["Send", "Not now"])
        XCTAssertEqual(send.titleVariants.first, "Send “Send follow-up email to Sarah Chen”?")
        let approve = ThreadCarPlayContent.confirmation(for: reminder, approve: { approved += 1 }, cancel: {})
        XCTAssertEqual(approve.actions.map(\.title), ["Approve", "Not now"])
        XCTAssertEqual(approved, 0)
    }

    func testListsStayWithinCarPlayLimits() {
        let items = (0..<40).map { CPListItem(text: "Item \($0)", detailText: nil) }
        let clamped = ThreadCarPlayContent.clamp((0..<60).map { _ in CPListSection(items: items) })
        XCTAssertLessThanOrEqual(clamped.count, Int(CPListTemplate.maximumSectionCount))
        XCTAssertEqual(clamped.reduce(0) { $0 + $1.items.count }, Int(CPListTemplate.maximumItemCount))
    }

    func testSignatureChangesOnlyWithWhatIsShown() {
        playDemo(until: 40)
        let before = ThreadCarPlayContent.signature(manager)
        XCTAssertEqual(ThreadCarPlayContent.signature(manager), before)
        manager.advanceToNextMilestone()
        XCTAssertNotEqual(ThreadCarPlayContent.signature(manager), before, "a new moment or action should redraw the car screen")
    }

    func testSpokenRepliesDropMarkdownAndStayShort() {
        XCTAssertEqual(ThreadSessionManager.spoken("**Deadline:** Oct 18 — `apply` now"), "Deadline: Oct 18 — apply now")
        let long = String(repeating: "Thread staged a reminder for the deadline. ", count: 20)
        XCTAssertLessThanOrEqual(ThreadSessionManager.spoken(long).count, 320)
    }

    func testWhatDidIMissRunsFromSiri() async throws {
        playDemo(until: 70)
        _ = try await WhatDidIMissIntent().perform()
    }
}
