import chalk from 'chalk';

import { BACKEND_PRO, CommandLineInputs, CommandLineOptions } from 'pw-ionic-cli-utils';
import { Command, CommandMetadata } from 'pw-ionic-cli-utils/lib/command';
import { FatalException } from 'pw-ionic-cli-utils/lib/errors';

@CommandMetadata({
  name: 'remote',
  type: 'project',
  backends: [BACKEND_PRO],
  description: 'Adds/updates the Ionic git remote to your local Ionic app repository',
})
export class GitRemoteCommand extends Command {
  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const { App } = await import('pw-ionic-cli-utils/lib/app');
    const { addIonicRemote, getIonicRemote, initializeRepo, isRepoInitialized, setIonicRemote } = await import('pw-ionic-cli-utils/lib/git');

    const token = await this.env.session.getUserToken();
    const appId = await this.env.project.loadAppId();
    const appLoader = new App(token, this.env.client);
    const app = await appLoader.load(appId);

    if (!app.repo_url) {
      throw new FatalException(`Missing ${chalk.bold('repo_url')} property in app.`);
    }

    if (!(await isRepoInitialized(this.env))) {
      await initializeRepo(this.env);

      this.env.log.warn(
        `Initializing a git repository for your project.\n` +
        `Before your first ${chalk.green('git push ionic master')}, you'll want to commit all the files in your project:\n\n` +
        `${chalk.green('git commit -a -m "Initial commit"')}\n`
      );
    }

    const remote = app.repo_url;
    const found = await getIonicRemote(this.env);

    if (found) {
      if (remote === found) {
        this.env.log.info(`Existing remote ${chalk.bold('ionic')} found.`);
      } else {
        await setIonicRemote(this.env, remote);
        this.env.log.ok(`Updated remote ${chalk.bold('ionic')}.`);
      }
    } else {
      await addIonicRemote(this.env, remote);
      this.env.log.ok(`Added remote ${chalk.bold('ionic')}.`);
    }
  }
}
