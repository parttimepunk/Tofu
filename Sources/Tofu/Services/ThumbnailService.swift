import SwiftUI
import ImageIO
import AVFoundation
#if os(macOS)
import AppKit
typealias PlatformImage = NSImage
#else
import UIKit
typealias PlatformImage = UIImage
#endif

final class Thumbnail: NSObject, @unchecked Sendable {
    let cgImage: CGImage
    init(_ cgImage: CGImage) { self.cgImage = cgImage }
}

actor ThumbnailService {
    static let shared = ThumbnailService()
    private let cache = NSCache<NSURL, Thumbnail>()
    init() { cache.countLimit = 180; cache.totalCostLimit = 96 * 1024 * 1024 }
    func image(for url: URL, kind: MediaKind) async -> Thumbnail? {
        if let image = cache.object(forKey: url as NSURL) { return image }
        let cg: CGImage?
        if kind == .image, let source = CGImageSourceCreateWithURL(url as CFURL, nil) {
            cg = CGImageSourceCreateThumbnailAtIndex(source, 0, [kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceThumbnailMaxPixelSize: 720, kCGImageSourceCreateThumbnailWithTransform: true] as CFDictionary)
        } else if kind == .video {
            let generator = AVAssetImageGenerator(asset: AVURLAsset(url: url)); generator.appliesPreferredTrackTransform = true; generator.maximumSize = CGSize(width: 720, height: 720)
            cg = try? await generator.image(at: .zero).image
        } else { return nil }
        guard let cg else { return nil }
        let image = Thumbnail(cg)
        cache.setObject(image, forKey: url as NSURL, cost: cg.bytesPerRow * cg.height)
        return image
    }
}

extension Image {
    init(platformImage: PlatformImage) {
        #if os(macOS)
        self.init(nsImage: platformImage)
        #else
        self.init(uiImage: platformImage)
        #endif
    }
}
