import 'tslib';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as _ from 'lodash';
import { TranspiledFile } from './TranspiledFile';
import { SourceFile } from 'stryker-api/report';
import { SourceMapConsumer, MappingItem } from 'source-map';
import { CodeReplacement } from './CodeReplacement';
import { MutantValidator } from './MutantValidator';
import BinaryExpressionMutator from './mutators/BinaryExpressionMutator';
import { MutableLanguageServiceHost } from './MutableLanguageServiceHost';
import { Mutant } from './Mutant';
import { parseConfigFile, filterValues } from './tsHelpers';


const tsconfigPath = path.resolve(__dirname, '..', 'tsconfig.json');
const tsconfig = parseConfigFile(tsconfigPath);

const mutators = [new BinaryExpressionMutator()];
const validator = new MutantValidator(tsconfig);


function findReplacements(node: ts.Node, sourceFile: ts.SourceFile): CodeReplacement[] {

    const mutatedNodes = _.flatMap(mutators, mutator => {
        if (mutator.syntaxTargets.indexOf(node.kind) !== -1) {
            return mutator.mutate(node, sourceFile);
        } else {
            return [];
        }
    }).map(mutatedNode => {
        console.log(`Replacing ${mutatedNode.originalText} with ${mutatedNode.replacementText}`);
        return mutatedNode;
    });
    node.forEachChild(child => {
        findReplacements(child, sourceFile).forEach(replacement => mutatedNodes.push(replacement));
    });
    return mutatedNodes;
}


const program = ts.createProgram(tsconfig.fileNames, tsconfig.options);
const allSourceFiles = program.getSourceFiles();

const replacements = _.flatMap(allSourceFiles,
    sourceFile => findReplacements(sourceFile, sourceFile));


console.log(`Found ${replacements.length} replacements`);
const valid: Mutant[] = [];
let invalid = 0;
console.time('Validating');

const validReplacements = replacements.filter(replacement => {
    const mutant = validator.validateMutant(replacement);
    if (mutant) {
        valid.push(mutant);
        console.log(`${valid.length + invalid} validated. ${valid.length} valid, ${replacements.length - (valid.length + invalid)} to go`);
        return true;
    } else {
        invalid++;
        return false;
    }
});
console.timeEnd('Validating');
console.log(`${validReplacements.length}/${replacements.length} valid`);

const transpiledFiles: ts.MapLike<TranspiledFile> = Object.create(null);

program.emit(/*targetSourceFile */undefined, /*writeFile*/(fileName, content, writeByteOrderMark, /*onError*/ undefined, sourceFiles) => {
    if (fileName.endsWith('.js.map')) {
        const transpiledFileName = fileName.substr(0, fileName.length - 4);
        const sourceMap = new SourceMapConsumer(content);
        const transpiledFile = transpiledFiles[transpiledFileName];
        if (!transpiledFile) {
            transpiledFiles[transpiledFileName] = {
                fileName: transpiledFileName,
                sourceMapFileName: fileName,
                content: '', // comes later
                sourceMap,
                sourceFiles
            };
        } else {
            transpiledFile.sourceMap = sourceMap;
            transpiledFile.sourceMapFileName = fileName;
        }
    } else if (fileName.endsWith('.js')) {
        const transpiledFile = transpiledFiles[fileName];
        if (transpiledFile) {
            transpiledFile.content = content;
        } else {
            transpiledFiles[fileName] = {
                fileName,
                content,
                sourceFiles
            };
        }
    }
});



validReplacements.forEach(replacement => {
    const sourceFile = replacement.sourceFile;
    const sourceFileName = sourceFile.fileName;
    const transpiledFile = Object.keys(transpiledFiles).filter(transpiledFileName => {
        const transpiledFile = transpiledFiles[transpiledFileName];
        return transpiledFile.sourceFiles && transpiledFile.sourceFiles.some(_ => _.fileName === sourceFileName);
    }).map(transpiledFileName => transpiledFiles[transpiledFileName])[0];

    const positionStart = ts.getLineAndCharacterOfPosition(sourceFile, replacement.original.pos);
    const positionEnd = ts.getLineAndCharacterOfPosition(sourceFile, replacement.original.end);
    const transpiledLines = transpiledFile.content.split('\n');
    if (transpiledFile.sourceMap && transpiledFile.sourceMapFileName) {
        const sourceFileNameRelative = path.basename(sourceFileName);
        const start = transpiledFile.sourceMap.generatedPositionFor({
            source: sourceFileNameRelative,
            line: positionStart.line + 1,
            column: positionStart.character + 1
        });
        const end = transpiledFile.sourceMap.generatedPositionFor({
            source: sourceFileNameRelative,
            line: positionEnd.line + 1,
            column: positionEnd.character + 1,
            bias: SourceMapConsumer.GREATEST_LOWER_BOUND
        });
        if (start.line && start.column && end.line && end.column && start.line === end.line) {
            const line = transpiledLines[start.line - 1];
            console.log(`- ${line}\n+${line.slice(0, start.column)}${replacement.replacementText}${line.slice(end.column - 1)}`);
        }
    }
});

console.log('done');