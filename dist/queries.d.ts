import { BaseFunction } from 'estree';
import { Identifier } from './common';
import { Connection } from './connections';
export declare type ExpressionFunction<T = {}> = (value: T, ...joins: any[]) => any;
export declare type SelectorFunction<T = {}> = (value: T, ...joins: any[]) => any;
export declare function parseFunctionExpression(fn: (...args: any[]) => void): BaseFunction;
export declare type OrderDirection = 'asc' | 'desc';
export interface Order {
    direction: OrderDirection;
    expression: BaseFunction;
}
export declare type JoinType = 'left' | 'right' | 'inner';
export interface Join {
    tableName: Identifier;
    type: JoinType;
    expression: BaseFunction;
}
export interface QueryParams {
    [key: string]: string | number | null;
}
export interface Query {
    where?: BaseFunction;
    orders?: Order[];
    limit?: number;
    offset?: number;
    joins?: Join[];
    params?: QueryParams;
}
export interface Queryable<T = {}> {
    with(params: QueryParams): Queryable<T>;
    where(fn: ExpressionFunction<T>): Queryable<T>;
    orderBy(fn: ExpressionFunction<T>, direction?: OrderDirection): Queryable<T>;
    slice(offset: number): Queryable<T>;
    take(amount: number): Queryable<T>;
    join(tableName: Identifier, type: JoinType, expr: ExpressionFunction<T>): Queryable<T>;
    leftJoin(tableName: Identifier, expr: ExpressionFunction<T>): Queryable<T>;
    rightJoin(tableName: Identifier, expr: ExpressionFunction<T>): Queryable<T>;
    innerJoin(tableName: Identifier, expr: ExpressionFunction<T>): Queryable<T>;
    select<M = T>(fn?: SelectorFunction<T>): Promise<M[]>;
    stream<M = T>(fn?: SelectorFunction<T>): AsyncIterator<M>;
    [Symbol.asyncIterator](): Promise<AsyncIterator<T>>;
}
export declare class QueryBuilder<T = {}> implements Queryable<T> {
    readonly connection: Connection;
    readonly databaseName: Identifier;
    readonly query: Query;
    private tableName;
    constructor(connection: Connection, databaseName: Identifier, tableName?: Identifier);
    from(tableName: Identifier): this;
    with(params: QueryParams): this;
    where(fn: ExpressionFunction<T>): this;
    orderBy(fn: ExpressionFunction<T>, direction?: OrderDirection): this;
    slice(offset: number): this;
    take(amount: number): this;
    join(tableName: Identifier, type: JoinType, expr: ExpressionFunction<T>): this;
    leftJoin(tableName: Identifier, expr: ExpressionFunction<T>): this;
    rightJoin(tableName: Identifier, expr: ExpressionFunction<T>): this;
    innerJoin(tableName: Identifier, expr: ExpressionFunction<T>): this;
    select<M = T>(fn?: SelectorFunction<T>): Promise<M[]>;
    stream<M = T>(fn?: SelectorFunction<T>): AsyncIterator<M, any, undefined>;
    [Symbol.asyncIterator](): Promise<AsyncIterator<T, any, undefined>>;
}
