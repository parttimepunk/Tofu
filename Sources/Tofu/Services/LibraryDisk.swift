import Foundation
import ImageIO
import AVFoundation

enum LibraryDisk {
    static func load(at root: URL) throws -> LibraryDocument {
        let file = root.appendingPathComponent("library.json")
        guard FileManager.default.fileExists(atPath: file.path) else { return LibraryDocument() }
        let data = try Data(contentsOf: file)
        let decoder = JSONDecoder()
        let document: LibraryDocument
        if let old = try? decoder.decode([LibraryItem].self, from: data) {
            document = LibraryDocument(items: old, collections: Array(Set(old.map(\.collection).filter { !$0.isEmpty })).sorted())
        } else { document = try decoder.decode(LibraryDocument.self, from: data) }
        guard document.version == 1 else { throw failure("This library requires a newer version of Tofu.") }
        for item in document.items {
            if let path = item.relativeFile { _ = try safeFile(path, at: root) }
        }
        return document
    }
    static func save(_ document: LibraryDocument, at root: URL) throws {
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(document)
        try data.write(to: root.appendingPathComponent("library.json"), options: .atomic)
    }
    static func safeFile(_ path: String, at root: URL) throws -> URL {
        let pieces = path.split(separator: "/", omittingEmptySubsequences: false)
        guard pieces.count == 2, pieces[0] == "Media", !pieces[1].isEmpty, pieces[1] != ".", pieces[1] != "..", !path.contains("\\") else { throw failure("Invalid media path in library.") }
        let url = root.appendingPathComponent(path)
        let base = root.resolvingSymlinksInPath().standardizedFileURL.path + "/"
        guard url.resolvingSymlinksInPath().standardizedFileURL.path.hasPrefix(base) else { throw failure("Media file is outside the library.") }
        return url
    }
    static func importFiles(_ urls: [URL], at root: URL) async -> (items: [LibraryItem], failures: [String]) {
        var imported: [LibraryItem] = []; var failures: [String] = []
        let mediaRoot = root.appendingPathComponent("Media", isDirectory: true)
        do { try FileManager.default.createDirectory(at: mediaRoot, withIntermediateDirectories: true) }
        catch { return ([], [error.localizedDescription]) }
        for url in urls {
            guard let kind = MediaKind.detect(url) else { failures.append("Unsupported file: \(url.lastPathComponent)"); continue }
            let access = url.startAccessingSecurityScopedResource()
            defer { if access { url.stopAccessingSecurityScopedResource() } }
            var item = LibraryItem(title: url.deletingPathExtension().lastPathComponent, kind: kind)
            let fileName = item.id.uuidString + "." + url.pathExtension.lowercased()
            let destination = mediaRoot.appendingPathComponent(fileName)
            do {
                let values = try url.resourceValues(forKeys: [.isRegularFileKey])
                guard values.isRegularFile == true else { throw failure("Choose a regular media file.") }
                try FileManager.default.copyItem(at: url, to: destination)
                item.relativeFile = "Media/" + fileName
                item.byteCount = (try? destination.resourceValues(forKeys: [.fileSizeKey]).fileSize).map(Int64.init)
                if kind == .image, let source = CGImageSourceCreateWithURL(destination as CFURL, nil), let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any] {
                    let w = properties[kCGImagePropertyPixelWidth] as? Double
                    let h = properties[kCGImagePropertyPixelHeight] as? Double
                    let orientation = properties[kCGImagePropertyOrientation] as? Int ?? 1
                    item.width = (5...8).contains(orientation) ? h : w
                    item.height = (5...8).contains(orientation) ? w : h
                }
                if kind == .video || kind == .audio {
                    let asset = AVURLAsset(url: destination)
                    if let time = try? await asset.load(.duration), time.seconds.isFinite { item.duration = time.seconds }
                    if kind == .video, let track = try? await asset.loadTracks(withMediaType: .video).first,
                       let size = try? await track.load(.naturalSize), let transform = try? await track.load(.preferredTransform) {
                        let transformed = size.applying(transform); item.width = abs(transformed.width); item.height = abs(transformed.height)
                    }
                }
                imported.append(item)
            } catch { failures.append("\(url.lastPathComponent): \(error.localizedDescription)") }
        }
        return (imported, failures)
    }
    static func validatedURL(_ string: String) -> URL? {
        guard let url = URL(string: string.trimmingCharacters(in: .whitespacesAndNewlines)), let scheme = url.scheme?.lowercased(), ["http", "https"].contains(scheme), let host = url.host, !host.isEmpty else { return nil }
        return url
    }
    static func failure(_ message: String) -> NSError { NSError(domain: "Tofu.Library", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
}
