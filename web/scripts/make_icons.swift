import Foundation

// Approved warm-greige photographic tofu. Keep the master outside public/.
// Run from web/: swift scripts/make_icons.swift public
guard CommandLine.arguments.count == 2 else {
    fatalError("Usage: swift scripts/make_icons.swift <destination>")
}
let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
let master = root.appendingPathComponent("assets/icon-master.png")
let destination = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: destination, withIntermediateDirectories: true)
for dimension in [180, 192, 512] {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/sips")
    process.arguments = ["--resampleHeightWidth", String(dimension), String(dimension), master.path,
                         "--out", destination.appendingPathComponent("icon-greige-\(dimension).png").path]
    try process.run()
    process.waitUntilExit()
    guard process.terminationStatus == 0 else { fatalError("Icon resize failed") }
}
