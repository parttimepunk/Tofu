import AppKit
import Foundation

let destination = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: destination, withIntermediateDirectories: true)
let canvas = NSImage(size: NSSize(width: 1024, height: 1024))
canvas.lockFocus()
NSColor(srgbRed: 0.22, green: 0.46, blue: 0.37, alpha: 1).setFill()
NSBezierPath(roundedRect: NSRect(x: 40, y: 40, width: 944, height: 944), xRadius: 210, yRadius: 210).fill()
func polygon(_ points: [NSPoint], _ color: NSColor) {
    let path = NSBezierPath(); path.move(to: points[0]); points.dropFirst().forEach { path.line(to: $0) }; path.close(); color.setFill(); path.fill()
}
polygon([NSPoint(x: 260, y: 655), NSPoint(x: 512, y: 780), NSPoint(x: 764, y: 655), NSPoint(x: 512, y: 525)], NSColor(srgbRed: 0.99, green: 0.99, blue: 0.95, alpha: 1))
polygon([NSPoint(x: 260, y: 655), NSPoint(x: 512, y: 525), NSPoint(x: 512, y: 245), NSPoint(x: 260, y: 375)], NSColor(srgbRed: 0.87, green: 0.91, blue: 0.85, alpha: 1))
polygon([NSPoint(x: 512, y: 525), NSPoint(x: 764, y: 655), NSPoint(x: 764, y: 375), NSPoint(x: 512, y: 245)], NSColor(srgbRed: 0.76, green: 0.84, blue: 0.76, alpha: 1))
canvas.unlockFocus()
for (name, dimension) in [("icon_16x16", 16), ("icon_16x16@2x", 32), ("icon_32x32", 32), ("icon_32x32@2x", 64), ("icon_128x128", 128), ("icon_128x128@2x", 256), ("icon_256x256", 256), ("icon_256x256@2x", 512), ("icon_512x512", 512), ("icon_512x512@2x", 1024)] {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: dimension, pixelsHigh: dimension, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high
    canvas.draw(in: NSRect(x: 0, y: 0, width: dimension, height: dimension))
    NSGraphicsContext.restoreGraphicsState()
    try rep.representation(using: .png, properties: [:])!.write(to: destination.appendingPathComponent(name + ".png"))
}
