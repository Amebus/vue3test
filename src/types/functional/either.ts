import {
	isFunction,
	isFunctionWithLength,
	isNullOrUndefined,
	isString
} from './utils';

import type {
	BooleanComparePredicate
} from './utils';
import type { Unit } from './unit';

export function either<R>(value?: R | null | undefined): IEither<null | undefined, R> {
	if (isNullOrUndefined(value))
		return left(value);
	return right(value);
}

export function left<L, R>(l: L) {
	return new Left<L,R>(l);
}
export function right<L, R>(r: R) {
	return new Right<L,R>(r);
}

export function isEither<L, R>(value?: any): value is IEither<L, R> {
	if (isNullOrUndefined(value))
		return false;
	if (isNullOrUndefined(value[Symbol.iterator]))
		return false;
	const v = value as IEither<L, R>;
	return isFunctionWithLength(v.asArray, 0) &&
		isFunctionWithLength(v.apply, 1) &&
		isFunctionWithLength(v.biMap, 2) &&
		isFunctionWithLength(v.chain, 1) &&
		isFunctionWithLength(v.concat, 2) &&
		isFunctionWithLength(v.equals, 2) &&
		isFunctionWithLength(v.extend, 1) &&
		isFunctionWithLength(v.getOrElse, 1) &&
		isFunctionWithLength(v.lessThen, 2) &&
		isFunctionWithLength(v.map, 1) &&
		isFunctionWithLength(v.match, 2) &&
		isFunctionWithLength(v.orElse, 1) &&
		isFunctionWithLength(v.reduce, 2) &&
		isFunctionWithLength(v.swap, 0) &&
		isFunctionWithLength(v.tap, 1) &&
		isFunctionWithLength(v.then, 1) &&
		isFunctionWithLength(v.toString, 0);
}
export interface IEither<L, R> {

	[Symbol.iterator](): Generator<R, void, unknown>;
	/**
	 * Returns the Array representation of the current object
	 */
	asArray(): R[];
	// asArrayL(): L[];

	/**
	 * Either a b ~> Either a (b -> c) -> Either a c
	 * @param e
	 */
	apply<RR>(e: IEither<L, (value: R) => RR>): IEither<L, RR>;
	// applyL<LL>(e: IEither<(value: L) => LL, R>): IEither<LL, R>;

	biMap<LL, RR>(
		l: (value: L) => LL,
		r: (value: R) => RR
	): IEither<LL, RR>;

	/**
	 * Either a b ~> (b -> Either a c) -> Either a c
	 * @param f 
	 */
	chain<RR>(f: (value: R) => IEither<L, RR>): IEither<L, RR>;
	// chainL<LL>(f: (value: L) => IEither<LL, R>): IEither<LL, R>;

	/**
	 * Either a b ~> Either a b -> Either a b
	 * 
	 * - `concat (Left (x)) (Left (y))` is equivalent to `Left (concat (x) (y))`
   * - `concat (Right (x)) (Right (y))` is equivalent to `Right (concat (x) (y))`
   * - `concat (Left (x)) (Right (y))` is equivalent to `Right (y)`
   * - `concat (Right (x)) (Left (y))` is equivalent to `Right (x)`
	 * @example
	 * 
	 * > left('abc').concat(left('def'))
	 * left('abcdef')
	 * 
	 * > right([1,2,3]).concat(right(4,5,6))
	 * right([1,2,3,4,5,6])
	 * 
	 * > left('abc').concat(right([1,2,3]))
	 * right([1,2,3])
	 * 
	 * > right([1,2,3]).concat(left('abc'))
	 * right([1,2,3])
	 * 
	 * @param other 
	 * @param howToConcat
	 */
	concat(other: IEither<L, R>, howToconcat?: {
			howToConcatLeft?: ((tv: L, ov: L) => L) | null | undefined;
			howToConcatRight?: ((tv: R, ov: R) => R) | null | undefined;
		} | null | undefined
	): IEither<L, R>;

	// concat(other: IEither<L, R>, howToConcat?: ((tv: R, ov: R) => R) | null | undefined): IEither<L, R>;
	

	equals(other: IEither<L, R>, predicates?: {
			leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined;
			rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined;
		} | null | undefined
	): boolean;
	// equals(other: IEither<L, R>, predicate?: BooleanComparePredicate<R> | null | undefined): boolean;
	/**
	 * Either a b ~> (Either a b -> c) -> Either a c
	 * @param f 
	 */
	extend<RR>(f: (value: IEither<L,R>) => RR): IEither<L, RR>;
	// extendL<LL>(f: (value: IEither<L,R>) => LL): IEither<LL, R>;

	getOrElse(other: R | (() => R)) : R;

	lessThen(other: IEither<L, R>, predicates?: {
			leftLessThenPredicate?: BooleanComparePredicate<L> | null | undefined;
			rightLessThenPredicate?: BooleanComparePredicate<R> | null | undefined;
		} | null | undefined
	): boolean;
	// lessThen(other: IEither<L, R>, predicate?: BooleanComparePredicate<R> | null | undefined): boolean;

	map<RR>(f: (value: R) => RR): IEither<L, RR>;
	// mapL<LL>(f: (value: L) => LL): IEither<LL, R>;

	match<T>(
		l: T | ((value: L) => T),
		r: T | ((value: R) => T)
	): T;

	orElse(other: IEither<L,R> | ((lv: L) => IEither<L,R>)): IEither<L,R>;
	/**
	 * Either a b ~> ((c, b) -> c, c) -> c
	 * @param f 
	 * @param initial 
	 */
	reduce<RR>(f: ( acc: RR, value: R) => RR, initial: RR): RR;
	// reduceL<LL>(f: ( acc: LL, value: L) => LL, initial: LL): LL;

	swap(): IEither<R, L>;

	/**
	 * Helper function to execute side effects outside of the `ITappable<T>` instance during the methods chaining.  
	 * Mainly used to debug or log
	 * @param f function executed when the execution chain reaches the `tap`
	 * @returns the instance whiche the `tap` is executed over
	 */
	tap(f: (l: L | null | undefined, r: R | null | undefined) => Unit): IEither<L, R>;
	/**
	* Methods intended to execute side effetcs if the `IMaybe<T>` instance method `hasValue` returns `true`.  
	* Returns the `IMaybe<T>` instance to allow the `IMaybe<T>` methods chaining
	* @param f The function to be run to produce side effects
	*/
	then(f: (value: R) => Unit): IEither<L, R>;

	toString(): string;
}

export class Right<L, R> implements IEither<L, R> {
	
	*[Symbol.iterator](): Generator<R, void, unknown> {
		yield this.internalValue;
	}
	
	constructor(value: R) {
		this.internalValue = value;
	}
	
	private internalValue: R;

	asArray(): R[] {
		return Array.from(this);
	}

	apply<RR>(e: IEither<L, (value: R) => RR>): IEither<L, RR> {
		return e.match<IEither<L, RR>>(
			ov => left(ov),
			ov => right(ov(this.internalValue))
		);
	}

	biMap<LL, RR>(
		l: (value: L) => LL,
		r: (value: R) => RR
	): IEither<LL, RR> {
		return right(r(this.internalValue));
	}

	chain<RR>(f: (value: R) => IEither<L, RR>): IEither<L, RR> {
		return f(this.internalValue);
	}

	concat(
		other: IEither<L, R>,
		howToConcat?: {
			howToConcatLeft?: ((tv: L, ov: L) => L) | null | undefined;
			howToConcatRight?: ((tv: R, ov: R) => R) | null | undefined;
		} | null | undefined
	): IEither<L, R> {
		return this.map(
			tv => {
				return other.match(
					tv, 
					ov => {
						const howToConcatRight = (howToConcat || {}).howToConcatRight;
						if (!isNullOrUndefined(howToConcatRight))
							return howToConcatRight(tv, ov);
						if (isString(tv))
							return `${tv}${ov}` as R;
						if (Array.isArray(tv))
							return [...tv].concat(ov) as R;
						return ov;
					}
				);
			}
		);
	}

	equals(
		other: IEither<L, R>,
		predicates?: {
			leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined;
			rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined;
		} | null | undefined
	): boolean {
		return other.match(
			false,
			ov => {
				let rep = (predicates || {} ).rightEqualsPredicate;
				if (isNullOrUndefined(rep))
					rep = (tv, ov) => tv === ov;
				return rep(this.internalValue, ov);
			}
		);
	}

	extend<RR>(f: (value: IEither<L, R>) => RR): IEither<L, RR> {
		return right(f(this));
	}

	getOrElse(other: R | (() => R)): R {
		return this.match(other, tv => tv);
	}

	lessThen(
		other: IEither<L, R>,
		predicates?: {
			leftLessThenPredicate?: BooleanComparePredicate<L> | null | undefined;
			rightLessThenPredicate?: BooleanComparePredicate<R> | null | undefined;
		} | null | undefined
	): boolean {
		return other.match(
			false,
			ov => {
				let rltp = (predicates || {}).rightLessThenPredicate;
				if (isNullOrUndefined(rltp))
					rltp = (tv, ov) => tv < ov;
				return rltp(this.internalValue, ov);
			}
		);
	}

	map<RR>(f: (value: R) => RR): IEither<L, RR> {
		return right(f(this.internalValue));
	}

	match<T>(
		l: T | ((value: L) => T),
		r: T | ((value: R) => T)
	): T {
		let ir = r;
		if (isFunction(ir))
			ir = ir(this.internalValue);
		return ir;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	orElse(other: IEither<L, R> | ((lv: L) => IEither<L, R>)): IEither<L, R> {
		return this;
	}

	reduce<RR>(f: (acc: RR, value: R) => RR, initial: RR): RR {
		return f(initial, this.internalValue);
	}

	swap(): IEither<R, L> {
		return left(this.internalValue);
	}

	tap(f: (l: L | null | undefined, r: R | null | undefined) => Unit): IEither<L, R> {
		f(void 0, this.internalValue);
		return this;
	}

	then(f: (value: R) => Unit): IEither<L, R> {
		f(this.internalValue);
		return this;
	}

	toString(): string {
		return `Either.Right(${this.internalValue})`;
	}

}

export class Left<L, R> implements IEither<L, R> {

	*[Symbol.iterator](): Generator<R, void, unknown> {
		// left doesn't return anything
	}

	private internalValue: L;

	constructor(value: L) {
		this.internalValue = value;
	}

	asArray(): R[] {
		return Array.from(this);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	apply<RR>(other: IEither<L, (value: R) => RR>): IEither<L, RR> {
		return left(this.internalValue);
	}

	biMap<LL, RR>(
		l: (value: L) => LL,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		r: (value: R) => RR
	): IEither<LL, RR> {
		return left(l(this.internalValue));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	chain<RR>(f: (value: R) => IEither<L, RR>): IEither<L, RR> {
		return left(this.internalValue);
	}
	
	concat(
		other: IEither<L, R>,
		howToConcat?: {
			howToConcatLeft?: (((tv: L, ov: L) => L)) | null | undefined;
			howToConcatRight?: (((tv: R, ov: R) => R)) | null | undefined;
		} | null | undefined
	): IEither<L, R> {
		return other.match<IEither<L,R>>(
			ov => left(concatLeft(this.internalValue, ov)),
			() => other
		);
		function concatLeft (tv: L, ov: L) {
			const howToConcatLeft = (howToConcat || {}).howToConcatLeft;
			if (!isNullOrUndefined(howToConcatLeft))
				return howToConcatLeft(tv, ov);
			if (isString(tv))
				return `${tv}${ov}` as L;
			if (Array.isArray(tv))
				return [...tv].concat(ov) as L;
			return ov;
		}
	}

	equals(
		other: IEither<L, R>,
		predicates?: {
			leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined;
			rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined;
		} | null | undefined
	): boolean {
		return other.match(
			ov => {
				let lep = (predicates || {}).leftEqualsPredicate;
				if (isNullOrUndefined(lep))
					lep = (tv, ov) => tv === ov;
				return lep(this.internalValue, ov);
			},
			false
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	extend<RR>(f: (value: IEither<L, R>) => RR): IEither<L, RR> {
		return left(this.internalValue);
	}

	getOrElse(other: R | (() => R)): R {
		let v = other;
		if (isFunction(v))
			v = v();
		return v;
	}

	lessThen(
		other: IEither<L, R>,
		predicates?: {
			leftLessThenPredicate?: BooleanComparePredicate<L> | null | undefined;
			rightLessThenPredicate?: BooleanComparePredicate<R> | null | undefined;
		}
	): boolean {
		return other.match(
			ov => {
				let ltnp = (predicates  || {}).leftLessThenPredicate;
				if (isNullOrUndefined(ltnp))
					ltnp = (tv, ov) => tv < ov;
				return ltnp(this.internalValue, ov);
			},
			true
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	map<RR>(f: (value: R) => RR): IEither<L, RR> {
		return left(this.internalValue);
	}

	match<T>(
		l: T | ((value: L) => T),
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		r: T | ((value: R) => T)
	): T {
		let il = l;
		if (isFunction(il))
			il = il(this.internalValue);
		return il;
	}

	orElse(other: IEither<L, R> | ((lv: L) => IEither<L, R>)): IEither<L, R> {
		let v = other;
		if (isFunction(v))
			v = v(this.internalValue);
		return v;
	}

	reduce<RR>(f: (acc: RR, value: R) => RR, initial: RR): RR {
		return initial;
	}

	swap(): IEither<R, L> {
		return right(this.internalValue);
	}

	tap(f: (l: L | null | undefined, r: R | null | undefined) => void): IEither<L, R> {
		f(this.internalValue, void 0);
		return this;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	then(f: (value: R) => void): IEither<L, R> {
		return this;
	}

	toString(): string {
		return `Either.Left(${this.internalValue})`;
	}
}
