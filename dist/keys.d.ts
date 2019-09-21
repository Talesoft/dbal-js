import { Identifier } from "./common";
export declare enum KeyType {
    INDEX = 0,
    PRIMARY = 1,
    UNIQUE = 2,
    FOREIGN = 3
}
export interface Key {
    type: KeyType;
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
export interface ForeignKey extends Key {
    referencedTableName: Identifier;
    referencedColumnNames: Identifier[];
}
