import { isFunction, isFunctionWithLength, isNullOrUndefined, isString, type BooleanComparePredicate } from "./utils";

export function success<ResultError, ResultData>(value: ResultData): ISuccessResult<ResultError, ResultData> {
	return new Success(value);
}

export function failure<ResultError, ResultData>(error: ResultError): IFailureResult<ResultError, ResultData> {
	return new Failure(error);
}

export function isActionResult<ResultError, ResultData>(value?: any): value is IActionResult<ResultError, ResultData> {
	if (isNullOrUndefined(value))
		return false;
	if (isNullOrUndefined(value[Symbol.iterator]))
		return false;
	const v = value as IActionResult<ResultError, ResultData>;
	return isFunctionWithLength(v.apply, 1) &&
		isFunctionWithLength(v.asArray, 0) &&
		isFunctionWithLength(v.biMap, 2) &&
		isFunctionWithLength(v.chain, 1) &&
		isFunctionWithLength(v.concat, 2) &&
		isFunctionWithLength(v.equals, 2) &&
		isFunctionWithLength(v.extend, 1) &&
		isFunctionWithLength(v.getOrElse, 1) &&
		isFunctionWithLength(v.isFailure, 0) &&
		isFunctionWithLength(v.isSuccess, 0) &&
		isFunctionWithLength(v.lessThen, 2) &&
		isFunctionWithLength(v.map, 1) &&
		isFunctionWithLength(v.match, 2) &&
		isFunctionWithLength(v.reduce, 2) &&
		isFunctionWithLength(v.swap, 0) &&
		isFunctionWithLength(v.tap, 1) &&
		isFunctionWithLength(v.then, 1) &&
		isFunctionWithLength(v.toString, 0);
}

export interface IActionResult<ResultError, ResultData> {
	
	[Symbol.iterator](): Generator<ResultData, void, unknown>;

	/**
	 * Either a b ~> Either a (b -> c) -> Either a c
	 * @param ar
	 */
	apply<NewResultData>(ar: IActionResult<ResultError, (value: ResultData) => NewResultData>): IActionResult<ResultError, NewResultData>;

	/**
	 * Returns the Array representation of the current object
	 */
	asArray(): ResultData[];

	biMap<NewResultError, NewResultData>(f: (value: ResultError) => NewResultError, s: (value: ResultData) => NewResultData): IActionResult<NewResultError, NewResultData>;

	/**
	 * Either a b ~> (b -> Either a c) -> Either a c
	 * @param s 
	 */
	chain<NewResultData>(s: (value: ResultData) => IActionResult<ResultError, NewResultData>): IActionResult<ResultError, NewResultData>;

	/**
	 * Either a b ~> Either a b -> Either a b
	 * @param other 
	 * @param howToConcat
	 */
	concat(other: IActionResult<ResultError, ResultData>, howToConcat?: {
			howToConcatFailure?: ((tv: ResultError, ov: ResultError) => ResultError) | null | undefined;
			howToConcatSuccess?: ((tv: ResultData, ov: ResultData) => ResultData) | null | undefined;
		} | null | undefined
	): IActionResult<ResultError, ResultData>;

	equals(other: IActionResult<ResultError, ResultData>, predicates?: {
			failureEqualsPredicate?: BooleanComparePredicate<ResultError> | null | undefined;
			successEqualsPredicate?: BooleanComparePredicate<ResultData> | null | undefined;
		} | null | undefined
	): boolean;
	/**
	 * Either a b ~> (Either a b -> c) -> Either a c
	 * @param s 
	 */
	extend<NewResultData>(s: (value: IActionResult<ResultError, ResultData>) => NewResultData): IActionResult<ResultError, NewResultData>;

	/**
	 * Get the inner value of the `IActionResult<>` instance if it's not `null` or `undefined` or the specified value otherwise
	 * @param other The value, or the function to evaluate, that should be returned if the `IMaybe<T>` instance is empty
	 */
	getOrElse(other: ResultData | (() => ResultData)) : ResultData;

	isFailure(): boolean;
	isSuccess(): boolean;

	lessThen(other: IActionResult<ResultError, ResultData>, predicates?: {
			failureEqualsPredicate?: BooleanComparePredicate<ResultError> | null | undefined;
			successEqualsPredicate?: BooleanComparePredicate<ResultData> | null | undefined;
		} | null | undefined
	): boolean;

	map<NewResultData>(s: (value: ResultData) => NewResultData): IActionResult<ResultError, NewResultData>;

	match<T>(f: T | ((value: ResultError) => T), s: T | ((value: ResultData) => T)): T;

	orElse(other: IActionResult<ResultError, ResultData> | ((error: ResultError) => IActionResult<ResultError, ResultData>)): IActionResult<ResultError, ResultData>;

	/**
	 * Either a b ~> ((c, b) -> c, c) -> c
	 * @param s 
	 * @param initial 
	 */
	reduce<NewResultData>(s: ( acc: NewResultData, value: ResultData) => NewResultData, initial: NewResultData): NewResultData;

	swap(): IActionResult<ResultData, ResultError>;

	/**
	 * Helper function to execute side effects outside of the `ITappable<T>` instance during the methods chaining.  
	 * Mainly used to debug or log
	 * @param func function executed when the execution chain reaches the `tap`
	 * @returns the instance whiche the `tap` is executed over
	 */
	tap(func: (l: ResultError | null | undefined, r: ResultData | null | undefined) => void): IActionResult<ResultError, ResultData>;
	/**
	* Methods intended to execute side effetcs if the `IMaybe<T>` instance method `hasValue` returns `true`.  
	* Returns the `IMaybe<T>` instance to allow the `IMaybe<T>` methods chaining
	* @param s The function to be run to produce side effects
	*/
	then(s: (value: ResultData) => void): IActionResult<ResultError, ResultData>;

	toString(): string;
}

export interface ISuccessResult<ResultError, ResultData> extends IActionResult<ResultError, ResultData> {
	succesData(): ResultData;
}

export interface IFailureResult<ResultError, ResultData> extends IActionResult<ResultError, ResultData> {
	failureError(): ResultError;
}

export class Success<ResultError, ResultData> implements ISuccessResult<ResultError, ResultData> {
	
	*[Symbol.iterator]() {
		yield this.resultData;
	}

	constructor(value: ResultData) {
		this.resultData = value;
	}

	private resultData: ResultData;
	
	asArray(): ResultData[] {
		return Array.from(this);
	}

	apply<NewResultData>(ar: IActionResult<ResultError, (value: ResultData) => NewResultData>): IActionResult<ResultError, NewResultData> {
		return ar.match<IActionResult<ResultError, NewResultData>>(
			ov => failure(ov), 
			ov => success(ov(this.succesData()))
		);
	}

	biMap<NewResultError, NewResultData>(f: (value: ResultError) => NewResultError, s: (value: ResultData) => NewResultData): IActionResult<NewResultError, NewResultData> {
		return success(s(this.succesData()));
	}

	chain<NewResultData>(s: (value: ResultData) => IActionResult<ResultError, NewResultData>): IActionResult<ResultError, NewResultData> {
		return s(this.succesData());
	}

	concat(
		other: IActionResult<ResultError, ResultData>,
		howToConcat?: { 
			howToConcatFailure?: ((tv: ResultError, ov: ResultError) => ResultError) | null | undefined;
			howToConcatSuccess?: ((tv: ResultData, ov: ResultData) => ResultData) | null | undefined; } | null | undefined
		): IActionResult<ResultError, ResultData> {
		return this.map(tv => {
			return other.match(tv, ov => {
				const howToConcatSuccess = (howToConcat || {}).howToConcatSuccess;
				if (!isNullOrUndefined(howToConcatSuccess))
					return howToConcatSuccess(tv, ov);
				if (isString(tv))
					return `${tv}${ov}` as ResultData;
				if (Array.isArray(tv))
					return [...tv].concat(ov) as ResultData;
				return ov;
			});
		});
	}

	equals(
		other: IActionResult<ResultError, ResultData>,
		predicates?: { 
			failureEqualsPredicate?: BooleanComparePredicate<ResultError> | null | undefined;
			successEqualsPredicate?: BooleanComparePredicate<ResultData> | null | undefined; 
		} | null | undefined
	): boolean {
		return other.match(
			false,
			ov => {
				let rep = (predicates || {} ).successEqualsPredicate;
				if (isNullOrUndefined(rep))
					rep = (tv, ov) => tv === ov;
				return rep(this.succesData(), ov);
			}
		);
	}

	extend<NewResultData>(s: (value: IActionResult<ResultError, ResultData>) => NewResultData): IActionResult<ResultError, NewResultData> {
		return success(s(this));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getOrElse(other: ResultData | (() => ResultData)): ResultData {
		return this.succesData();
	}

	isFailure(): boolean {
		return false;
	}
	isSuccess(): boolean {
		return true;
	}

	lessThen(
		other: IActionResult<ResultError, ResultData>,
		predicates?: { 
			failureEqualsPredicate?: BooleanComparePredicate<ResultError> | null | undefined;
			successEqualsPredicate?: BooleanComparePredicate<ResultData> | null | undefined;
		} | null | undefined
	): boolean {
		return other.match(
			false,
			ov => {
				let sep = (predicates || {}).successEqualsPredicate;
				if (isNullOrUndefined(sep))
					sep = (tv, ov) => tv < ov;
				return sep(this.succesData(), ov);
			}
		);
	}

	map<NewResultData>(s: (value: ResultData) => NewResultData): IActionResult<ResultError, NewResultData> {
		return success(s(this.succesData()));
	}

	match<T>(f: T | ((value: ResultError) => T), s: T | ((value: ResultData) => T)): T {
		let is = s;
		if (isFunction(is))
			is = is(this.succesData());
		return is;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	orElse(other: IActionResult<ResultError, ResultData> | ((error: ResultError) => IActionResult<ResultError, ResultData>)): IActionResult<ResultError, ResultData> {
		return this;
	}

	reduce<NewResultData>(s: (acc: NewResultData, value: ResultData) => NewResultData, initial: NewResultData): NewResultData {
		return s(initial, this.succesData());
	}

	swap(): IActionResult<ResultData, ResultError> {
		return failure(this.succesData());
	}

	succesData(): ResultData {
		return this.resultData;
	}

	tap(func: (l: ResultError | null | undefined, r: ResultData | null | undefined) => void): IActionResult<ResultError, ResultData> {
		func(void 0, this.succesData());
		return this;
	}

	then(s: (value: ResultData) => void): IActionResult<ResultError, ResultData> {
		s(this.succesData());
		return this;
	}

	toString(): string {
		return `ActionResult.Success(${this.succesData()})`;
	}
}

export class Failure<ResultError, ResultData> implements IFailureResult<ResultError, ResultData> {

	*[Symbol.iterator]() {
		// Failure has no ResultData
	}

	constructor(value: ResultError) {
		this.resultError = value;
	}

	private resultError: ResultError;

	asArray(): ResultData[] {
		return Array.from(this);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	apply<NewResultData>(ar: IActionResult<ResultError, (value: ResultData) => NewResultData>): IActionResult<ResultError, NewResultData> {
		return failure(this.failureError());
	}

	biMap<NewResultError, NewResultData>(
		f: (value: ResultError) => NewResultError,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		s: (value: ResultData) => NewResultData
	): IActionResult<NewResultError, NewResultData> {
		return failure(f(this.failureError()));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	chain<NewResultData>(s: (value: ResultData) => IActionResult<ResultError, NewResultData>): IActionResult<ResultError, NewResultData> {
		return failure(this.failureError());
	}

	concat(
		other: IActionResult<ResultError, ResultData>,
		howToConcat?: { 
			howToConcatFailure?: ((tv: ResultError, ov: ResultError) => ResultError) | null | undefined;
			howToConcatSuccess?: ((tv: ResultData, ov: ResultData) => ResultData) | null | undefined;
		} | null | undefined
	): IActionResult<ResultError, ResultData> {
		return other.match<IActionResult<ResultError, ResultData>>(
			ov => failure(concatFailure(this.failureError(), ov)),
			() => other
		);
		function concatFailure (tv: ResultError, ov: ResultError) {
			const howToConcatFailure = (howToConcat || {}).howToConcatFailure;
			if (!isNullOrUndefined(howToConcatFailure))
				return howToConcatFailure(tv, ov);
			if (isString(tv))
				return `${tv}${ov}` as ResultError;
			if (Array.isArray(tv))
				return [...tv].concat(ov) as ResultError;
			return ov;
		}
	}

	equals(
		other: IActionResult<ResultError, ResultData>,
		predicates?: { 
			failureEqualsPredicate?: BooleanComparePredicate<ResultError> | null | undefined;
			successEqualsPredicate?: BooleanComparePredicate<ResultData> | null | undefined;
		} | null | undefined
	): boolean {
		return other.match(
			ov => {
				let fep = (predicates || {}).failureEqualsPredicate;
				if (isNullOrUndefined(fep))
					fep = (tv, ov) => tv === ov;
				return fep(this.failureError(), ov);
			},
			false
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	extend<NewResultData>(s: (value: IActionResult<ResultError, ResultData>) => NewResultData): IActionResult<ResultError, NewResultData> {
		return failure(this.failureError());
	}

	failureError(): ResultError {
		return this.resultError;
	}

	getOrElse(other: ResultData | (() => ResultData)): ResultData {
		return this.match(other, other);
	}

	isFailure(): boolean {
		return true;
	}
	isSuccess(): boolean {
		return false;
	}

	lessThen(
		other: IActionResult<ResultError, ResultData>,
		predicates?: {
			failureEqualsPredicate?: BooleanComparePredicate<ResultError> | null | undefined;
			successEqualsPredicate?: BooleanComparePredicate<ResultData> | null | undefined;
		} | null | undefined
	): boolean {
		return other.match(
			ov => {
				let fep = (predicates  || {}).failureEqualsPredicate;
				if (isNullOrUndefined(fep))
					fep = (tv, ov) => tv < ov;
				return fep(this.failureError(), ov);
			},
			false
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	map<NewResultData>(s: (value: ResultData) => NewResultData): IActionResult<ResultError, NewResultData> {
		return failure(this.failureError());
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	match<T>(f: T | ((value: ResultError) => T), s: T | ((value: ResultData) => T)): T {
		let ff = f;
		if (isFunction(ff))
			ff = ff(this.failureError());
		return ff;
	}

	orElse(other: IActionResult<ResultError, ResultData> | ((error: ResultError) => IActionResult<ResultError, ResultData>)): IActionResult<ResultError, ResultData> {
		let o = other;
		if (isFunction(o))
			o = o(this.failureError());
		return o;
	}

	reduce<NewResultData>(s: (acc: NewResultData, value: ResultData) => NewResultData, initial: NewResultData): NewResultData {
		return initial;
	}

	swap(): IActionResult<ResultData, ResultError> {
		return success(this.failureError());
	}

	tap(func: (l: ResultError | null | undefined, r: ResultData | null | undefined) => void): IActionResult<ResultError, ResultData> {
		func(this.failureError(), void 0);
		return this;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	then(s: (value: ResultData) => void): IActionResult<ResultError, ResultData> {
		return this;
	}

	toString(): string {
		return `ActionResult.Failure(${this.failureError()})`;
	}
}