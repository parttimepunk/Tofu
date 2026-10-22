import XCTest
@testable import Tofu

final class LibraryTests: XCTestCase {
    private func temporaryRoot() throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("TofuTests-" + UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        addTeardownBlock { try? FileManager.default.removeItem(at: url) }
        return url
    }
    func testFilesAreCopiedAndMetadataSurvivesReload() async throws {
        let sandbox = try temporaryRoot()
        let original = sandbox.appendingPathComponent("source.png")
        let png = Data(base64Encoded: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZuoAAAAASUVORK5CYII=")!
        try png.write(to: original)
        let root = sandbox.appendingPathComponent("library")
        let store = await MainActor.run { LibraryStore(root: root) }
        let importedID = await store.importFiles([original], collection: "Typography")
        try await MainActor.run {
            XCTAssertNotNil(importedID)
            XCTAssertEqual(store.items.count, 1)
            let item = try XCTUnwrap(store.items.first)
            XCTAssertEqual(item.collection, "Typography")
            XCTAssertEqual(item.kind, .image)
            let copied = try XCTUnwrap(store.fileURL(for: item))
            XCTAssertNotEqual(copied, original)
            XCTAssertEqual(try Data(contentsOf: copied), png)
            XCTAssertEqual(try Data(contentsOf: original), png)
            let reopened = LibraryStore(root: root)
            XCTAssertEqual(reopened.items, store.items)
            XCTAssertEqual(reopened.collections, ["Typography"])
        }
    }
    func testSoftRemovalAndRestorePreserveData() async throws {
        let root = try temporaryRoot()
        try await MainActor.run {
            let store = LibraryStore(root: root)
            var item = LibraryItem(title: "A thought", kind: .note); item.note = "Keep the original idea"; item.tags = ["Type"]; item.collection = "Drafts"
            XCTAssertTrue(store.add(item))
            XCTAssertTrue(store.trash(item))
            XCTAssertTrue(store.matching(.all).isEmpty)
            XCTAssertEqual(store.matching(.trash).count, 1)
            XCTAssertTrue(store.restore(try XCTUnwrap(store.items.first)))
            let restored = try XCTUnwrap(LibraryStore(root: root).items.first)
            XCTAssertNil(restored.trashedAt)
            XCTAssertEqual(restored.note, item.note)
            XCTAssertEqual(restored.tags, item.tags)
        }
    }
    func testManualTimelineIsIndependentOfDateAndFilters() async throws {
        let root = try temporaryRoot()
        await MainActor.run {
            let store = LibraryStore(root: root)
            var first = LibraryItem(title: "Blue structure", kind: .note); first.collection = "Film"; first.tags = ["Shape"]; first.createdAt = Date(timeIntervalSince1970: 100)
            var second = LibraryItem(title: "City rain", kind: .note); second.collection = "Film"; second.createdAt = Date(timeIntervalSince1970: 200)
            var other = LibraryItem(title: "Other idea", kind: .note); other.collection = "Other"
            XCTAssertTrue(store.add(first)); XCTAssertTrue(store.add(second)); XCTAssertTrue(store.add(other))
            XCTAssertEqual(store.matching(.collection("Film")).map(\.id), [second.id, first.id])
            store.move(second.id, before: first.id)
            XCTAssertEqual(store.matching(.collection("Film"), mode: .creative).map(\.id), [second.id, first.id])
            XCTAssertEqual(store.matching(.collection("Film"), search: "shape").map(\.id), [first.id])
            XCTAssertTrue(store.matching(.collection("Film"), search: "Other").isEmpty)
            XCTAssertEqual(store.matching(.all, kind: .note).count, 3)
            XCTAssertEqual(store.items.first(where: { $0.id == first.id })?.createdAt, first.createdAt)
            XCTAssertEqual(LibraryStore(root: root).matching(.collection("Film"), mode: .creative).map(\.id), [second.id, first.id])
        }
    }
    func testCorruptLibraryIsNotOverwritten() async throws {
        let root = try temporaryRoot()
        let original = Data("broken data".utf8)
        try original.write(to: root.appendingPathComponent("library.json"))
        try await MainActor.run {
            let store = LibraryStore(root: root)
            XCTAssertFalse(store.isReadable)
            XCTAssertFalse(store.add(LibraryItem(title: "New", kind: .note)))
            XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent("library.json")), original)
        }
    }
    func testURLValidationAndUnsafePaths() throws {
        XCTAssertNotNil(LibraryDisk.validatedURL("https://example.com/a?q=test"))
        XCTAssertNil(LibraryDisk.validatedURL("javascript:alert(1)"))
        XCTAssertNil(LibraryDisk.validatedURL("file:///etc/passwd"))
        XCTAssertNil(LibraryDisk.validatedURL("https:///"))
        let root = try temporaryRoot()
        XCTAssertThrowsError(try LibraryDisk.safeFile("../outside", at: root))
        XCTAssertThrowsError(try LibraryDisk.safeFile("Media/../../outside", at: root))
        XCTAssertThrowsError(try LibraryDisk.safeFile("/Media/a.png", at: root))
        XCTAssertNoThrow(try LibraryDisk.safeFile("Media/a.png", at: root))
    }
    func testEmptyCollectionsPersistAndInvalidLinkDoesNotSave() async throws {
        let root = try temporaryRoot()
        await MainActor.run {
            let store = LibraryStore(root: root)
            XCTAssertTrue(store.createCollection("  Motion  "))
            XCTAssertEqual(LibraryStore(root: root).collections, ["Motion"])
            var link = LibraryItem(title: "Broken link", kind: .link); link.sourceURL = "not a URL"
            XCTAssertFalse(store.add(link)); XCTAssertTrue(store.items.isEmpty)
        }
    }
    func testExportCopiesCompleteLibraryAndRejectsNestedBackup() async throws {
        let sandbox = try temporaryRoot()
        let root = sandbox.appendingPathComponent("Library")
        let store = await MainActor.run { LibraryStore(root: root) }
        await MainActor.run { XCTAssertTrue(store.add(LibraryItem(title: "Backup me", kind: .note))) }
        let nested = await store.export(to: root)
        XCTAssertNil(nested)
        let exported = await store.export(to: sandbox)
        let url = try XCTUnwrap(exported)
        let document = try LibraryDisk.load(at: url)
        XCTAssertEqual(document.items.first?.title, "Backup me")
        XCTAssertEqual(try LibraryDisk.load(at: root).items, document.items)
    }
}
