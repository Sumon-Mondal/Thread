import SwiftUI

// MARK: - Thread Unified Theme & Color System
public enum ThreadTheme {
    // Obsidian Deep Black Canvas
    public static let background = Color(red: 0.035, green: 0.043, blue: 0.063) // #090B10 obsidian
    public static let backgroundDeep = Color(red: 0.02, green: 0.025, blue: 0.035)

    // Liquid Glass & Card Surfaces
    public static let surface = Color(red: 0.07, green: 0.09, blue: 0.14)
    public static let surfaceElevated = Color(red: 0.09, green: 0.12, blue: 0.18)
    public static let cardBorder = Color.white.opacity(0.08)
    public static let cardBorderSubtle = Color.white.opacity(0.04)

    // Brand Core Accents (Neon Cyan, Sapphire Blue, Indigo Violet)
    public static let cyan = Color(red: 0.0, green: 0.85, blue: 0.98) // #00D9FA
    public static let sapphire = Color(red: 0.18, green: 0.48, blue: 1.0) // #2E7BFF
    public static let indigo = Color(red: 0.52, green: 0.32, blue: 0.98) // #8552FA

    // Functional State Colors
    public static let success = Color(red: 0.16, green: 0.82, blue: 0.45) // Emerald
    public static let warning = Color(red: 1.0, green: 0.65, blue: 0.15) // Amber
    public static let liveRecording = Color(red: 0.98, green: 0.30, blue: 0.35) // Coral Red

    // Text Hierarchy
    public static let textPrimary = Color.white
    public static let textSecondary = Color.white.opacity(0.68)
    public static let textMuted = Color.white.opacity(0.42)

    // Gradients
    public static let brandGradient = LinearGradient(
        colors: [cyan, sapphire, indigo],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    public static let glassBorderGradient = LinearGradient(
        colors: [Color.white.opacity(0.14), Color.white.opacity(0.03)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

// MARK: - Thread Logo Badge Component
public struct ThreadLogoBadge: View {
    public let size: CGFloat
    public init(size: CGFloat = 28) {
        self.size = size
    }

    public var body: some View {
        Image("ThreadLogo")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.22, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: size * 0.22, style: .continuous)
                    .stroke(
                        LinearGradient(
                            colors: [ThreadTheme.cyan.opacity(0.7), ThreadTheme.indigo.opacity(0.4)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: ThreadTheme.cyan.opacity(0.25), radius: 6, x: 0, y: 2)
    }
}

// MARK: - Obsidian Liquid Glass Card
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
                    .fill(ThreadTheme.surface.opacity(0.85))
                    .background(.ultraThinMaterial)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(ThreadTheme.glassBorderGradient, lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.4), radius: 12, x: 0, y: 4)
    }
}

// MARK: - Semantic Moment Tag
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
            .background(badgeColor.opacity(0.18))
            .foregroundColor(badgeColor)
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(badgeColor.opacity(0.35), lineWidth: 1)
            )
            .cornerRadius(6)
    }

    private var badgeColor: Color {
        switch type.uppercased() {
        case "OPPORTUNITY": return ThreadTheme.cyan
        case "DEADLINE": return ThreadTheme.liveRecording
        case "RESOURCE": return ThreadTheme.sapphire
        case "REQUIREMENT": return ThreadTheme.indigo
        case "EVENT": return ThreadTheme.warning
        case "DECISION": return Color(red: 0.85, green: 0.38, blue: 0.85)
        default: return ThreadTheme.cyan
        }
    }
}
