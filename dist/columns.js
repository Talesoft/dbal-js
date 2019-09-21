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
class ColumnView {
    constructor(table, name) {
        this.changed = true;
        this.table = table;
        this.data = {
            name,
        };
    }
    get connection() {
        return this.database.connection;
    }
    get database() {
        return this.table.database;
    }
    get name() {
        return this.data.name;
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.hydrate(yield this.connection.driver.getColumn(this.database.name, this.table.name, this.data.name));
        });
    }
    hydrate(column) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.changed) {
                return;
            }
            this.data = column;
            this.changed = false;
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.changed) {
                return;
            }
            // TODO: Save column info
        });
    }
    getData() {
        return Object.assign({}, this.data);
    }
}
exports.ColumnView = ColumnView;
