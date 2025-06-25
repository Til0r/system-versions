#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { tools } from '../src/tools.constant';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Tool = (typeof tools)[number];

function generateToolsTable(): string {
  const tableHeader = `| Tool | Command |
|------|---------|`;

  const tableRows = tools
    .map((tool: Tool) => `| ${tool.name} | \`${tool.command}\` |`)
    .join('\n');

  return `${tableHeader}\n${tableRows}`;
}

function updateReadme(): void {
  const readmePath = join(__dirname, '../README.md');

  try {
    let readmeContent = readFileSync(readmePath, 'utf8');

    const toolsTable = generateToolsTable();
    const toolsSection = `## Supported Tools\n\n${toolsTable}\n\n*Total tools supported: ${tools.length}*\n\n> This table is auto-generated from the source code. Run \`npm run update-readme\` to refresh.`;

    // Define markers for the tools section
    const startMarker = '<!-- TOOLS_TABLE_START -->';
    const endMarker = '<!-- TOOLS_TABLE_END -->';

    // Check if markers exist
    if (
      readmeContent.includes(startMarker) &&
      readmeContent.includes(endMarker)
    ) {
      // Replace existing section
      const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
      readmeContent = readmeContent.replace(
        regex,
        `${startMarker}\n${toolsSection}\n${endMarker}`
      );
    } else {
      // Add new section at the end
      readmeContent += `\n\n${startMarker}\n${toolsSection}\n${endMarker}\n`;
    }

    writeFileSync(readmePath, readmeContent);
    console.log('✅ README.md updated successfully!');
    console.log(`📊 Added table with ${tools.length} supported tools`);
  } catch (error: any) {
    console.error('❌ Error updating README.md:', error.message);

    if (error.code === 'ENOENT') {
      console.error('💡 Make sure README.md exists in the project root');
    }

    process.exit(1);
  }
}

// Run the script
updateReadme();
