import { ConnectionOptions, ConnectionUrl, Identifier } from './common';
import { Database, DatabaseView } from './databases';
import { Driver, DriverList } from './drivers';
import { MySqlDriver } from './drivers/mysql';
export declare class Connection {
    readonly options: ConnectionOptions;
    readonly driver: Driver;
    private databases;
    constructor(options: ConnectionOptions, driver: Driver);
    load(deep?: boolean): Promise<void>;
    hydrate(databases: Database[], deep?: boolean): Promise<void>;
    save(deep?: boolean): Promise<void>;
    getDatabase(name?: Identifier): DatabaseView;
    disconnect(): Promise<void>;
    getData(deep?: boolean): {
        name: string;
    }[];
}
export declare class Connector {
    static inbuiltDrivers: {
        mysql: typeof MySqlDriver;
    };
    readonly drivers: DriverList;
    readonly defaultOptions: ConnectionOptions | undefined;
    constructor(drivers?: DriverList, defaultOptions?: ConnectionOptions);
    connect(options: ConnectionOptions): Promise<Connection>;
    connectUrl(url: ConnectionUrl): Promise<Connection>;
    static connect(options: ConnectionOptions, drivers?: DriverList): Promise<Connection>;
    static connectUrl(url: ConnectionUrl, drivers?: DriverList): Promise<Connection>;
}
