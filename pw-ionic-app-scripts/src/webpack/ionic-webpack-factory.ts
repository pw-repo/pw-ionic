import { getCommonChunksPlugin } from './common-chunks-plugins';
import { IonicEnvironmentPlugin } from './ionic-environment-plugin';
import { provideCorrectSourcePath } from './source-mapper';
import { getContext } from '../util/helpers';

export function getIonicEnvironmentPlugin() {
  const context = getContext();
  return new IonicEnvironmentPlugin(context, true);
}

export function getSourceMapperFunction(): Function {
  return provideCorrectSourcePath;
}

export { getCommonChunksPlugin };
