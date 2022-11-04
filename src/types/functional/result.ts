export interface IActionResult<ActionError, R> {
	
	[Symbol.iterator](): Generator<R, void, unknown>;
	
	isFailure(): boolean;
	isSuccess(): boolean;

	
	/**
	 * Returns the Array representation of the current object
	 */
	asArray(): R[];

	/**
	 * Either a b ~> Either a (b -> c) -> Either a c
	 * @param e
	 */
	apply<RR>(e: IActionResult<ActionError, (value: R) => RR>): IActionResult<ActionError, RR>;

	biMap<NewActionError, RR>(f: (value: ActionError) => NewActionError, s: (value: R) => RR): IActionResult<NewActionError, RR>;

	/**
	 * Either a b ~> (b -> Either a c) -> Either a c
	 * @param f 
	 */
	chain<RR>(f: (value: R) => IActionResult<ActionError, RR>): IActionResult<ActionError, RR>;

	/**
	 * Either a b ~> Either a b -> Either a b
	 * @param other 
	 * @param howToconcat
	 */
	concat(other: IEither<L, R>, howToconcat?: {
			howToConcatLeft?: ((tv: L, ov: L) => L) | null | undefined;
			howToConcatRight?: ((tv: R, ov: R) => R) | null | undefined;
		} | null | undefined
	): IEither<L, R>;

	equals(other: IEither<L, R>, predicates?: {
			leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined;
			rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined;
		} | null | undefined
	): boolean;
	/**
	 * Either a b ~> (Either a b -> c) -> Either a c
	 * @param f 
	 */
	extend<RR>(f: (value: IEither<L,R>) => RR): IEither<L, RR>;
	extendL<LL>(f: (value: IEither<L,R>) => LL): IEither<LL, R>;

	lessThen(other: IEither<L, R>, predicates?: {
			leftEqualsPredicate?: BooleanComparePredicate<L> | null | undefined;
			rightEqualsPredicate?: BooleanComparePredicate<R> | null | undefined;
		} | null | undefined
	): boolean;

	map<RR>(f: (value: R) => RR): IEither<L, RR>;

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

export interface ISuccess<Err, R> extends IResult<Err, R> {
	succesData(): R;
}

export interface IFailure<Err, R> extends IResult<Err, R> {
	failureData(): Err;
}

export function success<Err, R>(value: R): ISuccess<Err, R> {
	return new Success(value);
}

export function failure<Err, R>(error: Err): IFailure<Err, R> {
	return new Failure(error);
}

export class Success<Err, R> extends Right<Err, R> implements ISuccess<Err,R> {

	constructor(value: R) {
		super(value);
	}

	isFailure(): boolean {
		return false;
	}
	isSuccess(): boolean {
		return true;
	}

	succesData(): R {
		return this.asArray()[0];
	}

	toString(): string {
		return `Success(${this.succesData()})`;
	}
}

export class Failure<Err, R> extends Left<Err, R> implements IFailure<Err, R> {

	constructor(value: Err) {
		super(value);
	}

	isFailure(): boolean {
		return true;
	}
	isSuccess(): boolean {
		return false;
	}

	failureData(): Err {
		return this.asArrayL()[0];
	}

	toString(): string {
		return `Failure(${this.failureData()})`;
	}
}