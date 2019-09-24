import { Identifier } from './common';
import { TableView } from './tables';
export declare enum KeyType {
    INDEX = 0,
    PRIMARY = 1,
    UNIQUE = 2,
    FOREIGN = 3
}
export declare enum ForeignKeyUpdateRule {
    NO_ACTION = 0,
    RESTRICT = 1,
    CASCADE = 2,
    SET_NULL = 3
}
export interface Key {
    type: KeyType;
    name: string;
    columnNames: Identifier[];
}
export interface PrimaryKey extends Key {
    type: KeyType.PRIMARY;
}
export interface Index extends Key {
    type: KeyType.INDEX;
}
export interface UniqueKey extends Key {
    type: KeyType.UNIQUE;
}
export interface ForeignKeyUpdateRuleSet {
    onDelete: ForeignKeyUpdateRule;
    onUpdate: ForeignKeyUpdateRule;
}
export interface ForeignKey extends Key, ForeignKeyUpdateRuleSet {
    type: KeyType.FOREIGN;
    referencedTableName: Identifier;
    referencedColumnNames: Identifier[];
}
export declare class KeyView {
    readonly table: TableView;
    private data;
    private changed;
    constructor(table: TableView, name: Identifier);
    readonly connection: import("./connections").Connection;
    readonly database: import("./databases").DatabaseView;
    readonly name: string;
    load(): Promise<void>;
    hydrate(key: Key): Promise<void>;
    save(): Promise<void>;
    getData(): {
        type?: KeyType | undefined;
        name: string;
        columnNames?: string[] | undefined;
    };
}
