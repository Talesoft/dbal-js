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
var KeyType;
(function (KeyType) {
    KeyType[KeyType["INDEX"] = 0] = "INDEX";
    KeyType[KeyType["PRIMARY"] = 1] = "PRIMARY";
    KeyType[KeyType["UNIQUE"] = 2] = "UNIQUE";
    KeyType[KeyType["FOREIGN"] = 3] = "FOREIGN";
})(KeyType = exports.KeyType || (exports.KeyType = {}));
var ForeignKeyUpdateRule;
(function (ForeignKeyUpdateRule) {
    ForeignKeyUpdateRule[ForeignKeyUpdateRule["NO_ACTION"] = 0] = "NO_ACTION";
    ForeignKeyUpdateRule[ForeignKeyUpdateRule["RESTRICT"] = 1] = "RESTRICT";
    ForeignKeyUpdateRule[ForeignKeyUpdateRule["CASCADE"] = 2] = "CASCADE";
    ForeignKeyUpdateRule[ForeignKeyUpdateRule["SET_NULL"] = 3] = "SET_NULL";
})(ForeignKeyUpdateRule = exports.ForeignKeyUpdateRule || (exports.ForeignKeyUpdateRule = {}));
class KeyView {
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
            yield this.hydrate(yield this.connection.driver.getKey(this.database.name, this.table.name, this.data.name));
        });
    }
    hydrate(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.changed) {
                return;
            }
            this.data = key;
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
exports.KeyView = KeyView;
