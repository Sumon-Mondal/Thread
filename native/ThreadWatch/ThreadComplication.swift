import WidgetKit
import SwiftUI

struct LiveEntry: TimelineEntry { let date: Date; let state: LiveState }

struct LiveProvider: TimelineProvider {
    func placeholder(in context: Context) -> LiveEntry { .init(date: .now, state: .placeholder) }
    func getSnapshot(in context: Context, completion: @escaping (LiveEntry) -> Void) { completion(placeholder(in: context)) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<LiveEntry>) -> Void) {
        Task {
            let s = await LiveFeed.fetch()
            completion(Timeline(entries: [.init(date: .now, state: s)], policy: .after(.now.addingTimeInterval(60))))
        }
    }
}

struct ThreadComplicationView: View {
    let entry: LiveEntry
    var body: some View {
        Gauge(value: Double(entry.state.momentCount ?? 0), in: 0...10) {
            Image(systemName: "waveform")
        } currentValueLabel: { Text("\(entry.state.momentCount ?? 0)") }
        .gaugeStyle(.accessoryCircular)
    }
}

struct ThreadComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ThreadComplication", provider: LiveProvider()) { ThreadComplicationView(entry: $0) }
            .configurationDisplayName("Thread moments")
            .supportedFamilies([.accessoryCircular, .accessoryRectangular])
    }
}
