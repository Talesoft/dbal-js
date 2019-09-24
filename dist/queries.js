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
const esprima_1 = require("esprima");
const functionParseCache = {};
function parseFunctionExpression(fn) {
    const source = fn.toString();
    if (source in functionParseCache) {
        return functionParseCache[source];
    }
    let result;
    try {
        const expr = esprima_1.parseScript(`x = ${source}`).body[0];
        result = expr.expression.right;
    }
    catch (e) {
        throw new Error('Failed to parse function expression: Can\'t parse native functions');
    }
    if (!['ArrowFunctionExpression', 'FunctionExpression'].includes(result.type)) {
        throw new Error('Failed to parse function expression: Value was not a function expression');
    }
    return functionParseCache[source] = result;
}
exports.parseFunctionExpression = parseFunctionExpression;
class QueryBuilder {
    constructor(connection, databaseName, tableName) {
        this.connection = connection;
        this.databaseName = databaseName;
        this.tableName = tableName;
        this.query = {};
    }
    from(tableName) {
        this.tableName = tableName;
        return this;
    }
    with(params) {
        if (!this.query.params) {
            this.query.params = {};
        }
        Object.assign(this.query.params, params);
        return this;
    }
    where(fn) {
        this.query.where = parseFunctionExpression(fn);
        return this;
    }
    orderBy(fn, direction = 'asc') {
        if (!this.query.orders) {
            this.query.orders = [];
        }
        this.query.orders.push({
            direction,
            expression: parseFunctionExpression(fn),
        });
        return this;
    }
    slice(offset) {
        this.query.offset = offset;
        return this;
    }
    take(amount) {
        this.query.limit = amount;
        return this;
    }
    join(tableName, type, expr) {
        if (!this.query.joins) {
            this.query.joins = [];
        }
        // TODO: Make expr optional and build a default expression based on the target
        //       table's primary key
        this.query.joins.push({
            tableName,
            type,
            expression: parseFunctionExpression(expr),
        });
        return this;
    }
    leftJoin(tableName, expr) {
        return this.join(tableName, 'left', expr);
    }
    rightJoin(tableName, expr) {
        return this.join(tableName, 'left', expr);
    }
    innerJoin(tableName, expr) {
        return this.join(tableName, 'left', expr);
    }
    select(fn) {
        if (!this.tableName) {
            throw new Error('Failed to execute query: No table selected. Use from() to select a table.');
        }
        const selector = fn ? parseFunctionExpression(fn) : undefined;
        return this.connection.driver.select(this.databaseName, this.tableName, this.query, selector);
    }
    stream(fn) {
        if (!this.tableName) {
            throw new Error('Failed to execute query: No table selected. Use from() to select a table.');
        }
        const selector = fn ? parseFunctionExpression(fn) : undefined;
        return this.connection.driver.stream(this.databaseName, this.tableName, this.query, selector);
    }
    [Symbol.asyncIterator]() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stream();
        });
    }
}
exports.QueryBuilder = QueryBuilder;
