import {
    BaseFunction,
} from 'estree';
import { Connection, createConnection, FieldInfo } from 'mysql';
import { Column } from '../columns';
import { ConnectionOptions, Identifier } from '../common';
import { Database } from '../databases';
import { Driver } from '../drivers';
import { ForeignKeyUpdateRule, Key, KeyType } from '../keys';
import { Query } from '../queries';
import { SqlBuilder } from '../sql';
import { Table } from '../tables';
import { parseTypeInfoString } from '../types';

export class MySqlDriver implements Driver {
    private readonly options: ConnectionOptions;
    private connection: Connection | undefined;
    private sqlBuilder: SqlBuilder | undefined;
    private inTransaction = false;

    private fkUpdateRuleMap: any = {
        NO_ACTION: ForeignKeyUpdateRule.NO_ACTION,
        RESTRICT: ForeignKeyUpdateRule.RESTRICT,
        CASCADE: ForeignKeyUpdateRule.CASCADE,
        SET_NULL: ForeignKeyUpdateRule.SET_NULL,
    };

    constructor(options: ConnectionOptions) {
        this.options = options;
    }

    public disconnect(): Promise<void> {
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

    public async hasDatabase(name: Identifier): Promise<boolean> {
        const sqlBuilder = await this.getSqlBuilder();
        return (await this.query(`SHOW DATABASES LIKE ${sqlBuilder.escapeIdentifier(name)}`))[0].length > 0;
    }

    public async getDatabase(name: Identifier): Promise<Database> {
        if (!this.hasDatabase(name)) {
            throw new Error(`Database ${name} doesn\'t exist`);
        }
        return { name };
    }

    public async getDatabases(): Promise<Database[]> {
        const [results] = await this.query('SHOW DATABASES');
        return results.map((result: any) => ({
            name: result.Database,
        }));
    }

    public async createDatabase(database: Database): Promise<Database> {
        const sqlBuilder = await this.getSqlBuilder();
        await this.query(`CREATE DATABASE ${sqlBuilder.escapeIdentifier(database.name)}`);
        return { ...database };
    }

    public async updateDatabase(database: Database): Promise<Database> {
        return { ...database };
    }

    public async removeDatabase(name: string): Promise<void> {
        const sqlBuilder = await this.getSqlBuilder();
        await this.query(`DROP DATABASE ${sqlBuilder.escapeIdentifier(name)}`);
    }

    public async hasTable(databaseName: string, name: string): Promise<boolean> {
        const sqlBuilder = await this.getSqlBuilder();
        return (await this.query(
            `SHOW TABLES FROM ${sqlBuilder.escapeIdentifier(databaseName)} LIKE ${sqlBuilder.escape(name)}`,
        ))[0].length > 0;
    }

    public async getTable(databaseName: string, name: string): Promise<Table> {
        if (!this.hasTable(databaseName, name)) {
            throw new Error(`Table ${name} doesn\'t exist`);
        }
        return { name };
    }

    public async getTables(databaseName: string): Promise<Table[]> {
        const sqlBuilder = await this.getSqlBuilder();
        const [results] = await this.query(`SHOW TABLES FROM ${sqlBuilder.escapeIdentifier(databaseName)}`);
        return results.map((result: any) => ({
            name: result[`Tables_in_${databaseName}`],
        }));
    }

    public async createTable(databaseName: string, table: Table): Promise<Table> {
        const sqlBuilder = await this.getSqlBuilder();
        if (!table.columns) {
            throw new Error('Can\'t create a table that has no columns');
        }
        const fqtn = sqlBuilder.escapeIdentifier(databaseName, table.name);
        await this.query(`CREATE TABLE ${fqtn} (
            ${sqlBuilder.buildListSql(table.columns, c => sqlBuilder.buildColumnSql(c))}
        ) ENGINE=InnoDB COLLATE "utf8mb_unicode_ci"`); // TODO: Make this configurable via driver-specific options
        // TODO: Append data to table that was generated (Nothing we'd need there yet, but maybe the engine
        //       collation etc. could be useful
        return {
            ...table,
        };
    }

    public async updateTable(databaseName: string, table: Table): Promise<Table> {
        if (!table.columns || table.columns.length < 1) {
            throw new Error('Cannot update table with empty columns. Use removeTable instead');
        }
        if (!table.keys || table.keys.length < 1) {
            throw new Error('Cannot update table with empty keys. Use removeTable instead');
        }
        const sqlBuilder = await this.getSqlBuilder();
        const [currentColumns, currentKeys] = await Promise.all([
            await this.getColumns(databaseName, table.name),
            await this.getKeys(databaseName, table.name),
        ]);
        const currentColNames = currentColumns.map(c => c.name);
        const currentKeyNames = currentKeys.map(k => k.name);
        const newCols = table.columns.filter(c => !currentColNames.includes(c.name));
        const newKeys = table.keys.filter(k => !currentKeyNames.includes(k.name));
        const colChanges = [] as string[];
        const keyRemovals = [] as string[];
        const keyAdditions = [] as string[];
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
        await this.transact(async () => {
            await Promise.all([
                ...keyRemovals,
                ...colChanges,
                ...keyAdditions,
            ].map(change => this.query(change)));
        });
        return {
            ...table,
        };
    }

    public async removeTable(databaseName: string, name: string): Promise<void> {
        const sqlBuilder = await this.getSqlBuilder();
        await this.query(`DROP TABLE ${sqlBuilder.escapeIdentifier(databaseName, name)}`);
    }

    public async getKey(databaseName: string, tableName: string, name: string): Promise<Key> {
        const keys: any = await this.loadKeys(databaseName, tableName, name);
        if (keys.length < 1) {
            throw new Error(`Key ${name} not found`);
        }
        return keys[0];
    }

    public async hasKey(databaseName: string, tableName: string, name: string) {
        return (await this.query('SHOW INDEXES FROM ??.?? LIKE ?', [databaseName, tableName, name]))[0].length > 0;
    }

    public getKeys(databaseName: string, tableName: string): Promise<Key[]> {
        return this.loadKeys(databaseName, tableName);
    }

    public async loadKeys(databaseName: Identifier, tableName: Identifier, name?: Identifier): Promise<Key[]> {
        const sqlBuilder = await this.getSqlBuilder();
        const [results] = await this.query(
            `SHOW INDEXES FROM ${sqlBuilder.escapeIdentifier(databaseName, tableName)}${
                name ? ` WHERE \`Key_name\` = ${sqlBuilder.escape(name)}` : ''
            }`,
        );
        const [fkResults] = await this.query(`
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
        return Object.values(results.reduce((resultKeys: any, result: any) => {
            if (result.Key_name in resultKeys) {
                // This is a multi-column key
                resultKeys[result.Key_name].columnNames.push(result.Column_name);
                return resultKeys;
            }
            resultKeys[result.Key_name] = {
                type: KeyType.INDEX,
                name: result.Key_name,
                columnNames: [result.Column_name],
            };
            if (result.Key_name === 'PRIMARY') {
                resultKeys[result.Key_name].type = KeyType.PRIMARY;
                return resultKeys;
            }
            // We search for this key in the INFORMATION_SCHEMA database to check if this is a foreign key
            const fks = fkResults.filter((r: any) => r.CONSTRAINT_NAME === result.Key_name);
            if (fks.length > 0) {
                const [firstFk] = fks;
                // This is a foreign key
                resultKeys[result.Key_name].type = KeyType.FOREIGN;
                resultKeys[result.Key_name].referencedTableName = firstFk.REFERENCED_TABLE_NAME;
                resultKeys[result.Key_name].referencedColumnNames = fks.map((fk: any) => fk.REFERENCED_COLUMN_NAME);
                resultKeys[result.Key_name].onDelete = this.fkUpdateRuleMap[firstFk.DELETE_RULE];
                resultKeys[result.Key_name].onUpdate = this.fkUpdateRuleMap[firstFk.UPDATE_RULE];
                return resultKeys;
            }
            if (result.Non_unique === 0) {
                // This is a unique index
                resultKeys[result.Key_name].type = KeyType.UNIQUE;
                return resultKeys;
            }
            // TODO: Support more indexes, like FULLTEXT, SPATIAL?
            return resultKeys;
        }, {} as { [name: string]: Key; }));
    }

    public async hasColumn(databaseName: string, tableName: string, name: string): Promise<boolean> {
        return (await this.query('SHOW COLUMNS FROM ??.?? LIKE ?', [databaseName, tableName, name]))[0].length > 0;
    }

    // @ts-ignore
    public async getColumn<T = any>(databaseName: string, tableName: string, name: string): Promise<Column<T>> {
        const [results] = await this.query('SHOW COLUMNS FROM ??.?? LIKE ?', [databaseName, tableName, name]);
        if (results.length < 1) {
            throw new Error(`Column ${name} doesn\'t exist`);
        }
        const [result] = results;
        const extra = (result.Extra as string || '').split(' ').map(e => e.toUpperCase());
        return {
            ...parseTypeInfoString(result.Type),
            name: result.Field,
            nullable: result.Null !== 'NO',
            defaultValue: result.Default,
            generated: extra.includes('AUTO_INCREMENT'),
            comment: '',
        };
    }

    public async getColumns<T = any>(databaseName: string, tableName: string): Promise<Array<Column<T>>> {
        const [results] = await this.query('SHOW COLUMNS FROM ??.??', [databaseName, tableName]);
        return results.map((result: any) => {
            const extra = (result.Extra as string || '').split(' ').map(e => e.toUpperCase());
            return {
                ...parseTypeInfoString(result.Type),
                name: result.Field,
                nullable: result.Null !== 'NO',
                defaultValue: result.Default,
                generated: extra.includes('AUTO_INCREMENT'),
                comment: '',
            };
        });
    }

    public async insert<T = {}>(databaseName: string, tableName: string, row: T): Promise<number | string> {
        const sqlBuilder = await this.getSqlBuilder();
        const [results] = await this.query(sqlBuilder.buildInsertIntoSql(databaseName, tableName, row));
        return results.insertId;
    }

    public async insertMultiple<T = {}>(
        databaseName: string,
        tableName: string,
        rows: T[],
    ): Promise<Array<number | string>> {
        const sqlBuilder = await this.getSqlBuilder();
        const [results] = await this.query(sqlBuilder.buildInsertIntoMultipleSql(databaseName, tableName, rows));
        const insertedIds = [];
        // We can just do this since MySQL guarantees that IDs are generated in order in bulk inserts
        for (let i = 0; i < results.affectedRows; i += 1) {
            insertedIds.push(results.insertId + i);
        }
        return insertedIds;
    }

    public async select<T = {}, M = T>(
        databaseName: Identifier,
        tableName: Identifier,
        query: Query,
        selector?: BaseFunction,
    ): Promise<M[]> {
        const sqlBuilder = await this.getSqlBuilder();
        const [results] = await this.query(sqlBuilder.buildSelectSql(databaseName, tableName, query, selector));
        return results.map((result: any) => ({ ...result }));
    }

    // @ts-ignore
    public stream<T = {}, M = T>(
        // @ts-ignore
        databaseName: Identifier,
        // @ts-ignore
        tableName: Identifier,
        // @ts-ignore
        query: Query<T>,
        // @ts-ignore
        selector?: BaseFunction,
    ): AsyncIterator<M> {
        // @ts-ignore
        return undefined;
    }

    // @ts-ignore
    public update<T = {}>(databaseName: string, tableName: string, values: T, query: Query<T>): Promise<void> {
        // @ts-ignore
        return undefined;
    }

    // @ts-ignore
    public delete<T = {}>(databaseName: string, tableName: string, query: Query<T>): Promise<void> {
        // @ts-ignore
        return undefined;
    }

    public async transact(transactor: (driver: this) => Promise<void>): Promise<void> {
        if (this.inTransaction) {
            throw new Error('You can\'t nest transactions.');
        }
        this.inTransaction = true;
        const connection = await this.getConnection();
        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        await transactor(this);
        await new Promise((resolve, reject) => {
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
    }

    private async getConnection(): Promise<Connection> {
        if (this.connection) {
            return this.connection;
        }
        const {
            host = 'localhost',
            port = 3306,
            user = 'root',
            password = '',
            databaseName,
            params = {},
        } = this.options;
        const { encoding = 'utf8mb4' } = params;
        const connection = createConnection({
            host,
            port,
            user,
            password,
            database: databaseName,
        });
        await new Promise((resolve, reject) => {
            connection.connect(err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        this.sqlBuilder = new SqlBuilder({
            escape: val => connection.escape(val, false),
            escapeIdentifier: val => connection.escapeId(val, true),
        });
        this.connection = connection;
        await this.query(`SET NAMES ${this.sqlBuilder.escape(encoding)}`);
        return connection;
    }

    private async getSqlBuilder(): Promise<SqlBuilder> {
        if (this.sqlBuilder) {
            return this.sqlBuilder;
        }
        await this.getConnection();
        if (!this.sqlBuilder) {
            throw new Error('Failed to initialize SQL Builder');
        }
        return this.sqlBuilder;
    }

    private async query<T = any>(sql: string, values: any[] = []): Promise<[T, FieldInfo[] | undefined]> {
        const connection = await this.getConnection();
        console.log(sql);
        return await new Promise((resolve, reject) => {
            connection.query(sql, values, (err, results, fieldInfo) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve([results, fieldInfo]);
            });
        });
    }
}
