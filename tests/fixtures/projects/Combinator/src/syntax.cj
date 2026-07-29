package combinator

enum Expression {
    | Number(Int)
    | Plus(Expression, Expression)
    | Minus(Expression, Expression)
    | Multiply(Expression, Expression)
    | Divide(Expression, Expression)
}

extend Expression {
    func eval(): Int64 {
        match (this) {
            case Number(n) => n
            case Plus(a, b) => a.eval() + b.eval()
            case Minus(a, b) => a.eval() - b.eval()
            case Multiply(a, b) => a.eval() * b.eval()
            case Divide(a, b) => a.eval() / b.eval()
        }
    }
}

type TTC = Combinator<Token, Token>
func atomic() {
    let number = Combinator<Token, Expression> { input =>
        if (let Cons(head, tail) <- input) {
            if (let Value(value) <- head) {
                return Some((Number(value), tail))
            }
        }
        return None
    }
    number | TTC.next(LParen)
        .and(Combinator(expression))
        .and(TTC.next(RParen))
        .map { r => r[0][1] }
}

func factor() {
    // a([×÷]a)*
    atomic().and((TTC.next(Multiply) | TTC.next(Divide))
        .and(atomic())
        .least(0)).map { r =>
            r[1].reduce({ a, b =>
                match(b) {
                    case (Multiply, c) => Multiply(a, c)
                    case (_, c) => Divide(a, c)
                }
            }, r[0])
        }
}

func expression(tokens: List<Token>):
        Option<(Expression, List<Token>)> {
    // f([+-]f)*
    factor().and((TTC.next(Plus) | TTC.next(Minus))
        .and(factor())
        .least(0)).map { r =>
            r[1].reduce({ a, b =>
                match (b) {
                    case (Plus, c) => Plus(a, c)
                    case (_, c) => Minus(a, c)
                }
            }, r[0])
        }.parse(tokens)
}

func syntax(tokens: List<Token>): Option<Expression> {
    expression(tokens).map { r => r[0] }
}
