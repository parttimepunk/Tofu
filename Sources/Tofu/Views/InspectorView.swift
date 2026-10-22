import SwiftUI

struct InspectorView: View {
    let item: LibraryItem?
    let store: LibraryStore
    let onEdit: (LibraryItem) -> Void
    let onPreview: (LibraryItem) -> Void
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        if let item {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HStack { Text("Item Info").font(.headline); Spacer(); Image(systemName: "info.circle").foregroundStyle(TofuTheme.accent(scheme)) }
                    Button { onPreview(item) } label: {
                        MediaThumbnail(item: item, url: store.fileURL(for: item)).frame(height: 170).clipShape(RoundedRectangle(cornerRadius: 6))
                    }.buttonStyle(.plain).help("Preview")
                    VStack(alignment: .leading, spacing: 9) {
                        HStack(alignment: .top) {
                            Text(item.title).font(.title3.weight(.semibold)).textSelection(.enabled)
                            Spacer(minLength: 3)
                            Button { store.toggleFavorite(item) } label: { Image(systemName: item.isFavorite ? "heart.fill" : "heart").foregroundStyle(item.isFavorite ? Color.pink : .secondary) }.buttonStyle(.plain).help(item.isFavorite ? "Remove Favorite" : "Add to Favorites").disabled(!store.canWrite)
                        }
                        Text(fileDescription(item)).font(.callout).foregroundStyle(.secondary)
                    }
                    Divider()
                    field("Collection") { Label(item.collection.isEmpty ? "Unfiled" : item.collection, systemImage: "folder").font(.callout) }
                    if !item.tags.isEmpty {
                        field("Tags") {
                            TagList(tags: item.tags)
                        }
                    }
                    if !item.note.isEmpty { field("Notes") { Text(item.note).font(.callout).lineSpacing(4).textSelection(.enabled) } }
                    if let source = LibraryDisk.validatedURL(item.sourceURL) {
                        field("Source") { Link(source.host ?? item.sourceURL, destination: source).font(.callout).foregroundStyle(TofuTheme.accent(scheme)) }
                    }
                    field("Date Added") { Text(TofuFormat.date(item.createdAt)).font(.callout) }
                    field("Timeline Date") { Text(TofuFormat.date(item.ideaDate)).font(.callout) }
                    if let bytes = item.byteCount { field("File Size") { Text(ByteCountFormatter.string(fromByteCount: bytes, countStyle: .file)).font(.callout) } }
                    if let width = item.width, let height = item.height { field("Dimensions") { Text("\(Int(width)) × \(Int(height))").font(.callout.monospacedDigit()) } }
                    Divider()
                    Button("Edit Details…", systemImage: "square.and.pencil") { onEdit(item) }.disabled(!store.canWrite)
                    if item.trashedAt != nil {
                        Button("Restore Item", systemImage: "arrow.uturn.backward") { store.restore(item) }.disabled(!store.canWrite)
                    }
                }.padding(22)
            }
        } else {
            ContentUnavailableView("No Selection", systemImage: "info.circle", description: Text("Select an item to view its details."))
        }
    }
    private func fileDescription(_ item: LibraryItem) -> String {
        if let file = item.relativeFile { return URL(fileURLWithPath: file).pathExtension.uppercased() + " " + item.kind.singular }
        return item.kind.singular
    }
    private func field<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 9) { Text(title).font(.caption).foregroundStyle(.secondary); content() }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct TagList: View {
    let tags: [String]
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 6) { ForEach(tags, id: \.self) { tag($0) } }
            VStack(alignment: .leading, spacing: 6) { ForEach(tags, id: \.self) { tag($0) } }
        }
    }
    private func tag(_ value: String) -> some View {
        Text(value).font(.caption).foregroundStyle(TofuTheme.tagText(scheme)).padding(.horizontal, 9).padding(.vertical, 5).background(TofuTheme.selection(scheme), in: Capsule())
    }
}
