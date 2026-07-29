package combinator
import std.collection.*

enum Token <: Equatable<Token> {
    | Value(Int)
    | LParen
    | RParen
    | Plus
    | Minus
    | Multiply
    | Divide

    public operator func ==(that: Token) {
        match((this, that)) {
            case (Value(a), Value(b)) => a == b
            case (LParen, LParen) => true
            case (RParen, RParen) => true
            case (Plus, Plus) => true
            case (Minus, Minus) => true
            case (Multiply, Multiply) => true
            case (Divide, Divide) => true
            case _ => false
        }
    }

    public operator func !=(that: Token) {
        !(this == that)
    }
}

type RRC = Combinator<Rune, Rune>
type RTC = Combinator<Rune, Token>
func lex(runes: List<Rune>): Option<List<Token>> {
    let space = RRC.next(r' ')

    let number = RRC.next { rune =>
        UInt32(rune) >= 48 && UInt32(rune) < 58
    }.least(1).map { list =>
        list.reduce<Int64>({ sum, rune =>
            sum * 10 + Int64(UInt32(rune) - 48)
        }, 0) |> Value
    }

    let symbol = RTC.next(r'+', Plus) | RTC.next(r'-', Plus) |
                 RTC.next(r'*', Multiply) | RTC.next(r'/', Divide) |
                 RTC.next(r'(', LParen) | RTC.next(r')', RParen)

    let token = number | symbol
    let tokens = token.and(space.least(1))
        .map { result => result[0] }
        .or(token).least(1)

    tokens.parse(runes).map { r => r[0] }
}