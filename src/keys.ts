import { Identifier } from './common';
import { TableView } from './tables';

export enum KeyType {
    INDEX,
    PRIMARY,
    UNIQUE,
    FOREIGN,
}

export enum ForeignKeyUpdateRule {
    NO_ACTION,
    RESTRICT,
    CASCADE,
    SET_NULL,
}

export interface Key {
    type: KeyType;
    name: string;
    columnNames: Identifier[];
}

export interface PrimaryKey extends Key {
    type: KeyType.PRIMARY;
}

export interface Index extends Key {
    type: KeyType.INDEX;
}

export interface UniqueKey extends Key {
    type: KeyType.UNIQUE;
}

export interface ForeignKeyUpdateRuleSet {
    onDelete: ForeignKeyUpdateRule;
    onUpdate: ForeignKeyUpdateRule;
}

export interface ForeignKey extends Key, ForeignKeyUpdateRuleSet {
    type: KeyType.FOREIGN;
    referencedTableName: Identifier;
    referencedColumnNames: Identifier[];
}

export class KeyView {
    public readonly table: TableView;

    private data: Partial<Key> & { name: string };
    private changed = true;

    constructor(table: TableView, name: Identifier) {
        this.table = table;
        this.data = {
            name,
        };
    }

    public get connection() {
        return this.database.connection;
    }

    public get database() {
        return this.table.database;
    }

    public get name() {
        return this.data.name;
    }

    public async load() {
        await this.hydrate(await this.connection.driver.getKey(this.database.name, this.table.name, this.data.name));
    }

    public async hydrate(key: Key) {
        if (!this.changed) {
            return;
        }
        this.data = key;
        this.changed = false;
    }

    public async save() {
        if (!this.changed) {
            return;
        }
        // TODO: Save column info
    }

    public getData() {
        return { ...this.data };
    }
}
