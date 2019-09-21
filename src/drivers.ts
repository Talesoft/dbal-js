import { Column } from './columns';
import { ConnectionOptions, Identifier } from './common';
import { Database } from './databases';
import { Query } from './queries';
import { Table } from './tables';
import { BaseFunction } from 'estree';

export interface Driver {
    connect(): Promise<void>;
    disconnect(): Promise<void>;

    // Database Management
    getDatabases(): Promise<Database[]>;
    hasDatabase(name: Identifier): Promise<boolean>;
    getDatabase(name: Identifier): Promise<Database>;

    // Table Management
    getTables(databaseName: Identifier): Promise<Table[]>;
    hasTable(databaseName: Identifier, name: Identifier): Promise<boolean>;
    getTable(databaseName: Identifier, name: Identifier): Promise<Table>;

    // Column Management
    getColumns<T = any>(databaseName: Identifier, tableName: Identifier): Promise<Array<Column<T>>>;
    hasColumn(databaseName: Identifier, tableName: Identifier, name: Identifier): Promise<boolean>;
    getColumn<T = any>(databaseName: Identifier, tableName: Identifier, name: Identifier): Promise<Column<T>>;

    // Create
    insert<T = {}>(databaseName: Identifier, tableName: Identifier, row: T): void;
    insertMultiple<T = {}>(databaseName: Identifier, tableName: Identifier, rows: T[]): void;

    // Retrieve
    select<T = {}, M = T>(
        databaseName: Identifier,
        tableName: Identifier,
        query: Query<T>,
        selector?: BaseFunction
    ): Array<M>;
    stream<T = {}, M = T>(
        databaseName: Identifier,
        tableName: Identifier,
        query: Query<T>,
        selector?: BaseFunction
    ): AsyncIterator<M>;

    // Update
    update<T = {}>(databaseName: Identifier, tableName: Identifier, values: T, query: Query<T>): Promise<void>;

    // Delete
    delete<T = {}>(databaseName: Identifier, tableName: Identifier, query: Query<T>): Promise<void>;

    // Sanitation/Utils
    escape(value: any): void;
    escapeIdentifier(identifier: Identifier): void;
}

export type DriverConstructor<T extends ConnectionOptions = ConnectionOptions> = new (options: T) => Driver;

export type DriverList = { [name: string]: DriverConstructor };
