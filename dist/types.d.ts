export declare type Type = string;
export interface TypeInfo {
    type: Type;
    typeParams: Array<string | number>;
    nullable: boolean;
    unsigned: boolean;
}
export interface TypeInstruction {
    keyword: string;
    args: Array<string | number>;
}
export declare function parseTypeArgumentString(value: string): (string | number)[];
export declare function parseTypeInstructionString(value: string): TypeInstruction[];
export declare function parseTypeInfoString(value: string): TypeInfo;
