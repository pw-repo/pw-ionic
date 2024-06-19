import chalk from 'chalk';

import {
  AppDetails,
  BACKEND_LEGACY,
  BACKEND_PRO,
  CommandLineInputs,
  CommandLineOptions,
  CommandPreRun,
  GithubBranch,
  GithubRepo,
  isSuperAgentError
} from 'pw-ionic-cli-utils';
import { Command, CommandMetadata } from 'pw-ionic-cli-utils/lib/command';
import { FatalException } from 'pw-ionic-cli-utils/lib/errors';

const CHOICE_CREATE_NEW_APP = 'createNewApp';
const CHOICE_NEVERMIND = 'nevermind';

const CHOICE_IONIC = 'ionic';
const CHOICE_GITHUB = 'github';

const CHOICE_MASTER_ONLY = 'master';
const CHOICE_SPECIFIC_BRANCHES = 'specific';

@CommandMetadata({
  name: 'link',
  type: 'project',
  backends: [BACKEND_LEGACY, BACKEND_PRO],
  description: 'Connect your local app to Ionic',
  longDescription: `
If you have an app on Ionic, you can link it to this local Ionic project with this command.

Excluding the ${chalk.green('app_id')} argument looks up your apps on Ionic and prompts you to select one.

This command simply sets the ${chalk.bold('app_id')} property in ${chalk.bold('ionic.config.json')} for other commands to read.
  `,
  exampleCommands: ['', 'a1b2c3d4'],
  inputs: [
    {
      name: 'app_id',
      description: `The ID of the app to link (e.g. ${chalk.green('a1b2c3d4')})`,
      required: false,
    },
  ],
  options: [
    {
      name: 'name',
      description: 'The app name to use during the linking of a new app',
    },
    {
      name: 'create',
      description: 'Create a new app on Ionic and link it with this local Ionic project',
      backends: [BACKEND_PRO],
      type: Boolean,
      visible: false,
    },
    {
      name: 'pro-id',
      description: 'Specify an app ID from the Ionic Dashboard to link',
      visible: false,
    },
  ],
})
export class LinkCommand extends Command implements CommandPreRun {
  async preRun(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const { create } = options;

    if (inputs[0] && create) {
      throw new FatalException(`Sorry--cannot use both ${chalk.green('app_id')} and ${chalk.green('--create')}. You must either link an existing app or create a new one.`);
    }

    let proAppId = <string>options['pro-id'] || '';
    const config = await this.env.config.load();

    if (proAppId) {
      if (config.backend !== BACKEND_PRO) {
        await this.env.runCommand(['config', 'set', '-g', 'backend', 'pro'], { showExecution: false });
        this.env.log.nl();
        this.env.log.info(
          `${chalk.bold(chalk.blue.underline('Welcome to Ionic Pro!') + ' The CLI is now set up to use Ionic Pro services.')}\n` +
          `You can revert back to Ionic Cloud (legacy) services at any time:\n\n` +
          `${chalk.green('ionic config set -g backend legacy')}\n`
        );
      }

      inputs[0] = proAppId;
    }
  }

  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const { promptToLogin } = await import('pw-ionic-cli-utils/lib/session');

    let [ appId ] = inputs;
    let { create, name } = options;

    const config = await this.env.config.load();
    const project = await this.env.project.load();
    const appUtil = await this.getAppClient();

    if (project.app_id) {
      if (project.app_id === appId) {
        this.env.log.info(`Already linked with app ${chalk.green(appId)}.`);
        return;
      }

      const msg = appId ?
        `Are you sure you want to link it to ${chalk.green(appId)} instead?` :
        `Would you like to link it to a different app?`;

      const confirm = await this.env.prompt({
        type: 'confirm',
        name: 'confirm',
        message: `App ID ${chalk.green(project.app_id)} is already set up with this app. ${msg}`,
      });

      if (!confirm) {
        this.env.log.info('Not linking.');
        return;
      }
    }

    if (!(await this.env.session.isLoggedIn())) {
      await promptToLogin(this.env);
    }

    if (appId) {
      this.env.tasks.next(`Looking up app ${chalk.green(appId)}`);
      await appUtil.load(appId);

      this.env.tasks.end();

    } else if (!create) {
      this.env.tasks.next(`Looking up your apps`);
      let apps: AppDetails[] = [];

      const paginator = await appUtil.paginate();

      for (let r of paginator) {
        const res = await r;
        apps = apps.concat(res.data);
      }

      this.env.tasks.end();

      const createAppChoice = {
        name: 'Create a new app',
        id: CHOICE_CREATE_NEW_APP,
      };

      const neverMindChoice = {
        name: 'Nevermind',
        id: CHOICE_NEVERMIND,
      };

      const linkedApp = await this.env.prompt({
        type: 'list',
        name: 'linkedApp',
        message: `Which app would you like to link`,
        choices: [createAppChoice, ...apps, neverMindChoice].map((app) => ({
          name: [CHOICE_CREATE_NEW_APP, CHOICE_NEVERMIND].includes(app.id) ? chalk.bold(app.name) : `${app.name} (${app.id})`,
          value: app.id
        }))
      });

      appId = linkedApp;
    }

    if (create || appId === CHOICE_CREATE_NEW_APP) {

      if (config.backend === BACKEND_PRO) {
        if (!name) {
          name = await this.env.prompt({
            type: 'input',
            name: 'name',
            message: 'Please enter a name for your new app:',
          });
        }

        const app = await appUtil.create({ name: String(name) });

        appId = app.id;
        await this.linkApp(app);
      } else {
        const opn = await import('opn');
        const dashUrl = await this.env.config.getDashUrl();
        const token = await this.env.session.getUserToken();
        opn(`${dashUrl}/?user_token=${token}`, { wait: false });
        this.env.log.info(`Rerun ${chalk.green(`ionic link`)} to link to the new app.`);
      }
    } else if (appId === CHOICE_NEVERMIND) {
      this.env.log.info('Not linking app.');
    } else {
      const app = await appUtil.load(appId);
      await this.linkApp(app);
    }

    await Promise.all([this.env.config.save(), this.env.project.save()]);
  }

  private async getAppClient() {
    const { App } = await import('pw-ionic-cli-utils/lib/app');
    const token = await this.env.session.getUserToken();
    return new App(token, this.env.client);
  }

  private async getUserClient() {
    const { UserClient } = await import('pw-ionic-cli-utils/lib/user');
    const token = await this.env.session.getUserToken();
    return new UserClient({ token, client: this.env.client });
  }

  async linkApp(app: AppDetails) {
    // TODO: load connections
    // TODO: check for git availability before this
    this.env.log.nl();

    this.env.log.info(
      `${chalk.bold(`Ionic Pro uses a git-based workflow to manage app updates.`)}\n` +
      `You will be prompted to set up the git host and repository for this new app. See the docs${chalk.bold('[1]')} for more information.\n\n` +
      `${chalk.bold('[1]')}: ${chalk.cyan('https://ionicframework.com/docs/pro/basics/git/')}`
    );

    const service = await this.env.prompt({
      type: 'list',
      name: 'gitService',
      message: 'Which git host would you like to use?',
      choices: [
        {
          name: 'GitHub',
          value: CHOICE_GITHUB,
        },
        {
          name: 'Ionic Pro',
          value: CHOICE_IONIC,
        },
        // TODO: option to skip git setup for now
      ],
    });

    let githubUrl: string | undefined;
    if (service === CHOICE_IONIC) {
      const config = await this.env.config.load();

      if (!config.git.setup) {
        await this.env.runCommand(['ssh', 'setup']);
      }

      await this.env.runCommand(['config', 'set', 'app_id', `"${app.id}"`, '--json']);
      await this.env.runCommand(['git', 'remote']);
    } else {
      if (service === CHOICE_GITHUB) {
        githubUrl = await this.linkGithub(app);
      }

      await this.env.runCommand(['config', 'set', 'app_id', `"${app.id}"`, '--json']);
    }

    this.env.log.ok(`Project linked with app ${chalk.green(app.id)}!`);
    if (service === CHOICE_GITHUB) {
      this.env.log.info(
        `Here are some additional links that can help you with you first push to GitHub:\n` +
        `${chalk.bold('Adding GitHub as a remote')}:\n\t${chalk.cyan('https://help.github.com/articles/adding-a-remote/')}\n\n` +
        `${chalk.bold('Pushing to a remote')}:\n\t${chalk.cyan('https://help.github.com/articles/pushing-to-a-remote/')}\n\n` +
        `${chalk.bold('Working with branches')}:\n\t${chalk.cyan('https://guides.github.com/introduction/flow/')}\n\n` +
        `${chalk.bold('More comfortable with a GUI? Try GitHub Desktop!')}\n\t${chalk.cyan('https://desktop.github.com/')}`
      );

      if (githubUrl) {
        this.env.log.info(
          `${chalk.bold('You can now push to one of your branches on GitHub to trigger a build in Ionic Pro!')}\n` +
          `If you haven't added GitHub as your origin you can do so by running:\n\n` +
          `${chalk.green('git remote add origin ' + githubUrl)}\n\n` +
          `You can find additional links above to help if you're having issues.`
        );
      }
    }
  }

  async linkGithub(app: AppDetails): Promise<string | undefined> {
    const { id } = await this.env.session.getUser();

    const userClient = await this.getUserClient();
    const user = await userClient.load(id, { fields: ['oauth_identities'] });

    if (!user.oauth_identities || !user.oauth_identities.github) {
      await this.oAuthProcess(id);
    }

    if (await this.needsAssociation(app, user.id)) {
      await this.confirmGithubRepoExists();
      const repoId = await this.selectGithubRepo();
      const branches = await this.selectGithubBranches(repoId);
      return this.connectGithub(app, repoId, branches);
    }
  }

  async confirmGithubRepoExists() {

    let confirm = false;

    this.env.log.nl();
    this.env.log.info(chalk.bold(`In order to link to a GitHub repository the repository must already exist on GitHub.`));
    this.env.log.info(
      `${chalk.bold('If the repository does not exist please create one now before continuing.')}\n` +
      `If you're not familiar with Git you can learn how to set it up with GitHub here:\n\n` +
      chalk.cyan(`https://help.github.com/articles/set-up-git/ \n\n`) +
      `You can find documentation on how to create a repository on GitHub and push to it here:\n\n` +
      chalk.cyan(`https://help.github.com/articles/create-a-repo/`)
    );

    confirm = await this.env.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Does the repository exist on GitHub?',
    });

    if (!confirm) {
      throw new FatalException('Repo Must exist on GitHub in order to link.');
    }
  }

  async oAuthProcess(userId: number) {
    const opn = await import('opn');

    const userClient = await this.getUserClient();

    let confirm = false;

    this.env.log.nl();
    this.env.log.info(
      `${chalk.bold('GitHub OAuth setup required.')}\n` +
      `To continue, we need you to authorize Ionic Pro with your GitHub account. ` +
      `A browser will open and prompt you to complete the authorization request. ` +
      `When finished, please return to the CLI to continue linking your app.`
    );

    confirm = await this.env.prompt({
      type: 'confirm',
      name: 'ready',
      message: 'Open browser:',
    });

    if (!confirm) {
      throw new FatalException('Aborting.');
    }

    const url = await userClient.oAuthGithubLogin(userId);
    opn(url, { wait: false });

    confirm = await this.env.prompt({
      type: 'confirm',
      name: 'ready',
      message: 'Authorized and ready to continue:',
    });

    if (!confirm) {
      throw new FatalException('Aborting.');
    }
  }

  async needsAssociation(app: AppDetails, userId: number): Promise<boolean> {
    const appClient = await this.getAppClient();

    if (app.association && app.association.repository.html_url) {
      this.env.log.msg(`App ${chalk.green(app.id)} already connected to ${chalk.bold(app.association.repository.html_url)}`);

      const confirm = await this.env.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Would you like to connect a different repo?',
      });

      if (!confirm) {
        return false;
      }

      try {
        // TODO: maybe we can use a PUT instead of DELETE now + POST later?
        await appClient.deleteAssociation(app.id);
      } catch (e) {
        if (isSuperAgentError(e)) {
          if (e.response.status === 401) {
            await this.oAuthProcess(userId);
            await appClient.deleteAssociation(app.id);
            return true;
          } else if (e.response.status === 404) {
            return true;
          }
        }

        throw e;
      }
    }

    return true;
  }

  async connectGithub(app: AppDetails, repoId: number, branches: string[]): Promise<string | undefined> {
    const appClient = await this.getAppClient();

    try {
      const association = await appClient.createAssociation(app.id, { repoId, type: 'github', branches });
      this.env.log.ok(`App ${chalk.green(app.id)} connected to ${chalk.bold(association.repository.html_url)}`);
      return association.repository.clone_url;
    } catch (e) {
      if (isSuperAgentError(e) && e.response.status === 403) {
        throw new FatalException(e.response.body.error.message);
      } else {
        throw e;
      }
    }
  }

  formatRepoName(fullName: string) {
    const [ org, name ] = fullName.split('/');

    return `${chalk.dim(`${org} /`)} ${name}`;
  }

  async selectGithubRepo(): Promise<number> {
    const user = await this.env.session.getUser();
    const userClient = await this.getUserClient();

    this.env.tasks.next('Looking up your GitHub repositories');

    const paginator = userClient.paginateGithubRepositories(user.id);
    const repos: GithubRepo[] = [];

    try {
      for (const r of paginator) {
        const res = await r;
        repos.push(...res.data);

        this.env.tasks.updateMsg(`Looking up your GitHub repositories: ${chalk.bold(String(repos.length))} found`);
      }
    } catch (e) {
      this.env.tasks.fail();

      if (isSuperAgentError(e) && e.response.status === 401) {
        await this.oAuthProcess(user.id);
        return this.selectGithubRepo();
      }

      throw e;
    }

    this.env.tasks.end();

    const repoId = await this.env.prompt({
      type: 'list',
      name: 'githubRepo',
      message: 'Which GitHub repository would you like to link?',
      choices: repos.map(repo => ({
        name: this.formatRepoName(repo.full_name),
        value: String(repo.id),
      })),
    });

    return Number(repoId);
  }

  async selectGithubBranches(repoId: number): Promise<string[]> {

    this.env.log.nl();
    this.env.log.info(chalk.bold(`By default Ionic Pro links only to the ${chalk.green('master')} branch.`));
    this.env.log.info(
      `${chalk.bold('If you\'d like to link to another branch or multiple branches you\'ll need to select each branch to connect to.')}\n` +
      `If you're not familiar with on working with branches in GitHub you can read about them here:\n\n` +
      chalk.cyan(`https://guides.github.com/introduction/flow/ \n\n`)
    );

    const choice = await this.env.prompt({
      type: 'list',
      name: 'githubMultipleBranches',
      message: 'Which would you like to do?',
      choices: [
        {
          name: `Link to master branch only`,
          value: CHOICE_MASTER_ONLY,
        },
        {
          name: `Link to specific branches`,
          value: CHOICE_SPECIFIC_BRANCHES,
        },
      ],
    });

    switch (choice) {
      case CHOICE_MASTER_ONLY:
        return ['master'];
      case CHOICE_SPECIFIC_BRANCHES:
        // fall through and begin prompting to choose branches
        break;
      default:
        throw new FatalException('Aborting. No branch choice specified.');
    }

    const user = await this.env.session.getUser();
    const userClient = await this.getUserClient();
    const paginator = userClient.paginateGithubBranches(user.id, repoId);
    this.env.tasks.next('Looking for available branches');
    const availableBranches: GithubBranch[] = [];
    try {
      for (const r of paginator) {
        const res = await r;
        availableBranches.push(...res.data);

        this.env.tasks.updateMsg(`Looking up the available branches on your GitHub repository: ${chalk.bold(String(availableBranches.length))} found`);
      }
    } catch (e) {
      this.env.tasks.fail();
      throw e;
    }
    this.env.tasks.end();

    const choices = availableBranches.map(branch => ({
      name: branch.name,
      value: branch.name,
      checked: branch.name === 'master',
    }));

    if (choices.length === 0) {
      this.env.log.warn('No branches found for the repository...linking to master branch.');
      return ['master'];
    }

    const selectedBranches = await this.env.prompt({
      type: 'checkbox',
      name: 'githubBranches',
      message: 'Which branch would you like to link?',
      choices: choices,
      default: ['master'],
    });

    return selectedBranches;
  }

}
