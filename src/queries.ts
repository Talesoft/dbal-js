import { parseScript } from 'esprima';
import { ExpressionStatement, AssignmentExpression, BaseFunction, Node } from 'estree';
import { Identifier } from './common';
import { Connection } from './connections';
import { walk } from 'estree-walker';

export type ExpressionFunction<T = {}> = (value: T) => any;

const functionParseCache: { [key: string]: BaseFunction } = {};
export function parseFunctionExpression(fn: (...args: any[]) => void) {
    const source = fn.toString();
    if (source in functionParseCache) {
        return functionParseCache[source];
    }
    let result;
    try {
        const expr = parseScript('x = ' + source).body[0] as ExpressionStatement;
        result = (expr.expression as AssignmentExpression).right;
    } catch (e) {
        throw new Error('Failed to parse function expression: Can\'t parse native functions');
    }
    if (!['ArrowFunctionExpression', 'FunctionExpression'].includes(result.type)) {
        throw new Error('Failed to parse function expression: Value was not a function expression');
    }
    return functionParseCache[source] = result as BaseFunction;
}

export function renameParam(ast: BaseFunction, index: number, newName: string) {
    const param = ast.params[index];
    if (param.type !== 'Identifier') {
        throw new Error(
            `Failed to rename param at index ${index}: Param is not an identifier. Other params are not supported yet.`
        );
    }
    walk(ast as Node, {
        enter(node) {
            if (node.type === 'Identifier' && node.name === param.name) {
                node.name = newName;
            }
        }
    });
    param.name = newName;
}

export enum Order {
    ASC = 'asc',
    DESC = 'desc',
}

export type OrderList<T = {}> = { [K in keyof T]: Order };

export interface Query<T = {}> {
    where?: BaseFunction;
    order?: OrderList<T>;
    limit?: number;
    offset?: number;
}

export interface Queryable<T = {}> {
    where(fn: ExpressionFunction): this;
    sort(orderList: OrderList<T>): this;
    slice(offset: number): this;
    take(amount: number): this;
    select<M = T>(fn?: ExpressionFunction<T>): M[];
    stream<M = T>(fn?: ExpressionFunction<T>): AsyncIterator<M>;
}

export class QueryBuilder<T = {}> implements Queryable<T>{
    public readonly connection: Connection;
    public readonly databaseName: Identifier;
    public readonly query: Query<T>;

    private tableName: Identifier | undefined;

    constructor(connection: Connection, databaseName: Identifier, tableName?: Identifier) {
        this.connection = connection;
        this.databaseName = databaseName;
        this.tableName = tableName;
        this.query = {};
    }

    from(tableName: Identifier) {
        this.tableName = tableName;
        return this;
    }

    public where(fn: ExpressionFunction) {
        this.query.where = parseFunctionExpression(fn);
        return this;
    }

    public sort(orderList: OrderList<T>) {
        this.query.order = orderList;
        return this;
    }

    public slice(offset: number) {
        this.query.offset = offset;
        return this;
    }

    public take(amount: number) {
        this.query.limit = amount;
        return this;
    }

    public select<M = T>(fn?: ExpressionFunction<T>) {
        if (!this.tableName) {
            throw new Error('Failed to execute query: No table selected. Use from() to select a table.');
        }
        const selector = fn ? parseFunctionExpression(fn) : undefined;
        return this.connection.driver.select<T, M>(this.databaseName, this.tableName, this.query, selector);
    }

    public stream<M = T>(fn?: ExpressionFunction<T>) {
        if (!this.tableName) {
            throw new Error('Failed to execute query: No table selected. Use from() to select a table.');
        }
        const selector = fn ? parseFunctionExpression(fn) : undefined;
        return this.connection.driver.stream<T, M>(this.databaseName, this.tableName, this.query, selector);
    }

    async [Symbol.asyncIterator]() {
        return this.stream();
    }
}
