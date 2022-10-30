export class Unit {}

// type Fn<TArgs extends any[], TResult> = (...args: TArgs) => TResult;

// export function toFunction(fn: (...args: any[]) => void): (...args: any[]) => void {
// 	return (...args: any[]) => {
// 		fn(args);
// 		return new Unit();
// 	};
// }

// import {

// 	bind

// } from 'lodash';




// const a = (v: string) => console.log('ciao');
// const c = bind(a, {});
// c(10);
// const b = toFunction(a);
// b('cose');