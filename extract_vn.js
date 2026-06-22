import { Project, SyntaxKind } from "ts-morph";
import fs from "fs";

const project = new Project({
    tsConfigFilePath: "tsconfig.app.json", // Or tsconfig.json depending on setup
});

project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");

const vnRegex = /[áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/i;
const translations = {};

const sourceFiles = project.getSourceFiles();

for (const sourceFile of sourceFiles) {
    sourceFile.forEachDescendant((node) => {
        let text = "";
        
        if (node.isKind(SyntaxKind.StringLiteral)) {
            text = node.getLiteralValue();
        } else if (node.isKind(SyntaxKind.JsxText)) {
            text = node.getLiteralText();
            // JsxText might contain lots of whitespace and newlines, we should trim it but be careful.
            // Actually, keep the exact string for replacement, or trim and replace with trimmed.
            // Let's just store the exact string for now, but maybe trim surrounding newlines.
            text = text.trim();
        } else if (node.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
            text = node.getLiteralValue();
        }
        
        if (text && vnRegex.test(text)) {
            translations[text] = text;
        }
    });
}

fs.writeFileSync("translations_dict.json", JSON.stringify(translations, null, 2), "utf-8");
console.log(`Extracted ${Object.keys(translations).length} unique Vietnamese strings.`);
