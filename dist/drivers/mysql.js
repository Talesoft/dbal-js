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
const mysql_1 = require("mysql");
class MySqlDriver {
    constructor(options) {
        this.options = options;
    }
    connect() {
        if (this.connection) {
            throw new Error('Already connected.');
        }
        const { host = 'localhost', port = 3306, user = 'root', password = '', databaseName } = this.options;
        this.connection = mysql_1.createConnection({
            host,
            port,
            user,
            password,
            database: databaseName,
        });
        return new Promise((resolve, reject) => {
            if (!this.connection) {
                reject(new Error('Connection is gone.'));
                return;
            }
            this.connection.connect(err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.connection) {
                    reject(new Error('Connection is gone.'));
                    return;
                }
                this.connection.end(err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    this.connection = undefined;
                    resolve();
                });
            });
        });
    }
    query(sql, values = []) {
        return new Promise((resolve, reject) => {
            if (!this.connection) {
                reject(new Error('Connection is gone.'));
                return;
            }
            this.connection.query(sql, values, (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(results);
            });
        });
    }
    hasDatabase(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.query('SHOW DATABASES LIKE ?', [name])).length > 0;
        });
    }
    getDatabase(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return { name };
        });
    }
    getDatabases() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(yield this.query('SELECT * FROM `test`.`users`'));
            const results = yield this.query('SHOW DATABASES');
            return results.map((result) => ({
                name: result.Database,
            }));
        });
    }
    hasTable(databaseName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.query('SHOW TABLES FROM ?? LIKE ?', [databaseName, name])).length > 0;
        });
    }
    getTable(_, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return { name };
        });
    }
    getTables(databaseName) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.query('SHOW TABLES FROM ??', [databaseName]);
            return results.map((result) => ({
                name: result[`Tables_in_${databaseName}`],
            }));
        });
    }
    hasColumn(databaseName, tableName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.query('SHOW COLUMNS FROM ??.?? LIKE ?', [databaseName, tableName, name])).length > 0;
        });
    }
    // @ts-ignore
    getColumn(databaseName, tableName, name) {
        // @ts-ignore
        return undefined;
    }
    getColumns(databaseName, tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.query('SHOW COLUMNS FROM ??.??', [databaseName, tableName]);
            return results.map((result) => ({
                name: result.Field,
            }));
        });
    }
    // @ts-ignore
    insert(databaseName, tableName, row) {
    }
    // @ts-ignore
    insertMultiple(databaseName, tableName, rows) {
    }
    // @ts-ignore
    select(databaseName, tableName, query) {
        // @ts-ignore
        return undefined;
    }
    // @ts-ignore
    stream(databaseName, tableName, query) {
        // @ts-ignore
        return undefined;
    }
    // @ts-ignore
    update(databaseName, tableName, values, query) {
        // @ts-ignore
        return undefined;
    }
    // @ts-ignore
    delete(databaseName, tableName, query) {
        // @ts-ignore
        return undefined;
    }
    escape(value) {
        if (!this.connection) {
            throw new Error('Connection is gone.');
        }
        return this.connection.escape(value);
    }
    escapeIdentifier(identifier) {
        if (!this.connection) {
            throw new Error('Connection is gone.');
        }
        return this.connection.escapeId(identifier);
    }
}
exports.MySqlDriver = MySqlDriver;
