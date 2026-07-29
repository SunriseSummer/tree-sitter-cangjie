const {NL, commaSep1, sep1, PREC, commaSep } = require("./common");

const rules = {
    _topLevelObject: $ => choice(
        seq(
            alias(repeat(choice("public", "protected", "internal", "private", "abstract", "open", 'sealed')), $.modifiers),
            choice(
                $.variableDeclaration,
                $.functionDefinition,
                $.classDefinition,
                $.interfaceDefinition,
                $.structDefinition,
                $.enumDefinition,
                $.typeAlias,
            ),
        ),
        $.extendDefinition,
        $.foreignDeclaration,
        $.macroDefinition,
        $.macroExpression
    ),

    variableDeclaration: $ => prec.right(-1, seq(
        choice('let', 'var', 'const'),
        field('varName', $._patternsMaybeIrrefutable),
        choice(
            seq(':', field('type', $._type), optional(seq('=', field("initilizer", $._expression)))),
            seq('=', field("initilizer", $._expression))
        ),
        optional($._END),
    )),

    parameterList: $ => seq(
        '(', optional(choice(
            seq($._unnamedParameterList, optional(seq(',', $._namedParameterList))),
            $._namedParameterList
        )), ')',
    ),
    _unnamedParameterList: $ => seq(optional(seq($._unnamedParameterList, ',')), $.parameter),
    _namedParameterList: $ => seq(optional(seq($._namedParameterList, ',')), $.namedParameter),

    parameter: $ => seq(field('name', choice($.identifier, '_')), ':', field('type', $._type)),
    namedParameter: $ => seq(field('name', $.identifier), '!', ':', field('type', $._type), optional(seq('=', field('initilizer', $._expression)))),

    returnType: $ => seq(':', $._type),

    genericConstraints: $ => prec.right(seq('where', commaSep1($.genericConstraint))),
    genericConstraint: $ => prec.right(seq(choice($.identifier, 'This'), '<:', sep1($._type, '&'))),
    
    functionDefinition: $ => prec.right(seq(
        'func', alias($.identifier, $.funcName), optional($.typeParameters), 
        $.parameterList, 
        optional($.returnType),
        optional($.genericConstraints),
        optional($.block)
    )),

    operatorFunctionDefinition: $ => prec.right(seq(
        'operator', 'func',
        alias(choice(
            seq('[', ']'),
            '!',
            '+', '-', '**', '*', '/', '%',
            '<<', '>>',
            '<', '>', '<=', '>=', '==', '!=',
            '&', '^', '|'
        ), $.operator),
        optional($.typeParameters),
        $.parameterList,
        optional($.returnType),
        optional($.genericConstraints),
        optional($.block)
    )),

    primaryInit: $ => seq(
        alias($.identifier, $.className), $.primaryInitParamLists,
        '{',
        optional(seq($.thisSuperExpression, $.callSuffix)), $._END,
        optional(repeat(choice(
            seq($._expression, optional($._END)),
            seq(choice($.variableDeclaration, $.functionDefinition), optional($._END))
        ))),
        '}'
    ),
    primaryInitParamLists : $ => prec.right(seq('(',
        choice(
            $._unnamedParameterList,
            seq($._unnamedParameterList, seq(',', $._namedParameterList), optional(seq(',', $.primaryInitNamedParamList))),
            seq($._unnamedParameterList, seq(',', $.primaryInitUnnamedParamList), optional(seq(',', $.primaryInitNamedParamList))),
            seq($._unnamedParameterList, seq(',', $.primaryInitNamedParamList)),
            seq($.primaryInitUnnamedParamList, optional(seq(',', $.primaryInitNamedParamList))),
            seq($._namedParameterList, optional(seq(',', $.primaryInitNamedParamList))),
            optional($.primaryInitNamedParamList)),
        ')'
    )),
    primaryInitUnnamedParamList: $ => prec.right(commaSep1($.primaryInitUnnamedInitParam)),
    primaryInitUnnamedInitParam: $ => seq(
        optional(alias(choice('public', 'protected', 'internal', 'private'), $.modifiers)),
        choice('let', 'var'), 
        $.parameter
    ),

    primaryInitNamedParamList: $ => prec.right(commaSep1($.primaryInitNamedInitParam)),
    primaryInitNamedInitParam: $ => seq(
        optional(alias(choice('public', 'protected', 'internal', 'private'), $.modifiers)),
        choice('let', 'var'), 
        $.namedParameter
    ),    

    init: $ => prec(-1, seq(
        'init', $.parameterList,
        $.block
    )),

    staticInit: $ => prec(-2, seq(
        'init', '(', ')',
        $.block,
    )),

    _classOrStructBody: $ => prec(1, seq(
        '{',
        repeat($._memberDeclaration),
        optional(seq(alias(choice('public', 'protected', 'internal', 'private', 'const'), $.modifiers), $.primaryInit)),
        optional($.classFinalizer),
        repeat($._memberDeclaration),
        '}'
    )),

    _memberDeclaration: $ => choice(
        seq(
            alias(repeat(choice('public', 'protected', 'internal', 'private', 'static', 'redef', 'open', 'override', 'mut')), $.modifiers),
            choice(
                $.variableDeclaration,$.functionDefinition, $.operatorFunctionDefinition, $.propertyDefinition
            ),
        ),
        seq(
            alias(choice('public', 'protected', 'internal', 'private'), $.modifiers),
            $.init,
        ),
        $.staticInit,
        $.macroExpression,
    ),

    classFinalizer: $ => seq(
        '~', 'init', '(', ')',
        $.block
    ),

    propertyDefinition: $ => seq(
        'prop', alias($.identifier, $.propertyName), ':', field('type', $._type),
        '{',
        optional(field('getter', seq('get', '(',')', $.block))),
        optional(field('setter', seq('set', '(', $.identifier, ')', $.block))),
        '}'
    ),

    classDefinition: $ => prec.right(-2, seq(
        'class', alias($.identifier, $.className), optional($.typeParameters),
        optional(seq(
            '<:', 
            field('super', choice(
                $.classType,
                seq($.classType, '&', $._superInterfaces),
                $._superInterfaces
            ))
        )),
        optional($.genericConstraints),
        alias($._classOrStructBody, $.classBody)
    )),
    classType: $ => seq(repeat(seq($.identifier, '.')), $.identifier, optional($.typeParameters)),
    _superInterfaces: $ => seq(optional(seq($._superInterfaces, '&')), alias($.classType, $.interfaceType)),

    interfaceDefinition: $ => prec.right(-3, seq(
        'interface', alias($.identifier, $.interfaceName), optional($.typeParameters), optional(seq('<:', $._superInterfaces)),
        optional($.genericConstraints),
        alias($._classOrStructBody, $.interfaceBody),
    )),
    
    structDefinition: $ => prec.right(seq(
        'struct', alias($.identifier, $.structName), optional($.typeParameters), optional(seq('<:', $._superInterfaces)),
        optional($.genericConstraints),
        alias($._classOrStructBody, $.structBody),
    )),

    enumDefinition: $ => seq(
        'enum',
        alias($.identifier, $.enumName),
        optional($.typeParameters),
        optional(seq('<:', $._superInterfaces)),
        optional($.genericConstraints),
        $.enumBody
    ),
    enumBody: $ => seq(
        '{', optional('|'), 
        sep1(field('enumConstant', $._caseBody), '|'),
        repeat(choice(
            seq(alias(repeat(choice('public', 'protected', 'internal', 'private', 'static', 'redef', 'open', 'override', 'mut')), $.modifiers), 
                choice(
                    $.functionDefinition,
                    $.operatorFunctionDefinition,
                    $.propertyDefinition,
                )
            ),
            $.macroExpression
        )),
        '}'
    ),
    _caseBody: $ => seq(
        $.identifier,
        optional(seq('(', commaSep1($._type), ')'))
    ),

    macroDefinition: $ => seq(
        alias('public', $.modifiers), 'macro', field('macroName', $.identifier),
        $.macroParameters,
        optional(seq(':', $.identifier)),
        choice(
            seq('=', $._expression),
            $.block
        )
    ),

    macroParameters: $ => seq(
        '(',
        commaSep1(seq($.identifier, ':', $.identifier)),
        ')',
    ),

    typeAlias: $ => seq(
        'type',
        alias($.identifier, $.typeAliasName),
        optional($.typeParameters),
        '=',
        field('type', $._type)
    ),
    
    extendDefinition: $ => seq(
        'extend',
        $.extendType,
        optional(seq('<:', $._superInterfaces)),
        optional($.genericConstraints),
        field('body', $._extendBody),
    ),
    
    extendType: $ => choice(
        seq(
            optional($.typeParameters),
            alias(seq(repeat(seq($.identifier, '.')), $.identifier), $.extendTypeName),
            optional($.typeArguments)
        ),
        'Int8', 'Int16', 'Int32', 'Int64', 'IntNative',
        'UInt8', 'UInt16', 'UInt32', 'UInt64', 'UIntNative',
        'Float16', 'Float32', 'Float64',
        'Rune', 'Bool', 'Nothing', 'Unit'
    ),
    
    _extendBody: $ => seq(
        '{',
        repeat($._extendMemberDeclaration),
        '}'
    ),
    
    _extendMemberDeclaration: $ => choice(
        seq(alias(repeat(choice('public', 'protected', 'internal', 'private', 'static', 'redef', 'open', 'override', 'mut')), $.modifiers), $.functionDefinition),
        $.operatorFunctionDefinition,
        $.macroExpression,
        $.propertyDefinition
    ), 

    foreignDeclaration: $ => seq(
        'foreign',
        choice($.foreignBody, $._foreignMemberDeclaration)
    ),
    
    foreignBody: $ => seq(
        '{',
        repeat(seq($._foreignMemberDeclaration, optional($._END))),
        '}'
    ),
    
    _foreignMemberDeclaration: $ => choice(
        $.classDefinition,
        $.interfaceDefinition,
        seq(
            alias(repeat(choice('public', 'protected', 'internal', 'private', 'static', 'redef', 'open', 'override', 'mut')), $.modifiers),
            $.functionDefinition
        ),
        $.macroExpression,
        $.variableDeclaration
    ),

    annotationList: $ => repeat1($.annotation),
    annotation: $ => seq(
        '@', alias(seq(repeat(seq($.identifier, '.')), $.identifier), $.annotationName),
        optional(seq('[', $._annotationArgumentList, ']'))
    ),
    _annotationArgumentList: $ => seq(repeat(seq($.annotationArgument, ',')), $.annotationArgument, optional(',')),
    annotationArgument: $ => choice(
        seq($.parameter, ':', $._expression),
        $._expression
    ),  
}
module.exports = function($) { return rules }