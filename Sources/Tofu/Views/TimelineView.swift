import SwiftUI

struct CreativeTimelineView: View {
    let items: [LibraryItem]
    let store: LibraryStore
    @Binding var selection: UUID?
    let onOpen: (LibraryItem) -> Void
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        ScrollView(.horizontal) {
            LazyHStack(alignment: .top, spacing: 20) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Text(TofuFormat.date(item.ideaDate)).font(.caption).foregroundStyle(.secondary)
                            Spacer()
                            Menu {
                                Button("Move Earlier") { store.move(item, direction: -1, within: items) }.disabled(index == 0)
                                Button("Move Later") { store.move(item, direction: 1, within: items) }.disabled(index == items.count - 1)
                            } label: { Image(systemName: "ellipsis") }.menuStyle(.borderlessButton).fixedSize()
                        }
                        HStack(spacing: 0) {
                            Circle().fill(TofuTheme.accent(scheme)).frame(width: 9, height: 9)
                            Rectangle().fill(TofuTheme.accent(scheme).opacity(0.3)).frame(height: 1)
                        }
                        Button { selection = item.id } label: {
                            MediaThumbnail(item: item, url: store.fileURL(for: item)).frame(width: 250, height: min(360, max(175, 250 / item.aspectRatio))).clipShape(RoundedRectangle(cornerRadius: 7)).overlay(RoundedRectangle(cornerRadius: 7).strokeBorder(selection == item.id ? TofuTheme.accent(scheme) : .clear, lineWidth: 2))
                        }.buttonStyle(.plain).simultaneousGesture(TapGesture(count: 2).onEnded { onOpen(item) })
                        Text(item.title).font(.headline).lineLimit(2)
                        if !item.note.isEmpty { Text(item.note).font(.callout).foregroundStyle(.secondary).lineLimit(6).lineSpacing(4) }
                        HStack {
                            Button { store.move(item, direction: -1, within: items) } label: { Image(systemName: "arrow.left") }.disabled(index == 0).help("Move Earlier")
                            Button { store.move(item, direction: 1, within: items) } label: { Image(systemName: "arrow.right") }.disabled(index == items.count - 1).help("Move Later")
                            Spacer()
                            Text("\(index + 1)").font(.caption.monospacedDigit()).foregroundStyle(.tertiary)
                        }.buttonStyle(.borderless)
                    }
                    .frame(width: 250)
                    .draggable(item.id.uuidString)
                    .dropDestination(for: String.self) { values, _ in
                        guard let string = values.first, let id = UUID(uuidString: string), store.item(id) != nil else { return false }
                        store.move(id, before: item.id); return true
                    }
                }
            }.padding(24)
        }
    }
}
