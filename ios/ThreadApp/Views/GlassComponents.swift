import SwiftUI

// Obsidian Dark Liquid Glass Design System for Thread iOS
public struct GlassCard<Content: View>: View {
    let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        content
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(red: 0.08, green: 0.11, blue: 0.16).opacity(0.75))
                    .background(.ultraThinMaterial)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.15),
                                Color.white.opacity(0.03)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: Color.black.opacity(0.35), radius: 10, x: 0, y: 4)
    }
}

public struct MomentTag: View {
    let type: String

    public init(_ type: String) {
        self.type = type
    }

    public var body: some View {
        Text(type.uppercased())
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(badgeColor.opacity(0.2))
            .foregroundColor(badgeColor)
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(badgeColor.opacity(0.4), lineWidth: 1)
            )
            .cornerRadius(6)
    }

    private var badgeColor: Color {
        switch type.uppercased() {
        case "OPPORTUNITY": return Color(red: 0.38, green: 0.65, blue: 1.0)
        case "DEADLINE": return Color(red: 0.98, green: 0.44, blue: 0.44)
        case "RESOURCE": return Color(red: 0.18, green: 0.83, blue: 0.75)
        case "DECISION": return Color(red: 0.75, green: 0.52, blue: 0.98)
        default: return Color(red: 0.96, green: 0.62, blue: 0.04)
        }
    }
}
