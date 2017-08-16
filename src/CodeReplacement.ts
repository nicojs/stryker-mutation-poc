import { Location, Range, Position } from 'stryker-api/core';
import * as ts from 'typescript';
import {  } from './tsHelpers';

export class CodeReplacement {

    static printer = ts.createPrinter({
        removeComments: false,
        newLine: ts.NewLineKind.CarriageReturnLineFeed
    });

    constructor(public original: ts.Node, public replacement: ts.Node, public sourceFile: ts.SourceFile, public replacementJavaScript?: string) { }

    get replacementText() {
        return CodeReplacement.printer.printNode(ts.EmitHint.Unspecified, this.replacement, this.sourceFile);
    }

    get originalText(){
        return this.original.getFullText(this.sourceFile);
    }

    get range() {
        return CodeReplacement.createRange(this.original, this.sourceFile);
    }

    static createLocation(node: ts.Node, sourceFile: ts.SourceFile) {
        const lineCharStart: ts.LineAndCharacter = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        const lineCharEnd: ts.LineAndCharacter = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        const start: Position = { line: lineCharStart.line, column: lineCharStart.character };
        const end: Position = { line: lineCharEnd.line, column: lineCharEnd.character };
        return { start, end };
    }

    static createRange(node: ts.Node, sourceFile: ts.SourceFile): Range {
        return [node.getStart(sourceFile), node.getEnd()]; // matches shape of Range
    }
}