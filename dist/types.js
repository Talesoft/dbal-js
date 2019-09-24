"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseTypeArgumentString(value) {
    let str = value;
    const pattern = /^"([^"]+"|[\d.]+)(?:\s*,\s*|$)/;
    const args = [];
    while (str.length > 0) {
        const matches = str.match(pattern);
        if (!matches) {
            break;
        }
        const [match, argValue] = matches;
        let finalArgValue = argValue;
        if (!argValue.startsWith('"')) {
            finalArgValue = argValue.indexOf('.') !== -1 ? parseFloat(finalArgValue) : parseInt(finalArgValue, 10);
        }
        else {
            finalArgValue = argValue.substr(1, argValue.length - 2);
        }
        args.push(finalArgValue);
        str = str.substr(match.length);
    }
    return args;
}
exports.parseTypeArgumentString = parseTypeArgumentString;
function parseTypeInstructionString(value) {
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
exports.parseTypeInstructionString = parseTypeInstructionString;
function parseTypeInfoString(value) {
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
exports.parseTypeInfoString = parseTypeInfoString;
