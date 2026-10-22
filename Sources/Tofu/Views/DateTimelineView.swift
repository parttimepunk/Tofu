import SwiftUI

struct DateTimelineView: View {
    let items: [LibraryItem]
    let store: LibraryStore
    let sort: LibrarySort
    @Binding var selection: UUID?
    let onOpen: (LibraryItem) -> Void
    @Environment(\.colorScheme) private var scheme
    private var dates: [Date] {
        Array(Set(items.map { Calendar.current.startOfDay(for: $0.createdAt) })).sorted { sort == .oldest ? $0 < $1 : $0 > $1 }
    }
    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                ForEach(dates, id: \.self) { date in
                    Text(TofuFormat.day(date)).font(.headline).padding(.top, 8)
                    ForEach(items.filter { Calendar.current.isDate($0.createdAt, inSameDayAs: date) }) { item in
                        HStack(alignment: .top, spacing: 16) {
                            Circle().fill(TofuTheme.accent(scheme)).frame(width: 7, height: 7).padding(.top, 12)
                            Button { selection = item.id } label: {
                                HStack(alignment: .top, spacing: 18) {
                                    MediaThumbnail(item: item, url: store.fileURL(for: item)).frame(width: 130, height: 96).clipShape(RoundedRectangle(cornerRadius: 6))
                                    VStack(alignment: .leading, spacing: 9) {
                                        Text(item.title).font(.headline).lineLimit(2)
                                        if !item.note.isEmpty { Text(item.note).font(.callout).foregroundStyle(.secondary).lineLimit(2) }
                                        Label(item.kind.singular, systemImage: item.kind.symbol).font(.caption).foregroundStyle(.secondary)
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                }.padding(10).background(selection == item.id ? TofuTheme.selection(scheme) : .clear, in: RoundedRectangle(cornerRadius: 8))
                            }.buttonStyle(.plain).simultaneousGesture(TapGesture(count: 2).onEnded { onOpen(item) })
                        }
                    }
                }
            }.padding(24)
        }
    }
}
