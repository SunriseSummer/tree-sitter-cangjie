// swift-tools-version:5.3

import Foundation
import PackageDescription

let rootDir = "../.."
var sources = ["\(rootDir)/src/parser.c"]
if FileManager.default.fileExists(atPath: "\(rootDir)/src/scanner.c") {
    sources.append("\(rootDir)/src/scanner.c")
}

let package = Package(
    name: "TreeSitterCangjie",
    products: [
        .library(name: "TreeSitterCangjie", targets: ["TreeSitterCangjie"]),
    ],
    dependencies: [
        .package(url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterCangjie",
            dependencies: [],
            path: rootDir,
            sources: sources,
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift/TreeSitterCangjie",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterCangjieTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterCangjie",
            ],
            path: "TreeSitterCangjieTests"
        )
    ],
    cLanguageStandard: .c11
)
