import { Column, ColumnView } from './columns';
import { Identifier } from "./common";
import { DatabaseView } from './databases';
import { ExpressionFunction, OrderList, QueryBuilder } from './queries';

export interface Table {
    name: Identifier;
    columns?: Column[];
}

export class TableView<T = {}> {
    public readonly database: DatabaseView;

    private data: Partial<Table> & { name: string };
    private changed = true;

    private columns: { [name: string]: ColumnView } = {};

    constructor(database: DatabaseView, name: Identifier) {
        this.database = database;
        this.data = {
            name,
        };
    }

    public get connection() {
        return this.database.connection;
    }

    public get name() {
        return this.data.name;
    }

    public async load(deep?: boolean) {
        await this.hydrate(await this.connection.driver.getTable(this.database.name, this.data.name), deep);
    }

    public async hydrate(table: Table, deep?: boolean) {
        if (!this.changed) {
            return;
        }
        this.data = table;
        if (deep) {
            const columns = this.data.columns || await this.connection.driver
                .getColumns(this.database.name, this.data.name);
            await Promise.all(columns.map(async columnData => this.getColumn(columnData.name).hydrate(columnData)));
        }
        this.changed = false;
    }

    public async save(deep?: boolean) {
        if (!this.changed) {
            return;
        }
        if (deep) {
            await Promise.all(Object.values(this.columns).map(t => t.save()));
        }
    }

    public getColumn<C>(name: Identifier) {
        if (!(name in this.columns)) {
            this.columns[name] = new ColumnView<C>(this, name)
        }
        return this.columns[name];
    }

    public query() {
        return new QueryBuilder<T>(this.connection, this.database.name, this.data.name);
    }

    public where(fn: ExpressionFunction) {
        return this.query().where(fn);
    }

    public sort(orderList: OrderList<T>) {
        return this.query().sort(orderList);
    }

    public slice(offset: number) {
        return this.query().slice(offset);
    }

    public take(amount: number) {
        return this.query().take(amount);
    }

    public select<M = T>(fn?: ExpressionFunction<T>) {
        return this.query().select<M>(fn);
    }

    public stream() {
        return this.query().stream();
    }

    public getData(deep?: boolean) {
        return {
            name: this.data.name,
            ...(deep ? { columns: Object.values(this.columns).map(c => c.getData()) } : undefined),
        };
    }
}
