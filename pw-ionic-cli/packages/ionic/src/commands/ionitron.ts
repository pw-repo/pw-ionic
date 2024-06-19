import { CommandLineInputs, CommandLineOptions } from 'pw-ionic-cli-utils';
import { Command, CommandMetadata } from 'pw-ionic-cli-utils/lib/command';

@CommandMetadata({
  name: 'ionitron',
  type: 'global',
  description: 'Print random ionitron messages',
  options: [
    {
      name: 'es',
      description: 'Print in spanish',
      type: Boolean,
    }
  ],
  visible: false,
})
export class IonitronCommand extends Command {
  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const { getIonitronString, ionitronStatements } = await import('pw-ionic-cli-utils/lib/ionitron');

    const locale = options['es'] ? 'es' : 'en';
    const localeStatements = ionitronStatements[locale];
    const statement = localeStatements[Math.floor(Math.random() * (localeStatements.length))];

    this.env.log.msg(getIonitronString(statement));
  }
}
