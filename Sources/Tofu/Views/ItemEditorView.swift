import SwiftUI

struct ItemEditorView: View {
    @State var item: LibraryItem
    let store: LibraryStore
    var isNew = false
    var onSaved: ((UUID) -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @State private var tags = ""
    @State private var saveError: String?
    private var valid: Bool {
        !item.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        (item.kind != .link || LibraryDisk.validatedURL(item.sourceURL) != nil) &&
        (item.sourceURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || LibraryDisk.validatedURL(item.sourceURL) != nil)
    }
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Label(isNew ? (item.kind == .link ? "Save to Tofu" : "New Note") : "Edit Details", systemImage: item.kind.symbol).font(.headline)
                Spacer()
            }.padding(22)
            Divider()
            Form {
                TextField("Title", text: $item.title)
                TextField("Source URL", text: $item.sourceURL, prompt: Text("https://…"))
                    .autocorrectionDisabled()
                if item.kind == .link { Text("Saves the link and notes only.").font(.caption).foregroundStyle(.secondary) }
                HStack {
                    TextField("Collection", text: $item.collection, prompt: Text("Optional"))
                    if !store.collections.isEmpty {
                        Menu { Button("Unfiled") { item.collection = "" }; ForEach(store.collections, id: \.self) { name in Button(name) { item.collection = name } } } label: { Image(systemName: "folder") }.menuStyle(.borderlessButton).fixedSize()
                    }
                }
                TextField("Tags", text: $tags, prompt: Text("Type, Layout"))
                VStack(alignment: .leading, spacing: 8) {
                    Text("Notes").font(.caption).foregroundStyle(.secondary)
                    TextEditor(text: $item.note).frame(minHeight: 130).font(.body).scrollContentBackground(.hidden)
                        .padding(8).background(.quaternary.opacity(0.25), in: RoundedRectangle(cornerRadius: 6))
                }
                DatePicker("Timeline Date", selection: $item.ideaDate, displayedComponents: .date)
                Toggle("Favorite", isOn: $item.isFavorite)
            }.formStyle(.grouped)
            Divider()
            HStack {
                Button("Cancel", role: .cancel) { dismiss() }.keyboardShortcut(.cancelAction)
                Spacer()
                Button("Save") { save() }.buttonStyle(.borderedProminent).keyboardShortcut(.defaultAction).disabled(!valid || !store.canWrite)
            }.padding(18)
        }
        #if os(macOS)
        .frame(width: 560, height: 590)
        #endif
        .onAppear { tags = item.tags.joined(separator: ", ") }
        .alert("Couldn't Save", isPresented: Binding(get: { saveError != nil }, set: { if !$0 { saveError = nil } })) { Button("OK", role: .cancel) { saveError = nil } } message: { Text(saveError ?? "") }
    }
    private func save() {
        item.title = item.title.trimmingCharacters(in: .whitespacesAndNewlines)
        item.sourceURL = item.sourceURL.trimmingCharacters(in: .whitespacesAndNewlines)
        item.collection = item.collection.trimmingCharacters(in: .whitespacesAndNewlines)
        item.tags = Array(Set(tags.components(separatedBy: CharacterSet(charactersIn: ",，\n")).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty })).sorted()
        let success = isNew ? store.add(item) : store.update(item)
        if success { onSaved?(item.id); dismiss() }
        else { saveError = store.errorMessage ?? "Please try again."; store.errorMessage = nil }
    }
}

struct EditorRequest: Identifiable {
    var id: UUID { item.id }
    var item: LibraryItem
    var isNew: Bool
}
