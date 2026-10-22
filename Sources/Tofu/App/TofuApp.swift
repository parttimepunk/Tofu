import SwiftUI
#if os(macOS)
import AppKit
final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
    }
}
#endif

@main struct TofuApp: App {
    #if os(macOS)
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var delegate
    #endif
    @State private var store = LibraryStore()
    @AppStorage("appearance") private var appearance = Appearance.system.rawValue
    var body: some Scene {
        #if os(macOS)
        WindowGroup("Tofu") {
            rootView.frame(minWidth: 900, minHeight: 620)
        }
        .defaultSize(width: 1280, height: 820)
        .commands { TofuCommands() }
        Settings {
            SettingsView(store: store)
                .preferredColorScheme(Appearance(rawValue: appearance)?.scheme)
                .environment(\.locale, TofuFormat.locale)
        }
        #else
        WindowGroup("Tofu") { rootView }
        #endif
    }
    private var rootView: some View {
        ContentView(store: store)
            .preferredColorScheme(Appearance(rawValue: appearance)?.scheme)
            .environment(\.locale, TofuFormat.locale)
    }
}

#if os(macOS)
struct TofuCommands: Commands {
    @FocusedValue(\.tofuActions) private var actions
    var body: some Commands {
        CommandGroup(after: .newItem) {
            Button("Import Files…") { actions?.importFiles() }.keyboardShortcut("i").disabled(actions == nil)
            Button("Save Link…") { actions?.saveLink() }.keyboardShortcut("l", modifiers: [.command, .shift]).disabled(actions == nil)
            Button("New Note…") { actions?.newNote() }.keyboardShortcut("n", modifiers: [.command, .shift]).disabled(actions == nil)
            Button("New Collection…") { actions?.newCollection() }.disabled(actions == nil)
            Divider()
            Button("Export Library…") { actions?.export() }.disabled(actions == nil)
        }
    }
}
#endif
