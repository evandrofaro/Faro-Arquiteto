import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AiModel, Conversation, ConversationDetail, ConversationInput, DirRequest, FileContent, FileRequest, FileUpdate, GithubFile, GithubRepo, GithubStatus, HealthStatus, Message, MessageInput, Settings, SettingsUpdate } from './api.schemas';
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
export declare const getListConversationsUrl: () => string;
/**
 * @summary List all conversations
 */
export declare const listConversations: (options?: RequestInit) => Promise<Conversation[]>;
export declare const getListConversationsQueryKey: () => readonly ["/api/conversations"];
export declare const getListConversationsQueryOptions: <TData = Awaited<ReturnType<typeof listConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listConversations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListConversationsQueryResult = NonNullable<Awaited<ReturnType<typeof listConversations>>>;
export type ListConversationsQueryError = ErrorType<unknown>;
/**
 * @summary List all conversations
 */
export declare function useListConversations<TData = Awaited<ReturnType<typeof listConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateConversationUrl: () => string;
/**
 * @summary Create a new conversation
 */
export declare const createConversation: (conversationInput: ConversationInput, options?: RequestInit) => Promise<Conversation>;
export declare const getCreateConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createConversation>>, TError, {
        data: BodyType<ConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createConversation>>, TError, {
    data: BodyType<ConversationInput>;
}, TContext>;
export type CreateConversationMutationResult = NonNullable<Awaited<ReturnType<typeof createConversation>>>;
export type CreateConversationMutationBody = BodyType<ConversationInput>;
export type CreateConversationMutationError = ErrorType<unknown>;
/**
* @summary Create a new conversation
*/
export declare const useCreateConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createConversation>>, TError, {
        data: BodyType<ConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createConversation>>, TError, {
    data: BodyType<ConversationInput>;
}, TContext>;
export declare const getGetConversationUrl: (id: number) => string;
/**
 * @summary Get conversation with messages
 */
export declare const getConversation: (id: number, options?: RequestInit) => Promise<ConversationDetail>;
export declare const getGetConversationQueryKey: (id: number) => readonly [`/api/conversations/${number}`];
export declare const getGetConversationQueryOptions: <TData = Awaited<ReturnType<typeof getConversation>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getConversation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetConversationQueryResult = NonNullable<Awaited<ReturnType<typeof getConversation>>>;
export type GetConversationQueryError = ErrorType<void>;
/**
 * @summary Get conversation with messages
 */
export declare function useGetConversation<TData = Awaited<ReturnType<typeof getConversation>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteConversationUrl: (id: number) => string;
/**
 * @summary Delete a conversation
 */
export declare const deleteConversation: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteConversation>>, TError, {
    id: number;
}, TContext>;
export type DeleteConversationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteConversation>>>;
export type DeleteConversationMutationError = ErrorType<unknown>;
/**
* @summary Delete a conversation
*/
export declare const useDeleteConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteConversation>>, TError, {
    id: number;
}, TContext>;
export declare const getSendMessageUrl: (id: number) => string;
/**
 * @summary Send a message and get AI response
 */
export declare const sendMessage: (id: number, messageInput: MessageInput, options?: RequestInit) => Promise<Message>;
export declare const getSendMessageMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
        id: number;
        data: BodyType<MessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
    id: number;
    data: BodyType<MessageInput>;
}, TContext>;
export type SendMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendMessage>>>;
export type SendMessageMutationBody = BodyType<MessageInput>;
export type SendMessageMutationError = ErrorType<void>;
/**
* @summary Send a message and get AI response
*/
export declare const useSendMessage: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
        id: number;
        data: BodyType<MessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendMessage>>, TError, {
    id: number;
    data: BodyType<MessageInput>;
}, TContext>;
export declare const getListModelsUrl: () => string;
/**
 * @summary List available HuggingFace code models
 */
export declare const listModels: (options?: RequestInit) => Promise<AiModel[]>;
export declare const getListModelsQueryKey: () => readonly ["/api/models"];
export declare const getListModelsQueryOptions: <TData = Awaited<ReturnType<typeof listModels>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listModels>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listModels>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListModelsQueryResult = NonNullable<Awaited<ReturnType<typeof listModels>>>;
export type ListModelsQueryError = ErrorType<unknown>;
/**
 * @summary List available HuggingFace code models
 */
export declare function useListModels<TData = Awaited<ReturnType<typeof listModels>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listModels>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetGithubStatusUrl: () => string;
/**
 * @summary Check GitHub connection status
 */
export declare const getGithubStatus: (options?: RequestInit) => Promise<GithubStatus>;
export declare const getGetGithubStatusQueryKey: () => readonly ["/api/github/status"];
export declare const getGetGithubStatusQueryOptions: <TData = Awaited<ReturnType<typeof getGithubStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGithubStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getGithubStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetGithubStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getGithubStatus>>>;
export type GetGithubStatusQueryError = ErrorType<unknown>;
/**
 * @summary Check GitHub connection status
 */
export declare function useGetGithubStatus<TData = Awaited<ReturnType<typeof getGithubStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGithubStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListGithubReposUrl: () => string;
/**
 * @summary List user GitHub repositories
 */
export declare const listGithubRepos: (options?: RequestInit) => Promise<GithubRepo[]>;
export declare const getListGithubReposQueryKey: () => readonly ["/api/github/repos"];
export declare const getListGithubReposQueryOptions: <TData = Awaited<ReturnType<typeof listGithubRepos>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGithubRepos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listGithubRepos>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListGithubReposQueryResult = NonNullable<Awaited<ReturnType<typeof listGithubRepos>>>;
export type ListGithubReposQueryError = ErrorType<unknown>;
/**
 * @summary List user GitHub repositories
 */
export declare function useListGithubRepos<TData = Awaited<ReturnType<typeof listGithubRepos>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGithubRepos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListRepoContentsUrl: (owner: string, repo: string) => string;
/**
 * @summary List root-level contents of a repository
 */
export declare const listRepoContents: (owner: string, repo: string, options?: RequestInit) => Promise<GithubFile[]>;
export declare const getListRepoContentsQueryKey: (owner: string, repo: string) => readonly [`/api/github/repos/${string}/${string}/contents`];
export declare const getListRepoContentsQueryOptions: <TData = Awaited<ReturnType<typeof listRepoContents>>, TError = ErrorType<unknown>>(owner: string, repo: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRepoContents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listRepoContents>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListRepoContentsQueryResult = NonNullable<Awaited<ReturnType<typeof listRepoContents>>>;
export type ListRepoContentsQueryError = ErrorType<unknown>;
/**
 * @summary List root-level contents of a repository
 */
export declare function useListRepoContents<TData = Awaited<ReturnType<typeof listRepoContents>>, TError = ErrorType<unknown>>(owner: string, repo: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRepoContents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getFetchFileContentUrl: () => string;
/**
 * @summary Fetch file content from GitHub (POST to avoid query-param collisions)
 */
export declare const fetchFileContent: (fileRequest: FileRequest, options?: RequestInit) => Promise<FileContent>;
export declare const getFetchFileContentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof fetchFileContent>>, TError, {
        data: BodyType<FileRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof fetchFileContent>>, TError, {
    data: BodyType<FileRequest>;
}, TContext>;
export type FetchFileContentMutationResult = NonNullable<Awaited<ReturnType<typeof fetchFileContent>>>;
export type FetchFileContentMutationBody = BodyType<FileRequest>;
export type FetchFileContentMutationError = ErrorType<unknown>;
/**
* @summary Fetch file content from GitHub (POST to avoid query-param collisions)
*/
export declare const useFetchFileContent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof fetchFileContent>>, TError, {
        data: BodyType<FileRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof fetchFileContent>>, TError, {
    data: BodyType<FileRequest>;
}, TContext>;
export declare const getUpdateFileContentUrl: () => string;
/**
 * @summary Update file content on GitHub
 */
export declare const updateFileContent: (fileUpdate: FileUpdate, options?: RequestInit) => Promise<FileContent>;
export declare const getUpdateFileContentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateFileContent>>, TError, {
        data: BodyType<FileUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateFileContent>>, TError, {
    data: BodyType<FileUpdate>;
}, TContext>;
export type UpdateFileContentMutationResult = NonNullable<Awaited<ReturnType<typeof updateFileContent>>>;
export type UpdateFileContentMutationBody = BodyType<FileUpdate>;
export type UpdateFileContentMutationError = ErrorType<unknown>;
/**
* @summary Update file content on GitHub
*/
export declare const useUpdateFileContent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateFileContent>>, TError, {
        data: BodyType<FileUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateFileContent>>, TError, {
    data: BodyType<FileUpdate>;
}, TContext>;
export declare const getListDirContentsUrl: () => string;
/**
 * @summary List contents of a directory in a repository
 */
export declare const listDirContents: (dirRequest: DirRequest, options?: RequestInit) => Promise<GithubFile[]>;
export declare const getListDirContentsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof listDirContents>>, TError, {
        data: BodyType<DirRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof listDirContents>>, TError, {
    data: BodyType<DirRequest>;
}, TContext>;
export type ListDirContentsMutationResult = NonNullable<Awaited<ReturnType<typeof listDirContents>>>;
export type ListDirContentsMutationBody = BodyType<DirRequest>;
export type ListDirContentsMutationError = ErrorType<unknown>;
/**
* @summary List contents of a directory in a repository
*/
export declare const useListDirContents: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof listDirContents>>, TError, {
        data: BodyType<DirRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof listDirContents>>, TError, {
    data: BodyType<DirRequest>;
}, TContext>;
export declare const getGetSettingsUrl: () => string;
/**
 * @summary Get application settings
 */
export declare const getSettings: (options?: RequestInit) => Promise<Settings>;
export declare const getGetSettingsQueryKey: () => readonly ["/api/settings"];
export declare const getGetSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getSettings>>>;
export type GetSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get application settings
 */
export declare function useGetSettings<TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateSettingsUrl: () => string;
/**
 * @summary Update application settings
 */
export declare const updateSettings: (settingsUpdate: SettingsUpdate, options?: RequestInit) => Promise<Settings>;
export declare const getUpdateSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<SettingsUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<SettingsUpdate>;
}, TContext>;
export type UpdateSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettings>>>;
export type UpdateSettingsMutationBody = BodyType<SettingsUpdate>;
export type UpdateSettingsMutationError = ErrorType<unknown>;
/**
* @summary Update application settings
*/
export declare const useUpdateSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<SettingsUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<SettingsUpdate>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map