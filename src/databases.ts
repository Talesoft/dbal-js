import { Identifier } from "./common";
import { Connection } from './connections';
import { Table, TableView } from './tables';

export interface Database {
    name: Identifier;
    tables?: Table[];
}

export class DatabaseView {
    public readonly connection: Connection;

    private data: Partial<Database> & { name: string };
    private changed = true;

    private tables: { [name: string]: TableView } = {};

    constructor(connection: Connection, name: Identifier) {
        this.connection = connection;
        this.data = {
            name,
        };
    }

    public get name() {
        return this.data.name;
    }

    public async load(deep?: boolean) {
        if (!this.changed) {
            return;
        }
        await this.hydrate(await this.connection.driver.getDatabase(this.data.name), deep);
    }

    public async hydrate(database: Database, deep?: boolean) {
        this.data = database;
        if (deep) {
            const tables = this.data.tables || await this.connection.driver.getTables(this.data.name);
            await Promise.all(tables.map(tableData => this.getTable(tableData.name).hydrate(tableData, deep)));
        }
        this.changed = false;
    }

    public async save(deep?: boolean) {
        if (this.changed) {
            if (!this.exists()) {
                await this.create();
            }
        }
        if (deep) {
            await Promise.all(Object.values(this.tables).map(t => t.save(deep)));
        }
    }

    public getTable(name: Identifier) {
        if (name in this.tables) {
            return this.tables[name];
        }
        return this.tables[name] = new TableView(this, name);
    }

    public exists() {
        return this.connection.driver.hasDatabase(this.name);
    }

    public async create(deep?: boolean) {
        this.data = {
            ...this.data,
            ...(await this.connection.driver.createDatabase(this.data)),
        };
        if (deep && this.data.tables) {
            await Promise.all(this.data.tables.map(t => this.getTable(t.name).update()));
        }
        this.changed = false;
        return this;
    }

    public async update(deep?: boolean) {
        this.data = {
            ...this.data,
            ...(await this.connection.driver.updateDatabase(this.data)),
        };
        if (deep && this.data.tables) {
            await Promise.all(this.data.tables.map(t => this.getTable(t.name).update()));
        }
        this.changed = false;
        return this;
    }

    public async remove() {
        await this.connection.driver.removeDatabase(this.data.name);
        this.changed = true;
        return this;
    }

    public getData(deep?: boolean) {
        const tables = Object.values(this.tables);
        return {
            name: this.data.name,
            ...(deep ? { tables: tables.map(t => t.getData(deep)) } : undefined),
        };
    }
}
