"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const columns_1 = require("./columns");
const keys_1 = require("./keys");
const queries_1 = require("./queries");
class TableView {
    constructor(database, name) {
        this.changed = true;
        this.keys = {};
        this.columns = {};
        this.database = database;
        this.data = {
            name,
        };
    }
    get connection() {
        return this.database.connection;
    }
    get name() {
        return this.data.name;
    }
    load(deep) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.changed) {
                return;
            }
            yield this.hydrate(yield this.connection.driver.getTable(this.database.name, this.data.name), deep);
        });
    }
    hydrate(table, deep) {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = table;
            if (deep) {
                const keys = this.data.keys || (yield this.connection.driver
                    .getKeys(this.database.name, this.data.name));
                const columns = this.data.columns || (yield this.connection.driver
                    .getColumns(this.database.name, this.data.name));
                yield Promise.all([
                    ...keys.map((keyData) => __awaiter(this, void 0, void 0, function* () { return this.getKey(keyData.name).hydrate(keyData); })),
                    ...columns.map((columnData) => __awaiter(this, void 0, void 0, function* () { return this.getColumn(columnData.name).hydrate(columnData); })),
                ]);
            }
            this.changed = false;
        });
    }
    save(deep) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.changed) {
                if (!this.exists()) {
                    yield this.create();
                }
                else {
                    yield this.update();
                }
                return;
            }
            if (deep) {
                yield Promise.all([
                    ...Object.values(this.keys).map(k => k.save()),
                    ...Object.values(this.columns).map(c => c.save()),
                ]);
            }
        });
    }
    getKey(name) {
        if (!(name in this.keys)) {
            this.keys[name] = new keys_1.KeyView(this, name);
        }
        return this.keys[name];
    }
    getColumn(name) {
        if (!(name in this.columns)) {
            this.columns[name] = new columns_1.ColumnView(this, name);
        }
        return this.columns[name];
    }
    exists() {
        return this.connection.driver.hasTable(this.database.name, this.name);
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = Object.assign(Object.assign({}, this.data), (yield this.connection.driver.createTable(this.database.name, this.data)));
            this.changed = false;
            return this;
        });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = Object.assign(Object.assign({}, this.data), (yield this.connection.driver.updateTable(this.database.name, this.data)));
            this.changed = false;
            return this;
        });
    }
    remove() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.connection.driver.removeTable(this.database.name, this.data.name);
            this.changed = true;
            return this;
        });
    }
    insert(row) {
        return this.connection.driver.insert(this.database.name, this.name, row);
    }
    insertMultiple(rows) {
        return this.connection.driver.insertMultiple(this.database.name, this.name, rows);
    }
    query() {
        return new queries_1.QueryBuilder(this.connection, this.database.name, this.data.name);
    }
    with(params) {
        return this.query().with(params);
    }
    where(fn) {
        return this.query().where(fn);
    }
    orderBy(fn, direction = 'asc') {
        return this.query().orderBy(fn, direction);
    }
    slice(offset) {
        return this.query().slice(offset);
    }
    take(amount) {
        return this.query().take(amount);
    }
    join(tableName, type, expr) {
        return this.query().join(tableName, type, expr);
    }
    leftJoin(tableName, expr) {
        return this.join(tableName, 'left', expr);
    }
    rightJoin(tableName, expr) {
        return this.join(tableName, 'left', expr);
    }
    innerJoin(tableName, expr) {
        return this.join(tableName, 'left', expr);
    }
    select(fn) {
        return this.query().select(fn);
    }
    stream() {
        return this.query().stream();
    }
    getData(deep) {
        return Object.assign({ name: this.data.name }, (deep ? {
            keys: Object.values(this.keys).map(k => k.getData()),
            columns: Object.values(this.columns).map(c => c.getData()),
        } : undefined));
    }
    [Symbol.asyncIterator]() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stream();
        });
    }
}
exports.TableView = TableView;
