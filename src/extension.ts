import * as vsc from "vscode";

import Configuration from "./types/Configuration";
import CSharpConfiguration from "./types/CSharpConfiguration";
import Task from "./types/Task";
import Solution from "./types/Solution";

const selectActiveProjectCommandString = `csharp-active-project.selectProject`;

export async function activate({subscriptions}: vsc.ExtensionContext)
{
  let workspace = vsc.workspace.workspaceFolders?.[0].uri;
  if (workspace == null) return;

  if (await Solution.find(workspace) == null) return;

  let csharpLaunchConfiguration = readCSharpActiveProjectLaunchConfiguration();
  if (csharpLaunchConfiguration == null) return;

  let activeProjectName = csharpLaunchConfiguration.program.match(/.*\/(.*?)\.dll/)![1];

  let activeProjectStatusBarItem = vsc.window.createStatusBarItem(vsc.StatusBarAlignment.Left);
  activeProjectStatusBarItem.command = selectActiveProjectCommandString;
  activeProjectStatusBarItem.text = `$(breakpoints-view-icon) ${activeProjectName}`;
  activeProjectStatusBarItem.show();
  subscriptions.push(activeProjectStatusBarItem);

  let selectActiveProjectCommand = vsc.commands.registerCommand(selectActiveProjectCommandString, async () => {
    let solutionFilePath = (await Solution.find(workspace!))!;

    let solution = await Solution.read(vsc.Uri.joinPath(workspace!, solutionFilePath));
    let projects = solution.projects.filter(project => project.outputType != null
                                                    && project.outputType !== `Library`);

    let selectedProjectName = await vsc.window.showQuickPick(projects.map(project => project.name));
    if (selectedProjectName == null) return;

    let selectedProject = projects.find(project => (project.name === selectedProjectName))!;

    let launchConfiguration = readCSharpActiveProjectLaunchConfiguration()!;
    let buildTask = readCSharpActiveProjectBuildTask()!;

    launchConfiguration.program = `${selectedProject.directory.replace(workspace!.fsPath, `\${workspaceFolder}`)}/bin/Debug/${selectedProject.targetFramework}/${selectedProject.name}.dll`;
    await writeCSharpActiveProjectLaunchConfiguration(launchConfiguration);

    buildTask.args[1] = selectedProject.path.replace(workspace!.fsPath, `\${workspaceFolder}`);
    await writeCSharpActiveProjectBuildTask(buildTask);

    let activeProjectName = selectedProject.name;
    activeProjectStatusBarItem.text = `$(breakpoints-view-icon) ${activeProjectName}`;
  });
  subscriptions.push(selectActiveProjectCommand);
}

function readCSharpActiveProjectLaunchConfiguration()
{
  let launch = vsc.workspace.getConfiguration(`launch`);

  let launchConfigurations = launch.get<Configuration[]>(`configurations`);
  if (launchConfigurations == null) return null;

  if (launchConfigurations.length === 0) return null;
  let launchConfiguration = launchConfigurations[0];

  let csharpLaunchConfiguration = CSharpConfiguration.tryConvert(launchConfiguration);

  return csharpLaunchConfiguration;
}
function writeCSharpActiveProjectLaunchConfiguration(csharpActiveProjectLaunchConfiguration: Configuration)
{
  let launch = vsc.workspace.getConfiguration(`launch`);

  let launchConfigurations = launch.get<Configuration[]>(`configurations`)!;

  launchConfigurations[0] = csharpActiveProjectLaunchConfiguration;

  return launch.update(`configurations`, launchConfigurations);
}

function readCSharpActiveProjectBuildTask()
{
  let tasks = vsc.workspace.getConfiguration(`tasks`);

  let tasksTasks = tasks.get<Task[]>(`tasks`);
  if (tasksTasks == null) return null;

  if (tasksTasks.length === 0) return null;
  let task = tasksTasks[0];

  return task;
}
function writeCSharpActiveProjectBuildTask(csharpActiveProjectBuildTask: Task)
{
  let tasks = vsc.workspace.getConfiguration(`tasks`);

  let tasksTasks = tasks.get<Task[]>(`tasks`)!;

  tasksTasks[0] = csharpActiveProjectBuildTask;

  return tasks.update(`tasks`, tasksTasks);
}