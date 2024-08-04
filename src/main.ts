import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import './assets/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');


import * as Linq from 'iterable-linq-utility';

Linq.from([1,2,3,45]).some(v => v > 3);
import { Functions } from 'iterable-linq-utility';
const { filter, collectToArray, empty } = Functions;
const a: Linq.Unit = Linq.unit();

import { from } from 'iterable-linq-utility';




// interface IteratorReturnResult<TReturn> {
// 	done: true;
// 	value: TReturn;
// }

// type IteratorResult<T, TReturn = any> = IteratorYieldResult<T> | IteratorReturnResult<TReturn>;

// interface Iterator<T, TReturn = any, TNext = undefined> {
// 	// NOTE: 'next' is defined using a tuple to ensure we report the correct assignability errors in all places.
// 	next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
// 	return?(value?: TReturn): IteratorResult<T, TReturn>;
// 	throw?(e?: any): IteratorResult<T, TReturn>;
// }

class MyIterator<T, TR, TN> implements Iterator<T, TR, TN> {
	next(...args: [] | [TN]): IteratorResult<T, TR> {
		throw new Error("Method not implemented.");
	}
	return?(value?: TR): IteratorResult<T, TR> {
		return { done: true, value };
	}
	throw?(e?: any): IteratorResult<T, TR> {
		throw new Error("Method not implemented.");
	}
}

// (property) IteratorReturnResult<TR>.value: TR
// Type 'TR | undefined' is not assignable to type 'TR | T'.
//   Type 'undefined' is not assignable to type 'TR | T'.ts(2322)