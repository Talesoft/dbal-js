import { Column } from './columns';
import { Identifier } from './common';
import { Database } from './databases';
import { ForeignKeyUpdateRuleSet, Key, KeyType } from './keys';
import { Table } from './tables';
export declare class KeyBuilder {
    readonly tableBuilder: TableBuilder;
    readonly key: Key;
    constructor(tableBuilder: TableBuilder, name: string);
    index(columnNames: Identifier[]): this;
    unique(columnNames: Identifier[]): this;
    primary(columnNames: Identifier[]): this;
    reference(columnNames: Identifier[], referencedTableName: Identifier, referencedColumnNames: Identifier[], updateRules?: Partial<ForeignKeyUpdateRuleSet>): this;
    add(columnName: Identifier): this;
    remove(columnName: Identifier): this;
    validate(): void;
    getData(): {
        type: KeyType;
        name: string;
        columnNames: string[];
    };
}
export declare class ColumnBuilder {
    readonly tableBuilder: TableBuilder;
    readonly column: Column;
    constructor(tableBuilder: TableBuilder, name: string);
    type(name: string, typeParams?: Array<string | number>): this;
    unsigned(): this;
    signed(): this;
    nullable(): this;
    notNullable(): this;
    generated(): this;
    static(): this;
    string(length?: number, fixed?: boolean): this;
    bool(): this;
    int8(): this;
    uInt8(): this;
    int16(): this;
    uInt16(): this;
    int24(): this;
    uInt24(): this;
    int32(): this;
    uInt32(): this;
    int64(): this;
    uInt64(): this;
    enum(values: Array<string | number>, allowMultiple?: boolean): this;
    dateTime(): this;
    timeStamp(): this;
    defaultValue(value: any): this;
    comment(text: string): this;
    index(name?: string): this;
    unique(name?: string): this;
    primary(name?: string): this;
    reference(referencedTableName: string, referencedColumnNames: string[], updateRules?: Partial<ForeignKeyUpdateRuleSet>, name?: string): this;
    id(): this;
    guid(): this;
    getData(): {
        name: string;
        defaultValue: {} | null;
        generated: boolean;
        comment: string;
        type: string;
        typeParams: (string | number)[];
        nullable: boolean;
        unsigned: boolean;
    };
}
export declare class TableBuilder {
    readonly databaseBuilder: DatabaseBuilder;
    readonly table: Table;
    readonly columnBuilders: Map<string, ColumnBuilder>;
    readonly keyBuilders: Map<string, KeyBuilder>;
    constructor(databaseBuilder: DatabaseBuilder, name: string);
    column(name: Identifier, fn: (builder: ColumnBuilder) => any): this;
    id(name?: Identifier): this;
    guid(name?: Identifier): this;
    key(name: Identifier, fn: (builder: KeyBuilder) => any): this;
    index(columnNames: Identifier[], name?: string): this;
    unique(columnNames: Identifier[], name?: string): this;
    primary(columnNames: Identifier[], name?: string): this;
    reference(columnNames: Identifier[], referencedTableName: string, referencedColumnNames: string[], updateRules?: Partial<ForeignKeyUpdateRuleSet>, name?: string): void;
    getData(): {
        keys: {
            type: KeyType;
            name: string;
            columnNames: string[];
        }[];
        columns: {
            name: string;
            defaultValue: {} | null;
            generated: boolean;
            comment: string;
            type: string;
            typeParams: (string | number)[];
            nullable: boolean;
            unsigned: boolean;
        }[];
        name: string;
    };
    protected createColumnBuilder(name: Identifier): ColumnBuilder;
    protected createKeyBuilder(name: Identifier): KeyBuilder;
}
export declare class DatabaseBuilder {
    readonly schemaBuilder: SchemaBuilder;
    readonly database: Database;
    readonly tableBuilders: Map<string, TableBuilder>;
    constructor(schemaBuilder: SchemaBuilder, name: string);
    table(name: Identifier, fn: (builder: TableBuilder) => any): this;
    getData(): {
        tables: {
            keys: {
                type: KeyType;
                name: string;
                columnNames: string[];
            }[];
            columns: {
                name: string;
                defaultValue: {} | null;
                generated: boolean;
                comment: string;
                type: string;
                typeParams: (string | number)[];
                nullable: boolean;
                unsigned: boolean;
            }[];
            name: string;
        }[];
        name: string;
    };
    protected createTableBuilder(name: Identifier): TableBuilder;
}
export declare class SchemaBuilder {
    readonly databaseBuilders: Map<string, DatabaseBuilder>;
    database(name: Identifier, fn: (builder: DatabaseBuilder) => any): this;
    getData(): {
        tables: {
            keys: {
                type: KeyType;
                name: string;
                columnNames: string[];
            }[];
            columns: {
                name: string;
                defaultValue: {} | null;
                generated: boolean;
                comment: string;
                type: string;
                typeParams: (string | number)[];
                nullable: boolean;
                unsigned: boolean;
            }[];
            name: string;
        }[];
        name: string;
    }[];
    protected createDatabaseBuilder(name: Identifier): DatabaseBuilder;
}
