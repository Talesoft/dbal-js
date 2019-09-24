
export type Type = string;

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

export function parseTypeArgumentString(value: string) {
    let str = value;
    const pattern = /^"([^"]+"|[\d.]+)(?:\s*,\s*|$)/;
    const args: Array<string | number> = [];
    while (str.length > 0) {
        const matches = str.match(pattern);
        if (!matches) {
            break;
        }
        const [match, argValue] = matches;
        let finalArgValue: string | number = argValue;
        if (!argValue.startsWith('"')) {
            finalArgValue = argValue.indexOf('.') !== -1 ? parseFloat(finalArgValue) : parseInt(finalArgValue, 10);
        } else {
            finalArgValue = argValue.substr(1, argValue.length - 2);
        }
        args.push(finalArgValue);
        str = str.substr(match.length);
    }
    return args;
}

export function parseTypeInstructionString(value: string): TypeInstruction[] {
    let str = value;
    const pattern = /^([\w\d_]+)(?:\(([^)]+)\))?(?: |$)/;
    const instructions = [];
    while (str.length > 0) {
        const matches = str.match(pattern);
        if (!matches) {
            break;
        }
        const [match, keyword, args] = matches;
        instructions.push({ keyword: keyword.toUpperCase(), args: args ? parseTypeArgumentString(args) : [] });
        str = str.substr(match.length);
    }
    return instructions;
}

export function parseTypeInfoString(value: string): TypeInfo {
    const instructions = parseTypeInstructionString(value);
    if (instructions.length < 1) {
        throw new Error('Failed to parse type: No type instructions found');
    }
    let nullable = false;
    const nullInstruction = instructions.find(i => i.keyword === 'NULL');
    if (nullInstruction) {
        const idx = instructions.indexOf(nullInstruction);
        nullable = idx === 0 || instructions[idx - 1].keyword !== 'NOT';
    }
    return {
        nullable,
        type: instructions[0].keyword,
        typeParams: instructions[0].args,
        unsigned: !!instructions.find(i => i.keyword === 'UNSIGNED'),
    };
}
