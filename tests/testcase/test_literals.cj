package sample

// Byte literals (UInt8)
main() {
    var a = b'x'
    var b1 = b'\n'
    var c = b'\u{78}'
    c = b'\u{90}' - b'\u{66}' + c
    let d = b'A'
    let e = b'\t'
    let f = b'\0'

    // Triple single-quote multiline strings
    let s1 = '''
    Hello,
    Cangjie Lang'''
    let s2 = '''
    line1
    line2
    line3'''
    let s3 = '''
    interpolated ${a}'''

    // Triple double-quote multiline strings (existing)
    let s4 = """
    Hello,
    World"""
    let s5 = """
    with ${a} interpolation"""

    // Raw strings with single quotes
    let r1 = #'raw single'#
    let r2 = ##'#'\n'##
    let r3 = ###'multiline
raw
content'###

    // Raw strings with double quotes (existing)
    let r4 = #"raw double"#
    let r5 = ##"
multiline raw
"##

    // Rune literals
    let rune1 = r'A'
    let rune2 = r"B"

    // Integer literals with type suffixes
    let i1 = 100i8
    let i2 = 0xFFu8
    let i3 = 0b1010i16
    let i4 = 0o77u32

    // Float literals with type suffixes
    let f1 = 3.14f64
    let f2 = .25f32
    let f3 = 1e10
}
