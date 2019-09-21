import UrlParse from 'url-parse';
export type Identifier = string;

export type ConnectionUrl = string;

export interface ConnectionOptions {
    driver?: string;
    user?: string;
    password?: string;
    host?: string;
    port?: number;
    databaseName?: string;
    params?: { [key: string]: string | undefined };
}

export function parseConnectionUrl(url: ConnectionUrl) {
    const { protocol, hostname, port, pathname, query, username, password } = new UrlParse(url);
    let finalDriver = protocol;
    if (finalDriver && finalDriver.endsWith(':')) {
        finalDriver = finalDriver.substr(0, finalDriver.length - 1);
    }
    let finalPathname = pathname;
    if (finalPathname && finalPathname.startsWith('/')) {
        finalPathname = finalPathname.substr(1);
    }
    return {
        password,
        driver: finalDriver || undefined,
        user: username,
        host: hostname || undefined,
        port: port ? parseInt(port, 10) : undefined,
        databaseName: finalPathname,
        params: query || undefined,
    };
}
