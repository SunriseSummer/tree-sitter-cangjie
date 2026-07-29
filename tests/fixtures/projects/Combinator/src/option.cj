package combinator

extend<T> Option<T> {
    public func then<R>(f: (T) -> Option<R>): Option<R> {
        match(this) {
            case Some(u) => f(u)
            case None => None
        }
    }

    public func error(message: String): Option<T> {
        if (let None <- this) {
            println(message)
        }
        return this
    }
}