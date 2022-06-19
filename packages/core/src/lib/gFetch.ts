import type { DefinitionNode, DocumentNode } from 'graphql';
import { print } from 'graphql';

// What's the deal with *gFetch*?
// gFetch is a 0 dependency fetcher for graphql that accepts a custom fetch function
// This is useful if your platform provides you with a customer fetch. ie SvelteKit
// It also uses batched queries to batch several queries into one request.

// Two key exports from this file
// gFetch -> a fetcher that returns async
// ogFetch -> a fetcher that returns a subscription

// * Main Features *
//  1. 0 deps outside of graphql and svelte kit
//  2. Allows for batched queries
//  3. Plays nice with custom fetch functions
//  4. Doesn't use it's own cache, ie, would rely on Svelte's stores
export declare type GFetchQueryDefault = {
	errors?: Error[];
	gQueryStatus: 'LOADED' | 'LOADING' | 'ERROR';
};

type OptionalPropertyNames<T> = {
	[K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never;
}[keyof T];

type SpreadProperties<L, R, K extends keyof L & keyof R> = {
	[P in K]: L[P] | Exclude<R[P], undefined>;
};

type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type SpreadTwo<L, R> = Id<
	Pick<L, Exclude<keyof L, keyof R>> &
		Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> &
		Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> &
		SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;

type Spread<A extends readonly [...any]> = A extends [infer L, ...infer R]
	? SpreadTwo<L, Spread<R>>
	: unknown;

export declare type GFetchQueries = {
	query: DocumentNode;
	variables?: Record<string, unknown>;
};

export const stringifyDocument = (node: string | DefinitionNode | DocumentNode): string => {
	let str = (typeof node !== 'string' ? print(node) : node)
		.replace(/([\s,]|#[^\n\r]+)+/g, ' ')
		.trim();
	return str;
};

type gFetchProperties = {
	queries: GFetchQueries[];
	fetch: typeof fetch;
};

interface fetchOptions {
	credentials: 'include' | 'omit' | 'same-origin';
}

export type GClientOptions = {
	path: string;
	fetchOptions?: fetchOptions | {};
};

export type GGetParameters<Variables> = {
	variables?: Variables;
	fetch: typeof fetch;
};

export type GFetchReturnWithErrors<T> = Spread<[T, GFetchQueryDefault]>;

export class GFetch extends Object {
	public path: string;
	public fetchOptions?: fetchOptions;

	constructor(options: GClientOptions) {
		super();
		const { path, fetchOptions = {} } = options;
		this.path = path;
		this.fetchOptions = fetchOptions;
		this.fetch = this.fetch.bind(this);
	}

	// * gFetch
	// This is a fetcher that returns a promise that resolves to a graphql response
	public async fetch<T>({ queries, fetch }: gFetchProperties): Promise<GFetchReturnWithErrors<T>> {
		// let document: DocumentNode = addTypenameToDocument(queries[0].query);

		let documentString: string = stringifyDocument(queries[0].query);
		const newQueries = {
			...queries[0],
			query: documentString
		};

		let data;

		// This is generic fetch, that is polyfilled via svelte kit
		// graph ql fetches must be POST
		// credentials include for user ssr data
		try {
			const res = await fetch(this.path, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newQueries),
				...this.fetchOptions
			});
			// Gets the data back from the server
			data = await res.json();

			return {
				...data.data,
				errors: data.errors
			};
		} catch (err) {
			console.error('err', err);
			return {
				...data,
				gQueryStatus: 'ERROR',
				errors: [err] as Error[]
			};
		}
	}
}
