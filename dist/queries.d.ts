import { BaseFunction } from 'estree';
import { Identifier } from './common';
import { Connection } from './connections';
export declare type ExpressionFunction<T = {}> = (value: T) => any;
export declare function parseFunctionExpression(fn: (...args: any[]) => void): BaseFunction;
export declare function renameParam(ast: BaseFunction, index: number, newName: string): void;
export declare enum Order {
    ASC = "asc",
    DESC = "desc"
}
export declare type OrderList<T = {}> = {
    [K in keyof T]: Order;
};
export interface Query<T = {}> {
    where?: BaseFunction;
    order?: OrderList<T>;
    limit?: number;
    offset?: number;
}
export interface Queryable<T = {}> {
    where(fn: ExpressionFunction): this;
    sort(orderList: OrderList<T>): this;
    slice(offset: number): this;
    take(amount: number): this;
    select<M = T>(fn?: ExpressionFunction<T>): M[];
    stream<M = T>(fn?: ExpressionFunction<T>): AsyncIterator<M>;
}
export declare class QueryBuilder<T = {}> implements Queryable<T> {
    readonly connection: Connection;
    readonly databaseName: Identifier;
    readonly query: Query<T>;
    private tableName;
    constructor(connection: Connection, databaseName: Identifier, tableName?: Identifier);
    from(tableName: Identifier): this;
    where(fn: ExpressionFunction): this;
    sort(orderList: OrderList<T>): this;
    slice(offset: number): this;
    take(amount: number): this;
    select<M = T>(fn?: ExpressionFunction<T>): M[];
    stream<M = T>(fn?: ExpressionFunction<T>): AsyncIterator<M, any, undefined>;
    [Symbol.asyncIterator](): Promise<AsyncIterator<T, any, undefined>>;
}
