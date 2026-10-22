import Foundation
import Observation

@MainActor @Observable final class LibraryStore {
    private(set) var document = LibraryDocument()
    private(set) var isReadable = true
    var errorMessage: String?
    var notice = ""
    private(set) var isImporting = false
    private(set) var isExporting = false
    let root: URL
    var items: [LibraryItem] { document.items }
    var collections: [String] { document.collections }
    var canWrite: Bool { isReadable && !isExporting }
    var isBusy: Bool { isImporting || isExporting }
    init(root: URL? = nil) {
        let configuredPath = ProcessInfo.processInfo.environment["TOFU_LIBRARY_PATH"] ?? Bundle.main.object(forInfoDictionaryKey: "TofuVerificationLibraryPath") as? String
        let override = configuredPath.map { URL(fileURLWithPath: $0, isDirectory: true) }
        self.root = root ?? override ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("Tofu", isDirectory: true)
        do { document = try LibraryDisk.load(at: self.root) }
        catch { isReadable = false; errorMessage = "Tofu couldn't read this library. Saving is disabled to protect your files.\n\(error.localizedDescription)" }
    }
    func fileURL(for item: LibraryItem) -> URL? { item.relativeFile.flatMap { try? LibraryDisk.safeFile($0, at: root) } }
    func item(_ id: UUID?) -> LibraryItem? { guard let id else { return nil }; return items.first { $0.id == id } }
    func matching(_ filter: LibraryFilter, search: String = "", kind: MediaKind? = nil, mode: BrowseMode = .gallery, sort: LibrarySort = .newest) -> [LibraryItem] {
        let query = search.trimmingCharacters(in: .whitespacesAndNewlines)
        return items.filter { item in
            let matches: Bool
            switch filter {
            case .all: matches = item.trashedAt == nil
            case .recent: matches = item.trashedAt == nil && item.createdAt >= Calendar.current.date(byAdding: .day, value: -7, to: Date())!
            case .favorite: matches = item.trashedAt == nil && item.isFavorite
            case .kind(let type): matches = item.trashedAt == nil && item.kind == type
            case .collection(let name): matches = item.trashedAt == nil && item.collection == name
            case .trash: matches = item.trashedAt != nil
            }
            return matches && (kind == nil || item.kind == kind) && (query.isEmpty || ([item.title, item.note, item.collection, item.sourceURL] + item.tags).joined(separator: " ").localizedCaseInsensitiveContains(query))
        }.sorted { a, b in
            if mode == .creative { return a.creativeOrder == b.creativeOrder ? a.id.uuidString < b.id.uuidString : a.creativeOrder < b.creativeOrder }
            switch sort {
            case .title: return a.title.localizedStandardCompare(b.title) == .orderedAscending
            case .oldest: return a.createdAt < b.createdAt
            case .newest: return a.createdAt > b.createdAt
            }
        }
    }
    @discardableResult private func commit(_ updated: LibraryDocument) -> Bool {
        guard canWrite else { errorMessage = "This library is currently read-only."; return false }
        do { try LibraryDisk.save(updated, at: root); document = updated; return true }
        catch { errorMessage = "Couldn't save your changes: \(error.localizedDescription)"; return false }
    }
    @discardableResult func add(_ original: LibraryItem) -> Bool {
        var item = original
        item.title = item.title.trimmingCharacters(in: .whitespacesAndNewlines)
        item.sourceURL = item.sourceURL.trimmingCharacters(in: .whitespacesAndNewlines)
        item.collection = item.collection.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !item.title.isEmpty, !items.contains(where: { $0.id == item.id }) else { errorMessage = "Give this item a unique identity and a title."; return false }
        guard (item.kind != .link || LibraryDisk.validatedURL(item.sourceURL) != nil), item.sourceURL.isEmpty || LibraryDisk.validatedURL(item.sourceURL) != nil else { errorMessage = "Use a complete http:// or https:// source URL."; return false }
        item.creativeOrder = (items.map(\.creativeOrder).max() ?? 0) + 1
        var updated = document; updated.items.append(item)
        includeCollection(item.collection, in: &updated)
        return commit(updated)
    }
    @discardableResult func update(_ original: LibraryItem) -> Bool {
        guard let index = items.firstIndex(where: { $0.id == original.id }) else { return false }
        var updated = document; var item = original
        item.title = item.title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !item.title.isEmpty else { errorMessage = "Give this item a title."; return false }
        item.collection = item.collection.trimmingCharacters(in: .whitespacesAndNewlines)
        item.sourceURL = item.sourceURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard item.sourceURL.isEmpty || LibraryDisk.validatedURL(item.sourceURL) != nil else { errorMessage = "Use a complete http:// or https:// source URL."; return false }
        item.updatedAt = Date(); updated.items[index] = item
        includeCollection(item.collection, in: &updated)
        return commit(updated)
    }
    @discardableResult func createCollection(_ name: String) -> Bool {
        let name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return false }
        var updated = document; includeCollection(name, in: &updated)
        return commit(updated)
    }
    private func includeCollection(_ name: String, in document: inout LibraryDocument) {
        guard !name.isEmpty, !document.collections.contains(name) else { return }
        document.collections.append(name); document.collections.sort { $0.localizedStandardCompare($1) == .orderedAscending }
    }
    func toggleFavorite(_ item: LibraryItem) { guard var latest = self.item(item.id) else { return }; latest.isFavorite.toggle(); update(latest) }
    @discardableResult func trash(_ item: LibraryItem) -> Bool { guard var latest = self.item(item.id) else { return false }; latest.trashedAt = Date(); return update(latest) }
    @discardableResult func restore(_ item: LibraryItem) -> Bool { guard var latest = self.item(item.id) else { return false }; latest.trashedAt = nil; return update(latest) }
    func move(_ item: LibraryItem, direction: Int, within visible: [LibraryItem]) {
        guard let index = visible.firstIndex(where: { $0.id == item.id }), visible.indices.contains(index + direction) else { return }
        var updated = document
        guard let a = updated.items.firstIndex(where: { $0.id == item.id }), let b = updated.items.firstIndex(where: { $0.id == visible[index + direction].id }) else { return }
        let order = updated.items[a].creativeOrder; updated.items[a].creativeOrder = updated.items[b].creativeOrder; updated.items[b].creativeOrder = order
        commit(updated)
    }
    func move(_ id: UUID, before target: UUID) {
        guard id != target else { return }
        var ordered = items.sorted { $0.creativeOrder < $1.creativeOrder }
        guard let index = ordered.firstIndex(where: { $0.id == id }), ordered.contains(where: { $0.id == target }) else { return }
        let item = ordered.remove(at: index)
        guard let destination = ordered.firstIndex(where: { $0.id == target }) else { return }
        ordered.insert(item, at: destination)
        var updated = document
        let orders = Dictionary(uniqueKeysWithValues: ordered.enumerated().map { ($0.element.id, Double($0.offset)) })
        for index in updated.items.indices { updated.items[index].creativeOrder = orders[updated.items[index].id] ?? 0 }
        commit(updated)
    }
    @discardableResult func importFiles(_ urls: [URL], collection: String = "") async -> UUID? {
        guard !isBusy, canWrite else { return nil }
        isImporting = true; defer { isImporting = false }
        let root = root
        let result = await Task.detached(priority: .userInitiated) { await LibraryDisk.importFiles(urls, at: root) }.value
        var nextOrder = (items.map(\.creativeOrder).max() ?? 0) + 1
        let added = result.items.map { original in var item = original; item.collection = collection; item.creativeOrder = nextOrder; nextOrder += 1; return item }
        var updated = document; updated.items.append(contentsOf: added); includeCollection(collection, in: &updated)
        let saved = added.isEmpty ? false : commit(updated)
        if saved { notice = "Imported \(added.count) \(added.count == 1 ? "item" : "items"). Original files are unchanged." }
        if !result.failures.isEmpty { errorMessage = result.failures.joined(separator: "\n") }
        return saved ? added.first?.id : nil
    }
    func export(to parent: URL) async -> URL? {
        guard canWrite, !isBusy else { return nil }
        // Prevent nested backups when the destination is inside the live library.
        let livePath = root.resolvingSymlinksInPath().standardizedFileURL.path
        let path = parent.resolvingSymlinksInPath().standardizedFileURL.path
        guard path != livePath, !path.hasPrefix(livePath + "/") else { errorMessage = "Choose a backup location outside the Tofu library."; return nil }
        do { try LibraryDisk.save(document, at: root) }
        catch { errorMessage = error.localizedDescription; return nil }
        isExporting = true; defer { isExporting = false }
        let root = root
        let destination = parent.appendingPathComponent("Tofu Backup " + Date().formatted(.dateTime.year().month().day()).replacingOccurrences(of: "/", with: "-") + " " + UUID().uuidString.prefix(6), isDirectory: true)
        do {
            try await Task.detached(priority: .userInitiated) { try FileManager.default.copyItem(at: root, to: destination) }.value
            notice = "Library backup saved."
            return destination
        } catch { errorMessage = "Couldn't export the library: \(error.localizedDescription)"; return nil }
    }
}
