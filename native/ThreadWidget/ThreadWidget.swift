import WidgetKit
import SwiftUI
import ActivityKit

// iPhone Home Screen / Lock Screen widget
struct ThreadHomeWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ThreadHome", provider: LiveProvider()) { entry in
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.state.playing ? "LIVE · \(clock(entry.state.elapsed))" : "Thread").font(.caption2.bold()).foregroundStyle(.teal)
                Text(entry.state.meetingTitle ?? "No meeting").font(.headline).lineLimit(2)
                if let m = entry.state.latestMoment { Text("\(m.type): \(m.takeaway)").font(.caption).lineLimit(3) }
            }
            .containerBackground(.black, for: .widget)
        }
        .configurationDisplayName("Thread live meeting")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}

// Live Activity / Dynamic Island
struct ThreadActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable { var speaker: String; var elapsed: Int; var moment: String }
    var meetingTitle: String
}

struct ThreadLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ThreadActivityAttributes.self) { ctx in
            HStack { Text(ctx.attributes.meetingTitle).bold(); Spacer(); Text(clock(ctx.state.elapsed)) }.padding()
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) { Text(ctx.state.speaker).font(.caption) }
                DynamicIslandExpandedRegion(.trailing) { Text(clock(ctx.state.elapsed)).font(.caption) }
                DynamicIslandExpandedRegion(.bottom) { Text(ctx.state.moment).font(.caption).lineLimit(2) }
            } compactLeading: { Image(systemName: "waveform").foregroundStyle(.teal) }
              compactTrailing: { Text(clock(ctx.state.elapsed)).font(.caption2) }
              minimal: { Image(systemName: "waveform") }
        }
    }
}

@main
struct ThreadWidgets: WidgetBundle {
    var body: some Widget { ThreadHomeWidget(); ThreadLiveActivity() }
}
