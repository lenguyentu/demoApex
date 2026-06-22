import { Project, SyntaxKind } from "ts-morph";
import fs from "fs";

const project = new Project({
    tsConfigFilePath: "tsconfig.app.json", // Or tsconfig.json depending on setup
});

project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");

const dict = JSON.parse(fs.readFileSync("translated_dict.json", "utf-8"));
const sourceFiles = project.getSourceFiles();

let changedFilesCount = 0;

for (const sourceFile of sourceFiles) {
    let hasChanges = false;

    sourceFile.forEachDescendant((node) => {
        if (node.isKind(SyntaxKind.StringLiteral)) {
            const text = node.getLiteralValue();
            if (dict[text]) {
                node.setLiteralValue(dict[text]);
                hasChanges = true;
            }
        } else if (node.isKind(SyntaxKind.JsxText)) {
            const originalText = node.getLiteralText();
            const trimmedText = originalText.trim();
            if (dict[trimmedText]) {
                // To preserve spacing, we replace the trimmed part within the original
                const newText = originalText.replace(trimmedText, dict[trimmedText]);
                // Workaround to set JsxText, ts-morph doesn't have setLiteralText for JsxText directly easily,
                // but we can replace with text.
                node.replaceWithText(newText);
                hasChanges = true;
            } else if (dict[originalText]) {
                 node.replaceWithText(dict[originalText]);
                 hasChanges = true;
            }
        } else if (node.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
            const text = node.getLiteralValue();
            if (dict[text]) {
                node.setLiteralValue(dict[text]);
                hasChanges = true;
            }
        }
    });

    if (hasChanges) {
        sourceFile.saveSync();
        changedFilesCount++;
    }
}

console.log(`Successfully updated ${changedFilesCount} files with English translations.`);
