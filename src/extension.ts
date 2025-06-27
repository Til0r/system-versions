import { exec } from 'child_process';
import * as os from 'os';
import * as vscode from 'vscode';
import { tools } from '../src/tools.constant';

interface Tool {
  name: string;
  command: string;
  parseVersion?: (output: string) => string;
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new ToolVersionProvider();
  vscode.window.registerTreeDataProvider('systemVersionsView', provider);

  // Refresh on extension activation
  provider.refresh();

  // Register manual refresh
  context.subscriptions.push(
    vscode.commands.registerCommand('syv.refresh', () => {
      provider.refresh();
    })
  );
}

export function deactivate() {}

function preferredShell(): string | undefined {
  if (os.platform() === 'win32') {
    return 'cmd.exe';
  }

  return undefined;
}

class ToolVersionProvider implements vscode.TreeDataProvider<ToolItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    ToolItem | undefined | void
  > = new vscode.EventEmitter<ToolItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ToolItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private items: ToolItem[] = [];
  private loading = false;

  refresh(): void {
    this.loading = true;
    this._onDidChangeTreeData.fire();
    const versionPromises = (tools as Tool[]).map(tool => {
      return new Promise<ToolItem | null>(resolve => {
        exec(
          tool.command,
          { shell: preferredShell() },
          (error, stdout, stderr) => {
            let output = (stdout || stderr || '').trim();

            if (this.isCommandNotFound(output) || error) {
              resolve(null);
              return;
            }

            output = this.cleanOutput(output);

            if (tool.parseVersion) {
              output = tool.parseVersion(output);
            }

            const label = `${tool.name}: ${output}`;
            resolve(new ToolItem(label));
          }
        );
      });
    });

    Promise.all(versionPromises).then(results => {
      this.items = results.filter(item => item !== null) as ToolItem[];
      this.items.sort((a, b) => a.label.localeCompare(b.label));
      this.loading = false;
      this._onDidChangeTreeData.fire();
    });
  }

  private isCommandNotFound(output: string): boolean {
    const notFoundIndicators = [
      'command not found',
      'not recognized',
      'unable to locate',
      'unknown argument',
      'is not recognized as an internal or external command',
    ];

    const lowerOutput = output.toLowerCase();
    return (
      output === '' ||
      notFoundIndicators.some(indicator => lowerOutput.includes(indicator))
    );
  }

  private cleanOutput(output: string): string {
    return output.replace(/\s+/g, ' ').split('\n')[0].trim();
  }

  getTreeItem(element: ToolItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<ToolItem[]> {
    if (this.loading) {
      return Promise.resolve([
        new ToolItem('Summoning tool versions from the void...'),
      ]);
    }
    return Promise.resolve(this.items);
  }
}

class ToolItem extends vscode.TreeItem {
  constructor(public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}
