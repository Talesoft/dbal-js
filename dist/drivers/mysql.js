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
const keys_1 = require("../keys");
const sql_1 = require("../sql");
const types_1 = require("../types");
class MySqlDriver {
    constructor(options) {
        this.inTransaction = false;
        this.fkUpdateRuleMap = {
            NO_ACTION: keys_1.ForeignKeyUpdateRule.NO_ACTION,
            RESTRICT: keys_1.ForeignKeyUpdateRule.RESTRICT,
            CASCADE: keys_1.ForeignKeyUpdateRule.CASCADE,
            SET_NULL: keys_1.ForeignKeyUpdateRule.SET_NULL,
        };
        this.options = options;
    }
    disconnect() {
        return new Promise((resolve, reject) => {
            if (!this.connection) {
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
    }
    hasDatabase(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            return (yield this.query(`SHOW DATABASES LIKE ${sqlBuilder.escapeIdentifier(name)}`))[0].length > 0;
        });
    }
    getDatabase(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasDatabase(name)) {
                throw new Error(`Database ${name} doesn\'t exist`);
            }
            return { name };
        });
    }
    getDatabases() {
        return __awaiter(this, void 0, void 0, function* () {
            const [results] = yield this.query('SHOW DATABASES');
            return results.map((result) => ({
                name: result.Database,
            }));
        });
    }
    createDatabase(database) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            yield this.query(`CREATE DATABASE ${sqlBuilder.escapeIdentifier(database.name)}`);
            return Object.assign({}, database);
        });
    }
    updateDatabase(database) {
        return __awaiter(this, void 0, void 0, function* () {
            return Object.assign({}, database);
        });
    }
    removeDatabase(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            yield this.query(`DROP DATABASE ${sqlBuilder.escapeIdentifier(name)}`);
        });
    }
    hasTable(databaseName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            return (yield this.query(`SHOW TABLES FROM ${sqlBuilder.escapeIdentifier(databaseName)} LIKE ${sqlBuilder.escape(name)}`))[0].length > 0;
        });
    }
    getTable(databaseName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasTable(databaseName, name)) {
                throw new Error(`Table ${name} doesn\'t exist`);
            }
            return { name };
        });
    }
    getTables(databaseName) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            const [results] = yield this.query(`SHOW TABLES FROM ${sqlBuilder.escapeIdentifier(databaseName)}`);
            return results.map((result) => ({
                name: result[`Tables_in_${databaseName}`],
            }));
        });
    }
    createTable(databaseName, table) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            if (!table.columns) {
                throw new Error('Can\'t create a table that has no columns');
            }
            const fqtn = sqlBuilder.escapeIdentifier(databaseName, table.name);
            yield this.query(`CREATE TABLE ${fqtn} (
            ${sqlBuilder.buildListSql(table.columns, c => sqlBuilder.buildColumnSql(c))}
        ) ENGINE=InnoDB COLLATE "utf8mb_unicode_ci"`); // TODO: Make this configurable via driver-specific options
            // TODO: Append data to table that was generated (Nothing we'd need there yet, but maybe the engine
            //       collation etc. could be useful
            return Object.assign({}, table);
        });
    }
    updateTable(databaseName, table) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!table.columns || table.columns.length < 1) {
                throw new Error('Cannot update table with empty columns. Use removeTable instead');
            }
            if (!table.keys || table.keys.length < 1) {
                throw new Error('Cannot update table with empty keys. Use removeTable instead');
            }
            const sqlBuilder = yield this.getSqlBuilder();
            const [currentColumns, currentKeys] = yield Promise.all([
                yield this.getColumns(databaseName, table.name),
                yield this.getKeys(databaseName, table.name),
            ]);
            const currentColNames = currentColumns.map(c => c.name);
            const currentKeyNames = currentKeys.map(k => k.name);
            const newCols = table.columns.filter(c => !currentColNames.includes(c.name));
            const newKeys = table.keys.filter(k => !currentKeyNames.includes(k.name));
            const colChanges = [];
            const keyRemovals = [];
            const keyAdditions = [];
            const fqtn = sqlBuilder.escapeIdentifier(databaseName, table.name);
            // Column Updates
            // TODO: Check for columns where only the name might've changed (Same order + same types)
            for (let i = 0; i < currentColumns.length; i += 1) {
                const currentCol = currentColumns[i];
                const updatedCol = table.columns.find(c => c.name === currentCol.name);
                if (!updatedCol) {
                    // Col is not in new columns anymore, we want to delete it
                    colChanges.push(`ALTER TABLE ${fqtn} DROP COLUMN ${sqlBuilder.escapeIdentifier(currentCol.name)}`);
                    continue;
                }
                const currentSql = sqlBuilder.buildColumnSql(currentCol);
                const updatedSql = sqlBuilder.buildColumnSql(updatedCol);
                if (currentSql !== updatedSql) {
                    colChanges.push(`ALTER TABLE ${fqtn} CHANGE COLUMN ${updatedSql}`);
                }
            }
            for (let i = 0; i < newCols.length; i += 1) {
                const newCol = newCols[i];
                const newSql = sqlBuilder.buildColumnSql(newCol);
                colChanges.push(`ALTER TABLE ${fqtn} ADD COLUMN ${newSql}`);
            }
            // Key Updates
            for (let i = 0; i < currentKeys.length; i += 1) {
                const currentKey = currentKeys[i];
                const updatedKey = table.keys.find(k => k.name === currentKey.name);
                if (!updatedKey) {
                    // Key is not in new keys anymore, we want to delete it
                    keyRemovals.push(`ALTER TABLE ${fqtn} DROP ${sqlBuilder.buildKeyIdentifierSql(currentKey)}`);
                    continue;
                }
                const currentSql = sqlBuilder.buildKeySql(currentKey);
                const updatedSql = sqlBuilder.buildKeySql(updatedKey);
                if (currentSql !== updatedSql) {
                    keyRemovals.push(`ALTER TABLE ${fqtn} DROP ${sqlBuilder.buildKeyIdentifierSql(currentKey)}`);
                    keyAdditions.push(`ALTER TABLE ${fqtn} ADD ${updatedSql}`);
                }
            }
            for (let i = 0; i < newKeys.length; i += 1) {
                const newKey = newKeys[i];
                const newSql = sqlBuilder.buildKeySql(newKey);
                keyAdditions.push(`ALTER TABLE ${fqtn} ADD ${newSql}`);
            }
            yield this.transact(() => __awaiter(this, void 0, void 0, function* () {
                yield Promise.all([
                    ...keyRemovals,
                    ...colChanges,
                    ...keyAdditions,
                ].map(change => this.query(change)));
            }));
            return Object.assign({}, table);
        });
    }
    removeTable(databaseName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            yield this.query(`DROP TABLE ${sqlBuilder.escapeIdentifier(databaseName, name)}`);
        });
    }
    getKey(databaseName, tableName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const keys = yield this.loadKeys(databaseName, tableName, name);
            if (keys.length < 1) {
                throw new Error(`Key ${name} not found`);
            }
            return keys[0];
        });
    }
    hasKey(databaseName, tableName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.query('SHOW INDEXES FROM ??.?? LIKE ?', [databaseName, tableName, name]))[0].length > 0;
        });
    }
    getKeys(databaseName, tableName) {
        return this.loadKeys(databaseName, tableName);
    }
    loadKeys(databaseName, tableName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            const [results] = yield this.query(`SHOW INDEXES FROM ${sqlBuilder.escapeIdentifier(databaseName, tableName)}${name ? ` WHERE \`Key_name\` = ${sqlBuilder.escape(name)}` : ''}`);
            const [fkResults] = yield this.query(`
            SELECT
                \`k\`.\`CONSTRAINT_NAME\`,
                \`k\`.\`COLUMN_NAME\`,
                \`k\`.\`REFERENCED_TABLE_NAME\`,
                \`k\`.\`REFERENCED_COLUMN_NAME\`,
                \`i\`.\`DELETE_RULE\`,
                \`i\`.\`UPDATE_RULE\`
            FROM \`information_schema\`.\`KEY_COLUMN_USAGE\` AS \`k\`
            LEFT JOIN \`information_schema\`.\`REFERENTIAL_CONSTRAINTS\` AS \`i\`
                ON \`k\`.\`CONSTRAINT_NAME\` = \`i\`.\`CONSTRAINT_NAME\`
            WHERE
                \`k\`.\`CONSTRAINT_SCHEMA\` = ${sqlBuilder.escape(databaseName)}
                AND
                \`k\`.\`TABLE_NAME\` = ${sqlBuilder.escape(tableName)}
                AND
                \`k\`.\`REFERENCED_TABLE_NAME\` IS NOT NULL
                ${name ? ` AND \`k\`.\`CONSTRAINT_NAME\` = ${sqlBuilder.escape(name)}` : ''}
        `);
            return Object.values(results.reduce((resultKeys, result) => {
                if (result.Key_name in resultKeys) {
                    // This is a multi-column key
                    resultKeys[result.Key_name].columnNames.push(result.Column_name);
                    return resultKeys;
                }
                resultKeys[result.Key_name] = {
                    type: keys_1.KeyType.INDEX,
                    name: result.Key_name,
                    columnNames: [result.Column_name],
                };
                if (result.Key_name === 'PRIMARY') {
                    resultKeys[result.Key_name].type = keys_1.KeyType.PRIMARY;
                    return resultKeys;
                }
                // We search for this key in the INFORMATION_SCHEMA database to check if this is a foreign key
                const fks = fkResults.filter((r) => r.CONSTRAINT_NAME === result.Key_name);
                if (fks.length > 0) {
                    const [firstFk] = fks;
                    // This is a foreign key
                    resultKeys[result.Key_name].type = keys_1.KeyType.FOREIGN;
                    resultKeys[result.Key_name].referencedTableName = firstFk.REFERENCED_TABLE_NAME;
                    resultKeys[result.Key_name].referencedColumnNames = fks.map((fk) => fk.REFERENCED_COLUMN_NAME);
                    resultKeys[result.Key_name].onDelete = this.fkUpdateRuleMap[firstFk.DELETE_RULE];
                    resultKeys[result.Key_name].onUpdate = this.fkUpdateRuleMap[firstFk.UPDATE_RULE];
                    return resultKeys;
                }
                if (result.Non_unique === 0) {
                    // This is a unique index
                    resultKeys[result.Key_name].type = keys_1.KeyType.UNIQUE;
                    return resultKeys;
                }
                // TODO: Support more indexes, like FULLTEXT, SPATIAL?
                return resultKeys;
            }, {}));
        });
    }
    hasColumn(databaseName, tableName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.query('SHOW COLUMNS FROM ??.?? LIKE ?', [databaseName, tableName, name]))[0].length > 0;
        });
    }
    // @ts-ignore
    getColumn(databaseName, tableName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const [results] = yield this.query('SHOW COLUMNS FROM ??.?? LIKE ?', [databaseName, tableName, name]);
            if (results.length < 1) {
                throw new Error(`Column ${name} doesn\'t exist`);
            }
            const [result] = results;
            const extra = (result.Extra || '').split(' ').map(e => e.toUpperCase());
            return Object.assign(Object.assign({}, types_1.parseTypeInfoString(result.Type)), { name: result.Field, nullable: result.Null !== 'NO', defaultValue: result.Default, generated: extra.includes('AUTO_INCREMENT'), comment: '' });
        });
    }
    getColumns(databaseName, tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const [results] = yield this.query('SHOW COLUMNS FROM ??.??', [databaseName, tableName]);
            return results.map((result) => {
                const extra = (result.Extra || '').split(' ').map(e => e.toUpperCase());
                return Object.assign(Object.assign({}, types_1.parseTypeInfoString(result.Type)), { name: result.Field, nullable: result.Null !== 'NO', defaultValue: result.Default, generated: extra.includes('AUTO_INCREMENT'), comment: '' });
            });
        });
    }
    insert(databaseName, tableName, row) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            const [results] = yield this.query(sqlBuilder.buildInsertIntoSql(databaseName, tableName, row));
            return results.insertId;
        });
    }
    insertMultiple(databaseName, tableName, rows) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            const [results] = yield this.query(sqlBuilder.buildInsertIntoMultipleSql(databaseName, tableName, rows));
            const insertedIds = [];
            // We can just do this since MySQL guarantees that IDs are generated in order in bulk inserts
            for (let i = 0; i < results.affectedRows; i += 1) {
                insertedIds.push(results.insertId + i);
            }
            return insertedIds;
        });
    }
    select(databaseName, tableName, query, selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlBuilder = yield this.getSqlBuilder();
            const [results] = yield this.query(sqlBuilder.buildSelectSql(databaseName, tableName, query, selector));
            return results.map((result) => (Object.assign({}, result)));
        });
    }
    // @ts-ignore
    stream(
    // @ts-ignore
    databaseName, 
    // @ts-ignore
    tableName, 
    // @ts-ignore
    query, 
    // @ts-ignore
    selector) {
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
    transact(transactor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.inTransaction) {
                throw new Error('You can\'t nest transactions.');
            }
            this.inTransaction = true;
            const connection = yield this.getConnection();
            yield new Promise((resolve, reject) => {
                connection.beginTransaction(err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
            yield transactor(this);
            yield new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) {
                        connection.rollback(() => {
                            reject(err);
                        });
                    }
                    resolve();
                });
            });
            this.inTransaction = false;
        });
    }
    getConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection) {
                return this.connection;
            }
            const { host = 'localhost', port = 3306, user = 'root', password = '', databaseName, params = {}, } = this.options;
            const { encoding = 'utf8mb4' } = params;
            const connection = mysql_1.createConnection({
                host,
                port,
                user,
                password,
                database: databaseName,
            });
            yield new Promise((resolve, reject) => {
                connection.connect(err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
            this.sqlBuilder = new sql_1.SqlBuilder({
                escape: val => connection.escape(val, false),
                escapeIdentifier: val => connection.escapeId(val, true),
            });
            this.connection = connection;
            yield this.query(`SET NAMES ${this.sqlBuilder.escape(encoding)}`);
            return connection;
        });
    }
    getSqlBuilder() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.sqlBuilder) {
                return this.sqlBuilder;
            }
            yield this.getConnection();
            if (!this.sqlBuilder) {
                throw new Error('Failed to initialize SQL Builder');
            }
            return this.sqlBuilder;
        });
    }
    query(sql, values = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield this.getConnection();
            console.log(sql);
            return yield new Promise((resolve, reject) => {
                connection.query(sql, values, (err, results, fieldInfo) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve([results, fieldInfo]);
                });
            });
        });
    }
}
exports.MySqlDriver = MySqlDriver;
