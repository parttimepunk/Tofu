import Foundation
import UniformTypeIdentifiers

enum MediaKind: String, Codable, CaseIterable, Identifiable, Sendable {
    case image, video, audio, link, note
    var id: String { rawValue }
    var title: String {
        switch self { case .image: "Images"; case .video: "Videos"; case .audio: "Audio"; case .link: "Links"; case .note: "Notes" }
    }
    var singular: String {
        switch self { case .image: "Image"; case .video: "Video"; case .audio: "Audio"; case .link: "Link"; case .note: "Note" }
    }
    var symbol: String {
        switch self { case .image: "photo"; case .video: "film"; case .audio: "waveform"; case .link: "link"; case .note: "text.alignleft" }
    }
    static func detect(_ url: URL) -> MediaKind? {
        guard let type = UTType(filenameExtension: url.pathExtension) else { return nil }
        if type.conforms(to: .image) { return .image }
        if type.conforms(to: .movie) { return .video }
        if type.conforms(to: .audio) { return .audio }
        return nil
    }
}

struct LibraryItem: Codable, Identifiable, Equatable, Sendable {
    var id = UUID()
    var title: String
    var kind: MediaKind
    var createdAt = Date()
    var ideaDate = Date()
    var updatedAt = Date()
    var creativeOrder: Double = 0
    var relativeFile: String?
    var sourceURL = ""
    var note = ""
    var tags: [String] = []
    var collection = ""
    var isFavorite = false
    var trashedAt: Date?
    var width: Double?
    var height: Double?
    var duration: Double?
    var byteCount: Int64?
    var aspectRatio: Double { max(0.45, min(2.2, (width ?? 1) / max(1, height ?? 1))) }
    var durationLabel: String? {
        guard let duration, duration.isFinite, duration >= 0 else { return nil }
        let seconds = Int(duration)
        return seconds >= 3600 ? String(format: "%d:%02d:%02d", seconds / 3600, (seconds / 60) % 60, seconds % 60) : String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
}

struct LibraryDocument: Codable, Sendable {
    var version = 1
    var items: [LibraryItem] = []
    var collections: [String] = []
}

enum LibraryFilter: Hashable {
    case all, recent, favorite, kind(MediaKind), collection(String), trash
    var title: String {
        switch self {
        case .all: "All Items"
        case .recent: "Recently Added"
        case .favorite: "Favorites"
        case .kind(let kind): kind.title
        case .collection(let name): name
        case .trash: "Recently Removed"
        }
    }
}

enum BrowseMode: String, CaseIterable, Identifiable {
    case gallery = "Gallery", captured = "Date Added", creative = "Creative Timeline"
    var id: String { rawValue }
    var symbol: String { switch self { case .gallery: "square.grid.2x2"; case .captured: "calendar"; case .creative: "point.topleft.down.curvedto.point.bottomright.up" } }
}

enum LibrarySort: String, CaseIterable, Identifiable {
    case newest = "Newest First", oldest = "Oldest First", title = "Title"
    var id: String { rawValue }
}
