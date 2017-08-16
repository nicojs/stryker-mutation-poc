import * as sourceMap from 'source-map';
import * as ts from 'typescript';

export interface TranspiledFile {
    fileName: string;
    content: string;
    sourceMapFileName?: string;
    sourceMap?: sourceMap.SourceMapConsumer;
    sourceFiles?: ts.SourceFile[]
}