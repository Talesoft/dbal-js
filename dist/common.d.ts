export declare type Identifier = string;
export declare type EscapeIdentifierFunction = (value: Identifier) => string;
export declare type EscapeFunction<T = any> = (value: T) => string;
export declare type ConnectionUrl = string;
export interface ConnectionOptions {
    driver?: string;
    user?: string;
    password?: string;
    host?: string;
    port?: number;
    databaseName?: string;
    params?: {
        [key: string]: string | undefined;
    };
}
export declare function identity<T = any>(v: T): T;
export declare function toString<T = any>(v: T): string;
export declare function parseConnectionUrl(url: ConnectionUrl): {
    password: string;
    driver: string | undefined;
    user: string;
    host: string | undefined;
    port: number | undefined;
    databaseName: string;
    params: {
        [key: string]: string | undefined;
    };
};
