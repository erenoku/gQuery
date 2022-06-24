import type { DefinitionNode, DocumentNode } from 'graphql';
export declare type GFetchQueryDefault = {
	errors?: Error[];
	status: 'LOADED' | 'LOADING' | 'ERROR';
};
declare type OptionalPropertyNames<T> = {
	[K in keyof T]-?: {} extends {
		[P in K]: T[K];
	}
		? K
		: never;
}[keyof T];
declare type SpreadProperties<L, R, K extends keyof L & keyof R> = {
	[P in K]: L[P] | Exclude<R[P], undefined>;
};
declare type Id<T> = T extends infer U
	? {
			[K in keyof U]: U[K];
	  }
	: never;
declare type SpreadTwo<L, R> = Id<
	Pick<L, Exclude<keyof L, keyof R>> &
		Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> &
		Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> &
		SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;
declare type Spread<A extends readonly [...any]> = A extends [infer L, ...infer R]
	? SpreadTwo<L, Spread<R>>
	: unknown;
export declare type GFetchQueries = {
	query: DocumentNode;
	variables?: Record<string, unknown>;
};
export declare const stringifyDocument: (node: string | DefinitionNode | DocumentNode) => string;
declare type gFetchProperties = {
	queries: GFetchQueries[];
	fetch: typeof fetch;
};
interface fetchOptions {
	credentials: 'include' | 'omit' | 'same-origin';
}
export declare type GClientOptions = {
	path: string;
	fetchOptions?: fetchOptions | {};
};
export declare type GGetParameters<Variables> = {
	variables?: Variables;
	fetch: typeof fetch;
};
export declare type GFetchReturnWithErrors<T> = Spread<[T, GFetchQueryDefault]>;
export declare class GFetch extends Object {
	path: string;
	fetchOptions?: fetchOptions;
	constructor(options: GClientOptions);
	fetch<T>({ queries, fetch }: gFetchProperties): Promise<GFetchReturnWithErrors<T>>;
}
export {};
