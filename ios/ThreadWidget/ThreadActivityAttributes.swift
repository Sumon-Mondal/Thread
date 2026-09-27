import ActivityKit
import Foundation

public struct ThreadActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var meetingTitle: String
        public var speaker: String
        public var meetingPlatform: String
        public var liveSummary: String
        public var elapsedSeconds: Int
        public var startDate: Date
        public var progress: Double
        public var shortHeadline: String
        public var latestMomentType: String?
        public var latestMomentTakeaway: String?
        public var stagedActionId: String?
        public var stagedActionLabel: String?
        public var isActionExecuted: Bool
        public var isDemoMode: Bool
        /// Clock frozen; the widget shows a static time instead of a running timer.
        public var isPaused: Bool

        public init(
            meetingTitle: String,
            speaker: String,
            meetingPlatform: String = "Google Meet",
            liveSummary: String = "",
            elapsedSeconds: Int,
            startDate: Date = Date(),
            progress: Double = 0.0,
            shortHeadline: String,
            latestMomentType: String? = nil,
            latestMomentTakeaway: String? = nil,
            stagedActionId: String? = nil,
            stagedActionLabel: String? = nil,
            isActionExecuted: Bool = false,
            isDemoMode: Bool = false,
            isPaused: Bool = false
        ) {
            self.meetingTitle = meetingTitle
            self.speaker = speaker
            self.meetingPlatform = meetingPlatform
            self.liveSummary = liveSummary
            self.elapsedSeconds = elapsedSeconds
            self.startDate = startDate
            self.progress = progress
            self.shortHeadline = shortHeadline
            self.latestMomentType = latestMomentType
            self.latestMomentTakeaway = latestMomentTakeaway
            self.stagedActionId = stagedActionId
            self.stagedActionLabel = stagedActionLabel
            self.isActionExecuted = isActionExecuted
            self.isDemoMode = isDemoMode
            self.isPaused = isPaused
        }
    }

    public var sessionId: String

    public init(sessionId: String) {
        self.sessionId = sessionId
    }
}
