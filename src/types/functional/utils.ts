export function isNullOrUndefined(value?: any): value is null | undefined {
	return value === null || value === undefined || typeof value === 'undefined';
}