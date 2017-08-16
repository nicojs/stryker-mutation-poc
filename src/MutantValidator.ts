import { Mutant } from './Mutant';
import { CodeReplacement } from './CodeReplacement';
import { MutableLanguageServiceHost } from './MutableLanguageServiceHost';
import * as ts from 'typescript';
import * as os from 'os';

const diagnosticsFormatter: ts.FormatDiagnosticsHost = {
    getCurrentDirectory: process.cwd,
    getCanonicalFileName: fileName => fileName,
    getNewLine: () => os.EOL
}
export class MutantValidator {
    private languageService: ts.LanguageService;
    private host: MutableLanguageServiceHost;

    constructor(tsconfig: ts.ParsedCommandLine) {
        this.host = new MutableLanguageServiceHost(tsconfig);
        this.languageService = ts.createLanguageService(
            this.host,
            ts.createDocumentRegistry());
    }

    validateMutant(codeReplacement: CodeReplacement): Mutant | null {
        this.host.mutate(codeReplacement);
        const errors = this.languageService.getSemanticDiagnostics(codeReplacement.sourceFile.fileName);
        let mutant: Mutant | null = null;
        if (!errors.length) {
            this.host.restore();
            const output = this.languageService.getEmitOutput(codeReplacement.sourceFile.fileName).outputFiles.filter(file => file.name.endsWith('.js'));
            mutant = new Mutant(codeReplacement, output[0].text);
        }
        this.host.restore();
        return mutant;
    }
}