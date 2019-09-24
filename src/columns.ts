import { Identifier } from './common';
import { TableView } from './tables';
import { TypeInfo } from './types';

export interface Column<T = {}> extends TypeInfo {
    name: Identifier;
    defaultValue: T | null;
    generated: boolean;
    comment: string;
}

export class ColumnView<T = {}> {
    public readonly table: TableView;

    private data: Partial<Column<T>> & { name: string };
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
        await this.hydrate(await this.connection.driver.getColumn(this.database.name, this.table.name, this.data.name));
    }

    public async hydrate(column: Column<T>) {
        if (!this.changed) {
            return;
        }
        this.data = column;
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
