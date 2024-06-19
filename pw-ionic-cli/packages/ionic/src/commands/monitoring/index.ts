import { CommandMap, Namespace } from 'pw-ionic-cli-utils/lib/namespace';

export class MonitoringNamespace extends Namespace {
  name = 'monitoring';
  description = 'Commands relating to Ionic Pro error monitoring';
  longDescription = '';

  commands = new CommandMap([
    ['syncmaps', async () => { const { MonitoringSyncSourcemapsCommand } = await import('./syncmaps'); return new MonitoringSyncSourcemapsCommand(); }],
  ]);
}
