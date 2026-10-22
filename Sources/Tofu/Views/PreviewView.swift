import SwiftUI
import AVKit
import Combine
#if os(macOS)
import AppKit
#endif

struct PreviewView: View {
    let item: LibraryItem
    let store: LibraryStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var scheme
    @State private var player: AVPlayer?
    @State private var isPlaying = false
    @State private var zoom: Double = 1
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Label(item.title, systemImage: item.kind.symbol).font(.headline).lineLimit(1)
                Spacer()
                if let player {
                    Button(isPlaying ? "Pause" : "Play", systemImage: isPlaying ? "pause.fill" : "play.fill") {
                        if player.rate == 0 { player.play() } else { player.pause() }
                    }.keyboardShortcut(.space, modifiers: [])
                }
                if item.kind == .image {
                    Button { zoom = max(1, zoom - 0.5) } label: { Image(systemName: "minus.magnifyingglass") }.help("Zoom Out")
                    Button { zoom = min(4, zoom + 0.5) } label: { Image(systemName: "plus.magnifyingglass") }.help("Zoom In")
                }
                Button("Done") { dismiss() }.keyboardShortcut(.cancelAction)
            }.padding(18)
            Divider()
            preview.frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        #if os(macOS)
        .frame(width: 880, height: 650)
        #endif
        .onAppear {
            if item.kind == .video || item.kind == .audio, let url = store.fileURL(for: item) { player = AVPlayer(url: url) }
        }
        .onDisappear { player?.pause(); player = nil }
    }
    @ViewBuilder private var preview: some View {
        if let url = store.fileURL(for: item) {
            if !FileManager.default.fileExists(atPath: url.path) { ContentUnavailableView("File Unavailable", systemImage: "exclamationmark.triangle", description: Text("The library record is safe. Check your files or backup.")) }
            else if item.kind == .image {
                #if os(macOS)
                if let image = NSImage(contentsOf: url) {
                    GeometryReader { geometry in
                        ScrollView([.horizontal, .vertical]) {
                            Image(nsImage: image).resizable().scaledToFit().frame(width: geometry.size.width * zoom, height: geometry.size.height * zoom)
                        }
                    }
                } else { unavailable }
                #else
                if let image = UIImage(contentsOfFile: url.path) { Image(uiImage: image).resizable().scaledToFit() } else { unavailable }
                #endif
            } else if let player {
                VStack(spacing: 24) {
                    if item.kind == .audio { Image(systemName: "waveform").font(.system(size: 66, weight: .ultraLight)); Text(item.title).font(.title2) }
                    NativePlayerView(player: player)
                        .frame(maxHeight: item.kind == .audio ? 180 : .infinity)
                        .onReceive(player.publisher(for: \.timeControlStatus).receive(on: RunLoop.main)) { status in isPlaying = status == .playing }
                }.padding(item.kind == .audio ? 40 : 0)
            } else { ProgressView() }
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Image(systemName: item.kind.symbol).font(.largeTitle).foregroundStyle(.secondary)
                    Text(item.title).font(.largeTitle.weight(.semibold))
                    Text(item.note).font(.title3).lineSpacing(7).textSelection(.enabled)
                    if let url = LibraryDisk.validatedURL(item.sourceURL) { Link("Open Original", destination: url).foregroundStyle(TofuTheme.accent(scheme)) }
                }.padding(40).frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
    private var unavailable: some View {
        ContentUnavailableView("Preview Unavailable", systemImage: "photo", description: Text("This format can still be opened in its original app."))
    }
}
