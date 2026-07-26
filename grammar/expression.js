const { PREC, SYMBOLS, KEYWORDS, sep1, commaSep, commaSep1 } = require('./common');

const ASSIGN_SYMBOL = choice(
    '=', '+=', '-=', '*=', '/=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>=', "&&=", "||="
);
const BINARY_OPERATORS = [
    ['>', PREC.REL],
    ['<', PREC.REL],
    ['>=', PREC.REL],
    ['<=', PREC.REL],
    ['==', PREC.EQUALITY],
    ['!=', PREC.EQUALITY],
    ['&&', PREC.AND],
    ['||', PREC.OR],
    ['+', PREC.ADD_SUB],
    ['-', PREC.ADD_SUB],
    ['*', PREC.MUL_DIV],
    ['/', PREC.MUL_DIV],
    ['**', PREC.POWER],
    ['&', PREC.BIT_AND],
    ['|', PREC.BIT_OR],
    ['^', PREC.BIT_XOR],
    ['%', PREC.MUL_DIV],
    ['<<', PREC.SHIFT],
    ['>>', PREC.SHIFT],
    ['is', PREC.REL],
    ['as', PREC.REL],
    ['??', PREC.OR],
    ['|>', PREC.PIPE],
    ['~>', PREC.PIPE],
];

module.exports = function ($) { return {
    _expressions: $ => choice(
        $._expression,
        $.assignmentExpression,         //赋值表达式
    ),

    _expression: $ => prec.right(1, choice(
        $._atomicExpression,            //原子表达式
        $.unaryExpression,              //一元表达式
        $.binaryExpression,             //二元表达式, 流操作也是二元运算
        $._literal,                     //字面量
        $.unitLiteral,                  //Unit常量
        $.arrayLiteral,                 //数组常量
    )),

    unitLiteral: _ => seq('(', ')'),

    _atomicExpression: $ => prec.right(2, choice(
        $.atomicVariable,
//        $.coalescingExpression,
        $.tupleExpression,
        $.postfixExpression,
        $.rangeExpression,
        $.ifExpression,
        $.matchExpression,
        $._loopExpression,
        $.tryExpression,
        $.jumpExpression,
        $.numericTypeConvExpr,
        $.thisSuperExpression,
        $.synchronizedExpression,       //同步表达式
        $.parenthesizedExpression,
        $.lambdaExpression,
        $.macroExpression,
        $.quoteExpression,
        $.spawnExpression,              //生成表达式
        $.unsafeExpression,             //不安全表达式
    )),

    postfixExpression: $ => prec.right(4, seq(
        $._atomicExpression,
        choice(
//            seq('.', $._atomicExpression),  //点访问 ,  与成员访问相同，去掉
            prec(PREC.MEMBER, $.fieldAccess),
            prec(PREC.ARRAY, $.indexAccess),
            prec(PREC.POSTFIX, $.questAccess),
            prec(PREC.PARENS, $.callSuffix),
            prec(PREC.POSTFIX, $.incOrDec),
            $.trailingLambdaExpression,
        )
    )),

    fieldAccess: $ => seq('.', $.atomicVariable),

    callSuffix: $ => seq(
        '(', 
        commaSep(choice(
            seq($.varBindingPattern, ':', $._expression),
            $._expression,
            seq('inout', optional(seq($._expression, '.')), $.varBindingPattern)
        )),
        ')'
    ),

    indexAccess: $ => seq(
        '[', 
        choice(
            seq($._expression, optional('..')),
            seq($._expression, choice('..', '..='), $._expression, optional(seq(':', $._expression))),
            seq('..', $._expression,)
        ),
        ']'
    ), 
    questAccess: _ => '?',
    incOrDec: _ => choice('++', '--'),

    atomicVariable: $ => prec.right(seq($.varBindingPattern, optional($.typeArguments))),

//    coalescingExpression: $ => prec.left(seq($._expression, '??', $._expression)),

    parenthesizedExpression: $ => seq('(', $._expression, ')'),

    thisSuperExpression: _ => choice('this', 'super'),

    tupleExpression: $ => seq('(', $._expression, repeat1(seq(',', $._expression)), ')'),

    arrayLiteral: $ => seq('[', commaSep(choice($._expression, seq('*', $._expression))), ']'), 

    trailingLambdaExpression: $ => seq(
        '{',
            optional(seq(optional($.lambdaParameters),'=>')),
            optional($._expressionOrDeclaration),
        '}'
    ),

    lambdaParameters: $ => commaSep1($.lambdaParameter),

    lambdaParameter: $ => seq(choice($.varBindingPattern, '_'), optional(seq(':', $._type))),

/*  用二元运算替代
    flowExpression: $ => prec(PREC.PIPE, seq(
        $._atomicExpression,
        choice('|>', '~>'),
        $._atomicExpression,
    )),
*/
    rangeExpression: $ => prec.right(PREC.RANGE, seq(
        field('start', $._expression),
        choice('..', '..='),
        field('end', $._expression),
        optional(seq(':', field('step', $._expression)))
    )),

    ifExpression: $ => prec.right(seq(
        'if', 
        field('condition', seq('(', optional(seq('let', $._patternsMaybeIrrefutable, '<-')), $._expression, ')')),
            field('consequence', $.block),
        optional(
            field('alternative', seq('else', choice($.ifExpression, $.block))))
    )),

    matchExpression: $ => choice(
        seq('match', '(', $._expression, ')',
            '{',
                repeat1($.matchCase),
            '}'
        ),
        seq(
            'match',
            '{',
                repeat1($.matchCaseBody),
            '}'
        )
    ),
    matchCase: $ => seq(
        'case', sep1($._pattern, '|'), optional($.patternGuard),
        '=>',
        $._expressionOrDeclaration,
        repeat(seq(repeat1($._END), $._expressionOrDeclaration)),
    ),
    matchCaseBody: $ => seq(
        'case', choice($._expression, '_'), '=>', 
        $._expressionOrDeclaration, 
        optional(seq(repeat1($._END), $._expressionOrDeclaration))
    ),

    _loopExpression: $ => choice($.forInExpression, $.whileExpression, $.doWhileExpression),

    forInExpression: $ => seq(
        'for', '(', $._patternsMaybeIrrefutable, 'in', $._expression, optional($.patternGuard), ')', $.block
    ),

    whileExpression: $ => seq(
        'while', '(', optional(seq('let', $._deconstructPattern, '<-' )), $._expression, ')', 
        field('body', $.block)
    ),

    doWhileExpression: $ => seq('do',  field('body', $.block), 'while', '(', $._expression, ')'),

    tryExpression: $ => prec.right(choice(
        seq('try', 
                field('try_body', $.block),
            'finally', 
                field('finally_body', $.block)
        ),
        seq('try',
                field('try_body', $.block), 
            repeat1(seq(
            'catch', '(', $.catchPattern, ')', 
                field('catch_body', $.block))),
            optional(seq(
            'finally',
                field('finally_body', $.block)))
        ),
        seq('try', '(', $.resourceSpecifications, ')', 
                field('try_body', $.block),
            repeat(seq(
            'catch', '(', $.catchPattern, ')', 
                field('catch_body', $.block))),
            optional(seq(
            'finally', 
                field('finally_body', $.block)))
        )
    )),

    resourceSpecifications: $ => commaSep1($.resourceSpecification),
    resourceSpecification: $ => seq($.identifier, optional(seq(':', $._type)), '=', $._expression),  // $.classType

    jumpExpression: $ => choice(
        prec.right(seq('throw', $._expression)),
        prec.right(seq('return', optional($._expression))),
        'continue',
        'break',
    ),

    numericTypeConvExpr: $ => seq($.numericType, '(', $._expression, ')'),
    
    lambdaExpression: $ => seq(
        '{',
        optional($.lambdaParameters),
        '=>',
        repeat(seq($._expressionOrDeclaration, optional($._END))),
        '}'
    ),

    spawnExpression: $ => seq('spawn', optional(seq('(', $._expression, ')')), $.trailingLambdaExpression),

    synchronizedExpression: $ => seq('synchronized', '(', $._expression, ')', $.block),

    unsafeExpression: $ => seq('unsafe', $.block),

    macroExpression: $ => prec.right(PREC.MARCO_CALL, seq(
        '@', $.identifier, optional(seq('[', repeat($._quoteToken), ']')),
        choice(
            seq(choice($.identifier, $._reserved_identifier), optional(seq('(', commaSep1($._type), ')'))),
            $._macroInputExprWithoutParens,
            seq('(', choice($._quoteToken, $.macroExpression), ')')
        )
    )),
    _macroInputExprWithoutParens: $ => choice(
        $.functionDefinition,
        $.operatorFunctionDefinition,
        $.staticInit,
        $.structDefinition,
        $.primaryInit,
        $.init,
        $.enumDefinition,
        $.classDefinition,
//        $.classPrimaryInit,
//        $.classInit,
        $.interfaceDefinition,
        $.variableDeclaration,
        $.propertyDefinition,
        $.extendDefinition,
        $.macroExpression,
    ),

    unaryExpression: $ => prec.left(PREC.UNARY, seq(
        field('operator', choice('!', '-')),
        field('argument', $._expression)
    )),

    binaryExpression: $ => choice(...BINARY_OPERATORS.map(([operator, precedence]) => prec.left(precedence, seq(
        field('left', $._expression),
        field('operator', operator),
        field('right', $._expression)
    )))),

    assignmentExpression: $ => prec.right(PREC.ASSIGN, seq(
        field('variable', $._expression), 
        field('operator', ASSIGN_SYMBOL), 
        field('value', $._expression),
    )),

    quoteExpression: $ => seq("quote", $._quoteExpr),
    _quoteExpr: $ => prec.right(seq('(', $._quoteParameters, ')')),
    _quoteParameters: $ => repeat1(choice(
        choice($._quoteToken, $.identifier, $._dollarIdentifier, $._literal, $.unitLiteral, $.arrayLiteral),
        seq('$(', $._expressions, ')'),
        $.macroExpression
    )),

    _quoteToken: _ => choice(
        SYMBOLS.DOT, SYMBOLS.COMMA, 
        //SYMBOLS.LPAREN, SYMBOLS.RPAREN, 
        SYMBOLS.LSQUARE, SYMBOLS.RSQUARE, SYMBOLS.LCURL,
        SYMBOLS.COMPOSITION, SYMBOLS.INC, SYMBOLS.DEC, SYMBOLS.AND, SYMBOLS.OR, SYMBOLS.NOT, SYMBOLS.BITAND, SYMBOLS.BITOR,
        SYMBOLS.BITXOR, SYMBOLS.LSHIFT, SYMBOLS.RSHIFT, SYMBOLS.COLON, SYMBOLS.SEMI, SYMBOLS.ASSIGN, SYMBOLS.ADD_ASSIGN,
        SYMBOLS.SUB_ASSIGN, SYMBOLS.MUL_ASSIGN, SYMBOLS.EXP_ASSIGN, SYMBOLS.DIV_ASSIGN, SYMBOLS.MOD_ASSIGN, SYMBOLS.AND_ASSIGN,
        SYMBOLS.OR_ASSIGN, SYMBOLS.BITAND_ASSIGN, SYMBOLS.BITOR_ASSIGN, SYMBOLS.BITXOR_ASSIGN, SYMBOLS.LSHIFT_ASSIGN,
        SYMBOLS.RSHIFT_ASSIGN, SYMBOLS.ARROW, SYMBOLS.BACKARROW, SYMBOLS.DOUBLE_ARROW, SYMBOLS.ELLIPSIS, SYMBOLS.CLOSEDRANGEOP,
        SYMBOLS.RANGEOP, SYMBOLS.HASH, SYMBOLS.AT, SYMBOLS.QUEST, SYMBOLS.UPPERBOUND, SYMBOLS.LT, SYMBOLS.GT, SYMBOLS.LE, SYMBOLS.GE,
        SYMBOLS.NOTEQUAL, SYMBOLS.EQUAL, SYMBOLS.WILDCARD, SYMBOLS.BACKSLASH, SYMBOLS.QUOTESYMBOL, 
        //SYMBOLS.DOLLAR,
        KEYWORDS.INT8, KEYWORDS.INT16, KEYWORDS.INT32, KEYWORDS.INT64, KEYWORDS.INTNATIVE, KEYWORDS.UINT8, KEYWORDS.UINT16,
        KEYWORDS.UINT32, KEYWORDS.UINT64, KEYWORDS.UINTNATIVE, KEYWORDS.FLOAT16, KEYWORDS.FLOAT32, KEYWORDS.FLOAT64, KEYWORDS.RUNE,
        KEYWORDS.BOOLEAN, KEYWORDS.UNIT, KEYWORDS.NOTHING, KEYWORDS.STRUCT, KEYWORDS.ENUM, KEYWORDS.THISTYPE, KEYWORDS.PACKAGE,
        KEYWORDS.IMPORT, KEYWORDS.CLASS, KEYWORDS.INTERFACE, KEYWORDS.FUNC, KEYWORDS.LET, KEYWORDS.VAR, KEYWORDS.CONST, KEYWORDS.TYPE_ALIAS,
        KEYWORDS.INIT, KEYWORDS.THIS, KEYWORDS.SUPER, KEYWORDS.IF, KEYWORDS.ELSE, KEYWORDS.CASE, KEYWORDS.TRY, KEYWORDS.CATCH,
        KEYWORDS.FINALLY, KEYWORDS.FOR, KEYWORDS.DO, KEYWORDS.WHILE, KEYWORDS.THROW, KEYWORDS.RETURN, KEYWORDS.CONTINUE,
        KEYWORDS.BREAK, KEYWORDS.AS, KEYWORDS.IN, KEYWORDS.MATCH, KEYWORDS.FROM, KEYWORDS.WHERE, KEYWORDS.EXTEND, KEYWORDS.SPAWN,
        KEYWORDS.SYNCHRONIZED, KEYWORDS.MACRO, KEYWORDS.QUOTE, KEYWORDS.TRUE, KEYWORDS.FALSE, KEYWORDS.STATIC, KEYWORDS.PUBLIC,
        KEYWORDS.PRIVATE, KEYWORDS.PROTECTED, KEYWORDS.OVERRIDE, KEYWORDS.ABSTRACT, KEYWORDS.OPEN, KEYWORDS.OPERATOR, KEYWORDS.FOREIGN
    ),


    equalityOperator: _ => choice('!=', '=='),  //相等比较操作符
    comparisonOperator: _ => choice('<', '>', '<=', '>='),
    shiftingOperator: _ => choice('<<', '>>'),
    flowOperator: _ => choice('|>', '~>'),
    additiveOperator: _ => choice('+', '-'),
    exponentOperator: _ => '**',
    multiplicativeOperator: _ => choice('*', '/', '%'),
    prefixUnaryOperator: _ => choice('-', '!'),
    overloadedOperators: _ => choice(seq('[', ']'),'!','+','-','**','*','/','%','<<','>>','<','>','<=','>=','==','!=','&','^','|'),

}}
