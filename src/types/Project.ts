import * as vsc from "vscode";

export default class Project
{
  readonly path;
  readonly name;
  readonly directory;
  readonly outputType;
  readonly targetFramework;

  private constructor(path: string,
                      name: string,
                      directory: string,
                      type: string|undefined,
                      targetFramework: string)
  {
    this.path = path;
    this.name = name;
    this.directory = directory;
    this.outputType = type;
    this.targetFramework = targetFramework;
  }

  static async read(filePath: vsc.Uri)
  {
    filePath = filePath.with({path: filePath.path.replaceAll(`\\`, `/`)});
    let content = (await vsc.workspace.fs.readFile(filePath)).toString();

    return new Project(
      filePath.fsPath,
      filePath.fsPath.match(/.*\/(.*?)\.csproj/)![1],
      filePath.fsPath.match(/(.*)\/.*?\.csproj/)![1],
      content.match(/<OutputType>(.*?)<\/OutputType>/)?.[1],
      content.match(/<TargetFramework>(.*?)<\/TargetFramework>/)![1]
    );
  }
}