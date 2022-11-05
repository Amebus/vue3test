
import type { Unit } from './unit';
import { isFunction, isNullOrUndefined, isString, type BooleanComparePredicate } from './utils';

export function validate<ValidationError, Data>(value: Data, f: (value: Data) => ValidationError[]): IValidation<ValidationError, Data> {
	return new Valid<ValidationError, Data>(value).validate(f);
	// const errors = f(value);
	// if (errors.length > 0)
	// 	return invalid(errors);
	// return valid(value);
}

export function valid<ValidationError, R>(value: R): IValidation<ValidationError, R> {
	return new Valid(value);
}

export function invalid<ValidationError, Data>(errors: ValidationError[]): IValidation<ValidationError, Data> {
	return new Invalid(errors);
}

export interface IValidation<ValidationError, Data> {

	[Symbol.iterator](): Generator<Data, void, unknown>;

	addError(error: ValidationError): IValidation<ValidationError, Data>;
	addErrors(errors: ValidationError[]): IValidation<ValidationError, Data>;

	apply<NewData>(val: IValidation<ValidationError, (value: Data) => NewData>): IValidation<ValidationError, NewData>;

	asArray(): Data[];
	
	biMap<NewValidationError, NewData>(
		i: (validationError: ValidationError[]) => NewValidationError[],
		v: (data: Data) => NewData
	): IValidation<NewValidationError, NewData>;
	
	chain<NewData>(v: (data: Data) => IValidation<ValidationError, NewData>): IValidation<ValidationError, NewData>;

	concat(
		other: IValidation<ValidationError, Data>, 
		howToConcat?: {
			howToConcatInvalid?: ((tv: ValidationError[], ov: ValidationError[]) => ValidationError[]) | null | undefined;
			howToConcatValid?: ((tv: Data, ov: Data) => Data) | null | undefined;
		} | null | undefined
	): IValidation<ValidationError, Data>;

	equals(
		other: IValidation<ValidationError, Data>,
		predicates?: {
			invalidEqualsPredicate?: BooleanComparePredicate<ValidationError[]> | null | undefined;
			validEqualsPredicate?: BooleanComparePredicate<Data> | null | undefined;
		} | null | undefined
	): boolean;

	extend<NewData>(v: (value: IValidation<ValidationError, Data>) => NewData): IValidation<ValidationError, NewData>;
	
	getOrElse(other: Data | (() => Data)): Data;

	isInvalid(): boolean;
	isValid(): boolean;
	
	lessThen(
		other: IValidation<ValidationError, Data>,
		predicates?: {
			invalidLessThenPredicate?: BooleanComparePredicate<ValidationError[]> | null | undefined;
			validLessThenPredicate?: BooleanComparePredicate<Data> | null | undefined;
		} | null | undefined
	): boolean;

	map<NewData>(v: (value: Data) => NewData): IValidation<ValidationError, NewData>;

	match<T>(i: T | ((value: ValidationError[]) => T), v: T | ((value: Data) => T)): T;

	orElse(other: IValidation<ValidationError, Data> | ((errors: ValidationError[]) => IValidation<ValidationError, Data>)): IValidation<ValidationError, Data>;
	reduce<NewData>(v: ( acc: NewData, value: Data) => NewData, initial: NewData): NewData;
	swap(): IValidation<Data, ValidationError[]>;
	/**
	 * Helper function to execute side effects outside of the `ITappable<T>` instance during the methods chaining.  
	 * Mainly used to debug or log
	 * @param func function executed when the execution chain reaches the `tap`
	 * @returns the instance whiche the `tap` is executed over
	 */
	tap(func: (i: ValidationError[], v: Data | null | undefined) => Unit): IValidation<ValidationError, Data>;
	/**
	* Methods intended to execute side effetcs if the `IMaybe<T>` instance method `hasValue` returns `true`.  
	* Returns the `IMaybe<T>` instance to allow the `IMaybe<T>` methods chaining
	* @param v The function to be run to produce side effects
	*/
	then(v: (value: Data) => Unit): IValidation<ValidationError, Data>;

	toString(): string;
}

export interface IValid<ValidationError, Data> extends IValidation<ValidationError, Data> {
	data(): Data;
	validate(f: (value: Data) => ValidationError[]): IValidation<ValidationError, Data>;
}
export interface IInvalid<ValidationError, Data> extends IValidation<ValidationError, Data> {
	validationErrors(): ValidationError[];
}

export class Valid<ValidationError, Data>
	implements IValidation<ValidationError, Data> {

	*[Symbol.iterator](): Generator<Data, void, unknown> {
		yield this.data();
	}
	
	constructor(data: Data) {
		this.internalData = data;
	}

	private internalData: Data;

	addError(error: ValidationError): IValidation<ValidationError, Data> {
		return this.addErrors([error]);
	}
	addErrors(errors: ValidationError[]): IValidation<ValidationError, Data> {
		return invalid(errors);
	}

	apply<NewData>(val: IValidation<ValidationError, (value: Data) => NewData>): IValidation<ValidationError, NewData> {
		return val.match<IValidation<ValidationError, NewData>>(
			ov => invalid(ov),
			ov => valid(ov(this.data()))
		);
	}

	asArray(): Data[] {
		return Array.from(this);
	}

	biMap<NewValidationError, NewData>(
		i: (validationError: ValidationError[]) => NewValidationError[],
		v: (data: Data) => NewData
	): IValidation<NewValidationError, NewData> {
		return valid(v(this.data()));
	}

	chain<NewData>(v: (data: Data) => IValidation<ValidationError, NewData>): IValidation<ValidationError, NewData> {
		return v(this.data());
	}

	concat(
		other: IValidation<ValidationError, Data>,
		howToConcat?: { 
			howToConcatInvalid?: ((tv: ValidationError[], ov: ValidationError[]) => ValidationError[]) | null | undefined;
			howToConcatValid?: ((tv: Data, ov: Data) => Data) | null | undefined; 
		} | null | undefined
	): IValidation<ValidationError, Data> {
		return this.map(
			tv => {
				return other.match(
					tv,
					ov => {
						const howToConcatValid = (howToConcat || {}).howToConcatValid;
						if (!isNullOrUndefined(howToConcatValid))
							return howToConcatValid(tv, ov);
						if (isString(tv))
							return `${tv}${ov}` as Data;
						if (Array.isArray(tv))
							return [...tv].concat(ov) as Data;
						return ov;
					}
				);
			}
		);
	}

	data(): Data {
		return this.internalData;		
	}

	equals(
		other: IValidation<ValidationError, Data>,
		predicates?: {
			invalidEqualsPredicate?: BooleanComparePredicate<ValidationError[]> | null | undefined;
			validEqualsPredicate?: BooleanComparePredicate<Data> | null | undefined;
		} | null | undefined
	): boolean {
		return other.match(
			false,
			ov => {
				let vep = (predicates || {} ).validEqualsPredicate;
				if (isNullOrUndefined(vep))
					vep = (tv, ov) => tv === ov;
				return vep(this.data(), ov);
			}
		);
	}

	extend<NewData>(v: (value: IValidation<ValidationError, Data>) => NewData): IValidation<ValidationError, NewData> {
		return valid(v(this));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getOrElse(other: Data | (() => Data)): Data {
		return this.data();
	}

	isInvalid(): boolean {
		return false;
	}
	isValid(): boolean {
		return true;
	}

	lessThen(
		other: IValidation<ValidationError, Data>,
		predicates?: {
			invalidLessThenPredicate?: BooleanComparePredicate<ValidationError[]> | null | undefined;
			validLessThenPredicate?: BooleanComparePredicate<Data> | null | undefined;
		} | null | undefined
	): boolean {
		return other.match(
			false,
			ov => {
				let vltp = (predicates || {}).validLessThenPredicate;
				if (isNullOrUndefined(vltp))
					vltp = (tv, ov) => tv < ov;
				return vltp(this.data(), ov);
			}
		);
	}

	map<NewData>(v: (value: Data) => NewData): IValidation<ValidationError, NewData> {
		return valid(v(this.data()));
	}

	match<T>(
		i: T | ((value: ValidationError[]) => T),
		v: T | ((value: Data) => T)
	): T {
		let iv = v;
		if (isFunction(iv))
			iv = iv(this.data());
		return iv;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	orElse(other: IValidation<ValidationError, Data> | ((errors: ValidationError[]) => IValidation<ValidationError, Data>)): IValidation<ValidationError, Data> {
		return this;
	}

	reduce<NewData>(
		v: (acc: NewData, value: Data) => NewData,
		initial: NewData
	): NewData {
		return v(initial, this.data());
	}

	swap(): IValidation<Data, ValidationError[]> {
		return invalid([this.data()]);
	}

	tap(func: (i: ValidationError[], v: Data | null | undefined) => Unit): IValidation<ValidationError, Data> {
		func([], this.data());
		return this;
	}

	then(v: (value: Data) => Unit): IValidation<ValidationError, Data> {
		v(this.data());
		return this;
	}

	toString(): string {
		return `Valid(${this.data()})`;
	}

	validate(f: (value: Data) => ValidationError[]): IValidation<ValidationError, Data> {
		const errors = f(this.data());
		if (errors.length > 0)
			return this.addErrors(errors);
		return this;
	}

}

export class Invalid<ValidationError, Data>
	implements IInvalid<ValidationError, Data> {
	
	*[Symbol.iterator](): Generator<Data, void, unknown> {
		// returns nothing
	}
		
	constructor(errors: ValidationError[]) {
		this.internalValidationErrors = errors;
	}

	private internalValidationErrors: ValidationError[];

	addError(error: ValidationError): IValidation<ValidationError, Data> {
		return this.addErrors([error]);
	}
	addErrors(errors: ValidationError[]): IValidation<ValidationError, Data> {
		return this.concat(invalid(errors));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	apply<NewData>(val: IValidation<ValidationError, (value: Data) => NewData>): IValidation<ValidationError, NewData> {
		return invalid(this.validationErrors());
	}

	asArray(): Data[] {
		return Array.from(this);
	}

	biMap<NewValidationError, NewData>(
		i: (validationError: ValidationError[]) => NewValidationError[],
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		v: (data: Data) => NewData
	): IValidation<NewValidationError, NewData> {
		return invalid(i(this.validationErrors()));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	chain<NewData>(v: (data: Data) => IValidation<ValidationError, NewData>): IValidation<ValidationError, NewData> {
		return invalid(this.validationErrors());
	}

	concat(
		other: IValidation<ValidationError, Data>,
		howToConcat?: { 
			howToConcatInvalid?: ((tv: ValidationError[], ov: ValidationError[]) => ValidationError[]) | null | undefined;
			howToConcatValid?: ((tv: Data, ov: Data) => Data) | null | undefined; 
		} | null | undefined
	): IValidation<ValidationError, Data> {
		return other.match<IValidation<ValidationError, Data>>(
			ov => invalid(concatLeft(this.validationErrors(), ov)),
			() => other
		);
		function concatLeft (tv: ValidationError[], ov: ValidationError[]) {
			const howToConcatInvalid = (howToConcat || {}).howToConcatInvalid;
			if (!isNullOrUndefined(howToConcatInvalid))
				return howToConcatInvalid(tv, ov);
			return [...tv].concat(ov);
		}
	}

	equals(
		other: IValidation<ValidationError, Data>,
		predicates?: {
			invalidEqualsPredicate?: BooleanComparePredicate<ValidationError[]> | null | undefined;
			validEqualsPredicate?: BooleanComparePredicate<Data> | null | undefined;
		} | null | undefined
	): boolean {
		return other.match(
			ov => {
				let iep = (predicates || {}).invalidEqualsPredicate;
				if (isNullOrUndefined(iep))
					iep = (tv, ov) => tv.length === ov.length &&
															tv.every((tvi, idx) => tvi === ov[idx]);
				return iep(this.validationErrors(), ov);
			},
			false
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	extend<NewData>(v: (value: IValidation<ValidationError, Data>) => NewData): IValidation<ValidationError, NewData> {
		return invalid(this.validationErrors());
	}

	getOrElse(other: Data | (() => Data)): Data {
		let v = other;
		if (isFunction(v))
			v = v();
		return v;
	}


	isInvalid(): boolean {
		return true;
	}
	isValid(): boolean {
		return false;
	}

	lessThen(
		other: IValidation<ValidationError, Data>,
		predicates?: {
			invalidLessThenPredicate?: BooleanComparePredicate<ValidationError[]> | null | undefined;
			validLessThenPredicate?: BooleanComparePredicate<Data> | null | undefined;
		} | null | undefined
	): boolean {
		return other.match(
			ov => {
				let itnp = (predicates  || {}).invalidLessThenPredicate;
				if (isNullOrUndefined(itnp))
					itnp = (tv, ov) => tv.length < ov.length;
				return itnp(this.validationErrors(), ov);
			},
			true
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	map<NewData>(v: (value: Data) => NewData): IValidation<ValidationError, NewData> {
		return invalid(this.validationErrors());
	}

	match<T>(
		i: T | ((value: ValidationError[]) => T),
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		v: T | ((value: Data) => T)
	): T {
		let ii = i;
		if (isFunction(ii))
			ii = ii(this.validationErrors());
		return ii;
	}

	orElse(other: IValidation<ValidationError, Data> | ((errors: ValidationError[]) => IValidation<ValidationError, Data>)): IValidation<ValidationError, Data> {
		let v = other;
		if (isFunction(v))
			v = v(this.validationErrors());
		return v;
	}

	reduce<NewData>(
		v: (acc: NewData, value: Data) => NewData,
		initial: NewData
	): NewData {
		return initial;
	}

	swap(): IValidation<Data, ValidationError[]> {
		return valid(this.validationErrors());
	}

	tap(func: (i: ValidationError[], v: Data | null | undefined) => Unit): IValidation<ValidationError, Data> {
		func(this.validationErrors(), void  0);
		return this;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	then(v: (value: Data) => Unit): IValidation<ValidationError, Data> {
		return this;
	}
	
	toString(): string {
		return `Invalid(${this.validationErrors().join(' - ')})`;
	}

	validationErrors(): ValidationError[] {
		return this.internalValidationErrors;
	}

}