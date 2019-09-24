import { Identifier } from "./common";
import { Connection } from './connections';
import { Table, TableView } from './tables';
export interface Database {
    name: Identifier;
    tables?: Table[];
}
export declare class DatabaseView {
    readonly connection: Connection;
    private data;
    private changed;
    private tables;
    constructor(connection: Connection, name: Identifier);
    readonly name: string;
    load(deep?: boolean): Promise<void>;
    hydrate(database: Database, deep?: boolean): Promise<void>;
    save(deep?: boolean): Promise<void>;
    getTable(name: Identifier): TableView<{}>;
    exists(): Promise<boolean>;
    create(deep?: boolean): Promise<this>;
    update(deep?: boolean): Promise<this>;
    remove(): Promise<this>;
    getData(deep?: boolean): {
        name: string;
    } | {
        tables: {
            name: string;
        }[];
        name: string;
    };
}
