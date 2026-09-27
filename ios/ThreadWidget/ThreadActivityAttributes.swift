import ActivityKit
import Foundation

public struct ThreadActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var meetingTitle: String
        public var speaker: String
        public var elapsedSeconds: Int
        /// 3-5 word live summary for the Dynamic Island pill
        public var shortHeadline: String
        public var latestMomentType: String?
        public var latestMomentTakeaway: String?
        public var stagedActionId: String?
        public var stagedActionLabel: String?
        public var isActionExecuted: Bool

        public init(
            meetingTitle: String,
            speaker: String,
            elapsedSeconds: Int,
            shortHeadline: String,
            latestMomentType: String? = nil,
            latestMomentTakeaway: String? = nil,
            stagedActionId: String? = nil,
            stagedActionLabel: String? = nil,
            isActionExecuted: Bool = false
        ) {
            self.meetingTitle = meetingTitle
            self.speaker = speaker
            self.elapsedSeconds = elapsedSeconds
            self.shortHeadline = shortHeadline
            self.latestMomentType = latestMomentType
            self.latestMomentTakeaway = latestMomentTakeaway
            self.stagedActionId = stagedActionId
            self.stagedActionLabel = stagedActionLabel
            self.isActionExecuted = isActionExecuted
        }
    }

    public var sessionId: String

    public init(sessionId: String) {
        self.sessionId = sessionId
    }
}
