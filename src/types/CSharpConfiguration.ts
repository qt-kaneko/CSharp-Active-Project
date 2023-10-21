import Configuration from "./Configuration";

export default class CSharpConfiguration extends Configuration
{
  program = ``;

  static tryConvert(configuration: Configuration)
  {
    if (configuration.type !== `coreclr`) return null;
    else return <CSharpConfiguration>configuration;
  }
}