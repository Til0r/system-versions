#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const tools = JSON.parse(readFileSync(new URL('../resources/tools.json', import.meta.url), 'utf8'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateToolsTable() {
    const tableHeader = `| Tool | Command |
|------|---------|`;

    const tableRows = tools.map(tool =>
        `| ${tool.name} | \`${tool.command}\` |`
    ).join('\n');

    return `${tableHeader}\n${tableRows}`;
}

function updateReadme() {
    const readmePath = join(__dirname, '../README.md');

    try {
        let readmeContent = readFileSync(readmePath, 'utf8');

        const toolsTable = generateToolsTable();
        const toolsSection = `## 🛠️ Supported Tools

${toolsTable}`;

        // Define markers for the tools section
        const startMarker = '<!-- TOOLS_TABLE_START -->';
        const endMarker = '<!-- TOOLS_TABLE_END -->';

        // Check if markers exist
        if (readmeContent.includes(startMarker) && readmeContent.includes(endMarker)) {
            // Replace content between markers
            const regex = new RegExp(`(${startMarker})[\\s\\S]*?(${endMarker})`, 'g');
            readmeContent = readmeContent.replace(regex, `$1\n${toolsSection}\n$2`);
        } else {
            console.error('❌ Markers not found in README.md');
            console.error('Please add the following markers to your README.md:');
            console.error('<!-- TOOLS_TABLE_START -->');
            console.error('<!-- TOOLS_TABLE_END -->');
            process.exit(1);
        }

        writeFileSync(readmePath, readmeContent);
        console.log('✅ README.md updated successfully!');
        console.log(`📊 Added table with ${tools.length} supported tools`);

    } catch (error) {
        console.error('❌ Error updating README.md:', error.message);

        if (error.code === 'ENOENT') {
            console.error('💡 Make sure README.md exists in the project root');
        }

        process.exit(1);
    }
}

// Run the script
updateReadme();