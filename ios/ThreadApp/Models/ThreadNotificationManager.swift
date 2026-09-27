import UserNotifications
import Foundation
import ActivityKit

/// Manages system push notifications for upcoming calendar meetings.
/// In production, the background calendar poller calls `scheduleUpcomingMeetingNotification`
/// when a Google Calendar event is detected within the configured lead-time window.
public final class ThreadNotificationManager: NSObject, UNUserNotificationCenterDelegate {

    public static let shared = ThreadNotificationManager()

    // Notification category and action identifiers
    public static let categoryMeeting = "THREAD_UPCOMING_MEETING"
    public static let actionJoin      = "THREAD_JOIN_NOW"
    public static let actionDismiss   = "THREAD_DISMISS"

    private override init() { super.init() }

    // MARK: - Setup (call once at app launch)

    public func setup() {
        let center = UNUserNotificationCenter.current()
        center.delegate = self

        center.requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }

        let joinAction    = UNNotificationAction(identifier: Self.actionJoin,
                                                 title: "Join with Thread",
                                                 options: [.foreground])
        let dismissAction = UNNotificationAction(identifier: Self.actionDismiss,
                                                 title: "Dismiss",
                                                 options: [])
        let category = UNNotificationCategory(identifier: Self.categoryMeeting,
                                              actions: [joinAction, dismissAction],
                                              intentIdentifiers: [],
                                              options: [])
        center.setNotificationCategories([category])
    }

    // MARK: - Schedule a meeting notification

    public func scheduleUpcomingMeetingNotification(event: UpcomingMeetingEvent) {
        let content = UNMutableNotificationContent()
        content.title = "Upcoming Meeting · \(event.platform)"
        content.body  = "\(event.title) starts in ~\(event.minutesUntilStart) min. Join with Thread AI?"
        content.sound = .default
        content.categoryIdentifier = Self.categoryMeeting
        content.userInfo = [
            "meetingId": event.id,
            "joinUrl":   event.joinUrl ?? "",
            "title":     event.title,
            "platform":  event.platform
        ]

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: "thread-meeting-\(event.id)",
                                            content: content,
                                            trigger: trigger)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }

    /// A live meeting update. Skipped while a Live Activity is running, because the Dynamic Island
    /// and Lock Screen already show it; shown when Live Activities are off.
    public func postMomentNotification(title: String, body: String) {
        if ActivityAuthorizationInfo().areActivitiesEnabled && !Activity<ThreadActivityAttributes>.activities.isEmpty { return }
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.threadIdentifier = "thread-moments"
        let request = UNNotificationRequest(identifier: "thread-moment-\(UUID().uuidString)", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }

    // MARK: - UNUserNotificationCenterDelegate

    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                       willPresent notification: UNNotification,
                                       withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Inside the app, meeting updates already appear as in-app toasts; only the "Join with Thread" prompt needs a banner.
        let isMeetingUpdate = notification.request.content.threadIdentifier == "thread-moments"
        completionHandler(isMeetingUpdate ? [] : [.banner, .sound])
    }

    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                       didReceive response: UNNotificationResponse,
                                       withCompletionHandler completionHandler: @escaping () -> Void) {
        let info = response.notification.request.content.userInfo
        let title    = info["title"]    as? String ?? "Upcoming Meeting"
        let joinUrl  = info["joinUrl"]  as? String
        let platform = info["platform"] as? String ?? "Google Meet"

        Task { @MainActor in
            let manager = ThreadSessionManager.shared
            switch response.actionIdentifier {
            case Self.actionJoin, UNNotificationDefaultActionIdentifier:
                let event = UpcomingMeetingEvent(
                    id: info["meetingId"] as? String ?? UUID().uuidString,
                    title: title,
                    start: ISO8601DateFormatter().string(from: Date()),
                    platform: platform,
                    joinUrl: joinUrl,
                    description: nil,
                    minutesUntilStart: 0,
                    isDismissed: false
                )
                manager.pendingMeetingToJoin = event
            default:
                manager.pendingMeetingToJoin = nil
            }
        }
        completionHandler()
    }
}
