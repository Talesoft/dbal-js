import { BaseFunction } from 'estree';
import { Column } from './columns';
import { ConnectionOptions, Identifier } from './common';
import { Database } from './databases';
import { Key } from './keys';
import { Query } from './queries';
import { Table } from './tables';
export interface Driver {
    disconnect(): Promise<void>;
    getDatabases(): Promise<Database[]>;
    hasDatabase(name: Identifier): Promise<boolean>;
    getDatabase(name: Identifier): Promise<Database>;
    createDatabase(database: Database, deep?: boolean): Promise<Database>;
    updateDatabase(database: Database, deep?: boolean): Promise<Database>;
    removeDatabase(name: Identifier): Promise<void>;
    getTables(databaseName: Identifier): Promise<Table[]>;
    hasTable(databaseName: Identifier, name: Identifier): Promise<boolean>;
    getTable(databaseName: Identifier, name: Identifier): Promise<Table>;
    createTable(databaseName: Identifier, table: Table): Promise<Table>;
    updateTable(databaseName: Identifier, table: Table): Promise<Table>;
    removeTable(databaseName: Identifier, name: Identifier): Promise<void>;
    getKeys(databaseName: Identifier, tableName: Identifier): Promise<Key[]>;
    hasKey(databaseName: Identifier, tableName: Identifier, name: Identifier): Promise<boolean>;
    getKey(databaseName: Identifier, tableName: Identifier, name: Identifier): Promise<Key>;
    getColumns<T = any>(databaseName: Identifier, tableName: Identifier): Promise<Array<Column<T>>>;
    hasColumn(databaseName: Identifier, tableName: Identifier, name: Identifier): Promise<boolean>;
    getColumn<T = any>(databaseName: Identifier, tableName: Identifier, name: Identifier): Promise<Column<T>>;
    insert<T = {}>(databaseName: Identifier, tableName: Identifier, row: T): Promise<number | string>;
    insertMultiple<T = {}>(databaseName: Identifier, tableName: Identifier, rows: T[]): Promise<Array<number | string>>;
    select<T = {}, M = T>(databaseName: Identifier, tableName: Identifier, query: Query, selector?: BaseFunction): Promise<M[]>;
    stream<T = {}, M = T>(databaseName: Identifier, tableName: Identifier, query: Query, selector?: BaseFunction): AsyncIterator<M>;
    update<T = {}>(databaseName: Identifier, tableName: Identifier, values: T, query: Query): Promise<void>;
    delete(databaseName: Identifier, tableName: Identifier, query: Query): Promise<void>;
    transact(transactor: (driver: this) => Promise<void>): Promise<void>;
}
export declare type DriverConstructor<T extends ConnectionOptions = ConnectionOptions> = new (options: T) => Driver;
export interface DriverList {
    [name: string]: DriverConstructor;
}
