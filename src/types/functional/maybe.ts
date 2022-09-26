import {
	isNullOrUndefined
} from './utils';

export function maybe<T>(value?: T | null | undefined): Maybe<T> {
	if (isNullOrUndefined(value))
		return nothig(value);
	return just(value);
}
export function just<T>(value: T): Just<T> {
	if (isNullOrUndefined(value))
			throw Error('Just value must be different from "null" and "undefined"');
	return new Just<T>(value);
}
export function nothig<T>(value?: null | undefined): Nothing<T> {
	if (!isNullOrUndefined(value))
		throw Error('Nothing value must be different equal to "null" or "undefined"');
	return new Nothing<T>(value);
}



export class Maybe<T> {

	private value: T | null | undefined;

	constructor(value?: T | null | undefined) {
		this.value = value;
	}

	/**
	 * Gets the inner value of the curent `Maybe` instance. Useful in those cases in which is not possible to keep the code into the elevated world
	 * @returns the inner value of the `Maybe` instance
	 */
	getValue(): T | null | undefined {
		return this.value;
	}

	match<R>(nothing: R | (() => R), just: R | ((value: T) => R)): R {
		const v = this.value;
		if (isNullOrUndefined(v)) {
			let n = nothing;
			if (typeof n === 'function')
				n = (n as () => R)() ;
			return n;
		}
		let j = just;
		if (typeof j === 'function')
			j = (j as (value: T) => R)(v) ;
		return j;
	}

	isNothing() {
		return this.match(true, false);
	}
	isJust() {
		return this.match(false, true);
	}

	toString(): string {
		return this.match('Maybe.Nothing', `Maybe.Just(${this.value})`);
	}

	then(f: (value: T) => void): this {
		// TODO check it with unit type
		const v = this.getValue();
		if (this.isJust())
			f(v!);
		// this.match<Maybe<T>>(() => nothig<T>(), v => {
		// 	f(v);
		// 	return just<T>(v);
		// });
		return this;
	}
	/**
	 * Helper function to execute side effects outside of the `Maybe` instance during the methods chaining.
	 * @param f function executed when the execution chain reaches the `tap`
	 * @returns the instance whiche the `tap` is executed over
	 */
	tap(f: (param: { m: Maybe<T>; v: T | null | undefined }) => void): this {
		f({
			m: this,
			v: this.getValue()
		});
		return this;
	}

	orElse(other: Maybe<T> | (() => Maybe<T>)): Maybe<T> {
		return this.match(other, this);
	}

	getOrElse(other: T | (() => T)) : T {
		return this.match(other, v => v);
	}

	map<R>(f: (value: T) => R | null | undefined ): Maybe<R> {
		return this.match(() => nothig(), v => maybe(f(v)));
	}

	chain<R>(f: (value: T) => Maybe<R>): Maybe<R> {
		return this.match(() => nothig(), v => f(v));
	}
	
	filter(predicate: (value: T) =>  boolean): Maybe<T> {
		return this.match(() => nothig(), v => predicate(v) ? this : nothig());
	}

	every(predicate: (value: T) =>  boolean): boolean {
		return this.match(false, v => predicate(v));
	}
	
	*[Symbol.iterator]() {
		if (this.isJust())
			yield this.getValue()!;
	}

	asArray(): T[] {
		return Array.from(this);
	}
}


export class Just<T> extends Maybe<T> {
	constructor(value: T) {
		super(value);
		if (isNullOrUndefined(value))
			throw Error('Just value must be different from "null" and "undefined"');
	}

	getValue(): T {
		return super.getValue()!;
	}
}

export class Nothing<T> extends Maybe<T> {
	constructor(value?: null | undefined) {
		super(value);
		if (!isNullOrUndefined(value))
			throw Error('Nothing value must be different equal to "null" or "undefined"');
	}

	getValue(): null | undefined {
		return super.getValue() as null | undefined;
	}
}