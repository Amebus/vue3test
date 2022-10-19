import {
	isNullOrUndefined
} from './utils';

interface ITappable<T> {
	/**
	 * Helper function to execute side effects outside of the `Maybe` instance during the methods chaining.  
	 * Mainly used to debug or log
	 * @param f function executed when the execution chain reaches the `tap`
	 * @returns the instance whiche the `tap` is executed over
	 */
	tap(f: (value: T | null | undefined ) => void): this;
}
interface IAsArray<T> {
	[Symbol.iterator](): Generator<T, void, unknown>;
	asArray(): T[];
}
export type BooleanComparePredicate<T> = (current: T, other: T) => boolean;

export interface IMaybe<T> extends ITappable<T>, IAsArray<T> {
	
	/**
	 * `Apply f => f a ~> f (a -> b) -> f b`
	 * @param m
	 */
	apply<R>(m: IMaybe<(value: T) => R>): IMaybe<R>;

	/**
	 * `Chain m => m a ~> (a -> m b) -> m b`
	 */
	chain<R>(f: (value: T) => IMaybe<R>): IMaybe<R>;
	
	/**
	 * `Extend w => w a ~> (w a -> b) -> w b`
	 */
	extend<R>(f: (value: IMaybe<T>) => R): IMaybe<R>;
	
	filter(predicate: (value: T) =>  boolean): IMaybe<T>;
	
	getOrElse(other: T | (() => T)) : T;
	
	hasValue(): boolean;
	
	/**
	 * Functor f => f a ~> (a -> b) -> f b
	 */
	map<R>(f: (value: T) => R ): IMaybe<R>;
	match<R>(nothing: R | (() => R), just: R | ((value: T) => R)): R;
	
	orElse(other: IMaybe<T> | (() => IMaybe<T>)): IMaybe<T>;
	
	/**
	 * `Foldable f => f a ~> ((b, a) -> b, b) -> b`
	 */
	reduce<R>(f: (acc: R, value: T) => R, initial: R): R;
	
	then(f: (value: T) => void): this;
	
	/**
	 * Gets the inner value of the curent `IMaybe` instance. Useful in those cases in which is not possible to keep the code into the elevated world
	 * @returns the inner value of the `IMaybe` instance
	 */
	value(): T | null | undefined;
}

interface IJust<T> extends IMaybe<T>,	ITappable<T>, IAsArray<T> {
	value(): T;
}

interface INothing<T> extends IMaybe<T>, ITappable<T>, IAsArray<T> {
	value(): null | undefined;
}

export function maybe<T>(value?: T | null | undefined): IMaybe<T> {
	return isNullOrUndefined(value) ? nothing() : just(value);
}
export function just<T>(value: T): IJust<T> {
	return new Just(value);
}
export function nothing<T>(value?: null | undefined): INothing<T> {
	return new Nothing<T>(value);
}


export class Just<T> implements IJust<T> {
	
	*[Symbol.iterator]() {
		yield this.value();
	}

	private internalValue: T;

	constructor(value: T) {
		if (isNullOrUndefined(value))
			throw Error('Just value must be different from "null" and "undefined"');
		this.internalValue = value;
	}

	asArray(): T[] {
		return Array.from(this);
	}

	apply<R>(m: IMaybe<(value: T) => R>): IMaybe<R> {
		return m.match(() => nothing(), f => maybe(f(this.value()))); 
	}

	chain<R>(f: (value: T) => IMaybe<R>): IMaybe<R> {
		return f(this.value());
	}

	equals(other: IMaybe<T>, equalsPredicate?: BooleanComparePredicate<T> | null | undefined): boolean {
		// if (other.hasValue())
		// 	return maybe(equalsPredicate).getOrElse(() => (t: T, o: T) => t === o)(this.value(), other.value()!);
		// return false;
		return other.match(false, ov => maybe(equalsPredicate).getOrElse(() => (t: T, o: T) => t === o)(this.value(), ov));
	}

	extend<R>(f: (value: IMaybe<T>) => R): IMaybe<R> {
		return maybe(f(this));
	}

	filter(predicate: (value: T) =>  boolean): IMaybe<T> {
		return predicate(this.value()) ? this : nothing();
	}

	getOrElse() : T {
		return this.value();
	}

	hasValue(): boolean {
		return true;
	}

	lessThenOrEqual(other: IMaybe<T>, lessThenOrEqualPredicate?: BooleanComparePredicate<T> | null | undefined): boolean {
		// if (other.hasValue())
		// 	return maybe(lessThenOrEqualPredicate).getOrElse(() => (t: T, o: T) => t <= o)(this.value(), other.value()!);
		// return false;
		return other.match(false, ov => maybe(lessThenOrEqualPredicate).getOrElse(() => (t: T, o: T) => t <= o)(this.value(), ov));
	}

	map<R>(f: (value: T) => R | null | undefined ): IMaybe<R> {
		return maybe(f(this.value()));
	}

	match<R>(_nothing: R | (() => R), just: R | ((value: T) => R)): R {
		const v = this.value();
		let j = just;
		if (typeof j === 'function')
			j = (j as (value: T) => R)(v) ;
		return j;
	}

	orElse(): IMaybe<T> {
		return this;
	}

	reduce<R>(f: (acc: R, value: T) => R, initial: R): R {
		return f(initial, this.value());
	}

	tap(f: (value: T | null | undefined) => void): this {
		f(this.value());
		return this;
	}
	then(f: (value: T) => void): this {
		f(this.value());
		return this;
	}
	toString(): string {
		return `Maybe.Just(${this.value()})`;
	}

	value(): T {
		return this.internalValue;
	}
}

export class Nothing<T> implements INothing<T> {
	
	*[Symbol.iterator]() {
		// nothing doesn't return anything
	}

	constructor(value?: null | undefined) {
		if (!isNullOrUndefined(value))
			throw Error('Nothing value must be equal to "null" or "undefined"');
	}

	asArray(): T[] {
		return Array.from(this);
	}

	apply<R>(): IMaybe<R> {
		return nothing<R>();
	}

	chain<R>(): IMaybe<R> {
		return nothing();
	}

	equals(other: IMaybe<T>): boolean {
		return !other.hasValue();
	}

	extend<R>(): IMaybe<R> {
		return nothing();
	}

	filter(): IMaybe<T> {
		return nothing();
	}

	getOrElse(other: T | (() => T)) : T {
		return this.match(other);
	}

	hasValue(): boolean {
		return false;
	}

	map<R>(): IMaybe<R> {
		return nothing();
	}
	match<R>(nothing: R | (() => R)): R {
		let n = nothing;
		if (typeof n === 'function')
			n = (n as () => R)() ;
		return n;
	}

	
	orElse(other: IMaybe<T> | (() => IMaybe<T>)): IMaybe<T> {
		return this.match(other);
	}

	reduce<R>(f: (acc: R, value: T) => R, initial: R): R {
		return initial;
	}

	tap(f: (value: T | null | undefined) => void): this {
		f(this.value());
		return this;
	}
	then(): this {
		return this;
	}
	toString(): string {
		return 'Maybe.Nothing';
	}
	
	value(): null | undefined {
		return null;
	}
}