import {
	isFunction,
	isFunctionWithLength,
	isNullOrUndefined,
	isString
} from './utils';

import type {
	BooleanComparePredicate
} from './utils';

export interface IEither<L, R> {

	[Symbol.iterator](): Generator<R, void, unknown>;
	/**
	 * Returns the Array representation of the current object
	 */
	asArray(): R[];
	asArrayL(): L[];

	/**
	 * Either a b ~> Either a (b -> c) -> Either a c
	 * @param f 
	 */
	apply<RR>(e: IEither<L, (value: R) => RR>): IEither<L, RR>;
	applyL<LL>(e: IEither<(value: L) => LL, R>): IEither<LL, R>;

	biMap<LL, RR>(l: (value: L) => LL, r: (value: R) => RR): IEither<LL, RR>;

	/**
	 * Either a b ~> (b -> Either a c) -> Either a c
	 * @param f 
	 */
	chain<RR>(f: (value: R) => IEither<L, RR>): IEither<L, RR>;
	chainL<LL>(f: (value: L) => IEither<LL, R>): IEither<LL, R>;

	/**
	 * Either a b ~> Either a b -> Either a b
	 * @param other 
	 * @param howToConcatLeft 
	 * @param howToConcatRight 
	 */
	concat(other: IEither<L, R>, howToConcatLeft?: (tv: L, ov: L) => L, howToConcatRight?: (tv: R, ov: R) => R): IEither<L, R>;

	equals(other: IEither<L, R>, leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined, rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined): boolean;
	/**
	 * Either a b ~> (Either a b -> c) -> Either a c
	 * @param f 
	 */
	extend<RR>(f: (value: IEither<L,R>) => RR): IEither<L, RR>;
	extendL<LL>(f: (value: IEither<L,R>) => LL): IEither<LL, R>;

	lessThen(other: IEither<L, R>, leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined, rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined): boolean;

	map<RR>(f: (value: R) => RR): IEither<L, RR>;
	mapL<LL>(f: (value: L) => LL): IEither<LL, R>;

	match<T>(l: T | ((value: L) => T), r: T | ((value: R) => T)): T;

	/**
	 * Either a b ~> ((c, b) -> c, c) -> c
	 * @param f 
	 * @param initial 
	 */
	reduce<RR>(f: ( acc: RR, value: R) => RR, initial: RR): RR;
	reduceL<LL>(f: ( acc: LL, value: L) => LL, initial: LL): LL;

	/**
	 * Helper function to execute side effects outside of the `ITappable<T>` instance during the methods chaining.  
	 * Mainly used to debug or log
	 * @param f function executed when the execution chain reaches the `tap`
	 * @returns the instance whiche the `tap` is executed over
	 */
	tap(f: (l: L | null | undefined, r: R | null | undefined) => void): IEither<L, R>;
	/**
	* Methods intended to execute side effetcs if the `IMaybe<T>` instance method `hasValue` returns `true`.  
	* Returns the `IMaybe<T>` instance to allow the `IMaybe<T>` methods chaining
	* @param f The function to be run to produce side effects
	*/
	then(f: (value: R) => void): IEither<L, R>;
	thenL(f: (value: L) => void): IEither<L, R>;

	toString(): string;
}

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

export function isEither<L = any, R = any>(value?: any): value is IEither<L, R> {
	if (isNullOrUndefined(value))
		return false;
	if (isNullOrUndefined(value[Symbol.iterator]))
		return false;
	const v = value as IEither<L, R>;
	return isFunctionWithLength(v.asArray, 0) &&
		isFunctionWithLength(v.asArrayL, 0) &&
		isFunctionWithLength(v.apply, 1) &&
		isFunctionWithLength(v.applyL, 1) &&
		isFunctionWithLength(v.biMap, 2) &&
		isFunctionWithLength(v.chain, 1) &&
		isFunctionWithLength(v.chainL, 1) &&
		isFunctionWithLength(v.concat, 2) &&
		isFunctionWithLength(v.equals, 3) &&
		isFunctionWithLength(v.extend, 1) &&
		isFunctionWithLength(v.extendL, 1) &&
		isFunctionWithLength(v.lessThen, 3) &&
		isFunctionWithLength(v.map, 1) &&
		isFunctionWithLength(v.mapL, 1) &&
		isFunctionWithLength(v.match, 2) &&
		isFunctionWithLength(v.reduce, 2) &&
		isFunctionWithLength(v.reduceL, 2) &&
		isFunctionWithLength(v.tap, 1) &&
		isFunctionWithLength(v.then, 1) &&
		isFunctionWithLength(v.thenL, 1) &&
		isFunctionWithLength(v.toString, 0);
}

export class Right<L, R> implements IEither<L, R> {
	
	*[Symbol.iterator]() {
		yield this.internalValue;
	}

	private internalValue: R;

	constructor(value: R) {
		this.internalValue = value;
	}

	asArray(): R[] {
		return Array.from(this);
	}
	asArrayL(): L[] {
		return [];
	}

	apply<RR>(e: IEither<L, (value: R) => RR>): IEither<L, RR> {
		return e.match<IEither<L, RR>>(ov => left(ov), ov => right(ov(this.internalValue)));
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	applyL<LL>(e: IEither<(value: L) => LL, R>): IEither<LL, R> {
		return right(this.internalValue);
	}

	biMap<LL, RR>(l: (value: L) => LL, r: (value: R) => RR): IEither<LL, RR> {
		return right(r(this.internalValue));
	}

	chain<RR>(f: (value: R) => IEither<L, RR>): IEither<L, RR> {
		return f(this.internalValue);
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	chainL<LL>(f: (value: L) => IEither<LL, R>): IEither<LL, R> {
		return right(this.internalValue);
	}

	concat(other: IEither<L, R>, howToConcatLeft?: (tv: L, ov: L) => L, howToConcatRight?: (tv: R, ov: R) => R): IEither<L, R> {
		return this.map(tv => {
			return other.match(tv, ov => {
				if (isFunction(howToConcatRight))
					return howToConcatRight(tv, ov);
				if (isString(tv))
					return `${tv}${ov}` as R;
				if (Array.isArray(tv))
					return tv.concat(ov) as R;
				return ov;
			});
		});
	}

	equals(other: IEither<L, R>, leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined, rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined): boolean {
		return other.match(false, ov => {
			let rep = rightEqualsPredicate;
			if (isNullOrUndefined(rep))
				rep = (tv, ov) => tv === ov;
			return rep(this.internalValue, ov);
		});
	}

	extend<RR>(f: (value: IEither<L, R>) => RR): IEither<L, RR> {
		return right(f(this));
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	extendL<LL>(f: (value: IEither<L, R>) => LL): IEither<LL, R> {
		return right(this.internalValue);
	}

	lessThen(other: IEither<L, R>, leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined, rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined): boolean {
		return other.match(false, ov => {
			let rep = rightEqualsPredicate;
			if (isNullOrUndefined(rep))
				rep = (tv, ov) => tv < ov;
			return rep(this.internalValue, ov);
		});
	}

	map<RR>(f: (value: R) => RR): IEither<L, RR> {
		return right(f(this.internalValue));
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	mapL<LL>(f: (value: L) => LL): IEither<LL, R> {
		return right(this.internalValue);
	}

	match<T>(l: T | ((value: L) => T), r: T | ((value: R) => T)): T {
		let ir = r;
		if (isFunction(ir))
			ir = ir(this.internalValue);
		return ir;
	}

	reduce<RR>(f: (acc: RR, value: R) => RR, initial: RR): RR {
		return f(initial, this.internalValue);
	}
	reduceL<LL>(f: (acc: LL, value: L) => LL, initial: LL): LL {
		return initial;
	}

	tap(f: (l: L | null | undefined, r: R | null | undefined) => void): IEither<L, R> {
		f(void 0, this.internalValue);
		return this;
	}

	then(f: (value: R) => void): IEither<L, R> {
		f(this.internalValue);
		return this;
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	thenL(f: (value: L) => void): IEither<L, R> {
		return this;
	}

	toString(): string {
		return `Either.Right(${this.internalValue})`;
	}

}

export class Left<L, R> implements IEither<L, R> {

	*[Symbol.iterator]() {
		// left doesn't return anything
	}

	private internalValue: L;

	constructor(value: L) {
		this.internalValue = value;
	}

	asArray(): R[] {
		return Array.from(this);
	}
	asArrayL(): L[] {
		return [this.internalValue];
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	apply<RR>(other: IEither<L, (value: R) => RR>): IEither<L, RR> {
		return left(this.internalValue);
	}
	applyL<LL>(e: IEither<(value: L) => LL, R>): IEither<LL, R> {
		return e.match<IEither<LL, R>>(ov => left(ov(this.internalValue)), ov => right(ov));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	biMap<LL, RR>(l: (value: L) => LL, r: (value: R) => RR): IEither<LL, RR> {
		return left(l(this.internalValue));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	chain<RR>(f: (value: R) => IEither<L, RR>): IEither<L, RR> {
		return left(this.internalValue);
	}
	chainL<LL>(f: (value: L) => IEither<LL, R>): IEither<LL, R> {
		return f(this.internalValue);
	}

	concat(other: IEither<L, R>, howToConcatLeft?: ((tv: L, ov: L) => L) | undefined, howToConcatRight?: ((tv: R, ov: R) => R) | undefined): IEither<L, R> {
		return this.mapL(tv => {
			return other.match(ov => {
				if (isFunction(howToConcatLeft))
					return howToConcatLeft(tv, ov);
				if (isString(tv))
					return `${tv}${ov}` as L;
				if (Array.isArray(tv))
					return tv.concat(ov) as L;
				return ov;
			}, tv);
		});
	}

	equals(other: IEither<L, R>, leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined, rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined): boolean {
		return other.match(ov => {
			let lep = leftEqualsPredicate;
			if (isNullOrUndefined(lep))
				lep = (tv, ov) => tv === ov;
			return lep(this.internalValue, ov);
		}, false);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	extend<RR>(f: (value: IEither<L, R>) => RR): IEither<L, RR> {
		return left(this.internalValue);
	}
	extendL<LL>(f: (value: IEither<L, R>) => LL): IEither<LL, R> {
		return left(f(this));
	}

	lessThen(other: IEither<L, R>, leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined, rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined): boolean {
		return other.match(ov => {
			let lep = leftEqualsPredicate;
			if (isNullOrUndefined(lep))
				lep = (tv, ov) => tv < ov;
			return lep(this.internalValue, ov);
		}, true);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	map<RR>(f: (value: R) => RR): IEither<L, RR> {
		return left(this.internalValue);
	}
	mapL<LL>(f: (value: L) => LL): IEither<LL, R> {
		return left(f(this.internalValue));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	match<T>(l: (value: L) => T, r: (value: R) => T): T {
		return l(this.internalValue);
	}

	reduce<RR>(f: (acc: RR, value: R) => RR, initial: RR): RR {
		return initial;
	}
	reduceL<LL>(f: (acc: LL, value: L) => LL, initial: LL): LL {
		return f(initial, this.internalValue);
	}

	tap(f: (l: L | null | undefined, r: R | null | undefined) => void): IEither<L, R> {
		f(this.internalValue, void 0);
		return this;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	then(f: (value: R) => void): IEither<L, R> {
		return this;
	}
	thenL(f: (value: L) => void): IEither<L, R> {
		f(this.internalValue);
		return this;
	}

	toString(): string {
		return `Either.Left(${this.internalValue})`;
	}
}

const a = either<string>('ciao');

