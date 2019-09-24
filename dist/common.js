"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_parse_1 = __importDefault(require("url-parse"));
function identity(v) {
    return v;
}
exports.identity = identity;
function toString(v) {
    return `${v}`;
}
exports.toString = toString;
function parseConnectionUrl(url) {
    const { protocol, hostname, port, pathname, query, username, password } = url_parse_1.default(url);
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
exports.parseConnectionUrl = parseConnectionUrl;
