import { Connection, createConnection } from 'mysql';
import { Column } from '../columns';
import { ConnectionOptions, Identifier } from '../common';
import { Database } from '../databases';
import { Driver } from '../drivers';
import { Query } from '../queries';
import { Table } from '../tables';

export class MySqlDriver implements Driver {
    private readonly options: ConnectionOptions;
    private connection: Connection | undefined;

    constructor(options: ConnectionOptions) {
        this.options = options;
    }

    connect(): Promise<void> {
        if (this.connection) {
            throw new Error('Already connected.');
        }
        const { host = 'localhost', port = 3306, user = 'root', password = '', databaseName } = this.options;
        this.connection = createConnection({
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

    async disconnect(): Promise<void> {
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
            })
        });
    }

    private query<T = any>(sql: string, values: any[] = []): Promise<T> {
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

    async hasDatabase(name: Identifier): Promise<boolean> {
        return (await this.query('SHOW DATABASES LIKE ?', [name])).length > 0;
    }

    async getDatabase(name: Identifier): Promise<Database> {
        return { name };
    }

    async getDatabases(): Promise<Database[]> {
        console.log(await this.query('SELECT * FROM `test`.`users`'));
        const results = await this.query('SHOW DATABASES');
        return results.map((result: any) => ({
            name: result.Database,
        }));
    }

    async hasTable(databaseName: string, name: string): Promise<boolean> {
        return (await this.query('SHOW TABLES FROM ?? LIKE ?', [databaseName, name])).length > 0;
    }

    async getTable(_: string, name: string): Promise<Table> {
        return { name };
    }

    async getTables(databaseName: string): Promise<Table[]> {
        const results = await this.query('SHOW TABLES FROM ??', [databaseName]);
        return results.map((result: any) => ({
            name: result[`Tables_in_${databaseName}`],
        }));
    }

    async hasColumn(databaseName: string, tableName: string, name: string): Promise<boolean> {
        return (await this.query('SHOW COLUMNS FROM ??.?? LIKE ?', [databaseName, tableName, name])).length > 0;
    }

    // @ts-ignore
    getColumn<T = any>(databaseName: string, tableName: string, name: string): Promise<Column<T>> {
        // @ts-ignore
        return undefined;
    }

    async getColumns<T = any>(databaseName: string, tableName: string): Promise<Array<Column<T>>> {
        const results = await this.query('SHOW COLUMNS FROM ??.??', [databaseName, tableName]);
        return results.map((result: any) => ({
            name: result.Field,
        }));
    }

    // @ts-ignore
    insert<T = {}>(databaseName: string, tableName: string, row: T): void {
    }

    // @ts-ignore
    insertMultiple<T = {}>(databaseName: string, tableName: string, rows: T[]): void {
    }

    // @ts-ignore
    select<T = {}, M = T>(databaseName: string, tableName: string, query: Query<T>): Array<M> {
        // @ts-ignore
        return undefined;
    }

    // @ts-ignore
    stream<T = {}, M = T>(databaseName: string, tableName: string, query: Query<T>): AsyncIterator<M> {
        // @ts-ignore
        return undefined;
    }

    // @ts-ignore
    update<T = {}>(databaseName: string, tableName: string, values: T, query: Query<T>): Promise<void> {
        // @ts-ignore
        return undefined;
    }

    // @ts-ignore
    delete<T = {}>(databaseName: string, tableName: string, query: Query<T>): Promise<void> {
        // @ts-ignore
        return undefined;
    }

    escape(value: any): string {
        if (!this.connection) {
            throw new Error('Connection is gone.');
        }
        return this.connection.escape(value);
    }

    escapeIdentifier(identifier: string): string {
        if (!this.connection) {
            throw new Error('Connection is gone.');
        }
        return this.connection.escapeId(identifier);
    }
}
