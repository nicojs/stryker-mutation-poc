import { CodeReplacement } from './CodeReplacement';
import * as fs from 'fs';
import * as ts from 'typescript';

export class MutableLanguageServiceHost implements ts.LanguageServiceHost {

    private readonly originalFiles: ts.MapLike<{ version: number, content: string }>;
    private readonly compilerOptions: ts.CompilerOptions;
    private currentMutatedFiles: ts.MapLike<string>;

    constructor(private tsconfig: ts.ParsedCommandLine) {
        this.originalFiles = Object.create(null);
        tsconfig.fileNames.forEach(fileName => this.pullInFile(fileName));
        this.compilerOptions = tsconfig.options;
        this.currentMutatedFiles = Object.create(null);
    }

    pullInFile(fileName: string, encoding: string = 'utf8') {
        if (fs.existsSync(fileName)) {
            console.log(`Pulling in ${fileName}`);
            this.originalFiles[fileName] = { version: 0, content: fs.readFileSync(fileName, 'utf8') };
        } else {
            console.log(`File ${fileName} does not exist`);
        }
    }

    mutate(replacement: CodeReplacement) {
        const fileName = replacement.sourceFile.fileName;
        const originalCode = this.originalFiles[fileName].content;
        this.currentMutatedFiles[fileName] =
            originalCode.slice(0, replacement.range[0]) + replacement.replacementText + originalCode.slice(replacement.range[1])
        this.originalFiles[fileName].version++;
        // console.log(`Mutated! ${this.originalFiles[fileName].content} became ${this.currentMutatedFiles[fileName]}`)
    }

    restore() {
        const mutatedFiles = Object.keys(this.currentMutatedFiles);
        if (mutatedFiles.length > 0) {
            mutatedFiles.forEach(fileName => this.originalFiles[fileName].version++);
            this.currentMutatedFiles = Object.create(null);
        }
    }

    getScriptFileNames() {
        return this.tsconfig.fileNames;
    }
    getScriptVersion(fileName: string) {
        if (!this.originalFiles[fileName]) {
            this.pullInFile(fileName);
        }
        return this.originalFiles[fileName] && this.originalFiles[fileName].version.toString();
    }

    getScriptSnapshot(fileName: string) {
        const mutatedContent = this.currentMutatedFiles[fileName];
        if (mutatedContent) {
            return ts.ScriptSnapshot.fromString(mutatedContent);
        } else {
            if (!this.originalFiles[fileName]) {
                this.pullInFile(fileName);
            }
            const file = this.originalFiles[fileName];
            if (file) {
                return ts.ScriptSnapshot.fromString(file.content);
            } else {
                return undefined;
            }
        }
    }

    getCurrentDirectory() {
        return process.cwd();
    }
    getCompilationSettings() {
        return this.compilerOptions;
    }
    getDefaultLibFileName(options: ts.CompilerOptions) {
        return ts.getDefaultLibFilePath(options);
    }
    fileExists(path: string) {
        return ts.sys.fileExists(path);
    }
    readFile(path: string, encoding?: string) {
        return ts.sys.readFile(path, encoding);
    }
    readDirectory(path: string, extensions?: string[], exclude?: string[], include?: string[]) {
        return ts.sys.readDirectory(path, extensions, exclude, include);
    }
};