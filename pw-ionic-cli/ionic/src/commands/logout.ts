import { BACKEND_LEGACY, BACKEND_PRO, CommandLineInputs, CommandLineOptions } from 'pw-ionic-cli-utils';
import { Command, CommandMetadata } from 'pw-ionic-cli-utils/lib/command';

@CommandMetadata({
  name: 'logout',
  type: 'global',
  backends: [BACKEND_LEGACY, BACKEND_PRO],
  description: '',
  visible: false,
})
export class LogoutCommand extends Command {
  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    if (!(await this.env.session.isLoggedIn())) {
      this.env.log.info('You are already logged out.');
      return;
    }

    await this.env.session.logout();
    this.env.log.ok('You are logged out.');
  }
}
