import SwiftUI
import AVKit

#if os(macOS)
/// Use AVPlayerView directly to avoid the SwiftUI VideoPlayer bridge's
/// superclass metadata failure observed on macOS 15.0 with this CLT SDK.
struct NativePlayerView: NSViewRepresentable {
    let player: AVPlayer
    func makeNSView(context: Context) -> AVPlayerView {
        let view = AVPlayerView()
        view.controlsStyle = .inline
        view.videoGravity = .resizeAspect
        view.showsSharingServiceButton = false
        view.player = player
        return view
    }
    func updateNSView(_ view: AVPlayerView, context: Context) { if view.player !== player { view.player = player } }
    static func dismantleNSView(_ view: AVPlayerView, coordinator: ()) { view.player?.pause(); view.player = nil }
}
#else
struct NativePlayerView: View {
    let player: AVPlayer
    var body: some View { VideoPlayer(player: player) }
}
#endif
