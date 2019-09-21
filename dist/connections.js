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
const common_1 = require("./common");
const databases_1 = require("./databases");
const mysql_1 = require("./drivers/mysql");
class Connection {
    constructor(options, driver) {
        this.databases = {};
        this.options = options;
        this.driver = driver;
    }
    load(deep) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.hydrate(yield this.driver.getDatabases(), deep);
        });
    }
    hydrate(databases, deep) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(databases.map(databaseData => this.getDatabase(databaseData.name)
                .hydrate(databaseData, deep)));
        });
    }
    getDatabase(name) {
        if (!name) {
            if (!this.options.databaseName) {
                throw new Error('Failed to get default database: No `databaseName` specified in options.');
            }
            return this.getDatabase(this.options.databaseName);
        }
        if (name in this.databases) {
            return this.databases[name];
        }
        return this.databases[name] = new databases_1.DatabaseView(this, name);
    }
    disconnect() {
        return this.driver.disconnect();
    }
    getData(deep) {
        return Object.values(this.databases).map(d => d.getData(deep));
    }
}
exports.Connection = Connection;
class Connector {
    constructor(drivers = Connector.inbuiltDrivers, defaultOptions) {
        this.drivers = drivers;
        this.defaultOptions = defaultOptions;
    }
    connect(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullOptions = Object.assign(Object.assign({}, this.defaultOptions), options);
            if (!fullOptions.driver) {
                throw new Error('No driver selected');
            }
            if (!(fullOptions.driver in this.drivers)) {
                throw new Error(`Driver ${fullOptions.driver} is not registered`);
            }
            const DriverImplementation = this.drivers[fullOptions.driver];
            const connection = new Connection(fullOptions, new DriverImplementation(options));
            yield connection.driver.connect();
            return connection;
        });
    }
    connectUrl(url) {
        return this.connect(common_1.parseConnectionUrl(url));
    }
    static connect(options, drivers) {
        return new Connector(drivers).connect(options);
    }
    static connectUrl(url, drivers) {
        return Connector.connect(common_1.parseConnectionUrl(url), drivers);
    }
}
exports.Connector = Connector;
Connector.inbuiltDrivers = {
    mysql: mysql_1.MySqlDriver,
};
