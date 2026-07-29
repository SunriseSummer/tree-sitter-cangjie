package combinator
import std.console.*

main() {
    println(
        """
###################################################
##  Enter an simple math expression.             ##
##  e.g.                                         ##
##  3 + 2 * (99 + 101) + 7                       ##
##  1+(1 -1) + 6* 30/9                           ##
##                                               ##
##  Press Ctrl + C to exit                       ##
###################################################
"""
    )

    while (true) {
        let input = Console.stdIn.readln()
        if (let Some(text) <- input) {
            let runes = List<Rune>.fromArray(text.trimAscii().toRuneArray())
            lex(runes)
                .error('Lex Error')
                .then(syntax)
                .error('Syntax Error')
                .then { expr => expr.eval() |> println }
        }
    }
}
