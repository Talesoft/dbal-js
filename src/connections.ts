import { ConnectionOptions, ConnectionUrl, Identifier, parseConnectionUrl } from './common';
import { Database, DatabaseView } from './databases';
import { Driver, DriverList } from './drivers';
import { MySqlDriver } from './drivers/mysql';

export class Connection {
    public readonly options: ConnectionOptions;
    public readonly driver: Driver;

    private databases: { [name: string]: DatabaseView } = {};

    constructor(options: ConnectionOptions, driver: Driver) {
        this.options = options;
        this.driver = driver;
    }

    public async load(deep?: boolean) {
        await this.hydrate(await this.driver.getDatabases(), deep);
    }

    public async hydrate(databases: Database[], deep?: boolean) {
        await Promise.all(databases.map(databaseData => this.getDatabase(databaseData.name)
            .hydrate(databaseData, deep),
        ));
    }

    public async save(deep?: boolean) {
        console.log('Saving connection');
        await Promise.all(Object.values(this.databases).map(d => d.save(deep)));
    }

    public getDatabase(name?: Identifier): DatabaseView {
        if (!name) {
            if (!this.options.databaseName) {
                throw new Error('Failed to get default database: No `databaseName` specified in options.');
            }
            return this.getDatabase(this.options.databaseName);
        }
        if (name in this.databases) {
            return this.databases[name];
        }
        return this.databases[name] = new DatabaseView(this, name);
    }

    public disconnect() {
        return this.driver.disconnect();
    }

    public getData(deep?: boolean) {
        return Object.values(this.databases).map(d => d.getData(deep));
    }
}

export class Connector {
    public static inbuiltDrivers = {
        mysql: MySqlDriver,
    };
    public readonly drivers: DriverList;
    public readonly defaultOptions: ConnectionOptions | undefined;

    constructor(drivers: DriverList = Connector.inbuiltDrivers, defaultOptions?: ConnectionOptions) {
        this.drivers = drivers;
        this.defaultOptions = defaultOptions;
    }

    public async connect(options: ConnectionOptions) {
        const fullOptions = { ...this.defaultOptions, ...options };
        if (!fullOptions.driver) {
            throw new Error('No driver selected');
        }
        if (!(fullOptions.driver in this.drivers)) {
            throw new Error(`Driver ${fullOptions.driver} is not registered`);
        }
        const DriverImplementation = this.drivers[fullOptions.driver];
        return new Connection(fullOptions, new DriverImplementation(options));
    }

    public connectUrl(url: ConnectionUrl) {
        return this.connect(parseConnectionUrl(url));
    }

    public static connect(options: ConnectionOptions, drivers?: DriverList) {
        return new Connector(drivers).connect(options);
    }

    public static connectUrl(url: ConnectionUrl, drivers?: DriverList) {
        return Connector.connect(parseConnectionUrl(url), drivers);
    }
}
