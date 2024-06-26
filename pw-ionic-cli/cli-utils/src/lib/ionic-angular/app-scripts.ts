import * as path from 'path';

import { CommandOption, IonicEnvironment } from '../../definitions';

export const APP_SCRIPTS_INTENT = 'app-scripts';

export async function importAppScripts(env: IonicEnvironment): Promise<any> {
  const appScriptsPath = path.resolve(env.project.directory, 'node_modules', 'pw-ionic-app-scripts'); // TODO

  return require(appScriptsPath);
}

export const APP_SCRIPTS_OPTIONS: CommandOption[] = [
  {
    name: 'prod',
    description: 'Build the application for production',
    type: Boolean,
    intents: [APP_SCRIPTS_INTENT],
  },
  {
    name: 'aot',
    description: 'Perform ahead-of-time compilation for this build',
    type: Boolean,
    intents: [APP_SCRIPTS_INTENT],
    advanced: true,
  },
  {
    name: 'minifyjs',
    description: 'Minify JS for this build',
    type: Boolean,
    intents: [APP_SCRIPTS_INTENT],
    advanced: true,
  },
  {
    name: 'minifycss',
    description: 'Minify CSS for this build',
    type: Boolean,
    intents: [APP_SCRIPTS_INTENT],
    advanced: true,
  },
  {
    name: 'optimizejs',
    description: 'Perform JS optimizations for this build',
    type: Boolean,
    intents: [APP_SCRIPTS_INTENT],
    advanced: true,
  },
  {
    name: 'env',
    description: '',
    intents: [APP_SCRIPTS_INTENT],
    visible: false,
  }
];
