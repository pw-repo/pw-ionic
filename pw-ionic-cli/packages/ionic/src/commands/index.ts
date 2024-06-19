import chalk from 'chalk';

import { IRootNamespace, IonicEnvironment, KNOWN_BACKENDS } from 'pw-ionic-cli-utils';
import { CommandMap, Namespace, NamespaceMap } from 'pw-ionic-cli-utils/lib/namespace';
import { FatalException } from 'pw-ionic-cli-utils/lib/errors';

export class IonicNamespace extends Namespace implements IRootNamespace {
  readonly root: true = true;
  readonly name: 'ionic' = 'ionic';
  readonly description = '';
  readonly longDescription = '';

  namespaces = new NamespaceMap([
    ['config', async () => { const { ConfigNamespace } = await import('./config/index'); return new ConfigNamespace(); }],
    ['cordova', async () => { const { CordovaNamespace } = await import('./cordova/index'); return new CordovaNamespace(); }],
    ['git', async () => { const { GitNamespace } = await import('./git/index'); return new GitNamespace(); }],
    ['ssh', async () => { const { SSHNamespace } = await import('./ssh/index'); return new SSHNamespace(); }],
    ['package', async () => { const { PackageNamespace } = await import('./package/index'); return new PackageNamespace(); }],
    ['monitoring', async () => { const { MonitoringNamespace } = await import('./monitoring/index'); return new MonitoringNamespace(); }],
    ['doctor', async () => { const { DoctorNamespace } = await import('./doctor/index'); return new DoctorNamespace(); }],
    ['integrations', async () => { const { IntegrationsNamespace } = await import('./integrations/index'); return new IntegrationsNamespace(); }],
  ]);

  commands = new CommandMap([
    ['start', async () => { const { StartCommand } = await import('./start'); return new StartCommand(); }],
    ['serve', async () => { const { ServeCommand } = await import('./serve'); return new ServeCommand(); }],
    ['build', async () => { const { BuildCommand } = await import('./build'); return new BuildCommand(); }],
    ['help', async () => { const { HelpCommand } = await import('./help'); return new HelpCommand(); }],
    ['info', async () => { const { InfoCommand } = await import('./info'); return new InfoCommand(); }],
    ['login', async () => { const { LoginCommand } = await import('./login'); return new LoginCommand(); }],
    ['logout', async () => { const { LogoutCommand } = await import('./logout'); return new LogoutCommand(); }],
    ['signup', async () => { const { SignupCommand } = await import('./signup'); return new SignupCommand(); }],
    ['version', async () => { const { VersionCommand } = await import('./version'); return new VersionCommand(); }],
    ['telemetry', async () => { const { TelemetryCommand } = await import('./telemetry'); return new TelemetryCommand(); }],
    ['docs', async () => { const { DocsCommand } = await import('./docs'); return new DocsCommand(); }],
    ['daemon', async () => { const { DaemonCommand } = await import('./daemon'); return new DaemonCommand(); }],
    ['ionitron', async () => { const { IonitronCommand } = await import('./ionitron'); return new IonitronCommand(); }],
    ['generate', async () => { const { GenerateCommand } = await import('./generate'); return new GenerateCommand(); }],
    ['g', 'generate'],
    ['link', async () => { const { LinkCommand } = await import('./link'); return new LinkCommand(); }],
    ['upload', async () => { const { UploadCommand } = await import('./upload'); return new UploadCommand(); }],
    ['state', async () => { const { StateCommand } = await import('./state'); return new StateCommand(); }],
    ['share', async () => { const { ShareCommand } = await import('./share'); return new ShareCommand(); }],
  ]);

  async runCommand(env: IonicEnvironment, pargv: string[]): Promise<void> {
    const { metadataToMinimistOptions } = await import('pw-ionic-cli-utils/lib/utils/command');
    const { parseArgs } = await import('pw-ionic-cli-utils/lib/init');
    const { isCommand } = await import('pw-ionic-cli-utils/guards');

    const config = await env.config.load();

    const argv = parseArgs(pargv, { boolean: true, string: '_' });
    let [ depth, inputs, cmdOrNamespace ] = await this.locate(argv._);

    if (!isCommand(cmdOrNamespace)) {
      const { showHelp } = await import('pw-ionic-cli-utils/lib/help');
      await env.telemetry.sendCommand('ionic help', argv._);
      return showHelp(env, argv._);
    }

    const command = cmdOrNamespace;
    const minimistOpts = metadataToMinimistOptions(command.metadata);

    if (command.metadata.backends && !command.metadata.backends.includes(config.backend)) {
      throw new FatalException(
        `Sorry! The configured backend (${chalk.bold(config.backend)}) does not know about ${chalk.green('ionic ' + command.metadata.fullName)}.\n` +
        `You can switch backends with ${chalk.green('ionic config set -g backend')} (choose from ${KNOWN_BACKENDS.map(v => chalk.green(v)).join(', ')}).\n`
      );
    }

    const options = parseArgs(pargv, minimistOpts);
    inputs = options._.slice(depth);
    command.env = env;

    await command.validate(inputs);

    if (!env.project.directory && command.metadata.type === 'project') {
      throw new FatalException(`Sorry! ${chalk.green('ionic ' + command.metadata.fullName)} can only be run in an Ionic project directory.`);
    }

    if (command.metadata.options) {
      let found = false;

      for (let opt of command.metadata.options) {
        if (opt.backends && opt.default !== options[opt.name] && !opt.backends.includes(config.backend)) {
          found = true;
          env.log.warn(`${chalk.green('--' + (opt.default === true ? 'no-' : '') + opt.name)} has no effect with the configured backend (${chalk.bold(config.backend)}).`);
        }
      }

      if (found) {
        env.log.info(`You can switch backends with ${chalk.green('ionic config set -g backend')}.`);
      }
    }

    await command.execute(inputs, options);
  }
}
