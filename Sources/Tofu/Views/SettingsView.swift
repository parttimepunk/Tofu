import SwiftUI
#if os(macOS)
import AppKit
#endif

struct SettingsView: View {
    let store: LibraryStore
    @AppStorage("appearance") private var appearance = Appearance.system.rawValue
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        Form {
            Section("Appearance") {
                Picker("Appearance", selection: $appearance) { ForEach(Appearance.allCases) { Text($0.rawValue).tag($0.rawValue) } }.pickerStyle(.segmented)
                HStack(spacing: 8) {
                    Circle().fill(TofuTheme.accent(scheme)).frame(width: 12, height: 12)
                    Text("Soft Jade").foregroundStyle(.secondary)
                }
            }
            Section("Library") {
                LabeledContent("Storage", value: "On This Mac")
                Text(store.root.path).font(.caption).foregroundStyle(.secondary).textSelection(.enabled)
                #if os(macOS)
                Button("Show Library in Finder") {
                    do { try FileManager.default.createDirectory(at: store.root, withIntermediateDirectories: true); NSWorkspace.shared.open(store.root) }
                    catch { store.errorMessage = error.localizedDescription }
                }
                #endif
                Text("Imported files are copied into your library. Removed items remain recoverable.").font(.caption).foregroundStyle(.secondary)
            }
            Section("Sync") {
                LabeledContent("iCloud", value: "Not Connected")
                Text("This version stores your library locally. iPhone and iCloud sync are not enabled yet.").font(.caption).foregroundStyle(.secondary)
            }
            Section { LabeledContent("Tofu", value: "0.1.0") }
        }.formStyle(.grouped).tint(TofuTheme.accent(scheme))
        #if os(macOS)
        .frame(width: 520, height: 540)
        #endif
    }
}
