import SwiftUI

struct SidebarView: View {
    let store: LibraryStore
    @Binding var selection: LibraryFilter?
    var newCollection: () -> Void
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        List {
            Section("Library") {
                row("All Items", symbol: "square.grid.2x2", filter: .all)
                row("Recently Added", symbol: "clock", filter: .recent)
                row("Favorites", symbol: "heart", filter: .favorite)
            }
            Section("Media Types") {
                ForEach(MediaKind.allCases) { kind in row(kind.title, symbol: kind.symbol, filter: .kind(kind)) }
            }
            Section {
                ForEach(store.collections, id: \.self) { name in row(name, symbol: "folder", filter: .collection(name)) }
                Button(action: newCollection) { Label("New Collection", systemImage: "folder.badge.plus").foregroundStyle(.secondary) }.buttonStyle(.plain).disabled(!store.canWrite)
            } header: { Text("Collections") }
            Section {
                row("Recently Removed", symbol: "trash", filter: .trash)
            }
        }
        .listStyle(.sidebar)
        .tint(TofuTheme.accent(scheme))
        .navigationTitle("Tofu")
        .safeAreaInset(edge: .bottom) {
            HStack(spacing: 7) {
                Image(systemName: "internaldrive")
                Text("On This Mac").font(.caption)
                Spacer()
            }.foregroundStyle(.secondary).padding(.horizontal, 18).padding(.vertical, 13)
        }
    }
    private func row(_ title: String, symbol: String, filter: LibraryFilter) -> some View {
        let selected = selection == filter
        return Button { selection = filter } label: {
            HStack(spacing: 10) {
                Image(systemName: symbol).foregroundStyle(selected ? TofuTheme.accent(scheme) : .secondary).frame(width: 18)
                Text(title).foregroundStyle(selected ? TofuTheme.tagText(scheme) : .primary).lineLimit(1)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 8).padding(.vertical, 6)
            .background(selected ? TofuTheme.selection(scheme) : .clear, in: RoundedRectangle(cornerRadius: 6))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .listRowInsets(EdgeInsets(top: 0, leading: 2, bottom: 0, trailing: 2))
        .accessibilityAddTraits(selected ? [.isSelected] : [])
    }
}
