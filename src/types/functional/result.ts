import { Left, Right, type IEither } from './either';

export interface IResult<Err, R> extends IEither<Err, R> {
	isFailure(): boolean;
	isSuccess(): boolean;
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