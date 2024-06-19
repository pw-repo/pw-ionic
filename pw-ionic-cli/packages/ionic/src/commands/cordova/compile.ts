import chalk from 'chalk';

import { CommandLineInputs, CommandLineOptions, CommandPreRun } from 'pw-ionic-cli-utils';
import { CommandMetadata } from 'pw-ionic-cli-utils/lib/command';
import { CORDOVA_INTENT, filterArgumentsForCordova } from 'pw-ionic-cli-utils/lib/cordova/utils';

import { CordovaCommand } from './base';

@CommandMetadata({
  name: 'compile',
  type: 'project',
  description: 'Compile native platform code',
  longDescription: `
Like running ${chalk.green('cordova compile')} directly, but provides friendly checks.
  `,
  exampleCommands: [
    'ios',
    'ios --device',
    'android',
  ],
  inputs: [
    {
      name: 'platform',
      description: `The platform to compile (${['android', 'ios'].map(v => chalk.green(v)).join(', ')})`,
    },
  ],
  options: [
    {
      name: 'debug',
      description: 'Create a Cordova debug build',
      type: Boolean,
      intents: [CORDOVA_INTENT],
    },
    {
      name: 'release',
      description: 'Create a Cordova release build',
      type: Boolean,
      intents: [CORDOVA_INTENT],
    },
    {
      name: 'device',
      description: 'Compile Cordova build to a device',
      type: Boolean,
      intents: [CORDOVA_INTENT],
    },
    {
      name: 'emulator',
      description: 'Compile Cordova build to an emulator',
      type: Boolean,
      intents: [CORDOVA_INTENT],
    },
  ],
})
export class CompileCommand extends CordovaCommand implements CommandPreRun {
  async preRun(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    await this.preRunChecks();

    if (!inputs[0]) {
      const platform = await this.env.prompt({
        type: 'input',
        name: 'platform',
        message: `What platform would you like to compile (${['android', 'ios'].map(v => chalk.green(v)).join(', ')}):`
      });

      inputs[0] = platform.trim();
    }

    await this.checkForPlatformInstallation(inputs[0]);
  }

  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    await this.runCordova(filterArgumentsForCordova(this.metadata, inputs, options), { showExecution: true });
  }
}
