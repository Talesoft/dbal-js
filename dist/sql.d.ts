import { BaseExpression, BaseFunction, BinaryExpression, Literal, LogicalExpression, MemberExpression } from 'estree';
import { Column } from './columns';
import { EscapeFunction, EscapeIdentifierFunction, Identifier } from './common';
import { Key, KeyType } from './keys';
import { Join, Order, Query, QueryParams } from './queries';
export interface SqlBuilderOptions {
    escape: EscapeFunction;
    escapeIdentifier: EscapeIdentifierFunction;
    identifierDelimiter: string;
    arrayOpenBracket: string;
    arrayCloseBracket: string;
    arrayDelimiter: string;
    listOpenBracket: string;
    listCloseBracket: string;
    listDelimiter: string;
    mapOpenBracket: string;
    mapCloseBracket: string;
    mapDelimiter: string;
    mapPairDelimiter: string;
    tableAlias: string;
    joinAliasPattern: string;
    maxJoinParams: number;
    logicalOperatorMap: {
        '&&': string;
        '||': string;
    };
    binaryOperatorMap: {
        in: string;
        '===': string;
        '==': string;
        '!==': string;
        '!=': string;
        '<': string;
        '>': string;
        '<=': string;
        '>=': string;
        '+': string;
        '-': string;
        '/': string;
        '*': string;
    };
    keyMap: {
        [KeyType.INDEX]: string;
        [KeyType.PRIMARY]: string;
        [KeyType.UNIQUE]: string;
        [KeyType.FOREIGN]: string;
    };
}
export declare class SqlBuilder {
    readonly options: SqlBuilderOptions;
    private readonly paramNames;
    constructor(options?: Partial<SqlBuilderOptions>);
    escape<T = any>(value: T): string;
    escapeIdentifier(...identifiers: Identifier[]): string;
    refactorParams(ast: BaseFunction): void;
    buildArraySql(value: any[], mapFn?: EscapeFunction): string;
    buildListSql(value: any[], mapFn?: EscapeFunction): string;
    buildMapSql(value: any, mapFn?: EscapeFunction): string;
    buildIdentifierSql(expr: MemberExpression): string;
    buildSelectorSql(selector?: BaseFunction): string;
    buildLogicalExpressionSql(expr: LogicalExpression, params?: QueryParams): string;
    buildBinaryExpressionSql(expr: BinaryExpression, params?: QueryParams): string;
    buildExpressionSql(expr: BaseExpression | Literal, params?: QueryParams): string;
    buildWhereSql(fn: BaseFunction, params?: QueryParams): string;
    buildOrderSql(orders: Order[]): string;
    buildJoinSql(join: Join, index: number, params?: QueryParams): string;
    buildQuerySql(query: Query): string;
    buildInsertIntoSql<T = {}>(databaseName: string, tableName: string, row: T): string;
    buildInsertIntoMultipleSql<T = {}>(databaseName: string, tableName: string, rows: T[]): string;
    buildSelectSql(databaseName: Identifier, tableName: Identifier, query: Query, selector?: BaseFunction): string;
    buildColumnSql(column: Column): string;
    buildKeyIdentifierSql(key: Key): string;
    buildKeySql(key: Key): string;
}
