import { CommandMap, Namespace } from 'pw-ionic-cli-utils/lib/namespace';

export class GitNamespace extends Namespace {
  name = 'git';
  description = 'Commands relating to git';
  longDescription = '';

  commands = new CommandMap([
    ['clone', async () => { const { GitCloneCommand } = await import('./clone'); return new GitCloneCommand(); }],
    ['remote', async () => { const { GitRemoteCommand } = await import('./remote'); return new GitRemoteCommand(); }],
  ]);
}
