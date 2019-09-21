import { TableView } from './tables';
import { TypeInfo } from "./types";
import { Identifier } from "./common";
export interface Column<T = {}> {
    name: Identifier;
    typeInfo: TypeInfo;
    defaultValue: T;
}
export declare class ColumnView<T = {}> {
    readonly table: TableView;
    private data;
    private changed;
    constructor(table: TableView, name: Identifier);
    readonly connection: import("./connections").Connection;
    readonly database: import("./databases").DatabaseView;
    readonly name: string;
    load(): Promise<void>;
    hydrate(column: Column<T>): Promise<void>;
    save(): Promise<void>;
    getData(): {
        name: string;
        typeInfo?: TypeInfo | undefined;
        defaultValue?: T | undefined;
    };
}
