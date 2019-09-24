import { Column } from './columns';
import { Identifier } from './common';
import { Database } from './databases';
import { ForeignKeyUpdateRule, ForeignKeyUpdateRuleSet, Key, KeyType } from './keys';
import { Table } from './tables';

export class KeyBuilder {
    public readonly tableBuilder: TableBuilder;
    public readonly key: Key;

    constructor(tableBuilder: TableBuilder, name: string) {
        this.tableBuilder = tableBuilder;
        this.key = {
            name,
            type: KeyType.INDEX,
            columnNames: [],
        };
    }

    public index(columnNames: Identifier[]) {
        this.key.type = KeyType.INDEX;
        this.key.columnNames = columnNames;
        return this;
    }

    public unique(columnNames: Identifier[]) {
        this.key.type = KeyType.UNIQUE;
        this.key.columnNames = columnNames;
        return this;
    }

    public primary(columnNames: Identifier[]) {
        this.key.type = KeyType.PRIMARY;
        this.key.columnNames = columnNames;
        return this;
    }

    public reference(
        columnNames: Identifier[],
        referencedTableName: Identifier,
        referencedColumnNames: Identifier[],
        updateRules?: Partial<ForeignKeyUpdateRuleSet>,
    ) {
        Object.assign(this.key, {
            columnNames,
            referencedTableName,
            referencedColumnNames,
            key: KeyType.FOREIGN,
            onDelete: ForeignKeyUpdateRule.NO_ACTION,
            onUpdate: ForeignKeyUpdateRule.NO_ACTION,
            ...updateRules,
        });
        return this;
    }

    public add(columnName: Identifier) {
        this.key.columnNames.push(columnName);
        return this;
    }

    public remove(columnName: Identifier) {
        this.key.columnNames = this.key.columnNames.filter(n => n !== columnName);
        return this;
    }

    public validate() {
        if (this.key.columnNames.length < 1) {
            throw new Error(
                `Key ${this.key.name} of table ${this.tableBuilder.table.name} needs to have at least one column.`,
            );
        }
    }

    public getData() {
        return {
            ...this.key,
        };
    }
}

export class ColumnBuilder {
    public readonly tableBuilder: TableBuilder;
    public readonly column: Column;

    constructor(tableBuilder: TableBuilder, name: string) {
        this.tableBuilder = tableBuilder;
        this.column = {
            name,
            type: 'int',
            typeParams: [11],
            unsigned: false,
            nullable: false,
            generated: false,
            defaultValue: null,
            comment: '',
        };
    }

    public type(name: string, typeParams: Array<string | number> = []) {
        this.column.type = name;
        if (typeParams) {
            this.column.typeParams = typeParams;
        }
        return this;
    }

    public unsigned() {
        this.column.unsigned = true;
        return this;
    }

    public signed() {
        this.column.unsigned = false;
        return this;
    }

    public nullable() {
        this.column.nullable = true;
        return this;
    }

    public notNullable() {
        this.column.nullable = false;
        return this;
    }

    public generated() {
        this.column.generated = true;
        return this;
    }

    public static() {
        this.column.generated = false;
        return this;
    }

    public string(length?: number, fixed?: boolean) {
        return this.type(
            fixed ? 'char' : 'varchar',
            length ? [length] : undefined,
        );
    }

    public bool() {
        return this.type('tinyint', [1]).unsigned();
    }

    public int8() {
        return this.type('tinyint', [2]).signed();
    }

    public uInt8() {
        return this.type('tinyint', [4]).unsigned();
    }

    public int16() {
        return this.type('smallint', [6]).signed();
    }

    public uInt16() {
        return this.type('smallint', [5]).unsigned();
    }

    public int24() {
        return this.type('mediumint', [8]).signed();
    }

    public uInt24() {
        return this.type('mediumint', [8]).unsigned();
    }

    public int32() {
        return this.type('int', [11]).signed();
    }

    public uInt32() {
        return this.type('int', [10]).unsigned();
    }

    public int64() {
        return this.type('bigint', [20]).signed();
    }

    public uInt64() {
        return this.type('bigint', [20]).unsigned();
    }

    public enum(values: Array<string | number>, allowMultiple?: boolean) {
        return this.type(allowMultiple ? 'set' : 'enum', values);
    }

    public dateTime() {
        return this.type('datetime');
    }

    public timeStamp() {
        return this.type('timestamp');
    }

    public defaultValue(value: any) {
        this.column.defaultValue = value;
        return this;
    }

    public comment(text: string) {
        this.column.comment = text;
        return this;
    }

    public index(name?: string) {
        this.tableBuilder.index([this.column.name], name);
        return this;
    }

    public unique(name?: string) {
        this.tableBuilder.unique([this.column.name], name);
        return this;
    }

    public primary(name?: string) {
        this.tableBuilder.primary([this.column.name], name);
        return this;
    }

    public reference(
        referencedTableName: string,
        referencedColumnNames: string[],
        updateRules?: Partial<ForeignKeyUpdateRuleSet>,
        name?: string,
    ) {
        this.tableBuilder.reference([this.column.name], referencedTableName, referencedColumnNames, updateRules, name);
        return this;
    }

    public id() {
        return this.primary().generated().uInt32();
    }

    public guid() {
        return this.unique().string(36, true);
    }

    public getData() {
        return {
            ...this.column,
        };
    }
}

export class TableBuilder {
    public readonly databaseBuilder: DatabaseBuilder;
    public readonly table: Table;
    public readonly columnBuilders = new Map<string, ColumnBuilder>();
    public readonly keyBuilders = new Map<string, KeyBuilder>();

    constructor(databaseBuilder: DatabaseBuilder, name: string) {
        this.databaseBuilder = databaseBuilder;
        this.table = {
            name,
        };
    }

    public column(name: Identifier, fn: (builder: ColumnBuilder) => any) {
        if (!this.columnBuilders.has(name)) {
            this.columnBuilders.set(name, this.createColumnBuilder(name));
        }
        const builder = this.columnBuilders.get(name) as ColumnBuilder;
        fn(builder);
        return this;
    }

    // Quick Columns
    public id(name: Identifier = 'id') {
        return this.column(name, c => c.id());
    }

    public guid(name: Identifier = 'guid') {
        return this.column(name, c => c.guid());
    }

    public key(name: Identifier, fn: (builder: KeyBuilder) => any) {
        if (!this.keyBuilders.has(name)) {
            this.keyBuilders.set(name, this.createKeyBuilder(name));
        }
        const builder = this.keyBuilders.get(name) as KeyBuilder;
        fn(builder);
        return this;
    }

    // Quick Keys
    public index(columnNames: Identifier[], name?: string) {
        return this.key(name || `IX_${columnNames.join('_')}`, k => k.index(columnNames));
    }

    public unique(columnNames: Identifier[], name?: string) {
        return this.key(name || `UQ_${columnNames.join('_')}`, k => k.unique(columnNames));
    }

    public primary(columnNames: Identifier[], name?: string) {
        return this.key(name || `PK_${columnNames.join('_')}`, k => k.primary(columnNames));
    }

    public reference(
        columnNames: Identifier[],
        referencedTableName: string,
        referencedColumnNames: string[],
        updateRules?: Partial<ForeignKeyUpdateRuleSet>,
        name?: string,
    ) {
        this.key(name || `FK_${referencedTableName}_${referencedColumnNames.join('_')}`, k => k
            .reference(columnNames, referencedTableName, referencedColumnNames, updateRules),
        );
    }

    public getData() {
        return {
            ...this.table,
            keys: Array.from(this.keyBuilders.values()).map(b => b.getData()),
            columns: Array.from(this.columnBuilders.values()).map(b => b.getData()),
        };
    }

    protected createColumnBuilder(name: Identifier) {
        return new ColumnBuilder(this, name);
    }

    protected createKeyBuilder(name: Identifier) {
        return new KeyBuilder(this, name);
    }
}

export class DatabaseBuilder {
    public readonly schemaBuilder: SchemaBuilder;
    public readonly database: Database;
    public readonly tableBuilders = new Map<string, TableBuilder>();

    constructor(schemaBuilder: SchemaBuilder, name: string) {
        this.schemaBuilder = schemaBuilder;
        this.database = {
            name,
        };
    }

    public table(name: Identifier, fn: (builder: TableBuilder) => any) {
        if (!this.tableBuilders.has(name)) {
            this.tableBuilders.set(name, this.createTableBuilder(name));
        }
        const builder = this.tableBuilders.get(name) as TableBuilder;
        fn(builder);
        return this;
    }

    public getData() {
        return {
            ...this.database,
            tables: Array.from(this.tableBuilders.values()).map(b => b.getData()),
        };
    }

    protected createTableBuilder(name: Identifier) {
        return new TableBuilder(this, name);
    }
}

export class SchemaBuilder {
    public readonly databaseBuilders = new Map<string, DatabaseBuilder>();

    public database(name: Identifier, fn: (builder: DatabaseBuilder) => any) {
        if (!this.databaseBuilders.has(name)) {
            this.databaseBuilders.set(name, this.createDatabaseBuilder(name));
        }
        const builder = this.databaseBuilders.get(name) as DatabaseBuilder;
        fn(builder);
        return this;
    }

    public getData() {
        return Array.from(this.databaseBuilders.values()).map(b => b.getData());
    }

    protected createDatabaseBuilder(name: Identifier) {
        return new DatabaseBuilder(this, name);
    }
}
