import { Column, ColumnView } from './columns';
import { Identifier } from './common';
import { DatabaseView } from './databases';
import { Key, KeyView } from './keys';
import {
    ExpressionFunction,
    JoinType,
    OrderDirection,
    Queryable,
    QueryBuilder,
    QueryParams,
} from './queries';

export interface Table {
    name: Identifier;
    keys?: Key[];
    columns?: Column[];
}

export class TableView<T = {}> implements Queryable {
    public readonly database: DatabaseView;

    private data: Partial<Table> & { name: string };
    private changed = true;

    private keys: { [name: string]: KeyView } = {};
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
        if (!this.changed) {
            return;
        }
        await this.hydrate(await this.connection.driver.getTable(this.database.name, this.data.name), deep);
    }

    public async hydrate(table: Table, deep?: boolean) {
        this.data = table;
        if (deep) {
            const keys = this.data.keys || await this.connection.driver
                .getKeys(this.database.name, this.data.name);
            const columns = this.data.columns || await this.connection.driver
                .getColumns(this.database.name, this.data.name);
            await Promise.all([
                ...keys.map(async keyData => this.getKey(keyData.name).hydrate(keyData)),
                ...columns.map(async columnData => this.getColumn(columnData.name).hydrate(columnData)),
            ]);
        }
        this.changed = false;
    }

    public async save(deep?: boolean) {
        if (this.changed) {
            if (!this.exists()) {
                await this.create();
            } else {
                await this.update();
            }
            return;
        }
        if (deep) {
            await Promise.all([
                ...Object.values(this.keys).map(k => k.save()),
                ...Object.values(this.columns).map(c => c.save()),
            ]);
        }
    }

    public getKey(name: Identifier) {
        if (!(name in this.keys)) {
            this.keys[name] = new KeyView(this, name);
        }
        return this.keys[name];
    }

    public getColumn<C>(name: Identifier) {
        if (!(name in this.columns)) {
            this.columns[name] = new ColumnView<C>(this, name);
        }
        return this.columns[name];
    }

    public exists() {
        return this.connection.driver.hasTable(this.database.name, this.name);
    }

    public async create() {
        this.data = {
            ...this.data,
            ...(await this.connection.driver.createTable(this.database.name, this.data)),
        };
        this.changed = false;
        return this;
    }

    public async update() {
        this.data = {
            ...this.data,
            ...(await this.connection.driver.updateTable(this.database.name, this.data)),
        };
        this.changed = false;
        return this;
    }

    public async remove() {
        await this.connection.driver.removeTable(this.database.name, this.data.name);
        this.changed = true;
        return this;
    }

    public insert(row: T) {
        return this.connection.driver.insert(this.database.name, this.name, row);
    }

    public insertMultiple(rows: T[]) {
        return this.connection.driver.insertMultiple(this.database.name, this.name, rows);
    }

    public query() {
        return new QueryBuilder<T>(this.connection, this.database.name, this.data.name);
    }

    public with(params: QueryParams) {
        return this.query().with(params);
    }

    public where(fn: ExpressionFunction<T>) {
        return this.query().where(fn);
    }

    public orderBy(fn: ExpressionFunction<T>, direction: OrderDirection = 'asc') {
        return this.query().orderBy(fn, direction);
    }

    public slice(offset: number) {
        return this.query().slice(offset);
    }

    public take(amount: number) {
        return this.query().take(amount);
    }

    public join(
        tableName: Identifier,
        type: JoinType,
        expr: ExpressionFunction<T>,
    ) {
        return this.query().join(tableName, type, expr);
    }

    public leftJoin(tableName: Identifier, expr: ExpressionFunction<T>) {
        return this.join(tableName, 'left', expr);
    }

    public rightJoin(tableName: Identifier, expr: ExpressionFunction<T>) {
        return this.join(tableName, 'left', expr);
    }

    public innerJoin(tableName: Identifier, expr: ExpressionFunction<T>) {
        return this.join(tableName, 'left', expr);
    }

    public select<M = T>(fn?: ExpressionFunction<T>) {
        return this.query().select<M>(fn);
    }

    public stream<M = T>() {
        return this.query().stream<M>();
    }

    public getData(deep?: boolean) {
        return {
            name: this.data.name,
            ...(deep ? {
                keys: Object.values(this.keys).map(k => k.getData()),
                columns: Object.values(this.columns).map(c => c.getData()),
            } : undefined),
        };
    }

    public async [Symbol.asyncIterator]() {
        return this.stream();
    }
}
