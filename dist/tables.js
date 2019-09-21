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
const queries_1 = require("./queries");
class TableView {
    constructor(database, name) {
        this.changed = true;
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
            yield this.hydrate(yield this.connection.driver.getTable(this.database.name, this.data.name), deep);
        });
    }
    hydrate(table, deep) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.changed) {
                return;
            }
            this.data = table;
            if (deep) {
                const columns = this.data.columns || (yield this.connection.driver
                    .getColumns(this.database.name, this.data.name));
                yield Promise.all(columns.map((columnData) => __awaiter(this, void 0, void 0, function* () { return this.getColumn(columnData.name).hydrate(columnData); })));
            }
            this.changed = false;
        });
    }
    save(deep) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.changed) {
                return;
            }
            if (deep) {
                yield Promise.all(Object.values(this.columns).map(t => t.save()));
            }
        });
    }
    getColumn(name) {
        if (!(name in this.columns)) {
            this.columns[name] = new columns_1.ColumnView(this, name);
        }
        return this.columns[name];
    }
    query() {
        return new queries_1.QueryBuilder(this.connection, this.database.name, this.data.name);
    }
    where(fn) {
        return this.query().where(fn);
    }
    sort(orderList) {
        return this.query().sort(orderList);
    }
    slice(offset) {
        return this.query().slice(offset);
    }
    take(amount) {
        return this.query().take(amount);
    }
    select(fn) {
        return this.query().select(fn);
    }
    stream() {
        return this.query().stream();
    }
    getData(deep) {
        return Object.assign({ name: this.data.name }, (deep ? { columns: Object.values(this.columns).map(c => c.getData()) } : undefined));
    }
}
exports.TableView = TableView;
