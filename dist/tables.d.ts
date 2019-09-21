import { Column, ColumnView } from './columns';
import { Identifier } from "./common";
import { DatabaseView } from './databases';
import { ExpressionFunction, OrderList, QueryBuilder } from './queries';
export interface Table {
    name: Identifier;
    columns?: Column[];
}
export declare class TableView<T = {}> {
    readonly database: DatabaseView;
    private data;
    private changed;
    private columns;
    constructor(database: DatabaseView, name: Identifier);
    readonly connection: import("./connections").Connection;
    readonly name: string;
    load(deep?: boolean): Promise<void>;
    hydrate(table: Table, deep?: boolean): Promise<void>;
    save(deep?: boolean): Promise<void>;
    getColumn<C>(name: Identifier): ColumnView<{}>;
    query(): QueryBuilder<T>;
    where(fn: ExpressionFunction): QueryBuilder<T>;
    sort(orderList: OrderList<T>): QueryBuilder<T>;
    slice(offset: number): QueryBuilder<T>;
    take(amount: number): QueryBuilder<T>;
    select<M = T>(fn?: ExpressionFunction<T>): M[];
    stream(): AsyncIterator<T, any, undefined>;
    getData(deep?: boolean): {
        name: string;
    } | {
        columns: {
            name: string;
            typeInfo?: import("./types").TypeInfo | undefined;
            defaultValue?: {} | undefined;
        }[];
        name: string;
    };
}
