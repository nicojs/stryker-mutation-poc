import { CodeReplacement } from './CodeReplacement';

export class Mutant {
    constructor(public codeReplacement: CodeReplacement, mutatedSourceFileCode: string){
    }


}