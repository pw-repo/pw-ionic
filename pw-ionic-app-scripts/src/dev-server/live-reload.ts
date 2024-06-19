import { ChangedFile } from '../util/interfaces';
import { hasDiagnostics } from '../logger/logger-diagnostics';
import * as path from 'path';
import * as tinylr from 'tiny-lr';
import { ServeConfig } from './serve-config';
import * as events from '../util/events';


export function createLiveReloadServer(config: ServeConfig) {
  const liveReloadServer = tinylr();
  liveReloadServer.listen(config.liveReloadPort, config.host);

  function fileChange(changedFiles: ChangedFile[]) {
    // only do a live reload if there are no diagnostics
    // the notification server takes care of showing diagnostics
    if (!hasDiagnostics(config.buildDir)) {
      liveReloadServer.changed({
        body: {
          files: changedFiles.map(changedFile => '/' + path.relative(config.wwwDir, changedFile.filePath))
        }
      });
    }
  }

  events.on(events.EventType.FileChange, fileChange);

  events.on(events.EventType.ReloadApp, () => {
    fileChange([{ event: 'change', ext: '.html', filePath: 'index.html'}]);
  });
}


export function injectLiveReloadScript(content: any, host: string, port: Number): any {
  let contentStr = content.toString();
  const liveReloadScript = getLiveReloadScript(host, port);

  if (contentStr.indexOf('/livereload.js') > -1) {
    // already added script
    return content;
  }

  let match = contentStr.match(/<\/body>(?![\s\S]*<\/body>)/i);
  if (!match) {
    match = contentStr.match(/<\/html>(?![\s\S]*<\/html>)/i);
  }
  if (match) {
    contentStr = contentStr.replace(match[0], `${liveReloadScript}\n${match[0]}`);
  } else {
    contentStr += liveReloadScript;
  }

  return contentStr;
}

function getLiveReloadScript(host: string, port: Number) {
  var src = `//${host}:${port}/livereload.js?snipver=1`;
  return `  <!-- Ionic Dev Server: Injected LiveReload Script -->\n  <script src="${src}" async="" defer=""></script>`;
}
