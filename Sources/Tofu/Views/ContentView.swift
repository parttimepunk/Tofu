import SwiftUI
import UniformTypeIdentifiers
#if os(macOS)
import AppKit
#endif

struct ContentView: View {
    let store: LibraryStore
    @Environment(\.colorScheme) private var scheme
    @State private var filter: LibraryFilter? = .all
    @State private var mode: BrowseMode = .gallery
    @State private var kind: MediaKind?
    @State private var sort: LibrarySort = .newest
    @State private var search = ""
    @State private var selectedID: UUID?
    @State private var showInspector = true
    @State private var importing = false
    @State private var editor: EditorRequest?
    @State private var preview: LibraryItem?
    @State private var collectionSheet = false
    @State private var collectionName = ""
    @State private var dropTarget = false
    private var activeFilter: LibraryFilter { filter ?? .all }
    private var selected: LibraryItem? { store.item(selectedID) }
    private var visible: [LibraryItem] { store.matching(activeFilter, search: search, kind: kind, mode: mode, sort: sort) }
    private var collection: String { if case .collection(let name) = activeFilter { return name }; return "" }

    var body: some View {
        NavigationSplitView {
            SidebarView(store: store, selection: $filter) { collectionSheet = true }
                .navigationSplitViewColumnWidth(min: 180, ideal: 205, max: 270)
        } detail: {
            VStack(spacing: 0) {
                if visible.isEmpty { emptyState.frame(maxWidth: .infinity, maxHeight: .infinity) }
                else if mode == .creative {
                    CreativeTimelineView(items: visible, store: store, selection: $selectedID) { preview = $0 }
                } else if mode == .captured {
                    DateTimelineView(items: visible, store: store, sort: sort, selection: $selectedID, onOpen: { preview = $0 })
                } else {
                    GalleryView(items: visible, store: store, mode: mode, sort: sort, selection: $selectedID) { preview = $0 }
                }
                statusBar
            }
            .background(TofuTheme.canvas(scheme))
            .overlay { if dropTarget { RoundedRectangle(cornerRadius: 8).strokeBorder(TofuTheme.accent(scheme), style: StrokeStyle(lineWidth: 2, dash: [7])).padding(8).allowsHitTesting(false) } }
            .navigationTitle(activeFilter.title)
            .toolbar { toolbar }
            .inspector(isPresented: $showInspector) {
                InspectorView(item: selected, store: store, onEdit: { editor = EditorRequest(item: $0, isNew: false) }, onPreview: { preview = $0 })
                    .inspectorColumnWidth(min: 250, ideal: 280, max: 350)
            }
        }
        .tint(TofuTheme.accent(scheme))
        .searchable(text: $search, prompt: "Search items, tags, and notes")
        #if os(macOS)
        .focusedSceneValue(\.tofuActions, WindowActions(importFiles: { importing = true }, saveLink: { compose(.link) }, newNote: { compose(.note) }, newCollection: { collectionSheet = true }, export: exportLibrary))
        #endif
        .onChange(of: filter) { _, _ in selectedID = nil; kind = nil }
        .onChange(of: search) { _, _ in clearHiddenSelection() }
        .onChange(of: kind) { _, _ in clearHiddenSelection() }
        .onChange(of: store.items) { _, _ in clearHiddenSelection() }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.image, .movie, .audio], allowsMultipleSelection: true) { result in
            switch result {
            case .success(let urls):
                Task { if let id = await store.importFiles(urls, collection: collection) { selectImported(id) } }
            case .failure(let error): store.errorMessage = error.localizedDescription
            }
        }
        .onDrop(of: [UTType.fileURL], isTargeted: $dropTarget) { providers in
            guard store.canWrite, !store.isBusy else { return false }
            let targetCollection = collection
            Task {
                var urls: [URL] = []
                for provider in providers { if let url = await droppedURL(provider) { urls.append(url) } }
                if let id = await store.importFiles(urls, collection: targetCollection) { selectImported(id) }
            }
            return true
        }
        .sheet(item: $editor) { request in
            ItemEditorView(item: request.item, store: store, isNew: request.isNew) { id in selectImported(id) }
                .tint(TofuTheme.accent(scheme))
        }
        .sheet(item: $preview) { PreviewView(item: $0, store: store).tint(TofuTheme.accent(scheme)) }
        .sheet(isPresented: $collectionSheet) { newCollectionSheet }
        .alert("Tofu", isPresented: Binding(get: { store.errorMessage != nil }, set: { if !$0 { store.errorMessage = nil } })) {
            Button("OK", role: .cancel) { store.errorMessage = nil }
        } message: { Text(store.errorMessage ?? "") }
    }
    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        ToolbarItemGroup {
            Picker("View", selection: $mode) { ForEach(BrowseMode.allCases) { Label($0.rawValue, systemImage: $0.symbol).tag($0) } }
                .pickerStyle(.segmented).labelStyle(.iconOnly).help(mode.rawValue)
            Menu {
                Picker("Media Type", selection: $kind) {
                    Text("All Types").tag(MediaKind?.none)
                    ForEach(MediaKind.allCases) { Text($0.title).tag(Optional($0)) }
                }
                Divider()
                Picker("Sort By", selection: $sort) { ForEach(LibrarySort.allCases) { Text($0.rawValue).tag($0) } }.disabled(mode == .creative)
                if mode == .creative { Text("Manual Order") }
            } label: { Text(kind?.title ?? "All Types") }
            Menu {
                Button("Import Files…", systemImage: "square.and.arrow.down") { importing = true }
                Button("Save Link…", systemImage: "link") { compose(.link) }
                Button("New Note…", systemImage: "square.and.pencil") { compose(.note) }
                Divider()
                Button("New Collection…", systemImage: "folder.badge.plus") { collectionSheet = true }
            } label: { Label("Add Item", systemImage: "plus") }.disabled(!store.canWrite || store.isBusy)
            Button { showInspector.toggle() } label: { Label("Show Item Info", systemImage: "info.circle") }.help("Show Item Info")
            Menu {
                if let item = selected {
                    Button("Preview", systemImage: "eye") { preview = item }
                    Button("Edit Details…", systemImage: "square.and.pencil") { editor = EditorRequest(item: item, isNew: false) }.disabled(!store.canWrite)
                    if item.trashedAt == nil {
                        Button("Remove Item", systemImage: "trash", role: .destructive) { if store.trash(item) { selectedID = nil } }.disabled(!store.canWrite)
                    } else { Button("Restore Item", systemImage: "arrow.uturn.backward") { if store.restore(item) { selectedID = nil } }.disabled(!store.canWrite) }
                    #if os(macOS)
                    if let url = store.fileURL(for: item) { Button("Show in Finder") { NSWorkspace.shared.activateFileViewerSelecting([url]) } }
                    #endif
                    Divider()
                }
                Button("Export Library…", systemImage: "externaldrive") { exportLibrary() }.disabled(store.isBusy || !store.isReadable)
                #if os(macOS)
                SettingsLink { Label("Settings…", systemImage: "gearshape") }
                #endif
            } label: { Label("More", systemImage: "ellipsis.circle") }
        }
    }
    private var emptyState: some View {
        ContentUnavailableView {
            Label(emptyTitle, systemImage: search.isEmpty ? "square.stack.3d.up" : "magnifyingglass")
        } description: {
            Text(emptyDescription)
        } actions: {
            if activeFilter != .trash && search.isEmpty && kind == nil {
                Button("Import Files…") { importing = true }.buttonStyle(.borderedProminent).disabled(!store.canWrite || store.isBusy)
                Button("Save Link…") { compose(.link) }.disabled(!store.canWrite)
            }
        }
    }
    private var emptyTitle: String {
        if !search.isEmpty || kind != nil { return "No Matching Items" }
        if activeFilter == .trash { return "Nothing Removed" }
        if activeFilter == .favorite { return "No Favorites Yet" }
        return "A Place for Your Ideas"
    }
    private var emptyDescription: String {
        if !search.isEmpty || kind != nil { return "Try a different search or media type." }
        if activeFilter == .trash { return "Removed items appear here and can be restored." }
        if activeFilter == .favorite { return "Mark an item with a heart to keep it close." }
        return "Drop in images, videos, or audio. Save a link or write a note."
    }
    private var statusBar: some View {
        HStack(spacing: 8) {
            if store.isBusy { ProgressView().controlSize(.mini); Text(store.isExporting ? "Exporting…" : "Importing…") }
            else { Text("\(visible.count) \(visible.count == 1 ? "item" : "items")") }
            Spacer()
            if !store.notice.isEmpty { Text(store.notice).lineLimit(1) }
        }.font(.caption).foregroundStyle(.secondary).padding(.horizontal, 18).padding(.vertical, 8).background(.bar)
    }
    private var newCollectionSheet: some View {
        VStack(alignment: .leading, spacing: 22) {
            Label("New Collection", systemImage: "folder.badge.plus").font(.headline)
            TextField("Collection Name", text: $collectionName).textFieldStyle(.roundedBorder)
            HStack {
                Button("Cancel", role: .cancel) { collectionSheet = false }.keyboardShortcut(.cancelAction)
                Spacer()
                Button("Create") {
                    let name = collectionName.trimmingCharacters(in: .whitespacesAndNewlines)
                    if store.createCollection(name) { filter = .collection(name); collectionName = ""; collectionSheet = false }
                }.buttonStyle(.borderedProminent).keyboardShortcut(.defaultAction).disabled(collectionName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }.padding(26).frame(width: 380)
    }
    private func compose(_ type: MediaKind) {
        var item = LibraryItem(title: "", kind: type); item.collection = collection
        #if os(macOS)
        if type == .link, let content = NSPasteboard.general.string(forType: .string), let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) {
            if let url = detector.firstMatch(in: content, range: NSRange(content.startIndex..., in: content))?.url, LibraryDisk.validatedURL(url.absoluteString) != nil { item.sourceURL = url.absoluteString }
        }
        #endif
        editor = EditorRequest(item: item, isNew: true)
    }
    private func clearHiddenSelection() {
        if let id = selectedID, !visible.contains(where: { $0.id == id }) { selectedID = nil }
    }
    private func selectImported(_ id: UUID) {
        if let item = store.item(id), !visible.contains(where: { $0.id == id }) { filter = item.collection.isEmpty ? .all : .collection(item.collection); kind = nil; search = "" }
        selectedID = id
    }
    private func exportLibrary() {
        #if os(macOS)
        let panel = NSOpenPanel(); panel.canChooseFiles = false; panel.canChooseDirectories = true; panel.prompt = "Export Here"; panel.message = "Choose a location for the library records and original media files."
        if panel.runModal() == .OK, let url = panel.url { Task { if let destination = await store.export(to: url) { NSWorkspace.shared.activateFileViewerSelecting([destination]) } } }
        #endif
    }
    private func droppedURL(_ provider: NSItemProvider) async -> URL? {
        await withCheckedContinuation { continuation in
            provider.loadItem(forTypeIdentifier: UTType.fileURL.identifier, options: nil) { value, _ in
                if let data = value as? Data { continuation.resume(returning: URL(dataRepresentation: data, relativeTo: nil)) }
                else { continuation.resume(returning: value as? URL) }
            }
        }
    }
}
