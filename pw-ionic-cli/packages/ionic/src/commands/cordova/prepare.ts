import chalk from 'chalk';

import { CommandLineInputs, CommandLineOptions, CommandPreRun } from 'pw-ionic-cli-utils';
import { CommandMetadata } from 'pw-ionic-cli-utils/lib/command';
import { FatalException } from 'pw-ionic-cli-utils/lib/errors';
import { filterArgumentsForCordova, generateBuildOptions } from 'pw-ionic-cli-utils/lib/cordova/utils';
import { APP_SCRIPTS_OPTIONS } from 'pw-ionic-cli-utils/lib/ionic-angular/app-scripts';

import { CordovaCommand } from './base';

@CommandMetadata({
  name: 'prepare',
  type: 'project',
  description: 'Copies assets to Cordova platforms, preparing them for native builds',
  longDescription: `
${chalk.green('ionic cordova prepare')} will do the following:
- Copy the ${chalk.bold('www/')} directory into your Cordova platforms.
- Transform ${chalk.bold('config.xml')} into platform-specific manifest files.
- Copy icons and splash screens from ${chalk.bold('resources/')} to into your Cordova platforms.
- Copy plugin files into specified platforms.

You may wish to use ${chalk.green('ionic cordova prepare')} if you run your project with Android Studio or Xcode.
  `,
  exampleCommands: ['', 'ios', 'android'],
  inputs: [
    {
      name: 'platform',
      description: `The platform you would like to prepare (${['android', 'ios'].map(v => chalk.green(v)).join(', ')})`,
      required: false,
    },
  ],
  options: [
    {
      name: 'build',
      description: 'Do not invoke an Ionic build',
      type: Boolean,
      default: true,
    },
    ...APP_SCRIPTS_OPTIONS,
  ]
})
export class PrepareCommand extends CordovaCommand implements CommandPreRun {
  async preRun(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    await this.preRunChecks();
  }

  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const { getPlatforms, installPlatform } = await import('pw-ionic-cli-utils/lib/cordova/project');

    const [ platform ] = inputs;

    const platforms = await getPlatforms(this.env.project.directory);

    if (platform) {
      if (!platforms.includes(platform)) {
        const confirm = await this.env.prompt({
          message: `Platform ${chalk.green(platform)} is not installed! Would you like to install it?`,
          type: 'confirm',
          name: 'confirm',
        });

        if (confirm) {
          await installPlatform(this.env, platform);
        } else {
          throw new FatalException(
            `Can't prepare for ${chalk.green(platform)} unless the platform is installed.\n` +
            `Did you mean just ${chalk.green('ionic cordova prepare')}?\n`
          );
        }
      }
    }

    if (options.build) {
      const { build } = await import('pw-ionic-cli-utils/commands/build');
      await build(this.env, inputs, generateBuildOptions(this.metadata, options));
    }

    await this.runCordova(filterArgumentsForCordova(this.metadata, inputs, options), { showExecution: true });
  }
}
