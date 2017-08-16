import * as ts from 'typescript';
import { CodeReplacement } from '../CodeReplacement';
import { cloneNode } from '../tsHelpers';

export default class BinaryExpressionMutator {

    // replaceTokens: { [n: number]: string[] } = {
    //     [ts.SyntaxKind.PlusToken]: ['-'],
    //     [ts.SyntaxKind.MinusToken]: ['+'],
    //     [ts.SyntaxKind.SlashToken]: ['*'],
    //     [ts.SyntaxKind.AsteriskToken]: ['/'],
    //     [ts.SyntaxKind.PercentToken]: ['*'],
    //     [ts.SyntaxKind.LessThanToken]: ['<=', '>='],
    //     [ts.SyntaxKind.LessThanEqualsToken]: ['<', '>'],
    //     [ts.SyntaxKind.GreaterThanToken]: ['<=', '>='],
    //     [ts.SyntaxKind.GreaterThanEqualsToken]: ['<', '>'],
    //     [ts.SyntaxKind.EqualsEqualsToken]: ['!='],
    //     [ts.SyntaxKind.ExclamationEqualsToken]: ['=='],
    //     [ts.SyntaxKind.EqualsEqualsEqualsToken]: ['!=='],
    //     [ts.SyntaxKind.ExclamationEqualsEqualsToken]: ['==='],
    // };

    replaceTokens: { [n: number]: ts.BinaryOperator[] } = {
        [ts.SyntaxKind.PlusToken]: [ts.SyntaxKind.MinusToken],
        [ts.SyntaxKind.MinusToken]: [ts.SyntaxKind.PlusToken],
        [ts.SyntaxKind.SlashToken]: [ts.SyntaxKind.AsteriskToken],
        [ts.SyntaxKind.AsteriskToken]: [ts.SyntaxKind.SlashToken],
        [ts.SyntaxKind.PercentToken]: [ts.SyntaxKind.AsteriskToken],
        [ts.SyntaxKind.LessThanToken]: [ts.SyntaxKind.LessThanEqualsToken, ts.SyntaxKind.GreaterThanEqualsToken],
        [ts.SyntaxKind.LessThanEqualsToken]: [ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken],
        [ts.SyntaxKind.GreaterThanToken]: [ts.SyntaxKind.LessThanEqualsToken, ts.SyntaxKind.GreaterThanEqualsToken],
        [ts.SyntaxKind.GreaterThanEqualsToken]: [ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken],
        [ts.SyntaxKind.EqualsEqualsToken]: [ts.SyntaxKind.ExclamationEqualsToken],
        [ts.SyntaxKind.ExclamationEqualsToken]: [ts.SyntaxKind.EqualsEqualsToken],
        [ts.SyntaxKind.EqualsEqualsEqualsToken]: [ts.SyntaxKind.ExclamationEqualsEqualsToken],
        [ts.SyntaxKind.ExclamationEqualsEqualsToken]: [ts.SyntaxKind.EqualsEqualsEqualsToken],
    };

    public syntaxTargets: ts.SyntaxKind[] = [ts.SyntaxKind.BinaryExpression];

    public mutate(node: ts.Node, sourceFile: ts.SourceFile): CodeReplacement[] {
        const binaryExpression = (<ts.BinaryExpression>node);
        if (this.replaceTokens[binaryExpression.operatorToken.kind]) {
            return this.replaceTokens[binaryExpression.operatorToken.kind].map(replacement => {
                return new CodeReplacement(binaryExpression.operatorToken, ts.createToken(replacement), sourceFile);
            });
        } else {
            return [];
        }
    }
    name: string = 'BinaryExpressionMutator';
}