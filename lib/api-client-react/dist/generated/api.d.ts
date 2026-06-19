import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ErrorResponse, FetchedResults, HealthStatus, ResultsData, ResultsInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetResultsUrl: () => string;
/**
 * Returns the stored match results as a map of matchId to [home, away] scores
 * @summary Get all match results
 */
export declare const getResults: (options?: RequestInit) => Promise<ResultsData>;
export declare const getGetResultsQueryKey: () => readonly ["/api/results"];
export declare const getGetResultsQueryOptions: <TData = Awaited<ReturnType<typeof getResults>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getResults>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetResultsQueryResult = NonNullable<Awaited<ReturnType<typeof getResults>>>;
export type GetResultsQueryError = ErrorType<unknown>;
/**
 * @summary Get all match results
 */
export declare function useGetResults<TData = Awaited<ReturnType<typeof getResults>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSaveResultsUrl: () => string;
/**
 * Saves the full match results map
 * @summary Save match results
 */
export declare const saveResults: (resultsInput: ResultsInput, options?: RequestInit) => Promise<ResultsData>;
export declare const getSaveResultsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveResults>>, TError, {
        data: BodyType<ResultsInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof saveResults>>, TError, {
    data: BodyType<ResultsInput>;
}, TContext>;
export type SaveResultsMutationResult = NonNullable<Awaited<ReturnType<typeof saveResults>>>;
export type SaveResultsMutationBody = BodyType<ResultsInput>;
export type SaveResultsMutationError = ErrorType<unknown>;
/**
* @summary Save match results
*/
export declare const useSaveResults: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveResults>>, TError, {
        data: BodyType<ResultsInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof saveResults>>, TError, {
    data: BodyType<ResultsInput>;
}, TContext>;
export declare const getFetchResultsUrl: () => string;
/**
 * Uses AI to search for real World Cup 2026 match results and returns them
 * @summary Fetch results via AI web search
 */
export declare const fetchResults: (options?: RequestInit) => Promise<FetchedResults>;
export declare const getFetchResultsMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof fetchResults>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof fetchResults>>, TError, void, TContext>;
export type FetchResultsMutationResult = NonNullable<Awaited<ReturnType<typeof fetchResults>>>;
export type FetchResultsMutationError = ErrorType<ErrorResponse>;
/**
* @summary Fetch results via AI web search
*/
export declare const useFetchResults: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof fetchResults>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof fetchResults>>, TError, void, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map