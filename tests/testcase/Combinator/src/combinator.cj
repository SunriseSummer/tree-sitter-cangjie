package combinator

public struct Combinator<I, O> {
    public Combinator(public let parse:
        (List<I>) -> Option<(O, List<I>)>) {}
}

extend<I, O> Combinator<I, O> {
    public func map<T>(f: (O) -> T): Combinator<I, T> {
        Combinator { input =>
            if (let Some((output, rest)) <- parse(input)) {
                Some((f(output), rest))
            } else {
                None
            }
        }
    }

    public func and<T>(other: Combinator<I, T>): Combinator<I, (O, T)> {
        Combinator { input =>
            if (let Some((output1, rest1)) <- parse(input)) {
                if (let Some((output2, rest2)) <- other.parse(rest1)) {
                    return Some(((output1, output2), rest2))
                }
            }
            return None
        }
    }

    public func or(other: Combinator<I, O>): Combinator<I, O> {
        Combinator { input =>
            let result = parse(input)
            if (let None <- result) {
                other.parse(input)
            } else {
                result
            }
        }
    }

    public operator func |(other: Combinator<I, O>): Combinator<I, O> {
        this.or(other)
    }

    public func least(min: Int64): Combinator<I, List<O>> {
        Combinator { input =>
            var list = List<O>.empty()
            var rest = input
            while (let Some((result, tail)) <- parse(rest)) {
                list = list.add(result)
                rest = tail
            }
            if (list.lenth() >= min) {
                Some((list.reverse(), rest))
            } else {
                None
            }
        }
    }

    public static func next(assert: (I) -> Bool): Combinator<I, I> {
        Combinator { input =>
            if (let Cons(head, tail) <- input) {
                if (assert(head)) {
                    return Some((head, tail))
                }
            }
            return None
        }
    }
}

extend<I, O> Combinator<I, O> where I <: Equatable<I> {
    public static func next(item: I, output: O): Combinator<I, O> {
        Combinator { input =>
            if (let Cons(head, tail) <- input) {
                if (head == item) {
                    return Some((output, tail))
                }
            }
            return None
        }
    }

    public static func next(item: I): Combinator<I, I> {
        // next(item, item) // 这样写报错，确认是否为 Sema 问题
        Combinator { input =>
            if (let Cons(head, tail) <- input) {
                if (head == item) {
                    return Some((head, tail))
                }
            }
            return None
        }
    }
}