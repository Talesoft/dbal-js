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
const tables_1 = require("./tables");
class DatabaseView {
    constructor(connection, name) {
        this.changed = true;
        this.tables = {};
        this.connection = connection;
        this.data = {
            name,
        };
    }
    get name() {
        return this.data.name;
    }
    load(deep) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.changed) {
                return;
            }
            yield this.hydrate(yield this.connection.driver.getDatabase(this.data.name), deep);
        });
    }
    hydrate(database, deep) {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = database;
            if (deep) {
                const tables = this.data.tables || (yield this.connection.driver.getTables(this.data.name));
                yield Promise.all(tables.map(tableData => this.getTable(tableData.name).hydrate(tableData, deep)));
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
            }
            if (deep) {
                yield Promise.all(Object.values(this.tables).map(t => t.save(deep)));
            }
        });
    }
    getTable(name) {
        if (name in this.tables) {
            return this.tables[name];
        }
        return this.tables[name] = new tables_1.TableView(this, name);
    }
    exists() {
        return this.connection.driver.hasDatabase(this.name);
    }
    create(deep) {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = Object.assign(Object.assign({}, this.data), (yield this.connection.driver.createDatabase(this.data)));
            if (deep && this.data.tables) {
                yield Promise.all(this.data.tables.map(t => this.getTable(t.name).update()));
            }
            this.changed = false;
            return this;
        });
    }
    update(deep) {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = Object.assign(Object.assign({}, this.data), (yield this.connection.driver.updateDatabase(this.data)));
            if (deep && this.data.tables) {
                yield Promise.all(this.data.tables.map(t => this.getTable(t.name).update()));
            }
            this.changed = false;
            return this;
        });
    }
    remove() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.connection.driver.removeDatabase(this.data.name);
            this.changed = true;
            return this;
        });
    }
    getData(deep) {
        const tables = Object.values(this.tables);
        return Object.assign({ name: this.data.name }, (deep ? { tables: tables.map(t => t.getData(deep)) } : undefined));
    }
}
exports.DatabaseView = DatabaseView;
