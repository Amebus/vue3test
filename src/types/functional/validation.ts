import { Left, Right, type IEither } from './either';
import { isNullOrUndefined, isString } from './utils';

// TODO remove IEither from implementation hierarchy

export interface IValidation<ValidationError, R> extends IEither<ValidationError[], R> {

	concat(other: IValidation<ValidationError, R>, howToconcat?: {
		howToConcatLeft?: ((tv: ValidationError[], ov: ValidationError[]) => ValidationError[]) | null | undefined;
		howToConcatRight?: ((tv: R, ov: R) => R) | null | undefined;
	} | null | undefined
): IValidation<ValidationError, R>;

	addError(error: ValidationError): IValidation<ValidationError, R>;
	addErrors(errors: ValidationError[]): IValidation<ValidationError, R>;
	errors(): ValidationError[];
	isValid(): boolean;
	isInvalid(): boolean;
	value(): R;
	validate(f: (value: R) => ValidationError[]): IValidation<ValidationError, R>;
}


export function validate<ValidationError, R>(value: R, f: (value: R) => ValidationError[]): IValidation<ValidationError, R> {
	return new Valid<ValidationError, R>(value).validate(f);
}

export function valid<ValidationError, R>(value: R): IValidation<ValidationError, R> {
	return new Valid(value);
}

export function invalid<ValidationError, R>(errors: ValidationError[], value: R): IValidation<ValidationError, R> {
	return new Invalid(errors, value);
}

export class Valid<ValidationError, R> 
	extends Right<ValidationError[], R>
	implements IValidation<ValidationError, R> {

	constructor(value: R) {
		super(value);
	}

	addError(error: ValidationError): IValidation<ValidationError, R> {
		return this.addErrors([error]);
	}
	addErrors(errors: ValidationError[]): IValidation<ValidationError, R> {
		return new Invalid(errors, this.value());
	}

	concat(
		other: IValidation<ValidationError, R>, 
		howToConcat?: { 
			howToConcatLeft?: ((tv: ValidationError[], ov: ValidationError[]) => ValidationError[]) | null | undefined;
			howToConcatRight?: ((tv: R, ov: R) => R) | null | undefined; 
		} | null | undefined
	): IValidation<ValidationError, R> {
		const self = this as IValidation<ValidationError, R>;
		return this.match( () => self, tv => {
			return other.match(() => self, ov => {
				const howToConcatRight = (howToConcat || {}).howToConcatRight;
				if (!isNullOrUndefined(howToConcatRight))
					return new Valid(howToConcatRight(tv, ov));
				if (isString(tv))
					return new Valid(`${tv}${ov}` as R);
				if (Array.isArray(tv))
					return new Valid([...tv].concat(ov) as R);
				return other;
			});
		});
	}

	errors(): ValidationError[] {
		return [];
	}

	isValid(): boolean {
		return true;
	}
	isInvalid(): boolean {
		return false;
	}

	validate(f: (value: R) => ValidationError[]): IValidation<ValidationError, R> {
		const errors = f(this.value());
		if (errors.length > 0)
			return this.addErrors(errors);
		return this;
	}

	value(): R {
		return this.asArray()[0];
	}

	toString(): string {
		return `Valid(${this.value()})`;
	}
}

export class Invalid<ValidationError, R>
	extends Left<ValidationError[], R>
	implements IValidation<ValidationError, R> {
	
	private internalValidatedValue: R;

	constructor(error: ValidationError[], value: R) {
		super(error);
		this.internalValidatedValue = value;
	}

	addError(error: ValidationError): IValidation<ValidationError, R> {
		return this.addErrors([error]);
	}
	addErrors(errors: ValidationError[]): IValidation<ValidationError, R> {
		return this.concat(new Invalid(errors, this.value()));
	}

	concat(
		other: IValidation<ValidationError, R>, 
		howToConcat?: { 
			howToConcatLeft?: ((tv: ValidationError[], ov: ValidationError[]) => ValidationError[]) | null | undefined;
			howToConcatRight?: ((tv: R, ov: R) => R) | null | undefined; 
		} | null | undefined
	): IValidation<ValidationError, R> {
		const self = this as IValidation<ValidationError, R>;
		return this.match(tv => {
			return other.match(ov => {
				let errors: ValidationError[] = [];
				let howToConcatLeft = (howToConcat || {}).howToConcatLeft;
				if (isNullOrUndefined(howToConcatLeft))
					howToConcatLeft = (err1: ValidationError[], err2: ValidationError[]) => [...err1].concat(err2);
				errors = howToConcatLeft(tv, ov);
				return new Invalid(errors, this.value());
			}, () => self);
		},  () => self);
	}

	errors(): ValidationError[] {
		return this.asArrayL()[0];
	}

	isValid(): boolean {
		return false;
	}
	isInvalid(): boolean {
		return true;
	}

	validate(f: (value: R) => ValidationError[]): IValidation<ValidationError, R> {
		const value = this.value();
		const errors = f(value);
		if (errors.length > 0)
			return new Invalid([...this.errors()].concat(errors), value);
		return this;
	}

	value() {
		return this.internalValidatedValue;
	}

	toString(): string {
		return `Invalid(${this.errors().join(' - ')}, ${this.value()})`;
	}
}