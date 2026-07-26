const { terminator } = require("./common");

const hexDigit = /[0-9a-fA-F]/;
const octalDigit = /[0-7]/;
const decimalDigit = /[0-9]/;
const binaryDigit = /[01]/;

const hexDigits = seq(hexDigit, repeat(choice('_', hexDigit)));
const octalDigits = seq(octalDigit, repeat(choice('_', octalDigit)));
const decimalDigits = seq(decimalDigit, repeat(choice('_', decimalDigit)));
const binaryDigits = seq(binaryDigit, repeat(choice('_', binaryDigit)));

const hexLiteral = seq('0', choice('x', 'X'), hexDigits);
const octalLiteral = seq('0', choice('o', 'O'), octalDigits);
const binaryLiteral = seq('0', choice('b', 'B'), binaryDigits);
const decimalLiteral = choice(decimalDigit, seq(/[1-9]/, repeat1(choice('_', decimalDigit))));

const intLiteral = seq(
    choice(binaryLiteral, octalLiteral, hexLiteral,decimalLiteral),
    optional(/[iu](8|16|32|64)/),
);

const decimalExponent = seq(choice('e', 'E'), optional(choice('+', '-')), decimalDigits);
const decimalFloatLiteral = seq(
    choice(
        seq(decimalLiteral, decimalExponent),
        seq(decimalLiteral, '.', decimalDigits, optional(decimalExponent)),
        seq('.', decimalDigits, optional(decimalExponent)),
    ),
    optional(/[fF](16|32|64)/),
);

const hexExponent = seq(choice('p', 'P'), optional(choice('+', '-')), decimalDigits);
const hexMantissa = choice(
    seq(hexDigits),
    seq(hexDigits, '.', hexDigits),
    seq('.', hexDigits),
);
const hexFloatLiteral = seq('0', choice('x', 'X'), hexMantissa, hexExponent);

const floatLiteral = choice(decimalFloatLiteral, hexFloatLiteral);

const uniCharacterLiteral = seq('\\u{', /[0-9a-fA-F]{1,8}/, '}');
const escapedIdentifier = /\\[tbrn'"\\fv0\$]/;

const runeLiteral = choice(
    seq('r\'', choice(/[^'\\]/, uniCharacterLiteral, escapedIdentifier), '\''),
    seq('r"', choice(/[^"\\]/, uniCharacterLiteral, escapedIdentifier), '"'),
);

const singleCharByte = /[\u0000-\u0009\u000B\u000C\u000E-\u0021\u0023-\u0026\u0028-\u005B\u005D-\u007F]/;
const byteEscapedIdentifier = /\\[tbrn'"\\fv0]/;
const hexCharByte = seq('\\u{', choice(hexDigit, seq(hexDigit, hexDigit)), '}');

const byteLiteralPattern = seq("b'", choice(singleCharByte, byteEscapedIdentifier, hexCharByte), "'");

module.exports = function ($) {
    return {
        _literal: $ => choice(
            $.integerLiteral,
            $.floatLiteral,
            $.runeLiteral,
            $.byteLiteral,
            $.booleanLiteral,
            $.stringLiteral,
            $.unitLiteral
        ),

        //整数
        integerLiteral: _ => token(intLiteral),
        //浮点数
        floatLiteral: _ => token(floatLiteral),
        runeLiteral: _ => token(runeLiteral),
        //字节字面量
        byteLiteral: _ => token(byteLiteralPattern),
        // Bool keywords overlap the identifier token. Give them higher lexical
        // precedence so expressions such as `if (true)` produce literal nodes
        // instead of variable-binding nodes.
        booleanLiteral: _ => token(prec(1, choice('true', 'false'))),

        stringLiteral: $ => choice(
            $._lineStringLiteral,
            $._multiLineStringLiteral,
            $._multiLineSingleQuoteStringLiteral,
            $._multiLineRawStringLiteral,
        ),

        _lineStringLiteral: $ => choice(
            seq(
                '\'',
                repeat(choice(
                    token.immediate(prec(1, /[^'\\$]+/)),
                    token.immediate(prec(1, /\$[^{'"\\]/)),
                    token.immediate(prec(1, uniCharacterLiteral)),
                    token.immediate(prec(1, escapedIdentifier)),
                    $.inlineExpression
                )),
                '\''
            ),
            seq(
                '"',
                repeat(choice(
                    token.immediate(prec(1, /[^"\\$]+/)),
                    token.immediate(prec(1, /\$[^{"'\\]/)),
                    token.immediate(prec(1, uniCharacterLiteral)),
                    token.immediate(prec(1, escapedIdentifier)),
                    $.inlineExpression
                )),
                '"'
            ),
        ),

        inlineExpression: $ => seq(
            token.immediate(prec(2, '${')),
            $._expression, repeat(seq(repeat1(';'), $._expression)),
            '}'
        ),

        _multiLineStringLiteral: $ => seq(
            token(prec(1, seq('"""', /\r?\n/))),
            repeat(choice(
                token.immediate(prec(1, /([^"\\$]|"[^"\\$]|""[^"\\$])+/)),
                token.immediate(prec(1, '$')),
                token.immediate(prec(1, uniCharacterLiteral)),
                token.immediate(prec(1, escapedIdentifier)),
                $.inMultiLineStringExpression
            )),
            token.immediate('"""'),
        ),

        inMultiLineStringExpression: $ => seq(
            '${',
            optional(seq(
                $._expression, 
                repeat(seq(repeat(terminator), $._expression)),
            )),
            '}'
        ),

        _multiLineSingleQuoteStringLiteral: $ => seq(
            token(prec(1, seq("'''", /\r?\n/))),
            repeat(choice(
                token.immediate(prec(1, /([^'\\$]|'[^'\\$]|''[^'\\$])+/)),
                token.immediate(prec(1, '$')),
                token.immediate(prec(1, uniCharacterLiteral)),
                token.immediate(prec(1, escapedIdentifier)),
                $.inMultiLineStringExpression
            )),
            token.immediate("'''"),
        ),

        _multiLineRawStringLiteral: $ => seq(
            $._multiLineRawStringStart,
            optional($._multiLineRawStringContent),
            $._multiLineRawStringEND
        ),

        unitLiteral: _ => seq('(', ')'),
    }
}
