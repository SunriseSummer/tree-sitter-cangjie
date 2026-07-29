/**
 * @file Cangjie grammar for tree-sitter
 * @author vchuoshen6 <vchuoshen6@163.com>
 * @license MULANPLS v2.0
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const {
    PREC,
    SYMBOLS,
    TOKENS,
    newline,
    terminator,
    sep1,
    commaSep,
    commaSep1
} = require('./common');

// [运算符, 优先级, 结合性] —— 结合性依据语言规范操作符表:`**` 与 `??` 为右结合,其余为左结合
const BINARY_OPERATORS = [
    ['>', PREC.REL, 'left'],
    ['<', PREC.REL, 'left'],
    ['>=', PREC.REL, 'left'],
    ['<=', PREC.REL, 'left'],
    ['==', PREC.EQUALITY, 'left'],
    ['!=', PREC.EQUALITY, 'left'],
    ['&&', PREC.AND, 'left'],
    ['||', PREC.OR, 'left'],
    ['+', PREC.ADD_SUB, 'left'],
    ['-', PREC.ADD_SUB, 'left'],
    ['*', PREC.MUL_DIV, 'left'],
    ['/', PREC.MUL_DIV, 'left'],
    ['**', PREC.POWER, 'right'],
    ['&', PREC.BIT_AND, 'left'],
    ['|', PREC.BIT_OR, 'left'],
    ['^', PREC.BIT_XOR, 'left'],
    ['%', PREC.MUL_DIV, 'left'],
    ['<<', PREC.SHIFT, 'left'],
    ['>>', PREC.SHIFT, 'left'],
    ['is', PREC.REL, 'left'],
    ['as', PREC.REL, 'left'],
    ['??', PREC.COALESCE, 'right'],
    ['|>', PREC.PIPE, 'left'],
    ['~>', PREC.PIPE, 'left'],
];

const Literal = require('./literal');

const M = {
    name: 'cangjie',

    extras: $ => [
        /\s/,  //空白
        $.lineComment,
        $.blockComment,
    ],

    word: $ => $.identifier,

    externals: $ => [
        $._multiLineRawStringStart,
        $._multiLineRawStringContent,
        $._multiLineRawStringEND,
        $._newline,
        $.blockComment,
    ],

    supertypes: $ => [
    ],

    inline: $ => [
    ],

    conflicts: $ => [
        [$.modifiers],
        [$.modifiers, $.variableDeclaration],
        [$.callSuffix, $.unitLiteral],
        [$.callSuffix, $.tupleExpression],
        [$.callSuffix, $.parenthesizedExpression],
        [$.arrayLiteral, $.indexAccess],
        [$.functionDefinition],
        [$.trailingLambdaExpression, $.lambdaExpression],
        [$._memberDeclarations],
        [$._topObjects],
        [$.primaryInit, $.thisSuperExpression],
        [$.atomicVariable],
        [$.atomicVariable, $._genericAtomicVariable],
        [$.macroExpression],
        [$.interfaceBody],
        [$.arrowType, $._typeList],
        [$.quoteTokenTree, $.unitLiteral],
    ],

    precedences: $ => [
    ],

    rules: {
        translationUnit: $ => seq(
            optional(choice($.packageDeclaration, $.macroPackageDeclaration)),
            repeat($.importList),
            optional($._topObjects),
            optional($.mainDefinition),
            optional($._topObjects),
        ),
        // 相邻对象间的终结符可为零个,支持注解宏与声明同行:`@Deprecated func old() {...}`
        _topObjects: $ => seq(optional(seq($._topObjects, repeat(terminator))), $._topLevelObject, optional(repeat1(terminator))),

        packageDeclaration: $ => seq(
            optional($.modifiers),
            TOKENS.PACKAGE, field('packageName', $._name), optional(repeat1(terminator))
        ),
        macroPackageDeclaration: $ => seq(
            optional($.modifiers),
            TOKENS.MACRO, TOKENS.PACKAGE, field('packageName', $._name), optional(repeat1(terminator))
        ),
        modifiers: _ => repeat1(choice(
            TOKENS.PUBLIC,
            TOKENS.PROTECTED,
            TOKENS.PRIVATE,
            TOKENS.INTERNAL,
            TOKENS.ABSTRACT,
            TOKENS.STATIC,
            TOKENS.SEALED,
            TOKENS.REDEF,
            TOKENS.OPEN,
            TOKENS.OVERRIDE,
            TOKENS.MUT,
            TOKENS.UNSAFE,
            TOKENS.CONST,
        )),
        _name: $ => choice(
            $.identifier,
            $._reserved_identifier,
            $.scoped_identifier,
        ),
        scoped_identifier: $ => seq(
            field("scope", $._name), '.', field('name', choice($.identifier, $._reserved_identifier))),
        importList: $ => seq(
            optional($.modifiers),
            TOKENS.IMPORT,
            choice(
                $._importPackages,
                $.packageGroup,
                $.subGroupOfPackage,
            ),
            optional(repeat1(terminator))
        ),
        _importPackages: $ => choice(
            prec.right(-3, field('packageName', $._name)),
            prec.right(-2, $.packageFull),
            prec.right(-1, $.packageAlias),
        ),
        packageAlias: $ => seq(
            field('packageName', $._name),
            TOKENS.AS,
            field('alias', choice($.identifier, $._reserved_identifier)),
        ),
        packageFull: $ => seq(field('packageName', $._name), '.', $.asterisk),
        packageGroup: $ => seq(
            '{',
            seq($._importPackages, repeat(seq(',', $._importPackages))),
            '}',
        ),
        subGroupOfPackage: $ => seq(field('packageName', $._name), '.', $.packageGroup),
        asterisk: _ => '*',

        //types
        _type: $ => choice(
            $.arrowType,
            $.tupleType,
            $.prefixType,
//            alias(token('Array'), seq($.Array)),
//            alias(token('Range'), $.Range),
            alias(TOKENS.INT8, $.Int8),
            alias(TOKENS.INT16, $.Int16),
            alias(TOKENS.INT32, $.Int32),
            alias(TOKENS.INT64, $.Int64),
            alias(TOKENS.INTNATIVE, $.IntNative),
            alias(TOKENS.UINT8, $.UInt8),
            alias(TOKENS.UINT16, $.UInt16),
            alias(TOKENS.UINT32, $.UInt32),
            alias(TOKENS.UINT64, $.UInt64),
            alias(TOKENS.UINTNATIVE, $.UIntNative),
            alias(TOKENS.FLOAT16, $.Float16),
            alias(TOKENS.FLOAT32, $.Float32),
            alias(TOKENS.FLOAT64, $.Float64),
            alias(token('String'), $.String),
            alias(TOKENS.RUNE, $.Rune),
            alias(TOKENS.BOOL, $.Bool),
            alias(TOKENS.NOTHING, $.Nothing),
            alias(TOKENS.UNIT, $.Unit),
            alias(TOKENS.THISTYPE, $.Thistype),
            $.userType,
            $.arrayType,
            $.rangeType,
        ),

        arrowType: $ => seq('(', optional(commaSep1(choice(
            seq($.identifier, ':', $._type),
            $._type,
        ))), ')', token('->'), $._type),

        tupleType: $ => seq('(', $._typeList, ')'),

        _typeList: $ => commaSep1($._type),

        prefixType: $ => seq('?', $._type),

        userType: $ => seq($._name, optional($.typeArguments)),
        arrayType: $ => seq(token('Array'), $.typeArguments),
        rangeType: $ => seq(token('Range'), $.typeArguments),

        typeArguments: $ => seq('<', commaSep1(choice($._type, $._compileTimeConstant)), '>'),
        _compileTimeConstant: $ => choice(
            seq('$', $.identifier),
            seq('$', $.integerLiteral),
        ),

        typeParameters: $ => seq('<', commaSep1($.identifier), '>'),

        //patterns
        _pattern: $ => choice(
            $.wildcardPattern,
            $._varBindingPattern,
            $.tuplePattern,
            $.enumPattern,
            $._constantPattern,
            $.typePattern,
        ),
        wildcardPattern: _ => token('_'),                                   //通配模式
        _constantPattern: $ => choice(                                      //字面量模式(含负数字面量,如 case -1)
            alias($._literal, $.constantPattern),
            alias($._negativeNumericLiteral, $.constantPattern),
        ),
        _negativeNumericLiteral: $ => seq('-', choice($.integerLiteral, $.floatLiteral)),
        _varBindingPattern: $ => choice(
            alias($.identifier, $.varBindingPattern),
            alias($._reserved_identifier, $.varBindingPattern),
        ),
        tuplePattern: $ => seq('(', commaSep1($._pattern), ')'),                                        //元组模式
        enumPattern: $ => choice(                                                                         //枚举模式
            seq($._name, optional($.typeArguments), '.', $._varBindingPattern, optional($.tuplePattern)),
            seq($._varBindingPattern, $.tuplePattern),
        ),
        typePattern: $ => seq(choice($.wildcardPattern, $._varBindingPattern), ':', $._type),            //类型模式

        _deconstructPattern: $ => choice(
            $.wildcardPattern,
            $._varBindingPattern,
            $.tuplePattern,
            $.enumPattern,
            $._constantPattern,
        ),

        _patternsMaybeIrrefutable: $ => choice(
            $.wildcardPattern,
            $._varBindingPattern,
            $.tuplePattern,
            $.enumPattern
        ),

        patternGuard: $ => seq(TOKENS.WHERE, $._expression),

        catchPattern: $ => choice($.wildcardPattern, $._exceptionTypePattern),
        _exceptionTypePattern: $ => seq(choice($.wildcardPattern, $._varBindingPattern), ':', sep1($._type, '|')),

        mainDefinition: $ => seq(
            optional($.modifiers),
            TOKENS.MAIN, $.parameterList, optional($.returnType),
            $.block
        ),

        block: $ => seq(
            '{',
            optional(seq($._expressionOrDeclarations, optional(repeat1(terminator)))),
            '}',
        ),
        _expressionOrDeclarations: $ => seq(
            optional(seq($._expressionOrDeclarations, repeat(terminator))),
            choice(
                $.variableDeclaration,
                $.functionDefinition,
                $.assignmentExpression,
                $._expression
            ),
        ),

        //top level objects
        _topLevelObject: $ => choice(
            $.variableDeclaration,
            $.functionDefinition,
            $.classDefinition,
            $.interfaceDefinition,
            $.structDefinition,
            $.enumDefinition,
            $.typeAlias,
            $.extendDefinition,
            $.foreignDeclaration,
            $.macroDefinition,
            $.macroExpression
        ),
        variableDeclaration: $ => seq(
            optional($.modifiers),
            choice(TOKENS.LET, TOKENS.VAR, TOKENS.CONST),
            field('name', alias($._patternsMaybeIrrefutable, $.variableName)),
            choice(
                seq(':', field('type', $._type), optional(seq('=', field("initilizer", $._expression)))),
                seq('=', field("initilizer", $._expression))
            ),
        ),
        functionDefinition: $ => seq(
            optional($.modifiers),
            TOKENS.FUNC,
            field('name', $._functionName),
            optional($.typeParameters),
            $.parameterList,
            optional($.returnType),
            optional($.genericConstraints),
            optional($.block)
        ),
        _functionName: $ => alias($.identifier, $.funcName),
        parameterList: $ => seq(
            '(',
            optional(choice(
                seq(
                    commaSep1(choice($.namedParameter, $.parameter)),
                    optional(seq(',', '...')),
                ),
                '...',
            )),
            ')',
        ),
        _unnamedParameterList: $ => seq(optional(seq($._unnamedParameterList, ',')), $.parameter),
        _namedParameterList: $ => seq(optional(seq($._namedParameterList, ',')), $.namedParameter),
        parameter: $ => seq(
            field('paraName', choice($.identifier, '_')),
            ':',
            field('type', $._type)
        ),
        namedParameter: $ => seq(
            seq(field('paraName', $.identifier), '!'),
            ':',
            field('type', $._type),
            optional(seq('=', field('defaultValue', $._expression)))
        ),
        returnType: $ => seq(':', $._type),

        genericConstraints: $ => seq(TOKENS.WHERE, commaSep1($.genericConstraint)),
        genericConstraint: $ => seq(
            choice($.identifier, TOKENS.THIS),
            token('<:'),
            sep1($._type, '&')
        ),

        operatorFunctionDefinition: $ => seq(
            optional($.modifiers),
            TOKENS.OPERATOR, TOKENS.FUNC,
            alias(choice(
                token(seq('(', ')')),
                token(seq('[', ']')),
                token('!'), token('+'), token('-'), token('**'), token('*'), token('/'), token('%'), 
                token('<<'), token('>>'), token('<'), token('>'), token('<='), token('>='), 
                token('=='), token('!='), token('&'), token('^'), token('|')
            ), $.operator),
            optional($.typeParameters),
            $.parameterList,
            optional($.returnType),
            optional($.genericConstraints),
            optional($.block)
        ),

        interfaceDefinition: $ => seq(
            optional($.modifiers),
            TOKENS.INTERFACE,
            field('name', $._interfaceName),
            optional($.typeParameters),
            optional(seq(token('<:'), $._superInterfaces)),
            optional($.genericConstraints),
            '{',
            optional($.interfaceBody),
            '}',
        ),
        _interfaceName: $ => alias($.identifier, $.interfaceName),
        _superInterfaces: $ => seq(optional(seq($._superInterfaces, '&')), $._interfaceType),
        _interfaceType: $ => seq(alias($._name, $.superOrInterface), optional($.typeParameters)),
        interfaceBody: $ => seq(
            optional(seq($.interfaceBody, repeat(terminator))),
            $._interfaceBodyStatement,
            optional(repeat1(terminator)),
        ),
        _interfaceBodyStatement: $ => choice(
            $.functionDefinition,
            $.operatorFunctionDefinition,
            $.propertyDefinition,
            $.macroExpression,
        ),

        // 访问器块可选:接口/抽象类中的属性契约声明形如 `prop x: T`、`mut prop x: T`,无 getter/setter 体
        propertyDefinition: $ => seq(
            optional($.modifiers),
            TOKENS.PROP, field('name', $._propertyName), ':', field('type', $._type),
            optional(seq(
                '{',
                choice(
                    seq(
                        optional(field('getter', seq(token('get'), '(', ')', $.block))),
                        optional(field('setter', seq(token('set'), '(', $.identifier, ')', $.block))),
                    ),
                    seq(
                        field('setter', seq(token('set'), '(', $.identifier, ')', $.block)),
                        optional(field('getter', seq(token('get'), '(', ')', $.block))),
                    ),
                ),
                '}'
            ))
        ),
        _propertyName: $ => alias($.identifier, $.propertyName),

        classDefinition: $ => seq(
            optional($.modifiers),
            TOKENS.CLASS, field('name', $._className), optional($.typeParameters),
            optional(seq(token('<:'), $._superInterfaces)),
            optional($.genericConstraints),
            $.classBody,
        ),
        _className: $ => alias($.identifier, $.className),
        classBody: $ => seq(
            '{',
            optional($._memberDeclarations),
            optional($.primaryInit),
            optional($.finalizer),
            optional($._memberDeclarations),
            '}'
        ),
        _memberDeclarations: $ => seq(
            optional(seq($._memberDeclarations, repeat(terminator))),
            choice(
                $.variableDeclaration,
                $.functionDefinition,
                $.operatorFunctionDefinition,
                $.propertyDefinition,
                $.init,
                $.staticInit,
                $.macroExpression,
            ), optional(repeat1(terminator)),
        ),
        // 构造器体可选:兼容 API 文档式的签名声明(与 functionDefinition 的可选函数体一致)
        init: $ => prec(-1, seq(
            optional($.modifiers),
            TOKENS.INIT, $.parameterList,
            optional($.block)
        )),
        staticInit: $ => prec(-2, seq(
            TOKENS.STATIC, TOKENS.INIT, '(', ')',
            $.block,
        )),
        primaryInit: $ => seq(
            optional($.modifiers),
            $._className, $.primaryInitParamList,
            '{',
            optional(seq(TOKENS.SUPER, $.callSuffix, terminator)),
            optional(repeat(seq(
                choice(
                    $._expression,
                    $.assignmentExpression,
                    $.variableDeclaration,
                    $.functionDefinition,
                ),
                optional(terminator)),
            )),
            '}'
        ),
        primaryInitParamList: $ => seq('(',
            commaSep(choice(
                $.namedMemeberParam,
                $.unnamedMemberParam,
                $.namedParameter,
                $.parameter,
            )),
            ')'
        ),
        _unnamedMemberParamList: $ => prec.right(commaSep1($.unnamedMemberParam)),
        unnamedMemberParam: $ => seq(
            optional($.modifiers),
            choice(TOKENS.LET, TOKENS.VAR),
            $.parameter
        ),

        _namedMemberParamList: $ => prec.right(commaSep1($.namedMemeberParam)),
        namedMemeberParam: $ => seq(
            optional($.modifiers),
            choice(TOKENS.LET, TOKENS.VAR),
            $.namedParameter
        ),

        finalizer: $ => seq(
            '~', TOKENS.INIT, '(', ')',
            $.block
        ),

        structDefinition: $ => seq(
            optional($.modifiers),
            TOKENS.STRUCT, field('name', $._structName),
            optional($.typeParameters),
            optional(seq(token('<:'), $._superInterfaces)),
            optional($.genericConstraints),
            $.structBody,
        ),
        _structName: $ => alias($.identifier, $.structName),
        structBody: $ => seq(
            '{',
            optional($._memberDeclarations),
            optional($.primaryInit),
            optional($._memberDeclarations),
            '}'
        ),

        enumDefinition: $ => seq(
            optional($.modifiers),
            TOKENS.ENUM,
            field('name', $._enumName),
            optional($.typeParameters),
            optional(seq(token('<:'), $._superInterfaces)),
            optional($.genericConstraints),
            $.enumBody
        ),
        _enumName: $ => alias($.identifier, $.enumName),
        enumBody: $ => seq(
            '{', optional('|'),
            sep1($.enumConstructor, '|'),
            repeat(choice(
                $.functionDefinition,
                $.operatorFunctionDefinition,
                $.propertyDefinition,
                $.macroExpression
            )),
            '}'
        ),
        // Keep each constructor and its optional payload as one semantic node.
        // The previous hidden rule caused enumBody to expose a flat sequence of
        // identifiers, punctuation and types, making constructor signatures
        // impossible to recover reliably from the syntax tree.
        enumConstructor: $ => seq(
            field('name', $.identifier),
            optional(field('payload', $.enumPayload))
        ),
        enumPayload: $ => seq(
            '(', commaSep1(field('type', $._type)), ')'
        ),

        typeAlias: $ => seq(
            optional($.modifiers),
            TOKENS.TYPE,
            field('name', alias($.identifier, $.typeAliasName)),
            optional($.typeParameters),
            '=',
            field('type', $._type)
        ),

        extendDefinition: $ => seq(
            TOKENS.EXTEND,
            $.extendType,
            optional(seq(token('<:'), $._superInterfaces)),
            optional($.genericConstraints),
            $.extendBody,
        ),

        extendType: $ => choice(
            seq(
                optional($.typeParameters),
                $._name, optional($.typeArguments)
            ),
            TOKENS.INT8, TOKENS.INT16, TOKENS.INT32, TOKENS.INT64, TOKENS.INTNATIVE,
            TOKENS.UINT8, TOKENS.UINT16, TOKENS.UINT32, TOKENS.UINT64, TOKENS.UINTNATIVE,
            TOKENS.FLOAT16, TOKENS.FLOAT32, TOKENS.FLOAT64,
            TOKENS.RUNE, TOKENS.BOOL, TOKENS.NOTHING, TOKENS.UNIT,
            token('String'), token('Range'),
        ),

        extendBody: $ => seq(
            '{',
            repeat(seq(choice(
                $.functionDefinition,
                $.operatorFunctionDefinition,
                $.propertyDefinition,
                $.macroExpression
            ), repeat(terminator))),
            '}'
        ),

        foreignDeclaration: $ => seq(
            TOKENS.FOREIGN,
            choice($.foreignBody, $._foreignMemberDeclaration)
        ),

        foreignBody: $ => seq(
            '{',
            repeat(seq($._foreignMemberDeclaration, repeat(terminator))),
            '}'
        ),

        _foreignMemberDeclaration: $ => choice(
            $.classDefinition,
            $.interfaceDefinition,
            $.functionDefinition,
            $.macroExpression,
            $.variableDeclaration
        ),

        macroDefinition: $ => seq(
            optional($.modifiers), TOKENS.MACRO, field('name', $._macroName),
            seq(
                '(',
                seq($.identifier, ':', $.identifier),
                optional(seq(',', $.identifier, ':', $.identifier)),
                ')',
            ),
            optional(seq(':', $.identifier)),
            choice(
                seq('=', $._expression),
                $.block
            )
        ),
        _macroName: $ => alias($.identifier, $.macroName),

        // expressions
        assignmentExpression: $ => prec.right(PREC.ASSIGN, seq(
            field('variable', $._expression),
            field('operator', choice(
                token('='), token('+='), token('-='), token('*='), token('/='), 
                token('%='), token('**='), token('&='), token('|='), token('^='),
                token('<<='), token('>>='), token("&&="), token("||=")
            )),
            field('value', $._expression),
        )),

        _expression: $ => choice(
            $.unaryExpression,              //一元表达式
            $.binaryExpression,             //二元表达式, 流操作也是二元运算
            $._atomicExpression,
        ),

        _atomicExpression: $ => choice(
            $._literal,                     //字面量
            $.arrayLiteral,                 //数组常量
            //seq($.identifier, $.typeArguments),
            $.atomicVariable,
            $.rangeExpression,
            $.parenthesizedExpression,
            $.tupleExpression,
            $.postfixExpression,
            $.jumpExpression,
            //$.typeConvertExpression,      //等同于函数调用
            $.lambdaExpression,
            $.synchronizedExpression,       //同步表达式
            $.spawnExpression,              //生成表达式
            $.unsafeExpression,             //不安全表达式
            $.thisSuperExpression,
            $.ifExpression,
            $.matchExpression,
            $._loopExpression,
            $.tryExpression,
            $.quoteExpression,
            $.macroExpression,
            $._dollarIdentifier,
            $._dollarCall,
        ),

        _dollarCall: $ => seq(
            token('$('),
            $._expression,
            ')',
        ),

        unaryExpression: $ => prec.left(PREC.UNARY, seq(
            field('operator', choice('!', '-')),
            field('argument', $._expression)
        )),

        binaryExpression: $ => choice(...BINARY_OPERATORS.map(([operator, precedence, assoc]) => (assoc === 'right' ? prec.right : prec.left)(precedence, seq(
            field('left', $._expression),
            //@ts-ignore
            field('operator', token(operator)),
            field('right', $._expression)
        )))),

        arrayLiteral: $ => seq('[', commaSep(choice($._expression, seq('*', $._expression))), ']'),

        // _atomicExpression: $ => choice(
        //     $.atomicVariable,
        //     $.rangeExpression,
        //     $.parenthesizedExpression,
        //     $.tupleExpression,
        //     $.postfixExpression,
        // ),
        atomicVariable: $ => seq($._varBindingPattern, optional($.typeArguments)),
        parenthesizedExpression: $ => seq('(', $._expression, ')'),
        rangeExpression: $ => prec.right(PREC.RANGE, seq(
            field('start', $._expression),
            choice(token('..'), token('..=')),
            field('end', $._expression),
            optional(seq(':', field('step', $._expression)))
        )),

        postfixExpression: $ => prec.right(29, seq(
            field('operand', choice(
                // Inside another call's argument list, `Name<T>(...)` is also a
                // valid chain of relational expressions. Give the complete
                // generic postfix operand a small dynamic preference while
                // retaining the public `atomicVariable` node shape.
                prec.dynamic(1, alias(
                    $._genericAtomicVariable,
                    $.atomicVariable
                )),
                $._expression
            )),
            field('suffix', choice(
                prec(PREC.MEMBER, $.fieldAccess),
                prec(PREC.ARRAY, $.indexAccess),
                prec(PREC.POSTFIX, $.questAccess),
                prec(PREC.PARENS, $.callSuffix),
                prec(PREC.POSTFIX, $.incOrDec),
                $.trailingLambdaExpression,
            ))
        )),

        _genericAtomicVariable: $ => seq(
            $._varBindingPattern,
            $.typeArguments
        ),

        fieldAccess: $ => seq('.', $.atomicVariable),
        callSuffix: $ => seq(
            '(',
            commaSep(choice(
                seq($._varBindingPattern, ':', $._expression),
                $._expression,
                seq(TOKENS.INOUT, optional(seq($._expression, '.')), $._varBindingPattern)
            )),
            ')'
        ),
        indexAccess: $ => seq(
            '[',
            choice(
                seq($._expression, optional(token('..'))),
                seq($._expression, choice(token('..'), token('..=')), $._expression, optional(seq(':', $._expression))),
                seq(token('..'), $._expression,)
            ),
            ']'
        ),
        questAccess: _ => '?',
        incOrDec: _ => choice(token('++'), token('--')),

        tupleExpression: $ => seq('(', $._expression, repeat1(seq(',', $._expression)), ')'),
        trailingLambdaExpression: $ => seq(
            '{',
            optional(seq(optional($.lambdaParameters), token('=>'))),
            optional(seq($._expressionOrDeclarations, repeat(terminator))),
            '}'
        ),

        lambdaParameters: $ => commaSep1($.lambdaParameter),
        lambdaParameter: $ => seq(choice($._varBindingPattern, '_'), optional(seq(':', $._type))),

        jumpExpression: $ => choice(
            prec.right(seq(TOKENS.THROW, $._expression)),
            prec.right(seq(TOKENS.RETURN, optional($._expression))),
            TOKENS.CONTINUE,
            TOKENS.BREAK,
        ),

        thisSuperExpression: _ => choice(TOKENS.THIS, TOKENS.SUPER),
        //typeConvertExpression: $ => seq($._type, '(', $._expression, ')'),
        lambdaExpression: $ => seq(
            '{',
            optional($.lambdaParameters),
            token('=>'),
            optional(seq($._expressionOrDeclarations, optional(repeat1(terminator)))),
            '}'
        ),
        spawnExpression: $ => seq(TOKENS.SPAWN, optional(seq('(', $._expression, ')')), $.trailingLambdaExpression),
        synchronizedExpression: $ => seq(TOKENS.SYNCHRONIZED, '(', $._expression, ')', $.block),
        unsafeExpression: $ => seq(TOKENS.UNSAFE, $.block),
        // 条件支持 let 模式解构串联:`let A <- x && let B <- y`,且 let 前可有布尔表达式
        // (如 `ok && let Some(a) <- f()`);无 let 时退化为普通表达式,树形与旧版一致
        ifExpression: $ => prec.left(seq(
            TOKENS.IF,
            field('condition', seq('(', choice(
                seq(
                    optional(seq($._expression, token('&&'))),
                    seq(TOKENS.LET, $._patternsMaybeIrrefutable, token('<-'), $._expression),
                    repeat(seq(token('&&'), TOKENS.LET, $._patternsMaybeIrrefutable, token('<-'), $._expression)),
                ),
                $._expression,
            ), ')')),
            field('consequence', $.block),
            optional(field('alternative', seq(TOKENS.ELSE, choice($.ifExpression, $.block))))
        )),

        matchExpression: $ => choice(
            seq(TOKENS.MATCH, '(', $._expression, ')',
                '{',
                repeat1($.matchCase),
                '}'
            ),
            seq(
                TOKENS.MATCH,
                '{',
                repeat1($.matchCaseBody),
                '}'
            )
        ),
        matchCase: $ => seq(
            TOKENS.CASE, sep1($._pattern, '|'), optional($.patternGuard),
            token('=>'),
            $._expressionOrDeclarations, optional(repeat1(terminator)),
        ),
        matchCaseBody: $ => seq(
            TOKENS.CASE, choice($._expression, '_'), token('=>'),
            $._expressionOrDeclarations, optional(repeat1(terminator)),
        ),

        _loopExpression: $ => choice($.forInExpression, $.whileExpression, $.doWhileExpression),

        forInExpression: $ => seq(
            TOKENS.FOR, '(', $._patternsMaybeIrrefutable, TOKENS.IN, $._expression, optional($.patternGuard), ')', $.block
        ),

        whileExpression: $ => seq(
            TOKENS.WHILE, '(', choice(
                seq(
                    optional(seq($._expression, token('&&'))),
                    seq(TOKENS.LET, $._deconstructPattern, token('<-'), $._expression),
                    repeat(seq(token('&&'), TOKENS.LET, $._deconstructPattern, token('<-'), $._expression)),
                ),
                $._expression,
            ), ')',
            $.block
        ),

        doWhileExpression: $ => seq(TOKENS.DO, field('body', $.block), TOKENS.WHILE, '(', $._expression, ')'),

        tryExpression: $ => prec.right(choice(
            seq(TOKENS.TRY,
                field('try_body', $.block),
                TOKENS.FINALLY,
                field('finally_body', $.block)
            ),
            seq(TOKENS.TRY,
                field('try_body', $.block),
                repeat1(seq(
                    TOKENS.CATCH, '(', $.catchPattern, ')',
                    field('catch_body', $.block))),
                optional(seq(
                    TOKENS.FINALLY,
                    field('finally_body', $.block)))
            ),
            seq(TOKENS.TRY, '(', $.resourceSpecifications, ')',
                field('try_body', $.block),
                repeat(seq(
                    TOKENS.CATCH, '(', $.catchPattern, ')',
                    field('catch_body', $.block))),
                optional(seq(
                    TOKENS.FINALLY,
                    field('finally_body', $.block)))
            )
        )),

        resourceSpecifications: $ => commaSep1($.resourceSpecification),
        resourceSpecification: $ => seq($.identifier, optional(seq(':', $._type)), '=', $._expression),  // $.classType

        macroExpression: $ => seq(
            '@', $._macroName,
            optional(seq('[', optional(commaSep1($._macroAttrArgument)), ']')),
            optional(seq('(', optional(seq(repeat(seq($._expression, ',')), $._expression)), ')')),
        ),
        // 宏属性参数,覆盖标准库测试框架等的三种真实形态:
        //   @Configure[randomSeed: 42]          命名参数
        //   @Bench[data in [d1, d2]]            数据策略(`in`)
        //   @When[backend == "sdl"]             普通表达式
        _macroAttrArgument: $ => choice(
            seq($._varBindingPattern, ':', $._expression),
            seq($._expression, TOKENS.IN, $._expression),
            $._expression,
        ),

        // Macro quotes are token trees, not executable expressions in the
        // enclosing program. Keeping the tree balanced accepts splices in
        // type, parameter, and declaration positions while avoiding false
        // symbol/call extraction from code that the macro merely generates.
        quoteExpression: $ => seq(
            TOKENS.QUOTE,
            '(',
            optional($.quoteTokenTree),
            ')'
        ),
        quoteTokenTree: $ => repeat1(choice(
            $._literal,
            $.quoteSplice,
            $._quoteRawAtom,
            seq('(', optional($.quoteTokenTree), ')'),
            seq('{', optional($.quoteTokenTree), '}'),
            seq('[', optional($.quoteTokenTree), ']'),
        )),
        quoteSplice: $ => seq('$', '(', optional($.quoteTokenTree), ')'),
        _quoteRawAtom: _ => token(prec(1, /[^$(){}\[\]\s]+/)),

        lineComment: _ => token(prec(PREC.COMMENT, seq('//', /[^\r\n\u2028\u2029]*/))),
        // blockComment \u4e3b\u8981\u7531\u5916\u90e8\u626b\u63cf\u5668\u4ea7\u51fa(src/scanner.c):\u4ed3\u9889\u5757\u6ce8\u91ca\u652f\u6301\u5d4c\u5957
        // (/* \u5916 /* \u5185 */ \u5916 */),\u6b63\u5219\u65e0\u6cd5\u8868\u8fbe\u5d4c\u5957\u914d\u5bf9,\u626b\u63cf\u5668\u6309\u6df1\u5ea6\u8ba1\u6570\u5b9e\u73b0\u3002
        // \u6b64\u5904\u4fdd\u7559\u7684\u6b63\u5219\u89c4\u5219\u662f\u5185\u90e8\u8bcd\u6cd5\u56de\u9000:externals \u4e0e\u540c\u540d\u89c4\u5219\u5e76\u5b58\u65f6\u4f18\u5148\u8d70
        // \u5916\u90e8\u626b\u63cf\u5668,\u5916\u90e8\u672a\u4ea7\u51fa\u65f6(\u5982\u6362\u884c\u88ab\u6291\u5236\u540e\u7684\u5185\u90e8\u7eed\u626b)\u7531\u8be5\u6b63\u5219\u515c\u5e95\u3002
        blockComment: _ => token(prec(PREC.COMMENT,
            seq(
                '/*',
                /[^*]*\*+([^/*][^*]*\*+)*/,
                '/',
            ),
        )),
        _reserved_identifier: $ => choice(
            prec(-3, alias(
                choice(
                    TOKENS.PUBLIC,
                    TOKENS.PROTECTED,
                    TOKENS.PRIVATE,
                    TOKENS.INTERNAL,
                    TOKENS.ABSTRACT,
                    TOKENS.SEALED,
                    TOKENS.REDEF,
                    TOKENS.OPEN,
                    TOKENS.OVERRIDE,
                    token('get'),
                    token('set'),
                ),
                $.identifier
            ))
        ),
        // 仓颉规范(Unicode XID): XID_Start 或 `_` 开头,后接任意 XID_Continue。
        // 单独的 `_` 保留在此规则中(与历史行为一致),以支持表达式位置的
        // 通配符用法,如元组赋值 `(a, _) = t`、mock 参数匹配 `f(_)`;
        // 模式位置的 `_` 仍由 wildcardPattern 优先匹配。
        identifier: _ => token(choice(
            /[_\p{XID_Start}][\p{XID_Continue}]*/,
            seq('`', /[_\p{XID_Start}][\p{XID_Continue}]*/, '`'),
        )),
        _dollarIdentifier: $ => seq('$', $.identifier),

        ...Literal(),
    },
};

module.exports = grammar(M);
