export declare type Type = string;
export interface TypeInfo {
    type: Type;
    args: Array<string | number>;
    nullable: boolean;
    unsigned: boolean;
}
export interface TypeConverter<L, R = string> {
    toLocalValue(value: L, typeInfo: TypeInfo): R;
    toRemoteValue(value: R, typeInfo: TypeInfo): L;
}
export interface TypeInstruction {
    keyword: string;
    args: Array<string | number>;
}
export declare function parseTypeArgumentString(value: string): (string | number)[];
export declare function parseTypeInstructionString(value: string): Array<TypeInstruction>;
export declare function parseTypeInfoString(value: string): TypeInfo;
