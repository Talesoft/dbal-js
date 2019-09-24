import { parseScript } from 'esprima';
import { AssignmentExpression, BaseFunction, ExpressionStatement } from 'estree';
import { Identifier } from './common';
import { Connection } from './connections';

export type ExpressionFunction<T = {}> = (value: T, ...joins: any[]) => any;
export type SelectorFunction<T = {}> = (value: T, ...joins: any[]) => any;

const functionParseCache: { [key: string]: BaseFunction } = {};
export function parseFunctionExpression(fn: (...args: any[]) => void) {
    const source = fn.toString();
    if (source in functionParseCache) {
        return functionParseCache[source];
    }
    let result;
    try {
        const expr = parseScript(`x = ${source}`).body[0] as ExpressionStatement;
        result = (expr.expression as AssignmentExpression).right;
    } catch (e) {
        throw new Error('Failed to parse function expression: Can\'t parse native functions');
    }
    if (!['ArrowFunctionExpression', 'FunctionExpression'].includes(result.type)) {
        throw new Error('Failed to parse function expression: Value was not a function expression');
    }
    return functionParseCache[source] = result as BaseFunction;
}

export type OrderDirection = 'asc' | 'desc';
export interface Order {
    direction: OrderDirection;
    expression: BaseFunction;
}

export type JoinType = 'left' | 'right' | 'inner';
export interface Join {
    tableName: Identifier;
    type: JoinType;
    expression: BaseFunction;
}

export interface QueryParams {
    [key: string]: string | number | null;
}

export interface Query {
    where?: BaseFunction;
    orders?: Order[];
    limit?: number;
    offset?: number;
    joins?: Join[];
    params?: QueryParams;
}

export interface Queryable<T = {}> {
    with(params: QueryParams): Queryable<T>;
    where(fn: ExpressionFunction<T>): Queryable<T>;
    orderBy(fn: ExpressionFunction<T>, direction?: OrderDirection): Queryable<T>;
    slice(offset: number): Queryable<T>;
    take(amount: number): Queryable<T>;
    join(tableName: Identifier, type: JoinType, expr: ExpressionFunction<T>): Queryable<T>;
    leftJoin(tableName: Identifier, expr: ExpressionFunction<T>): Queryable<T>;
    rightJoin(tableName: Identifier, expr: ExpressionFunction<T>): Queryable<T>;
    innerJoin(tableName: Identifier, expr: ExpressionFunction<T>): Queryable<T>;
    select<M = T>(fn?: SelectorFunction<T>): Promise<M[]>;
    stream<M = T>(fn?: SelectorFunction<T>): AsyncIterator<M>;
    [Symbol.asyncIterator](): Promise<AsyncIterator<T>>;
}

export class QueryBuilder<T = {}> implements Queryable<T> {
    public readonly connection: Connection;
    public readonly databaseName: Identifier;
    public readonly query: Query;

    private tableName: Identifier | undefined;

    constructor(connection: Connection, databaseName: Identifier, tableName?: Identifier) {
        this.connection = connection;
        this.databaseName = databaseName;
        this.tableName = tableName;
        this.query = {};
    }

    public from(tableName: Identifier) {
        this.tableName = tableName;
        return this;
    }

    public with(params: QueryParams) {
        if (!this.query.params) {
            this.query.params = {};
        }
        Object.assign(this.query.params, params);
        return this;
    }

    public where(fn: ExpressionFunction<T>) {
        this.query.where = parseFunctionExpression(fn);
        return this;
    }

    public orderBy(fn: ExpressionFunction<T>, direction: OrderDirection = 'asc') {
        if (!this.query.orders) {
            this.query.orders = [];
        }
        this.query.orders.push({
            direction,
            expression: parseFunctionExpression(fn),
        });
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

    public join(
        tableName: Identifier,
        type: JoinType,
        expr: ExpressionFunction<T>,
    ): this {
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

    public leftJoin(tableName: Identifier, expr: ExpressionFunction<T>): this {
        return this.join(tableName, 'left', expr);
    }

    public rightJoin(tableName: Identifier, expr: ExpressionFunction<T>): this {
        return this.join(tableName, 'left', expr);
    }

    public innerJoin(tableName: Identifier, expr: ExpressionFunction<T>): this {
        return this.join(tableName, 'left', expr);
    }

    public select<M = T>(fn?: SelectorFunction<T>) {
        if (!this.tableName) {
            throw new Error('Failed to execute query: No table selected. Use from() to select a table.');
        }
        const selector = fn ? parseFunctionExpression(fn) : undefined;
        return this.connection.driver.select<T, M>(this.databaseName, this.tableName, this.query, selector);
    }

    public stream<M = T>(fn?: SelectorFunction<T>) {
        if (!this.tableName) {
            throw new Error('Failed to execute query: No table selected. Use from() to select a table.');
        }
        const selector = fn ? parseFunctionExpression(fn) : undefined;
        return this.connection.driver.stream<T, M>(this.databaseName, this.tableName, this.query, selector);
    }

    public async [Symbol.asyncIterator]() {
        return this.stream();
    }
}
