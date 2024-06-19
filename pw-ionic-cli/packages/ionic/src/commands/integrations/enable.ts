import chalk from 'chalk';
import { contains } from '@ionic/cli-framework/lib';
import { CommandLineInputs, CommandLineOptions } from 'pw-ionic-cli-utils';
import { Command, CommandMetadata } from 'pw-ionic-cli-utils/lib/command';
import { INTEGRATIONS, enableIntegration } from 'pw-ionic-cli-utils/lib/integrations';

@CommandMetadata({
  name: 'enable',
  type: 'project',
  description: 'Add various integrations to your app',
  inputs: [
    {
      name: 'id',
      description: `The integration to enable (${INTEGRATIONS.map(i => chalk.green(i.name)).join(', ')})`,
      validators: [contains(INTEGRATIONS.map(i => i.name), {})],
    }
  ],
  options: [
    {
      name: 'quiet',
      description: 'Do not log file operations',
      type: Boolean,
    }
  ],
})
export class IntegrationsEnableCommand extends Command {
  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const [ id ] = inputs;

    const { quiet } = options;

    await enableIntegration(this.env, id, { quiet: Boolean(quiet) });
  }
}
