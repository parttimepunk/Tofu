import Foundation

@main struct RuntimeChecks {
    struct Failed: Error, CustomStringConvertible { var description: String }
    static func check(_ condition: @autoclosure () -> Bool, _ message: String) throws { if !condition() { throw Failed(description: message) } }
    @MainActor static func main() async throws {
        let base = FileManager.default.temporaryDirectory.appendingPathComponent("TofuChecks-" + UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: base, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: base) }
        let root = base.appendingPathComponent("Library", isDirectory: true)
        let store = LibraryStore(root: root)
        try check(store.createCollection(" Motion "), "Create collection")
        try check(LibraryStore(root: root).collections == ["Motion"], "Empty collection must persist")
        print("PASS: Empty collections persist")

        var first = LibraryItem(title: "Quiet light", kind: .note)
        first.note = "A thought about shadows"; first.tags = ["Shape"]; first.collection = "Motion"; first.createdAt = Date(timeIntervalSince1970: 100)
        var second = LibraryItem(title: "City rain", kind: .note)
        second.collection = "Motion"; second.createdAt = Date(timeIntervalSince1970: 200)
        try check(store.add(first) && store.add(second), "Save notes")
        try check(store.matching(.collection("Motion")).map(\.id) == [second.id, first.id], "Date order")
        try check(store.matching(.all, search: "shape").map(\.id) == [first.id], "Tag search")
        try check(store.matching(.all, search: "shadows").map(\.id) == [first.id], "Notes search")
        try check(store.matching(.kind(.image)).isEmpty, "Type filter")
        print("PASS: Notes, tags, collection and media filters")

        store.move(second.id, before: first.id)
        try check(store.matching(.all, mode: .creative).map(\.id) == [second.id, first.id], "Reorder")
        store.move(second, direction: 1, within: store.matching(.all, mode: .creative))
        try check(store.matching(.all, mode: .creative).map(\.id) == [first.id, second.id], "Move later")
        try check(store.matching(.all).map(\.id) == [second.id, first.id], "Reorder must not affect dates")
        try check(LibraryStore(root: root).matching(.all, mode: .creative).map(\.id) == [first.id, second.id], "Reorder persistence")
        print("PASS: Creative order persists independently of dates")

        try check(store.trash(first), "Remove")
        try check(store.matching(.trash).count == 1 && store.matching(.all).count == 1, "Soft removal filters")
        guard let removed = store.item(first.id) else { throw Failed(description: "Removed item lost") }
        try check(store.restore(removed), "Restore")
        try check(store.item(first.id)?.note == first.note && store.matching(.trash).isEmpty, "Restore preserves data")
        store.toggleFavorite(first)
        try check(store.matching(.favorite).map(\.id) == [first.id], "Favorite")
        print("PASS: Favorites and recoverable removal")

        var badLink = LibraryItem(title: "Bad URL", kind: .link); badLink.sourceURL = "javascript:alert(1)"
        try check(!store.add(badLink), "Reject unsafe URL")
        try check(LibraryDisk.validatedURL("https://example.com/ref") != nil, "Accept valid URL")
        try check(LibraryDisk.validatedURL("file:///etc/passwd") == nil, "Reject file URL")
        do { _ = try LibraryDisk.safeFile("Media/../../outside", at: root); throw Failed(description: "Path escape accepted") }
        catch let failure as Failed { throw failure } catch { }
        print("PASS: Source URL and media path validation")

        let original = base.appendingPathComponent("source.png")
        let bytes = Data(base64Encoded: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZuoAAAAASUVORK5CYII=")!
        try bytes.write(to: original)
        guard let id = await store.importFiles([original], collection: "Images"), let imported = store.item(id), let copied = store.fileURL(for: imported) else { throw Failed(description: "File import failed") }
        let copiedData = try Data(contentsOf: copied); let originalData = try Data(contentsOf: original)
        try check(copiedData == bytes && originalData == bytes && copied != original, "Import must copy originals")
        let missingResult = await store.importFiles([base.appendingPathComponent("missing.png")])
        try check(missingResult == nil && store.items.count == 3, "Missing file must not create item")
        try check(LibraryStore(root: root).items == store.items, "Round-trip metadata")
        print("PASS: Original-preserving import, error reporting and reload")

        let nested = await store.export(to: root)
        try check(nested == nil, "Reject nested backup")
        guard let exported = await store.export(to: base) else { throw Failed(description: "Export failed") }
        let backup = try LibraryDisk.load(at: exported)
        let backupAsset = try LibraryDisk.safeFile(imported.relativeFile!, at: exported)
        let backupData = try Data(contentsOf: backupAsset)
        try check(backup.items == store.items && backupData == bytes, "Backup includes metadata and original files")
        print("PASS: Full backup and nested-backup protection")

        let corruptRoot = base.appendingPathComponent("Corrupt")
        try FileManager.default.createDirectory(at: corruptRoot, withIntermediateDirectories: true)
        let corrupt = Data("invalid library data".utf8)
        try corrupt.write(to: corruptRoot.appendingPathComponent("library.json"))
        let corruptStore = LibraryStore(root: corruptRoot)
        try check(!corruptStore.isReadable && !corruptStore.add(first), "Protect corrupt library")
        let unchanged = try Data(contentsOf: corruptRoot.appendingPathComponent("library.json"))
        try check(unchanged == corrupt, "Corrupt file overwritten")
        print("PASS: Unreadable library is not overwritten")
        print("8 runtime checks passed")
    }
}
