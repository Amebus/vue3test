import { maybe } from './maybe';


// export function maybe<T>(value?: T | null | undefined): Maybe<T> {
// 	if (isNullOrUndefined(value))
// 		return new Nothing<T>(value);
// 	return new Just<T>(value);
// }

// export function nothig<T>(value?: null | undefined) {
// 	return new Nothing<T>(value);
// }

// import './polyfill';

// const a = maybe('aa');
// a.toEither();


export * from './maybe';
