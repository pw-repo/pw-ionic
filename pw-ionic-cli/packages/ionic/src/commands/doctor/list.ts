import chalk from 'chalk';

import { CommandLineInputs, CommandLineOptions } from 'pw-ionic-cli-utils';
import { Command, CommandMetadata } from 'pw-ionic-cli-utils/lib/command';

@CommandMetadata({
  name: 'list',
  type: 'project',
  description: 'List all issue identifiers',
})
export class DoctorListCommand extends Command {
  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const { Ailments } = await import('pw-ionic-cli-utils/lib/doctor/ailments');

    const ailmentIds = Ailments.ALL.map(Ailment => new Ailment().id);

    this.env.log.msg(ailmentIds.map(id => chalk.green(id)).join('\n'));
  }
}
