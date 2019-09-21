import { Identifier } from "./common";

export enum KeyType {
    INDEX,
    PRIMARY,
    UNIQUE,
    FOREIGN,
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
