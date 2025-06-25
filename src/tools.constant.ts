import toolsJson from '../resources/tools.json';

const gradleParseVersion = (output: string) =>
  output.match(/Gradle\s+(\d+\.\d+\.\d+)/)?.[1] ?? '';

export const tools = toolsJson.map((tool: any) => {
  if (tool.name === 'Gradle') {
    return { ...tool, parseVersion: gradleParseVersion };
  }

  return tool;
});
