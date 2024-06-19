import chalk from 'chalk';

import { contains } from 'pw-ionic-cli-framework/lib';
import { CommandLineInputs, CommandLineOptions } from 'pw-ionic-cli-utils';
import { Command, CommandMetadata } from 'pw-ionic-cli-utils/lib/command';
import { INTEGRATIONS, disableIntegration } from 'pw-ionic-cli-utils/lib/integrations';

@CommandMetadata({
  name: 'disable',
  type: 'project',
  description: 'Disable an integration',
  inputs: [
    {
      name: 'id',
      description: `The integration to disable (${INTEGRATIONS.map(i => chalk.green(i.name)).join(', ')})`,
      validators: [contains(INTEGRATIONS.map(i => i.name), {})],
    }
  ],
})
export class IntegrationsDisableCommand extends Command {
  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const [ id ] = inputs;

    await disableIntegration(this.env, id);
  }
}
