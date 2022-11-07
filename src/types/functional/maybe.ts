import {
	isFunction,
	isFunctionWithLength,
	isNullOrUndefined, isString,
} from './utils';

import type {
	BooleanComparePredicate
} from './utils';
import type { Unit } from './unit';

export function maybe<T>(value?: T | null | undefined): IMaybe<T> {
	return isNullOrUndefined(value) ? nothing() : just(value);
}
export function maybeFunction<T, R>(value?: ApplyFunction<T,R> | null | undefined): IMaybeFunction<T,R> {
	return isNullOrUndefined(value) ? nothingFunction() : justFunction(value);
}
export function just<T>(value: T): IJust<T> {
	return new Just(value);
}
export function justFunction<T, R>(value: ApplyFunction<T,R>): IJustFunction<T, R> {
	return new JustFunction(value);
}
export function nothing<T>(value?: null | undefined): INothing<T> {
	return new Nothing(value);
}
export function nothingFunction<T,R>(value?: null | undefined): INothingFunction<T,R> {
	return new NothingFunction<T,R>(value);
}

export function maybeApplyTo<T, R>(m: IMaybe<ApplyFunction<T,R>>, value: T | IMaybe<T>): IMaybe<R> {
	if (isMaybe(value))
		return value.apply(m);
	return m.match(() => nothing(), f => maybe(f(value)) );
}
export function justApplyTo<T,R>(j: IJust<ApplyFunction<T,R>>, value: T | IMaybe<T>): IMaybe<R> {
	if (isMaybe(value))
		return value.apply(j);
	return maybe(j.value()(value));
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function nothingApplyTo<T,R>(n: INothing<ApplyFunction<T,R>>, value: T | IMaybe<T>): IMaybe<R> {
	return nothing();
}

export function isMaybe<T>(value?: any): value is IMaybe<T> {
	if (isNullOrUndefined(value))
		return false;
	if (isNullOrUndefined(value[Symbol.iterator]))
		return false;
	const v = value as IMaybe<T>;
	return isFunctionWithLength(v.asArray, 0) &&
		isFunctionWithLength(v.apply, 1) &&
		isFunctionWithLength(v.chain, 1) &&
		isFunctionWithLength(v.concat, 2) &&
		isFunctionWithLength(v.equals, 2) &&
		isFunctionWithLength(v.extend, 1) &&
		isFunctionWithLength(v.filter, 1) &&
		isFunctionWithLength(v.getOrElse, 1) &&
		isFunctionWithLength(v.hasValue, 0) &&
		isFunctionWithLength(v.lessThen, 2) &&
		isFunctionWithLength(v.map, 1) &&
		isFunctionWithLength(v.match, 2) &&
		isFunctionWithLength(v.orElse, 1) &&
		isFunctionWithLength(v.reduce, 2) &&
		isFunctionWithLength(v.tap, 1) &&
		isFunctionWithLength(v.then, 1) &&
		isFunctionWithLength(v.toString, 0) &&
		isFunctionWithLength(v.value, 0);
}

export type ApplyFunction<T,R> = ((v:T) => R | null | undefined);

export interface IMaybe<T> {
	
	[Symbol.iterator](): Generator<T, void, unknown>;
	/**
	 * Returns the Array representation of the current object
	 */
	asArray(): T[];

	/**
	 * `Apply f => f a ~> f (a -> b) -> f b`
	 * @param m
	 */
	apply<R>(m: IMaybe<ApplyFunction<T,R>>): IMaybe<R>;

	/**
	 * `Chain m => m a ~> (a -> m b) -> m b`
	 */
	chain<R>(f: (value: T) => IMaybe<R>): IMaybe<R>;
	
	/**
	 * 
	 * Smigroup a => Maybe a ~> Maybe a -> Maybe a
	 * 
	 * @param other 
	 */
	concat(other: IMaybe<T>, howToConcat?:(tv: T, ov: T) => T): IMaybe<T>;

	equals(other: IMaybe<T>, equalsPredicate?: BooleanComparePredicate<T> | null | undefined): boolean;

	/**
	 * `Extend w => w a ~> (w a -> b) -> w b`
	 */
	extend<R>(f: (value: IMaybe<T>) => R): IMaybe<R>;
	
	/**
	 * Filter the inner value of the `IMaybe<T>` instance depending on the result of the evaluation of the `predicate` function:
	 * - If the inner value of the `IMaybe<T>` instance is `null` or `undefined` a `INothing<T>` is returned
	 * - If the `predicate` function evaluate to `false` an empty `IMaybe<T>` is returned
	 * - If the `predicate` function evaluate to `true` the `IMaybe<T>` instance is returned
	 * @param predicate Functions that accept the inner value of the `IMaybe<T>` instance and returns `true` or `false` depending on the value of that value
	 */
	filter(predicate: (value: T) =>  boolean): IMaybe<T>;
	
	/**
	 * Get the inner value of the `IMaybe<T>` instance if it's not `null` or `undefined` or the specified value otherwise
	 * @param other The value, or the function to evaluate, that should be returned if the `IMaybe<T>` instance is empty
	 */
	getOrElse(other: T | (() => T)) : T;
	
	/**
	 * Wether the `IMaybe<T>` instance has a value or not
	 */
	hasValue(): boolean;
	
	/**
	 * 
	 * Ord a => Maybe a ~> Maybe a -> Boolean
	 * 
	 * @param other 
	 * @param lessThenPredicate 
	 */
	lessThen(other: IMaybe<T>, lessThenPredicate?: BooleanComparePredicate<T> | null | undefined): boolean;

	/**
	 * Functor f => f a ~> (a -> b) -> f b
	 */
	map<R>(f: (value: T) => R ): IMaybe<R>;
	/**
	 * Executes and return a value of type `R` depending on the state of the `IMaybe<T>` instance.
	 * - If the `IMaybe<T>` instance method `hasValue` returns `true` it returns the first parameter as
	 *   - itself if it's a value
	 *   - its evaluation if it is a function
	 * - If the `IMaybe<T>` instance method `hasValue` returns `true` it returns the second parameter as
	 *   - itself if it's a value
	 *   - its evaluation if it is a function
	 * @param nothing The `nothing` branch value or function to be evalueted
	 * @param just The `just` branch value or function to be evalueted
	 */
	match<R>(nothing: R | (() => R), just: R | ((value: T) => R)): R;
	
	/**
	 * Return the provided `IMaybe<T>` instance if the method `hasValue` of the current instance returns `false`.  
	 * Usefull to keep the methods chaining
	 * @param other the new `IMaybe<T>` instance to return
	 */
	orElse(other: IMaybe<T> | (() => IMaybe<T>)): IMaybe<T>;
	
	/**
	 * `Foldable f => f a ~> ((b, a) -> b, b) -> b`
	 */
	reduce<R>(f: (acc: R, value: T) => R, initial: R): R;
	
	/**
	 * Helper function to execute side effects outside of the `ITappable<T>` instance during the methods chaining.  
	 * Mainly used to debug or log
	 * @param f function executed when the execution chain reaches the `tap`
	 * @returns the instance whiche the `tap` is executed over
	 */
	tap(f: (value: T | null | undefined ) => Unit): IMaybe<T>;
	/**
	 * Methods intended to execute side effetcs if the `IMaybe<T>` instance method `hasValue` returns `true`.  
	 * Returns the `IMaybe<T>` instance to allow the `IMaybe<T>` methods chaining
	 * @param f The function to be run to produce side effects
	 */
	then(f: (value: T) => Unit): IMaybe<T>;

	toString(): string;
	
	/**
	 * Gets the inner value of the curent `IMaybe` instance. Useful in those cases in which is not possible to keep the code into the elevated world
	 * @returns the inner value of the `IMaybe` instance
	 */
	value(): T | null | undefined;
}
export interface IJust<T> extends IMaybe<T> {
	value(): T;
}
export interface INothing<T> extends IMaybe<T> {
	value(): null | undefined;
}

export class Just<T> implements IJust<T> {
	
	*[Symbol.iterator](): Generator<T, void, unknown> {
		yield this.value();
	}

	private internalValue: T;

	constructor(value: T) {
		if (isNullOrUndefined(value))
			throw Error('Just value must be different from "null" and "undefined"');
		this.internalValue = value;
	}

	apply<R>(m: IMaybe<ApplyFunction<T,R>>): IMaybe<R> {
		return m.match(() => nothing(), f => maybe(f(this.value()))); 
	}

	asArray(): T[] {
		return Array.from(this);
	}

	chain<R>(f: (value: T) => IMaybe<R>): IMaybe<R> {
		return f(this.value());
	}

	concat(other: IMaybe<T>, howToConcat?:(tv: T, ov: T) => T): IMaybe<T> {
		return this.map(tv => {
			return other.match(tv, ov => {
				if (isFunction(howToConcat))
					return howToConcat(tv, ov);
				if (isString(tv))
					return `${tv}${ov}` as T;
				if (Array.isArray(tv))
					return tv.concat(ov) as T;
				return ov;
			});
		});
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getOrElse(other: T | (() => T)) : T {
		return this.value();
	}

	hasValue(): boolean {
		return true;
	}

	lessThen(other: IMaybe<T>, lessThenPredicate?: BooleanComparePredicate<T> | null | undefined): boolean {
		// if (other.hasValue())
		// 	return maybe(lessThenOrEqualPredicate).getOrElse(() => (t: T, o: T) => t <= o)(this.value(), other.value()!);
		// return false;
		return other.match(false, ov => maybe(lessThenPredicate).getOrElse(() => (t: T, o: T) => t <= o)(this.value(), ov));
	}

	map<R>(f: (value: T) => R | null | undefined ): IMaybe<R> {
		return maybe(f(this.value()));
	}

	match<R>(_nothing: R | (() => R), just: R | ((value: T) => R)): R {
		const v = this.value();
		let j = just;
		if (isFunction(j))
			j = (j as (value: T) => R)(v) ;
		return j;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	orElse(other: IMaybe<T> | (() => IMaybe<T>)): IMaybe<T> {
		return this;
	}

	reduce<R>(f: (acc: R, value: T) => R, initial: R): R {
		return f(initial, this.value());
	}

	tap(f: (value: T | null | undefined) => Unit): IMaybe<T> {
		f(this.value());
		return this;
	}
	then(f: (value: T) => Unit): IMaybe<T> {
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
	
	*[Symbol.iterator](): Generator<T, void, unknown> {
		// nothing doesn't return anything
	}

	constructor(value?: null | undefined) {
		if (!isNullOrUndefined(value))
			throw Error('Nothing value must be equal to "null" or "undefined"');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	apply<R>(m: IMaybe<ApplyFunction<T,R>>): IMaybe<R> {
		return nothing<R>();
	}
	
	asArray(): T[] {
		return Array.from(this);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	chain<R>(f: (value: T) => IMaybe<R>): IMaybe<R> {
		return nothing();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	concat(other: IMaybe<T>, howToConcat?:(tv: T, ov: T) => T): IMaybe<T> {
		return other;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	equals(other: IMaybe<T>, equalsPredicate?: BooleanComparePredicate<T> | null | undefined): boolean {
		return !other.hasValue();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	extend<R>(f: (value: IMaybe<T>) => R): IMaybe<R> {
		return nothing();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	filter(predicate: (value: T) =>  boolean): IMaybe<T> {
		return nothing();
	}

	getOrElse(other: T | (() => T)) : T {
		return this.match(other, other);
	}

	hasValue(): boolean {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	lessThen(other: IMaybe<T>, lessThenPredicate?: BooleanComparePredicate<T> | null | undefined): boolean {
		return true;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	map<R>(f: (value: T) => R ): IMaybe<R> {
		return nothing();
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	match<R>(nothing: R | (() => R), just: R | ((value: T) => R)): R {
		let n = nothing;
		if (isFunction(n))
			n = (n as () => R)() ;
		return n;
	}

	
	orElse(other: IMaybe<T> | (() => IMaybe<T>)): IMaybe<T> {
		return this.match(other, other);
	}

	reduce<R>(f: (acc: R, value: T) => R, initial: R): R {
		return initial;
	}

	tap(f: (value: T | null | undefined) => Unit): IMaybe<T> {
		f(this.value());
		return this;
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	then(f: (value: T) => Unit): IMaybe<T> {
		return this;
	}
	toString(): string {
		return 'Maybe.Nothing()';
	}
	
	value(): null | undefined {
		return null;
	}
}

export interface IMaybeFunction<T, R> extends IMaybe<ApplyFunction<T,R>> {
	applyTo(value: T): IMaybe<R>;
	applyTo(value: IMaybe<T>): IMaybe<R>;
}
export interface IJustFunction<T, R> extends IMaybeFunction<T,R>, IJust<ApplyFunction<T,R>> {
	value(): ApplyFunction<T,R>;
}
export interface INothingFunction<T, R> extends IMaybeFunction<T,R>, INothing<ApplyFunction<T,R>> {
	value(): null | undefined;
}

export class JustFunction<T, R> extends Just<ApplyFunction<T,R>> implements IJustFunction<T, R> {
	constructor(value: ApplyFunction<T,R>) {
		super(value);
	}
	applyTo(value: T): IMaybe<R>;
	applyTo(value: IMaybe<T>): IMaybe<R>;
	applyTo(value: T | IMaybe<T>): IMaybe<R> {
		if (isMaybe(value))
			return value.apply<R>(this);
		return maybe(value).apply(this);
	}
}
export class NothingFunction<T,R> extends Nothing<(v:T) => R> implements INothingFunction<T,R> {
	constructor(value?: null | undefined) {
		super(value);
	}

	applyTo(value: T): IMaybe<R>;
	applyTo(value: IMaybe<T>): IMaybe<R>;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	applyTo(value: T | IMaybe<T>): IMaybe<R> {
		return nothing();
	}
}
