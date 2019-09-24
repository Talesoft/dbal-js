"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const estree_walker_1 = require("estree-walker");
const common_1 = require("./common");
const keys_1 = require("./keys");
class SqlBuilder {
    constructor(options) {
        this.options = Object.assign(Object.assign({ escape: common_1.toString, escapeIdentifier: common_1.toString, identifierDelimiter: '.', arrayOpenBracket: '(', arrayCloseBracket: ')', arrayDelimiter: ',', listOpenBracket: '', listCloseBracket: '', listDelimiter: ',', mapOpenBracket: '', mapCloseBracket: '', mapDelimiter: '=', mapPairDelimiter: ',', tableAlias: '__t', joinAliasPattern: '__j{{ index }}', maxJoinParams: 5 }, options), { logicalOperatorMap: Object.assign({ '&&': 'AND', '||': 'OR' }, (options && options.logicalOperatorMap)), binaryOperatorMap: Object.assign({ in: 'IN', '===': '=', '==': '=', '!==': '!=', '!=': '!=', '<': '<', '>': '>', '<=': '<=', '>=': '>=', '+': '+', '-': '-', '/': '/', '*': '*' }, (options && options.binaryOperatorMap)), keyMap: {
                [keys_1.KeyType.INDEX]: 'INDEX',
                [keys_1.KeyType.PRIMARY]: 'PRIMARY INDEX',
                [keys_1.KeyType.UNIQUE]: 'UNIQUE INDEX',
                [keys_1.KeyType.FOREIGN]: 'FOREIGN INDEX',
            } });
        this.paramNames = [this.options.tableAlias];
        for (let i = 0; i < this.options.maxJoinParams; i += 1) {
            this.paramNames.push(this.options.joinAliasPattern
                .replace('{{ index }}', i.toString(10)));
        }
    }
    escape(value) {
        if (value === null) {
            return 'NULL';
        }
        return this.options.escape(value);
    }
    escapeIdentifier(...identifiers) {
        return identifiers.map(i => this.options.escapeIdentifier(i)).join(this.options.identifierDelimiter);
    }
    refactorParams(ast) {
        const newNames = this.paramNames;
        const oldNames = newNames.slice(0, Math.min(newNames.length, ast.params.length)).map((newName, i) => {
            const param = ast.params[i];
            if (param.type !== 'Identifier') {
                throw new Error(`Failed to refactor param at index ${i}: Param is not an identifier.
                 Other params are not supported yet.`);
            }
            const oldName = param.name;
            param.name = newName; // Rename function argument
            return oldName;
        });
        estree_walker_1.walk(ast, {
            enter(node, parent) {
                if (node.type === 'Identifier'
                    && !(parent && parent.type === 'MemberExpression' && parent.property === node)) {
                    const idx = oldNames.indexOf(node.name);
                    if (idx === -1) {
                        return;
                    }
                    node.name = newNames[idx]; // Rename occurences in body
                }
            },
        });
    }
    buildArraySql(value, mapFn = v => this.escape(v)) {
        return `${this.options.arrayOpenBracket}${value.map(mapFn).join(this.options.arrayDelimiter)}${this.options.arrayCloseBracket}`;
    }
    buildListSql(value, mapFn = v => this.escape(v)) {
        return `${this.options.listOpenBracket}${value.map(mapFn).join(this.options.listDelimiter)}${this.options.listCloseBracket}`;
    }
    buildMapSql(value, mapFn = v => this.escape(v)) {
        return `${this.options.mapOpenBracket}${Object.entries(value)
            .map(([k, v]) => `${this.escapeIdentifier(k)}${this.options.mapDelimiter}${mapFn(v)}`)
            .join(this.options.mapPairDelimiter)}${this.options.mapCloseBracket}`;
    }
    buildIdentifierSql(expr) {
        if (expr.computed) {
            throw new Error('Can\'t build identifiers from computed properties');
        }
        if (expr.object.type !== 'Identifier') {
            throw new Error('Can\'t build nested identifiers from expressions');
        }
        if (expr.property.type !== 'Identifier') {
            throw new Error('Can\'t access non-static members on expression arguments');
        }
        return this.escapeIdentifier(expr.object.name, expr.property.name);
    }
    buildSelectorSql(selector) {
        if (!selector) {
            return `${this.options.tableAlias}.*`;
        }
        this.refactorParams(selector);
        if (selector.type !== 'ArrowFunctionExpression') {
            throw new Error('Non-ArrowFunction selectors are not supported yet');
        }
        if (selector.body.type === 'MemberExpression') {
            return this.buildIdentifierSql(selector.body);
        }
        if (selector.body.type === 'ArrayExpression') {
            const parts = selector.body.elements.map(element => {
                if (element.type !== 'MemberExpression') {
                    throw new Error('You can only access members of arguments in this array yet');
                }
                return this.buildIdentifierSql(element);
            });
            return this.buildListSql(parts);
        }
        if (selector.body.type === 'ObjectExpression') {
            return this.buildListSql(selector.body.properties.map(prop => {
                if (prop.computed || prop.key.type !== 'Identifier') {
                    throw new Error('Computed properties are not supported yet');
                }
                if (prop.value.type !== 'MemberExpression') {
                    throw new Error('You can only access members of arguments in this object yet');
                }
                const identifier = this.buildIdentifierSql(prop.value);
                return `${identifier} AS ${this.escapeIdentifier(prop.key.name)}`;
            }));
        }
        throw new Error('Selector-functions need to return a single object property or an array of object properties');
    }
    buildLogicalExpressionSql(expr, params) {
        const operator = this.options.logicalOperatorMap[expr.operator];
        return `(${this.buildExpressionSql(expr.left, params)} ${operator} ${this.buildExpressionSql(expr.right, params)})`;
    }
    buildBinaryExpressionSql(expr, params) {
        if (expr.operator !== '===' && expr.operator !== '==' && expr.operator !== '!==' && expr.operator !== '!='
            && expr.operator !== '<' && expr.operator !== '>' && expr.operator !== '<=' && expr.operator !== '>='
            && expr.operator !== 'in' && expr.operator !== '+' && expr.operator !== '-' && expr.operator !== '/'
            && expr.operator !== '*') {
            throw new Error(`Invalid operator ${expr.operator}`);
        }
        const operator = this.options.binaryOperatorMap[expr.operator];
        return `(${this.buildExpressionSql(expr.left, params)} ${operator} ${this.buildExpressionSql(expr.right, params)})`;
    }
    buildExpressionSql(expr, params) {
        if (expr.type === 'LogicalExpression') {
            return this.buildLogicalExpressionSql(expr, params);
        }
        if (expr.type === 'BinaryExpression') {
            return this.buildBinaryExpressionSql(expr, params);
        }
        if (expr.type === 'MemberExpression') {
            return this.buildIdentifierSql(expr);
        }
        if (expr.type === 'ArrayExpression') {
            return this.buildArraySql(expr.elements.map(ex => this.buildExpressionSql(ex, params)));
        }
        if (expr.type === 'Literal') {
            return this.escape(expr.value);
        }
        if (expr.type === 'TemplateLiteral') {
            const literal = expr;
            if (literal.quasis.length < 1) {
                throw new Error('Invalid parameter literal: No quasis found');
            }
            const quasis = literal.quasis[0];
            if (quasis.type !== 'TemplateElement') {
                throw new Error('Expected a single TemplateElement inside parameter literal');
            }
            if (!quasis.value.raw.match(/^:[a-z_][a-z0-9_]+$/i)) {
                throw new Error(`Parameter literal needs to have the format \`:parameter_name\`.
                    The name can only consist of a-z, A-Z, 0-9 and _ and can't start with a digit.`);
            }
            const parameterName = quasis.value.raw.substr(1);
            if (!params || !(parameterName in params)) {
                throw new Error(`Parameter \`:${parameterName}\` is not defined. Pass it with .with()`);
            }
            return this.escape(params[parameterName]);
        }
        throw new Error(`Unsupported expression ${expr.type} encountered`);
    }
    buildWhereSql(fn, params) {
        this.refactorParams(fn);
        if (fn.type !== 'ArrowFunctionExpression') {
            throw new Error('Non-ArrowFunction expressions are not supported yet');
        }
        return this.buildExpressionSql(fn.body, params);
    }
    buildOrderSql(orders) {
        return this.buildListSql(orders.map(({ direction, expression: fn }) => {
            this.refactorParams(fn);
            if (fn.type !== 'ArrowFunctionExpression') {
                throw new Error('Non-ArrowFunction expressions are not supported yet');
            }
            if (fn.body.type === 'ArrayExpression') {
                return this.buildListSql(fn.body.elements.map(ex => {
                    if (ex.type !== 'MemberExpression') {
                        throw new Error('Order expressions need to be object properties');
                    }
                    return `${this.buildIdentifierSql(ex)} ${direction.toUpperCase()}`;
                }));
            }
            if (fn.body.type === 'MemberExpression') {
                return `${this.buildIdentifierSql(fn.body)} ${direction.toUpperCase()}`;
            }
            throw new Error(`Invalid order expression type ${fn.body.type}`);
        }));
    }
    buildJoinSql(join, index, params) {
        this.refactorParams(join.expression);
        if (join.expression.type !== 'ArrowFunctionExpression') {
            throw new Error('Non-ArrowFunction expressions are not supported yet');
        }
        const expr = this.buildExpressionSql(join.expression.body, params);
        return `${join.type.toUpperCase()} JOIN ${this.escapeIdentifier(join.tableName)} AS ${this.escapeIdentifier(`__j${index + 1}`)} ON ${expr}`;
    }
    buildQuerySql(query) {
        const parts = [];
        if (query.joins) {
            parts.push(query.joins.map((join, i) => this.buildJoinSql(join, i, query.params)));
        }
        if (query.where) {
            parts.push(`WHERE ${this.buildWhereSql(query.where, query.params)}`);
        }
        if (query.orders) {
            parts.push(`ORDER BY ${this.buildOrderSql(query.orders)}`);
        }
        if (query.limit) {
            parts.push(`LIMIT ${parseInt(query.limit.toString(), 10)}`);
        }
        if (query.offset) {
            parts.push(`OFFSET ${parseInt(query.offset.toString(), 10)}`);
        }
        return parts.join(' ');
    }
    buildInsertIntoSql(databaseName, tableName, row) {
        return `INSERT INTO ${this.escapeIdentifier(databaseName, tableName)} SET ${this.buildMapSql(row)}`;
    }
    buildInsertIntoMultipleSql(databaseName, tableName, rows) {
        // Calculate all column names that need to be written
        const columnNames = [];
        for (let i = 0; i < rows.length; i += 1) {
            const keys = Object.keys(rows[i]);
            for (let j = 0; j < keys.length; j += 1) {
                if (columnNames.includes(keys[j])) {
                    continue;
                }
                columnNames.push(keys[j]);
            }
        }
        const columns = this.buildArraySql(columnNames, name => this.escapeIdentifier(name));
        const values = this.buildArraySql(rows, row => this.buildListSql(Object.values(row)));
        return `INSERT INTO ${this.escapeIdentifier(databaseName, tableName)}${columns} VALUES ${values}`;
    }
    buildSelectSql(databaseName, tableName, query, selector) {
        const what = this.buildSelectorSql(selector);
        let sql = `SELECT ${what} FROM ${this.escapeIdentifier(databaseName, tableName)} AS ${this.escapeIdentifier(this.options.tableAlias)}`;
        if (query.joins || query.where || query.limit || query.offset || query.orders) {
            sql += ` ${this.buildQuerySql(query)}`;
        }
        return sql;
    }
    buildColumnSql(column) {
        let sql = this.escapeIdentifier(column.name);
        sql += ` ${column.type.toUpperCase()}`;
        if (column.typeParams) {
            sql += `(${column.typeParams.map(p => this.escape(p)).join(',')})`;
        }
        if (column.unsigned) {
            sql += ' UNSIGNED';
        }
        sql += column.nullable ? ' NULL' : ' NOT NULL';
        if (typeof column.defaultValue !== 'undefined' && column.defaultValue !== null) {
            sql += ` DEFAULT ${this.escape(column.defaultValue)}`;
        }
        if (column.generated) {
            sql += ' AUTO_INCREMENT';
        }
        if (column.comment) {
            sql += ` COMMENT ${this.escape(column.comment)}`;
        }
        return sql;
    }
    buildKeyIdentifierSql(key) {
        const { keyMap } = this.options;
        return `${keyMap[key.type]} ${key.type !== keys_1.KeyType.PRIMARY ? this.escapeIdentifier(key.name) : ''}`;
    }
    buildKeySql(key) {
        let sql = `${this.buildKeyIdentifierSql(key)}(${this.escapeIdentifier(...key.columnNames)})`;
        if (key.type === keys_1.KeyType.FOREIGN) {
            const fk = key;
            sql += ` REFERENCES ${this.escapeIdentifier(fk.referencedTableName)}(${this.escapeIdentifier(...fk.referencedColumnNames)})`;
            if (fk.onDelete !== keys_1.ForeignKeyUpdateRule.NO_ACTION) {
                sql += ` ON DELETE ${keys_1.ForeignKeyUpdateRule[fk.onDelete]}`;
            }
            if (fk.onUpdate !== keys_1.ForeignKeyUpdateRule.NO_ACTION) {
                sql += ` ON UPDATE ${keys_1.ForeignKeyUpdateRule[fk.onUpdate]}`;
            }
        }
        return sql;
    }
}
exports.SqlBuilder = SqlBuilder;
