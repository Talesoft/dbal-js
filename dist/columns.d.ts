import { Identifier } from './common';
import { TableView } from './tables';
import { TypeInfo } from './types';
export interface Column<T = {}> extends TypeInfo {
    name: Identifier;
    defaultValue: T | null;
    generated: boolean;
    comment: string;
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
        defaultValue?: T | null | undefined;
        generated?: boolean | undefined;
        comment?: string | undefined;
        type?: string | undefined;
        typeParams?: (string | number)[] | undefined;
        nullable?: boolean | undefined;
        unsigned?: boolean | undefined;
    };
}
