import SwiftUI

enum Appearance: String, CaseIterable, Identifiable {
    case system = "System", light = "Light", dark = "Dark"
    var id: String { rawValue }
    var scheme: ColorScheme? { switch self { case .system: nil; case .light: .light; case .dark: .dark } }
}

enum TofuTheme {
    static func accent(_ scheme: ColorScheme) -> Color { Color(hex: scheme == .dark ? 0x82A68F : 0x38755F) }
    static func canvas(_ scheme: ColorScheme) -> Color { Color(hex: scheme == .dark ? 0x111111 : 0xFCFCFC) }
    static func surface(_ scheme: ColorScheme) -> Color { Color(hex: scheme == .dark ? 0x1E211F : 0xF7F9F8) }
    static func selection(_ scheme: ColorScheme) -> Color { Color(hex: scheme == .dark ? 0x293A31 : 0xE1ECE5) }
    static func tagText(_ scheme: ColorScheme) -> Color { Color(hex: scheme == .dark ? 0xBCD0C2 : 0x42624E) }
}

extension Color {
    init(hex: UInt32) { self.init(.sRGB, red: Double((hex >> 16) & 255) / 255, green: Double((hex >> 8) & 255) / 255, blue: Double(hex & 255) / 255, opacity: 1) }
}

enum TofuFormat {
    static let locale = Locale(identifier: "en_US")
    static func day(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Today" }
        if calendar.isDateInYesterday(date) { return "Yesterday" }
        return date.formatted(.dateTime.year().month(.wide).day().locale(locale))
    }
    static func date(_ date: Date) -> String { date.formatted(.dateTime.year().month(.abbreviated).day().locale(locale)) }
}
