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
const estree_walker_1 = require("estree-walker");
const functionParseCache = {};
function parseFunctionExpression(fn) {
    const source = fn.toString();
    if (source in functionParseCache) {
        return functionParseCache[source];
    }
    let result;
    try {
        const expr = esprima_1.parseScript('x = ' + source).body[0];
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
function renameParam(ast, index, newName) {
    const param = ast.params[index];
    if (param.type !== 'Identifier') {
        throw new Error(`Failed to rename param at index ${index}: Param is not an identifier. Other params are not supported yet.`);
    }
    estree_walker_1.walk(ast, {
        enter(node) {
            if (node.type === 'Identifier' && node.name === param.name) {
                node.name = newName;
            }
        }
    });
    param.name = newName;
}
exports.renameParam = renameParam;
var Order;
(function (Order) {
    Order["ASC"] = "asc";
    Order["DESC"] = "desc";
})(Order = exports.Order || (exports.Order = {}));
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
    where(fn) {
        this.query.where = parseFunctionExpression(fn);
        return this;
    }
    sort(orderList) {
        this.query.order = orderList;
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
