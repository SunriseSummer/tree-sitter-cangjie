// 换行终结符由外部扫描器(src/scanner.c)产出:
// 当下一行首个有效 token 是成员访问的 `.`(非 `..`/`..=`/浮点 `.5`)时,
// 换行不作为语句终结符,以支持行首点号的链式调用风格
const newline = sym('_newline');

const terminator = choice(newline, ';');

const PREC = {
    COMMENT: 0,           // //  /*  */
    ASSIGN: 10,            // =  += -=  *=  /=  %=  &=  ^=  |=  <<=  >>=  **=  &&=
    PIPE: 11,              // -> |>
    COALESCE: 12,          // ??(优先级低于 ||、高于 |>,右结合,见语言规范操作符表)
    OR: 13,                // ||
    AND: 14,               // &&
    BIT_OR: 15,            // |
    BIT_XOR: 16,           // ^
    BIT_AND: 17,           // &
    EQUALITY: 18,          // ==  !=
    REL: 19,               // > < >= <= is as
    RANGE: 20,            // .. ..=
    SHIFT: 21,            // <<  >>
    ADD_SUB: 22,          // +  -
    MUL_DIV: 23,          // *  /  %
    POWER: 24,            // **
    UNARY: 25,            // ! -  + 
    POSTFIX: 26,          // ++  -- ?
    PARENS: 27,           // (Expression)
    ARRAY: 28,            // [index]
    MEMBER: 29,           // .
    MARCO_CALL: 30,       // @
};
const SYMBOLS = {
    DOT: '.',
    COMMA: ',',
    LPAREN: '(',
    RPAREN: ')',
    LSQUARE: '[',
    RSQUARE: ']',
    LCURL: '{',
    RCURL: '}',
    EXP: '**',
    MUL: '*',
    MOD: '%',
    DIV: '/',
    ADD: '+',
    SUB: '-',
    PIPELINE: '|>',
    COMPOSITION: '~>',
    INC: '++',
    DEC: '--',
    AND: '&&',
    OR: '||',
    NOT: '!',
    BITAND: '&',
    BITOR: '|',
    BITXOR: '^',
    LSHIFT: '<<',
    RSHIFT: '>>',
    COLON: ':',
    SEMI: ';',
    ASSIGN: '=',
    ADD_ASSIGN: '+=',
    SUB_ASSIGN: '-=',
    MUL_ASSIGN: '*=',
    EXP_ASSIGN: '**=',
    DIV_ASSIGN: '/=',
    MOD_ASSIGN: '%=',
    AND_ASSIGN: '&&=',
    OR_ASSIGN: '||=',
    BITAND_ASSIGN: '&=',
    BITOR_ASSIGN: '|=',
    BITXOR_ASSIGN: '^=',
    LSHIFT_ASSIGN: '<<=',
    RSHIFT_ASSIGN: '>>=',
    ARROW: '->',
    BACKARROW: '<-',
    DOUBLE_ARROW: '=>',
    ELLIPSIS: '...',
    CLOSEDRANGEOP: '..=',
    RANGEOP: '..',
    HASH: '#',
    AT: '@',
    QUEST: '?',
    UPPERBOUND: '<:',
    LT: '<',
    GT: '>',
    LE: '<=',
    GE: '>=',
    NOTEQUAL: '!=',
    EQUAL: '==',
    WILDCARD: '_',
    BACKSLASH: '\\',
    QUOTESYMBOL: '`',
    DOLLAR: '$',
    QUOTE_OPEN: '"',
    TRIPLE_QUOTE_OPEN: seq('"""', /\r?\n/),
    QUOTE_CLOSE: '"',
    TRIPLE_QUOTE_CLOSE: '"""',
    LineStrExprStart: '${',
    MultiLineStrExprStart: '${',
};

const TOKENS = {
    AS            :     token('as'),
    BREAK         :     token('break'),
    BOOL          :     token('Bool'),
    CASE          :     token('case'),
    CATCH         :     token('catch'),
    CLASS         :     token('class'),
    CONST         :     token('const'),
    CONTINUE      :     token('continue'),
    RUNE          :     token('Rune'),
    DO            :     token('do'),
    ELSE          :     token('else'),
    ENUM          :     token('enum'),
    EXTEND        :     token('extend'),
    FOR           :     token('for'),
    FROM          :     token('from'),
    FUNC          :     token('func'),
    FALSE         :     token('FALSE'),
    FINALLY       :     token('finally'),
    FOREIGN       :     token('foreign'),
    FLOAT16       :     token('Float16'),
    FLOAT32       :     token('Float32'),
    FLOAT64       :     token('Float64'),
    IF            :     token('if'),
    IN            :     token('in'),
    IS            :     token('is'),
    INIT          :     token('init'),
    INOUT         :     token('inout'),
    IMPORT        :     token('import'),
    INTERFACE     :     token('interface'),
    INT8          :     token('Int8'),
    INT16         :     token('Int16'),
    INT32         :     token('Int32'),
    INT64         :     token('Int64'),
    INTNATIVE     :     token('IntNative'),
    LET           :     token('let'),
    MUT           :     token('mut'),
    MAIN          :     token('main'),
    MACRO         :     token('macro'),
    MATCH         :     token('match'),
    NOTHING       :     token('Nothing'),
    OPERATOR      :     token('operator'),
    PROP          :     token('prop'),
    PACKAGE       :     token('package'),
    QUOTE         :     token('quote'),
    RETURN        :     token('return'),
    SPAWN         :     token('spawn'),
    SUPER         :     token('super'),
    STATIC        :     token('static'),
    STRUCT        :     token('struct'),
    SYNCHRONIZED  :     token('synchronized'),
    TRY           :     token('try'),
    THIS          :     token('this'),
    TRUE          :     token('true'),
    TYPE          :     token('type'),
    THROW         :     token('throw'),
    THISTYPE      :     token('This'),
    UNSAFE        :     token('unsafe'),
    UNIT          :     token('Unit'),
    UINT8         :     token('UInt8'),
    UINT16        :     token('UInt16'),
    UINT32        :     token('UInt32'),
    UINT64        :     token('UInt64'),
    UINTNATIVE    :     token('UIntNative'),
    VAR           :     token('var'),
    VARRAY        :     token('VArray'),
    WHERE         :     token('where'),
    WHILE         :     token('while'),
    PUBLIC        :     token('public'),
    PROTECTED     :     token('protected'),
    INTERNAL      :     token('internal'),
    PRIVATE       :     token('private'),
    ABSTRACT      :     token('abstract'),
    SEALED        :     token('sealed'),
    REDEF         :     token('redef'),
    OPEN          :     token('open'),
    OVERRIDE      :     token('override'),
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {SeqRule}
 */
function commaSep1(rule) {
    return seq(rule, repeat(seq(',', rule)));          //使用左递归
}

/**
 * Creates a rule to match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep1(rule, separator) {
    return seq(rule, repeat(seq(separator, rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
    return optional(commaSep1(rule));
}

module.exports = {
    newline, terminator,
    PREC, SYMBOLS, TOKENS,
    sep1, commaSep, commaSep1
};
