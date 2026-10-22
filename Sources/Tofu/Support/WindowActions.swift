import SwiftUI

struct WindowActions {
    var importFiles: () -> Void
    var saveLink: () -> Void
    var newNote: () -> Void
    var newCollection: () -> Void
    var export: () -> Void
}
private struct WindowActionsKey: FocusedValueKey { typealias Value = WindowActions }
extension FocusedValues {
    var tofuActions: WindowActions? {
        get { self[WindowActionsKey.self] }
        set { self[WindowActionsKey.self] = newValue }
    }
}
