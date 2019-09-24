import { Column, ColumnView } from './columns';
import { Identifier } from './common';
import { DatabaseView } from './databases';
import { Key, KeyView } from './keys';
import { ExpressionFunction, JoinType, OrderDirection, Queryable, QueryBuilder, QueryParams } from './queries';
export interface Table {
    name: Identifier;
    keys?: Key[];
    columns?: Column[];
}
export declare class TableView<T = {}> implements Queryable {
    readonly database: DatabaseView;
    private data;
    private changed;
    private keys;
    private columns;
    constructor(database: DatabaseView, name: Identifier);
    readonly connection: import("./connections").Connection;
    readonly name: string;
    load(deep?: boolean): Promise<void>;
    hydrate(table: Table, deep?: boolean): Promise<void>;
    save(deep?: boolean): Promise<void>;
    getKey(name: Identifier): KeyView;
    getColumn<C>(name: Identifier): ColumnView<{}>;
    exists(): Promise<boolean>;
    create(): Promise<this>;
    update(): Promise<this>;
    remove(): Promise<this>;
    insert(row: T): Promise<string | number>;
    insertMultiple(rows: T[]): Promise<(string | number)[]>;
    query(): QueryBuilder<T>;
    with(params: QueryParams): QueryBuilder<T>;
    where(fn: ExpressionFunction<T>): QueryBuilder<T>;
    orderBy(fn: ExpressionFunction<T>, direction?: OrderDirection): QueryBuilder<T>;
    slice(offset: number): QueryBuilder<T>;
    take(amount: number): QueryBuilder<T>;
    join(tableName: Identifier, type: JoinType, expr: ExpressionFunction<T>): QueryBuilder<T>;
    leftJoin(tableName: Identifier, expr: ExpressionFunction<T>): QueryBuilder<T>;
    rightJoin(tableName: Identifier, expr: ExpressionFunction<T>): QueryBuilder<T>;
    innerJoin(tableName: Identifier, expr: ExpressionFunction<T>): QueryBuilder<T>;
    select<M = T>(fn?: ExpressionFunction<T>): Promise<M[]>;
    stream<M = T>(): AsyncIterator<M, any, undefined>;
    getData(deep?: boolean): {
        name: string;
    } | {
        keys: {
            type?: import("./keys").KeyType | undefined;
            name: string;
            columnNames?: string[] | undefined;
        }[];
        columns: {
            name: string;
            defaultValue?: {} | null | undefined;
            generated?: boolean | undefined;
            comment?: string | undefined;
            type?: string | undefined;
            typeParams?: (string | number)[] | undefined;
            nullable?: boolean | undefined;
            unsigned?: boolean | undefined;
        }[];
        name: string;
    };
    [Symbol.asyncIterator](): Promise<AsyncIterator<T, any, undefined>>;
}
