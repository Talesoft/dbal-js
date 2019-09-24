"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keys_1 = require("./keys");
class KeyBuilder {
    constructor(tableBuilder, name) {
        this.tableBuilder = tableBuilder;
        this.key = {
            name,
            type: keys_1.KeyType.INDEX,
            columnNames: [],
        };
    }
    index(columnNames) {
        this.key.type = keys_1.KeyType.INDEX;
        this.key.columnNames = columnNames;
        return this;
    }
    unique(columnNames) {
        this.key.type = keys_1.KeyType.UNIQUE;
        this.key.columnNames = columnNames;
        return this;
    }
    primary(columnNames) {
        this.key.type = keys_1.KeyType.PRIMARY;
        this.key.columnNames = columnNames;
        return this;
    }
    reference(columnNames, referencedTableName, referencedColumnNames, updateRules) {
        Object.assign(this.key, Object.assign({ columnNames,
            referencedTableName,
            referencedColumnNames, key: keys_1.KeyType.FOREIGN, onDelete: keys_1.ForeignKeyUpdateRule.NO_ACTION, onUpdate: keys_1.ForeignKeyUpdateRule.NO_ACTION }, updateRules));
        return this;
    }
    add(columnName) {
        this.key.columnNames.push(columnName);
        return this;
    }
    remove(columnName) {
        this.key.columnNames = this.key.columnNames.filter(n => n !== columnName);
        return this;
    }
    validate() {
        if (this.key.columnNames.length < 1) {
            throw new Error(`Key ${this.key.name} of table ${this.tableBuilder.table.name} needs to have at least one column.`);
        }
    }
    getData() {
        return Object.assign({}, this.key);
    }
}
exports.KeyBuilder = KeyBuilder;
class ColumnBuilder {
    constructor(tableBuilder, name) {
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
    type(name, typeParams = []) {
        this.column.type = name;
        if (typeParams) {
            this.column.typeParams = typeParams;
        }
        return this;
    }
    unsigned() {
        this.column.unsigned = true;
        return this;
    }
    signed() {
        this.column.unsigned = false;
        return this;
    }
    nullable() {
        this.column.nullable = true;
        return this;
    }
    notNullable() {
        this.column.nullable = false;
        return this;
    }
    generated() {
        this.column.generated = true;
        return this;
    }
    static() {
        this.column.generated = false;
        return this;
    }
    string(length, fixed) {
        return this.type(fixed ? 'char' : 'varchar', length ? [length] : undefined);
    }
    bool() {
        return this.type('tinyint', [1]).unsigned();
    }
    int8() {
        return this.type('tinyint', [2]).signed();
    }
    uInt8() {
        return this.type('tinyint', [4]).unsigned();
    }
    int16() {
        return this.type('smallint', [6]).signed();
    }
    uInt16() {
        return this.type('smallint', [5]).unsigned();
    }
    int24() {
        return this.type('mediumint', [8]).signed();
    }
    uInt24() {
        return this.type('mediumint', [8]).unsigned();
    }
    int32() {
        return this.type('int', [11]).signed();
    }
    uInt32() {
        return this.type('int', [10]).unsigned();
    }
    int64() {
        return this.type('bigint', [20]).signed();
    }
    uInt64() {
        return this.type('bigint', [20]).unsigned();
    }
    enum(values, allowMultiple) {
        return this.type(allowMultiple ? 'set' : 'enum', values);
    }
    dateTime() {
        return this.type('datetime');
    }
    timeStamp() {
        return this.type('timestamp');
    }
    defaultValue(value) {
        this.column.defaultValue = value;
        return this;
    }
    comment(text) {
        this.column.comment = text;
        return this;
    }
    index(name) {
        this.tableBuilder.index([this.column.name], name);
        return this;
    }
    unique(name) {
        this.tableBuilder.unique([this.column.name], name);
        return this;
    }
    primary(name) {
        this.tableBuilder.primary([this.column.name], name);
        return this;
    }
    reference(referencedTableName, referencedColumnNames, updateRules, name) {
        this.tableBuilder.reference([this.column.name], referencedTableName, referencedColumnNames, updateRules, name);
        return this;
    }
    id() {
        return this.primary().generated().uInt32();
    }
    guid() {
        return this.unique().string(36, true);
    }
    getData() {
        return Object.assign({}, this.column);
    }
}
exports.ColumnBuilder = ColumnBuilder;
class TableBuilder {
    constructor(databaseBuilder, name) {
        this.columnBuilders = new Map();
        this.keyBuilders = new Map();
        this.databaseBuilder = databaseBuilder;
        this.table = {
            name,
        };
    }
    column(name, fn) {
        if (!this.columnBuilders.has(name)) {
            this.columnBuilders.set(name, this.createColumnBuilder(name));
        }
        const builder = this.columnBuilders.get(name);
        fn(builder);
        return this;
    }
    // Quick Columns
    id(name = 'id') {
        return this.column(name, c => c.id());
    }
    guid(name = 'guid') {
        return this.column(name, c => c.guid());
    }
    key(name, fn) {
        if (!this.keyBuilders.has(name)) {
            this.keyBuilders.set(name, this.createKeyBuilder(name));
        }
        const builder = this.keyBuilders.get(name);
        fn(builder);
        return this;
    }
    // Quick Keys
    index(columnNames, name) {
        return this.key(name || `IX_${columnNames.join('_')}`, k => k.index(columnNames));
    }
    unique(columnNames, name) {
        return this.key(name || `UQ_${columnNames.join('_')}`, k => k.unique(columnNames));
    }
    primary(columnNames, name) {
        return this.key(name || `PK_${columnNames.join('_')}`, k => k.primary(columnNames));
    }
    reference(columnNames, referencedTableName, referencedColumnNames, updateRules, name) {
        this.key(name || `FK_${referencedTableName}_${referencedColumnNames.join('_')}`, k => k
            .reference(columnNames, referencedTableName, referencedColumnNames, updateRules));
    }
    getData() {
        return Object.assign(Object.assign({}, this.table), { keys: Array.from(this.keyBuilders.values()).map(b => b.getData()), columns: Array.from(this.columnBuilders.values()).map(b => b.getData()) });
    }
    createColumnBuilder(name) {
        return new ColumnBuilder(this, name);
    }
    createKeyBuilder(name) {
        return new KeyBuilder(this, name);
    }
}
exports.TableBuilder = TableBuilder;
class DatabaseBuilder {
    constructor(schemaBuilder, name) {
        this.tableBuilders = new Map();
        this.schemaBuilder = schemaBuilder;
        this.database = {
            name,
        };
    }
    table(name, fn) {
        if (!this.tableBuilders.has(name)) {
            this.tableBuilders.set(name, this.createTableBuilder(name));
        }
        const builder = this.tableBuilders.get(name);
        fn(builder);
        return this;
    }
    getData() {
        return Object.assign(Object.assign({}, this.database), { tables: Array.from(this.tableBuilders.values()).map(b => b.getData()) });
    }
    createTableBuilder(name) {
        return new TableBuilder(this, name);
    }
}
exports.DatabaseBuilder = DatabaseBuilder;
class SchemaBuilder {
    constructor() {
        this.databaseBuilders = new Map();
    }
    database(name, fn) {
        if (!this.databaseBuilders.has(name)) {
            this.databaseBuilders.set(name, this.createDatabaseBuilder(name));
        }
        const builder = this.databaseBuilders.get(name);
        fn(builder);
        return this;
    }
    getData() {
        return Array.from(this.databaseBuilders.values()).map(b => b.getData());
    }
    createDatabaseBuilder(name) {
        return new DatabaseBuilder(this, name);
    }
}
exports.SchemaBuilder = SchemaBuilder;
