import { left, right, type IEither } from './either';
import { Just, Nothing } from './maybe';



// export interface Just {
// 	toEither<T>(): IEither<null | undefined, T>;
// }

// declare module './maybe' {
// 	interface IMaybe<T> {
// 		toEither(): IEither<null | undefined, T>;
// 	}
// 	interface Just<T> {
// 		toEither(): IEither<null | undefined, T>;
// 	}
// 	interface Nothing<T> {
// 		toEither(): IEither<null | undefined, T>;
// 	}
// }


// Just.prototype.toEither = function<T>(): IEither<null | undefined, T> {
// 	return right(this.value());
// };


// Nothing.prototype.toEither = function<T>(): IEither<null | undefined, T> {
// 	return left<null | undefined, T>(null);
// };
