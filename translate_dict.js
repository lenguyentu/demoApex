import { translate } from "@vitalets/google-translate-api";
import fs from "fs";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
    const dict = JSON.parse(fs.readFileSync("translations_dict.json", "utf-8"));
    const translatedDict = {};
    
    // Check if there is already a partially translated file
    if (fs.existsSync("translated_dict.json")) {
        Object.assign(translatedDict, JSON.parse(fs.readFileSync("translated_dict.json", "utf-8")));
    }

    const keys = Object.keys(dict);
    let count = 0;
    
    for (const key of keys) {
        if (translatedDict[key]) continue; // Skip already translated
        
        try {
            const res = await translate(key, { to: 'en' });
            translatedDict[key] = res.text;
            count++;
            
            if (count % 50 === 0) {
                console.log(`Translated ${count} strings...`);
                // Save periodically
                fs.writeFileSync("translated_dict.json", JSON.stringify(translatedDict, null, 2), "utf-8");
            }
            // Small delay to avoid rate limiting
            await delay(50);
        } catch (e) {
            console.error(`Error translating: ${key}`, e.message);
            // Save and break or continue
            fs.writeFileSync("translated_dict.json", JSON.stringify(translatedDict, null, 2), "utf-8");
            
            if (e.name === "TooManyRequestsError" || e.statusCode === 429) {
                console.log("Rate limited! Stopping for now. Rerun script to continue.");
                break;
            }
        }
    }
    
    fs.writeFileSync("translated_dict.json", JSON.stringify(translatedDict, null, 2), "utf-8");
    console.log("Translation process finished.");
}

run();
