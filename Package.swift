// swift-tools-version: 6.0
import PackageDescription
let package = Package(
    name: "Tofu",
    platforms: [.macOS(.v14)],
    products: [.executable(name: "Tofu", targets: ["Tofu"])],
    targets: [
        .executableTarget(name: "Tofu", path: "Sources/Tofu", linkerSettings: [.linkedFramework("AVKit", .when(platforms: [.macOS]))]),
        .testTarget(name: "TofuTests", dependencies: ["Tofu"], path: "Tests/TofuTests")
    ], swiftLanguageModes: [.v5]
)
