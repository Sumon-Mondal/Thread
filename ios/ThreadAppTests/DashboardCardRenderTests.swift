import SwiftUI
import XCTest

/// Renders the small Live Activity card (CarPlay Dashboard, Apple Watch Smart Stack) and saves PNGs for review.
@MainActor
final class DashboardCardRenderTests: XCTestCase {
    func testCardRendersAtDashboardSizes() throws {
        let live = ThreadActivityAttributes.ContentState(
            meetingTitle: "Nova Dynamics — Discovery Day",
            speaker: "Sarah Chen",
            meetingPlatform: "Google Meet",
            liveSummary: "Applications close October 18 at 11:59 PM ET",
            elapsedSeconds: 94,
            startDate: Date().addingTimeInterval(-94),
            shortHeadline: "Due Oct 18",
            latestMomentType: "DEADLINE",
            stagedActionId: "a3",
            stagedActionLabel: "Set deadline reminder — Oct 18, 11:59 PM ET"
        )
        var speaking = live
        speaking.shortHeadline = "Internships Open"
        speaking.stagedActionLabel = nil
        var paused = speaking
        paused.isPaused = true

        let folder = URL(fileURLWithPath: "/tmp/carplay-shots", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        for (name, state) in [("approval", live), ("speaking", speaking), ("paused", paused)] {
            for size in [CGSize(width: 260, height: 104), CGSize(width: 180, height: 80)] {
                let card = DashboardActivityView(state: state)
                    .frame(width: size.width, height: size.height)
                    .background(Color(red: 0.05, green: 0.07, blue: 0.10))
                    .environment(\.colorScheme, .dark)
                let renderer = ImageRenderer(content: card)
                renderer.scale = 2
                let image = try XCTUnwrap(renderer.uiImage, "\(name) card didn't render")
                XCTAssertEqual(image.size, size)
                let file = folder.appendingPathComponent("card-\(name)-\(Int(size.width)).png")
                try XCTUnwrap(image.pngData()).write(to: file)
                add(XCTAttachment(image: image))
                print("CARD \(file.path)")
            }
        }
    }
}
