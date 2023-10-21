import * as vsc from "vscode";

import Project from "./Project";

export default class Solution
{
  readonly projects;

  private constructor(projects: readonly Project[])
  {
    this.projects = projects;
  }

  static async find(directory: vsc.Uri)
  {
    let content = await vsc.workspace.fs.readDirectory(directory);

    return content.find(([file, type]) => type === vsc.FileType.File
                                       && file.endsWith(`.sln`))?.[0];
  }
  static async read(filePath: vsc.Uri)
  {
    let content = (await vsc.workspace.fs.readFile(filePath)).toString();

    let directory = vsc.Uri.parse(filePath.fsPath.match(/(.*\/)/)![1]);
    let projects = await Promise.all(
      [...content.matchAll(/Project\(".*?"\) = "(.*?)", "(?<path>.*?)"/g)]
                 .map(match => <{path: string}>match.groups!)
                 .map(({path}) => Project.read(vsc.Uri.joinPath(directory, path)))
    );

    return new Solution(projects);
  }
}