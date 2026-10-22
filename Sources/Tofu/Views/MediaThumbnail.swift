import SwiftUI

struct MediaThumbnail: View {
    let item: LibraryItem
    let url: URL?
    @Environment(\.colorScheme) private var scheme
    @State private var thumbnail: PlatformImage?
    @State private var loaded = false
    var body: some View {
        ZStack {
            TofuTheme.surface(scheme)
            if let thumbnail { Image(platformImage: thumbnail).resizable().scaledToFill() }
            else { placeholder }
        }
        .clipped()
        .task(id: url) {
            thumbnail = nil; loaded = false
            if let url, let result = await ThumbnailService.shared.image(for: url, kind: item.kind), !Task.isCancelled {
                #if os(macOS)
                thumbnail = NSImage(cgImage: result.cgImage, size: NSSize(width: result.cgImage.width, height: result.cgImage.height))
                #else
                thumbnail = UIImage(cgImage: result.cgImage)
                #endif
            }
            if !Task.isCancelled { loaded = true }
        }
    }
    @ViewBuilder private var placeholder: some View {
        if item.kind == .note {
            VStack(alignment: .leading, spacing: 16) {
                Image(systemName: "text.alignleft").foregroundStyle(TofuTheme.accent(scheme))
                Text(item.title).font(.headline).lineLimit(2)
                Text(item.note).font(.callout).lineSpacing(4).lineLimit(7).foregroundStyle(.secondary)
                Spacer(minLength: 0)
            }.padding(20).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        } else if item.kind == .audio {
            VStack(alignment: .leading, spacing: 22) {
                Text(item.title).font(.headline).lineLimit(2)
                HStack(alignment: .center, spacing: 3) {
                    ForEach(0..<29, id: \.self) { index in
                        Capsule().fill(TofuTheme.accent(scheme).opacity(0.7)).frame(height: CGFloat([15, 27, 43, 60, 37, 20, 48, 68, 36, 23][index % 10]))
                    }
                }.frame(height: 76).accessibilityHidden(true)
                HStack { Image(systemName: "waveform"); Spacer(); Text(item.durationLabel ?? "Audio") }.font(.caption).foregroundStyle(.secondary)
            }.padding(20)
        } else if item.kind == .link {
            VStack(alignment: .leading, spacing: 16) {
                Image(systemName: "link").font(.title2).foregroundStyle(TofuTheme.accent(scheme))
                Text(item.title).font(.title3.weight(.medium)).lineLimit(4)
                Spacer(minLength: 0)
                Text(URL(string: item.sourceURL)?.host ?? item.sourceURL).font(.caption).foregroundStyle(.secondary).lineLimit(1)
            }.padding(20).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        } else {
            VStack(spacing: 10) {
                if !loaded { ProgressView().controlSize(.small) }
                else { Image(systemName: item.kind.symbol).font(.largeTitle).foregroundStyle(.secondary); Text(item.title).font(.caption).foregroundStyle(.secondary).lineLimit(2).multilineTextAlignment(.center) }
            }.padding(18)
        }
    }
}
