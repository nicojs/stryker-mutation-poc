import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export function parseConfigFile(configFileName: string): ts.ParsedCommandLine {
    const configFileBase = path.dirname(configFileName);
    const configFileText = fs.readFileSync(configFileName, 'utf8');
    const configFileJson = ts.parseConfigFileTextToJson(configFileName, configFileText).config;
    const configParseResult = ts.parseJsonConfigFileContent(configFileJson, ts.sys, configFileBase, { project: configFileBase }, configFileName);
    return configParseResult;
}

export function filterValues<T>(array: (T | null | undefined)[]): T[] {
    return array.filter(a => a !== null && a !== undefined) as T[];
}

