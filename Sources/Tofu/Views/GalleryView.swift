import SwiftUI

struct GalleryView: View {
    let items: [LibraryItem]
    let store: LibraryStore
    let mode: BrowseMode
    let sort: LibrarySort
    @Binding var selection: UUID?
    var onOpen: (LibraryItem) -> Void
    @Environment(\.colorScheme) private var scheme
    private var groups: [(String, [LibraryItem])] {
        if mode == .gallery { return [("", items)] }
        let grouped = Dictionary(grouping: items) { Calendar.current.startOfDay(for: $0.createdAt) }
        let days = grouped.keys.sorted { sort == .oldest ? $0 < $1 : $0 > $1 }
        return days.map { (TofuFormat.day($0), grouped[$0] ?? []) }
    }
    var body: some View {
        GeometryReader { geometry in
            let count = max(1, Int((geometry.size.width - 32) / 210))
            let columnWidth = max(1, (geometry.size.width - 32 - CGFloat(count - 1) * 9) / CGFloat(count))
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 22) {
                    ForEach(groups, id: \.0) { title, group in
                        VStack(alignment: .leading, spacing: 13) {
                            if !title.isEmpty { Text(title).font(.headline).padding(.top, 2) }
                            HStack(alignment: .top, spacing: 9) {
                                ForEach(Array(columns(group, count: count).enumerated()), id: \.offset) { _, column in
                                    LazyVStack(spacing: 9) {
                                        ForEach(column) { item in
                                            tile(item, width: columnWidth)
                                        }
                                    }.frame(width: columnWidth)
                                }
                            }
                        }
                    }
                }.padding(16)
            }
        }
    }
    private func columns(_ group: [LibraryItem], count: Int) -> [[LibraryItem]] {
        var columns = Array(repeating: [LibraryItem](), count: count)
        var heights = Array(repeating: 0.0, count: count)
        for item in group {
            let shortest = heights.enumerated().min(by: { $0.element < $1.element })?.offset ?? 0
            columns[shortest].append(item); heights[shortest] += 1 / item.aspectRatio + 0.05
        }
        return columns
    }
    private func tile(_ item: LibraryItem, width: CGFloat) -> some View {
        let height = min(width * 1.8, max(width * 0.60, width / item.aspectRatio))
        return Button { selection = item.id } label: {
            MediaThumbnail(item: item, url: store.fileURL(for: item))
                .frame(width: width, height: height)
                .overlay(alignment: .bottomTrailing) {
                    if let duration = item.durationLabel, item.kind == .video {
                        Label(duration, systemImage: "play.fill").font(.caption2.monospacedDigit()).padding(.horizontal, 7).padding(.vertical, 5).background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 5)).padding(8)
                    }
                }
                .overlay(alignment: .topTrailing) {
                    if item.isFavorite { Image(systemName: "heart.fill").font(.caption).foregroundStyle(.pink).padding(7).background(.regularMaterial, in: Circle()).padding(8) }
                }
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(selection == item.id ? TofuTheme.accent(scheme) : .clear, lineWidth: 2.5))
                .contentShape(RoundedRectangle(cornerRadius: 6))
        }
        .buttonStyle(.plain)
        .simultaneousGesture(TapGesture(count: 2).onEnded { onOpen(item) })
        .contextMenu {
            Button("Preview", systemImage: "eye") { onOpen(item) }
            Button(item.isFavorite ? "Remove Favorite" : "Add to Favorites", systemImage: "heart") { store.toggleFavorite(item) }
            if item.trashedAt == nil { Button("Remove Item", systemImage: "trash", role: .destructive) { store.trash(item) } }
            else { Button("Restore Item", systemImage: "arrow.uturn.backward") { store.restore(item) } }
        }
        .help(item.title)
        .accessibilityLabel(item.title + ", " + item.kind.singular)
        .accessibilityAddTraits(selection == item.id ? [.isSelected] : [])
    }
}
