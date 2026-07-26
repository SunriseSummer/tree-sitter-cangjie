const {commaSep1, sep1, commaSep, PREC} = require('./common');

module.exports = function($) { return {
    _type: $ => choice(
        $.arrowType,
        $.tupleType,
        $.prefixType,
        $._atomicType,
    ),

    arrowType: $ => prec(-1, seq('(', optional($._typeList), ')', '->', $._type)),

    tupleType: $ => prec(-2, seq('(', $._typeList, ')')),

    _typeList: $ => commaSep1($._type),

    prefixType: $ => seq('?', $._type),

    _atomicType: $ => prec(-2, choice(
        $.numericType,
        alias(token('Rune'), $.Rune),
        alias(token('Bool'), $.Bool),
        alias(token('Nothing'), $.Nothing),
        alias(token('Unit'), $.Unit),
        alias(token('This'), $.Thistype),
        $.userType,
    )),

    numericType: _ => token(choice(
        'UInt8', 'UInt16', 'UInt32', 'UInt64', 'UIntNative',
        'Int8', 'Int16', 'Int32', 'Int64', 'IntNative',
        'Float16', 'Float32', 'Float64')),
    
    userType: $ => prec.right(-1, seq(choice(
        $.identifier, $._reserved_identifier,
        seq($.userType, '.', choice($.identifier, $._reserved_identifier))
    ), optional($.typeArguments))),
    
    parenthesizedType: $ => seq('(', $._type, ')'),

    typeArguments: $ => seq('<', $._typeList, '>'),

    typeParameters: $ => seq('<', commaSep1(choice($.identifier, $._reserved_identifier)), '>'),

    _pattern: $ => choice(
        $.constantPattern, $.wildcardPattern, $.varBindingPattern, $.typePattern,
        $.tuplePattern, $.enumPattern
    ),

    _deconstructPattern: $ => choice(
        $.constantPattern,
        $.wildcardPattern,
        $.varBindingPattern,
        $.tuplePattern,
        $.enumPattern
    ),
    
    _patternsMaybeIrrefutable: $ => choice(
        $.wildcardPattern,
        $.varBindingPattern,
        $.tuplePattern,
        $.enumPattern
    ),

    constantPattern: $ => $._literal,                                                               //常量模式
    wildcardPattern: _ => token('_'),                                                               //通配模式
    varBindingPattern: $ => $.identifier,                                                           //变量绑定模式
    typePattern: $ => seq(choice($.wildcardPattern, $.varBindingPattern), ':', $._type),            //类型模式
    tuplePattern: $ => seq('(', commaSep1($._pattern), ')'),                                        //元组模式
    enumPattern: $ => seq(                                                                          //枚举模式
        optional(seq($._name, optional($.typeArguments), '.')), $.varBindingPattern, $.tuplePattern
    ),

    patternGuard: $ => seq('where', $._expression),

    catchPattern: $ => choice($.wildcardPattern, $._exceptionTypePattern),
    _exceptionTypePattern: $ => seq(choice($.wildcardPattern, $.varBindingPattern), ':', sep1($._type, '|')),
}}
