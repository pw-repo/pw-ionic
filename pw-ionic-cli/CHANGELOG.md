# Changelog

This is a curated CHANGELOG. We also use an automatic utility that maintains
the CHANGELOG files within CLI packages. For specific commit-level changes, see
[#packages](#packages). For big, high-level CLI changes, see
[#versions](#versions).

## Versions

<a name="3.20.0"></a>
### 3.20.0 (2018-03-13)
* Added Ionic Pro GitHub integation ability to link Pro users and apps to GitHub

<a name="3.19.1"></a>
### 3.19.1 (2018-01-27)

* Quick fix for SSH path input tilde expansion
  ([#2958](https://github.com/ionic-team/ionic-cli/issues/2958))

<a name="3.19.0"></a>
### 3.19.0 (2017-11-21)

* Added prompt to `ionic start` that asks to install the Cordova version.
* Added `--bundle-id` to `ionic start` for setting the Cordova bundle ID in
  `config.xml` when creating a new app.
* Added more personalization features to `ionic start` for Cordova.
* Fixed some poor error handling when something _really_ goes wrong.
* Fixed issue with SSH config parsing without `Host` directives.
* Fixed issue with serving an Ionic 1 app with livereload when the host is
  unexpectedly changed.

<a name="3.18.0"></a>
### 3.18.0 (2017-11-09)

* Added support for custom git repository URLs to the `template` argument of
  `ionic start`. See `ionic start --help` for usage.
* Added `--cordova` flag for `ionic start` to provide the Cordova integration
  while creating a new app.
* `ionic cordova prepare` will now run an Ionic Build beforehand to ensure the
  latest files are prepared. A `--no-build` flag has been added to disable this.
* Fixed long-standing issue with `ionic build` not running `sass` task for Ionic
  1 apps with gulp integration. It was previously only working during `ionic
  serve`.
* Fixed issue with `ionic doctor check` throwing an ENOENT error when
  `config.xml` was missing.
* Fixed issue with app not being personalized with app name during `ionic
  start`.

<a name="3.17.0"></a>
### 3.17.0 (2017-11-07)

* `ionic start` is now using the starters generated from the new [Ionic
  Starters](https://github.com/ionic-team/starters) repo, which supports
  approved community starters.
* Cordova integration is no longer included for new apps (new apps won't have
  `config.xml` or `resources/`). The CLI will download these files and integrate
  the app with Cordova when requested, which can be with the new `ionic
  integrations` commands, or whenever `ionic cordova` commands are first used.
* Fixed spammy connection errors related to DevApp broadcasting.

<a name="3.16.0"></a>
### 3.16.0 (2017-11-01)

* Support for the :sparkles: [Ionic
  DevApp](https://blog.ionicframework.com/announcing-ionic-devapp/) :sparkles:
* Added `--local` flag to `ionic serve`, which is an easy way to disable
  external network usage when serving your app.

<a name="3.15.2"></a>
#### 3.15.2 (2017-10-26)

* Fixed issue with default livereload setting in serve.

<a name="3.15.1"></a>
#### 3.15.1 (2017-10-25)

* Fixed issue with not recognizing some Cordova platforms during `ionic cordova
  run`.
* Fixed issue with proxy settings during `ionic cordova run`.
* Fixed incorrect count with `ionic doctor check`.

<a name="3.15.0"></a>
### 3.15.0 (2017-10-24)

* Allow all command options to be specified as environment variables. See [the
  docs](https://ionicframework.com/docs/cli/configuring.html#command-options)
  for usage.
* Fixed issue with writing incorrect whitespace to SSH config if the config file
  was missing eol.

<a name="3.14.0"></a>
### 3.14.0 (2017-10-23)

* :tada: New `ionic doctor` commands. Run `ionic doctor check` in your project
  to detect the "health" of your Ionic project.
* Now showing all Cordova command output in real-time.
* Now using contents of `platforms/` directory to know which Cordova platforms
  are installed, not `platforms/platforms.json`.
* Fixed pagination issue with getting a long list of apps.
* No longer loading local CLI if "too old". See
  [#2810](https://github.com/ionic-team/ionic-cli/issues/2810) for details.

<a name="3.13.2"></a>
#### 3.13.2 (2017-10-16)

* Fixed `resources/` directory being excluded in Ionic Package builds.

<a name="3.13.1"></a>
#### 3.13.1 (2017-10-16)

* Fixed incorrect behavior in `ionic cordova prepare` with no installed
  platforms after 3.13.0 release.

<a name="3.13.0"></a>
### 3.13.0 (2017-10-10)

* Added automatic backslash replacement on Windows for paths in `config.xml`.
  Forward slashes are cross-platform, backslashes only work on Windows
  machines.
* Fixed slightly buggy Cordova platforms detection. The CLI now uses
  `platforms/platforms.json` to detect Cordova platforms, not `config.xml`.
* Fixed rare race condition with loading/writing `config.xml`.
* Fixed issue with a first run of `ionic cordova prepare` inside Docker
  container.
* Fixed issue with `after_prepare` Cordova hook being executed twice during
  Cordova builds.
* Fixed issue with dev logger not finding next available port for Ionic 1.

<a name="3.12.0"></a>
### 3.12.0 (2017-09-21)

* Added support for generating iPhone Marketing Icons: `icon-1024.png`. Just
  run `ionic cordova resources`.
* Added ability to generate/support non-RSA SSH keys for Ionic Pro.

<a name="3.11.0"></a>
### 3.11.0 (2017-09-21)

* Added support for generating iPhone X splash screen images:
  `Default@2x~universal~anyany.png`. Just run `ionic cordova resources`.
* The CLI will now run the local `cordova` binary if found in project. In
  general, it will now prefer locally installed binaries over global binaries,
  just like npm scripts.
* Fixed Cordova run/emulate not cleaning up after itself in `config.xml`
  (`original-src` -> `src`).
* Fixed watch patterns bug for serve in Ionic 1. The CLI will now always use
  `watchPatterns` in your `ionic.config.json`. If `watchPatterns` doesn't
  exist, the CLI fills it in with default values.
* Fixed bug with the CLI where the backend was occasionally misconfigured and
  it was using the legacy URLs for Ionic Pro service requests.

<a name="3.10.3"></a>
#### 3.10.3 (2017-09-13)

* Hide `ionic serve` errors for DevApp multicasting.

<a name="3.10.2"></a>
#### 3.10.2 (2017-09-13)

* Hot fix for `--consolelogs` not being passed to app-scripts for Cordova
  builds.

<a name="3.10.1"></a>
#### 3.10.1 (2017-09-12)

* Hot fix for `--prod` not being passed to app-scripts for Cordova builds.

<a name="3.10.0"></a>
### 3.10.0 (2017-09-12)

* New CLI installs will default to use Ionic Pro. For existing CLI
  installations, use `--pro-id` with `ionic start` or `ionic link` to switch
  your CLI to Ionic Pro. You can switch between backends with `ionic config set
  -g backend pro` (Ionic Pro) and `ionic config set -g backend legacy` (Ionic
  Cloud).
* Added app-scripts arguments (such as `--prod`) to `ionic upload`. (:memo:
  Note: `ionic upload` is for Ionic Cloud, aka the "legacy" backend.)
* Added SSL configuration options for CLI HTTP requests. See [SSH
  Configuration](https://ionicframework.com/docs/cli/configuring.html#ssl-configuration).
* Added Cordova arguments to `ionic cordova compile`.
* Added `ionic cordova requirements` command.
* Fixed issue with `ionic serve` requiring an external network.
* Fixed `--consolelogs` not working for Ionic 1.
* Fixed issue with `ionic cordova platform add` not using custom icon and
  splash screens for the generated resources.
* Fixed Cordova resources issue where if the resource generation failed, the
  cache files were still saved.
* Fixed Ionic builds not passing necessary context to `build:after` hooks. When
  an Ionic Cordova build occurs, the target platform is now passed to `cordova
  prepare`. Thanks, [@rtwall](https://github.com/rtwall)!
* Fixed Ionic Pro issue with incorrect interpretation of app IDs in scientific
  notation... again.

<a name="3.9.2"></a>
#### 3.9.2 (2017-08-17)

* Pass `--platform` and `--target` to app-scripts for build optimizations
  during `ionic cordova build`.
* Fixed an issue with log  commands conntinually printing lines while the
  spinner ran.
* Fixed a few minor issues with `ionic cordova resources`.

<a name="3.9.1"></a>
#### 3.9.1 (2017-08-16)

* Fixed missing detection of all deprecated plugins. The CLI now warns for all
  plugins, not just `@ionic/cli-plugin-cordova`.
* Default Ionic Cordova resources are no longer bundled with CLI installation,
  they are instead downloaded and copied into project directories when needed.
* Fixed recurring prompting of proxy plugin installation.

<a name="3.9.0"></a>
### 3.9.0 (2017-08-16)

* The CLI will now use `--livereload` if `--consolelogs` or `--serverlogs` is
  used. There are various consolelog fixes in new release of
  `@ionic/app-scripts`: 2.1.4.
* Added `--browser` flag to `ionic docs` to open the docs in a browser of your
  choice.

<a name="3.8.1"></a>
#### 3.8.1 (2017-08-14)

* Fixed an issue with Cordova serve improperly mocking `cordova.js` for Ionic
  Angular apps.

<a name="3.8.0"></a>
### 3.8.0 (2017-08-14)

* :trumpet: All functionality provided by the
  `@ionic/cli-plugin-ionic-angular`, `@ionic/cli-plugin-ionic1`,
  `@ionic/cli-plugin-cordova`, and `@ionic/cli-plugin-gulp` plugins has been
  moved into the core `ionic` package. The listed CLI plugins have been marked
  as deprecated. For the former two, project type is now detected and handled
  appropriately during `ionic build`, `ionic serve`, etc. For the latter two,
  integrations such as Cordova and Gulp are now detected and enabled
  automatically. See
  [Integrations](https://ionicframework.com/docs/cli/configuring.html#integrations).
  The `@ionic/cli-plugin-proxy` plugin is unchanged. You are encouraged to
  uninstall the deprecated CLI plugins upon updating, as they are no longer
  needed and will not be loaded.
* With significantly fewer plugins, the update prompts are now inherently less
  annoying. Additionally, if you answer "no" to an update prompt, it will ask
  again in a day, instead of upon the next command.
* Fixed issue with multiple serve instances running at once on a computer.
* Added helpful messages for errant invocations of `ionic build`, `ionic
  state`, and `ionic share`.
* Added `--json` to `ionic config set` for stricter inputs, as well as
  `--force` to allow for overwriting arrays and objects, which normally would
  not be.
* During `ionic cordova platform add`, if an error from Cordova occurs because
  of the platform already having been added, `cordova platform save` is now run
  to persist platform engine specification to `config.xml`.
* Most `ionic cordova` commands now read the list of platforms from
  `config.xml`, so if the platform engine isn't listed, it attempts to install,
  at which point if an error occurs, it runs `cordova platform save`.
* Fixed `ionic cordova prepare` such that it no longer errors when platforms
  are not detected, it just does nothing, as there is nothing to do.

<a name="3.7.0"></a>
### 3.7.0 (2017-08-02)

* :tada: Added `ionic build` (finally). Now you can invoke a build for web
  assets and prepare them for platform targets. For Ionic/Cordova apps, this
  means running `cordova prepare` after the build, allowing you to use Android
  Studio or Xcode for native build/test/deploy. It is different from `ionic
  cordova build` in that it does not run `cordova build`. The native build must
  happen separately, if at all.
* Made `ionic cordova` commands friendlier to your `config.xml`. The Ionic CLI
  was formatting XML differently from Cordova, which resulted in an annoying
  set of changes which each command. Now we use the same XML library as Cordova
  with the same settings, so massive reformatting should be minimal.
* Added source image change detection to `ionic cordova resources`, which saves
  a checksum file (`.md5`) next to each source image. If the source image
  changes, the checksums will no longer match and the resources will be
  regenerated for that source image.
* Added `--json` option to `ionic config get`, `ionic package list`, and `ionic
  package info` for those using these commands programmatically.
* Fixed Windows bug for spawning the daemon process that was occasional with a
  wonky `node_modules`. Shoutout to [@imgx64](https://github.com/imgx64) for
  being so helpful!
* Allow `--address=localhost` with `ionic cordova` run/emulate commands. Some
  things are only possible when port forwarding from computer to device and
  using `localhost` as the "external" address that the device loads during
  livereload.
* `ionic cordova resources` and `ionic cordova platform` now respect the
  `Orientation` preference (see
  [Preferences](https://cordova.apache.org/docs/en/latest/config_ref/#preference)).
* Fixed `ionic serve` ignoring `-b` option when `--lab` was used.

<a name="3.6.0"></a>
### 3.6.0 (2017-07-27)

* Added prompt for local CLI installation. It is now required that the local
  CLI be installed to use local CLI plugins (which provide often necessary
  functionality such as `ionic serve`). You can use the global `ionic` binary
  from `npm i -g ionic` installation and it will use the local CLI version if
  installed, similar to gulp or other CLIs. The CLI is installed locally for
  new projects by default. See [this
  comment](https://github.com/ionic-team/ionic-cli/issues/2570#issuecomment-318571127)
  for detailed information.
* Added `ionic config` commands for getting and setting project
  (`ionic.config.json`) and global CLI config (`~/.ionic/config.json`) files.
  See [Config
  Files](https://ionicframework.com/docs/cli/configuring.html#config-files).
* Removed `--no-timeouts`: All CLI timeouts have been removed, so the option is
  useless.
* Fixed odd behavior of `--no-interactive` and `--confirm`: the flags now work
  per-command and do not persist the mode.
* Moved update checking into an opt-in background process that checks npm for
  new versions. The CLI now simply reads a file of latest versions instead of
  doing network requests.
* Fixed CLI HTTP requests not being proxied for project commands. For this to
  work, the CLI and the proxy plugin must be installed locally. See [Using a
  Proxy](https://ionicframework.com/docs/cli/configuring.html#using-a-proxy).
* Added `ionic logout` command. (Hidden for now.)
* Using `--no-interactive` will no longer prompt for CLI updates at all.
* Fixed issue with Ionic 1 not live-reloading in devices.
* Added `--no-build` option to `ionic cordova build` to skip Ionic builds.
* Added check for Android SDK Tools version during `ionic info`.
* Added `--no-module` option to Ionic Angular generators. By default, if
  applicable, components are generated with corresponding `@NgModule` classes
  which allow the component to be lazy-loaded. This new flag offers the ability
  to disable this feature.
* Added `--constants` option to Ionic Angular generators. If provided, a file
  will be generated that stores string constants for identifiers for
  lazy-loaded pages.

<a name="3.5.0"></a>
### 3.5.0 (2017-07-11)

* Added deploy metadata option for `ionic upload`. Thanks,
  [@harshabonthu](https://github.com/harshabonthu)!
* Added CI detection to switch CLI into non-interactive mode.
* Added logging for showing the execution of npm script hooks.
* Added better error messaging for gulpfile errors.
* Removed non-printing characters in the output of `ionic --version`.
* Fixed lack of error message for unknown generator types.
* Fixed incorrect interpretation of app IDs in scientific notation. (Only if
  you have a really unfortunate app_id such as `12345e10` :joy:). See
  [#2506](https://github.com/ionic-team/ionic-cli/issues/2506).

<a name="3.4.0"></a>
### 3.4.0 (2017-06-12)

* **Warning**: For Ionic 1 projects, the `sass` gulp task is no longer
  automatically run during SCSS file changes during `ionic serve`. See the
  bullet point below!
* Added CLI hooks that you can use to run code during CLI events using npm
  scripts. See
  [Hooks](https://ionicframework.com/docs/cli/configuring.html#hooks) for
  usage.
* :tada: Added `@ionic/cli-plugin-gulp`! This plugin will hook into
  appropriately named gulp tasks during CLI events. It will also automatically
  run the `sass` gulp task during SCSS file changes during `ionic serve`.
* Fixed an issue where `0.0.0.0` was the address being opened in the browser
  for Ionic 1 apps for server. Now the dev server still *binds* on `0.0.0.0` by
  default, but opens `localhost` in the browser.
* Fixed npm errors bubbling up during CLI update checks while offline.
* Improved `--help` descriptions of a few Cordova commands.

<a name="3.3.0"></a>
### 3.3.0 (2017-05-31)

* Added CLI flag for turning on/off timeouts: `--[no-]timeout`
* Added fuller descriptions to the `--help` output of individual commands.
* Improved Cordova argument parsing.
* Fixed the proxy plugin so `ionic start` works behind a corporate firewall.
* Improved CLI automatic update feature.

<a name="3.2.0"></a>
### 3.2.0 (2017-05-23)

* Added [CLI flags](https://github.com/ionic-team/ionic-cli#cli-flags), which
  change CLI behavior. There is now `--quiet`, `--[no-]interactive`
  (interactive/non-interactive mode), `--[no-]confirm`.
* Added non-interactive mode, which is useful for CI/CD servers. It disables
  "flair" such as spinners and unnecessary output. It also disables prompts.
* Added automatic login capability with `IONIC_EMAIL` and `IONIC_PASSWORD`
  environment variables.
* Added Cordova platforms to output of `ionic info`.
* (Somewhat) support `documentRoot` and `watchPatterns` (which are attributes
  of `ionic.config.json`) for Ionic 1 projects.
* If git is installed, new Ionic projects are automatically setup as
  repositories and an initial commit is made.

<a name="3.1.0"></a>
### 3.1.0 (2017-05-16)

* Added `--aot`, `--minifyjs`, `--minifycss`, `--optimizejs` flags for build
  commands of Ionic Angular projects.
* Fixed some runtime errors.
* Took out confirmation prompt for logging in again when already logged in.

<a name="3.0.0"></a>
### 3.0.0 (2017-05-09)

[CLI v3 Blog Post](https://blog.ionicframework.com/announcing-ionic-cli-v3/)
:tada:

#### Upgrading from CLI v2

As a reminder, Ionic Cloud users must migrate their apps to [Ionic
Pro](https://dashboard.ionicjs.com/apps) to continue using our services. The
changes below often reference Ionic Cloud, which is deprecated. See the [Cloud
Migration guide](https://ionicframework.com/docs/pro/migration/) for details
and [the CLI website](https://ionicframework.com/docs/cli/#ionic-pro) to see
how the CLI integrates with Ionic Pro.

##### Required Changes

* If you're using Ionic Deploy, you'll need to update
  [`ionic-plugin-deploy`](https://github.com/ionic-team/ionic-plugin-deploy) to
  the latest version. See
  [#2237](https://github.com/ionic-team/ionic-cli/issues/2237) and
  [ionic-team/ionic-plugin-deploy#122](https://github.com/ionic-team/ionic-plugin-deploy/issues/122).

##### Removed Commands

* `setup`: This was only used to setup sass in Ionic 1 projects, which now is
  now handled in `start`.
* `share`: Please use the [Dashboard](https://apps.ionic.io/) to manage
  collaborators.
* `lib`, `add`, `remove`, `list`: For v1 projects, we recommend using
  [bower](https://bower.io/).
* `io`: Please configure apps in the [Dashboard](https://apps.ionic.io/) and
  use `link` to associate your local project.
* `security`: Please manage security profiles in the
  [Dashboard](https://apps.ionic.io/).
* `push`: Please manage push credentials (through security profiles) in the
  [Dashboard](https://apps.ionic.io/).
* ~~`config`: Please manually edit the `ionic.config.json` file.~~ `ionic
  config` is back! Please refer to `ionic config get --help` and `ionic config
  set --help`.
* `service`: Please migrate your app to use the [Ionic Cloud
  Client](https://github.com/ionic-team/ionic-cloud).
* `state`: The plugins and platforms can [be managed entirely by
  Cordova](https://cordova.apache.org/docs/en/latest/platform_plugin_versioning_ref/).
  Please remove the `cordovaPlatforms` and `cordovaPlugins` keys from your
  `package.json` file. If you're using Cordova 7, please [review the
  announcement](https://cordova.apache.org/news/2017/05/04/cordova-7.html)
  about how Cordova uses `config.xml` and `package.json` to manage plugins and
  platforms.

##### Additional Changes

* Added commands: `signup`. Signup will change in the future, but as for now it
  simply opens up the signup page.
* Cordova commands have been namespaced to allow for future platform support
  and to reduce clutter.
* Many command arguments, options, and flags have changed. For example, the
  `--v1` and `--v2` flags in `ionic start` have been removed in favor of
  `--type` with respective values `ionic1` (for v1) and `ionic-angular` (for
  latest Ionic Angular version). Please use `ionic help <commands>` for new
  command usage.
* `generate` command has been overhauled to interactively generate components,
  pages, directives, etc. It uses the power of
  [app-scripts](https://github.com/ionic-team/ionic-app-scripts/) to hook up
  generated entities to your app. In the future, generators will continue to be
  expanded upon.

## Packages

You can drill down into commit-level changes in the CHANGELOG files of each
package.

* [`ionic`](https://github.com/ionic-team/ionic-cli/blob/master/packages/ionic)
  ([CHANGELOG.md](https://github.com/ionic-team/ionic-cli/blob/master/packages/ionic/CHANGELOG.md))
* [`@ionic/cli-utils`](https://github.com/ionic-team/ionic-cli/blob/master/packages/@ionic/cli-utils)
  ([CHANGELOG.md](https://github.com/ionic-team/ionic-cli/blob/master/packages/@ionic/cli-utils/CHANGELOG.md))

**Plugins**:

* [`@ionic/cli-plugin-proxy`](https://github.com/ionic-team/ionic-cli/blob/master/packages/@ionic/cli-plugin-proxy)
  ([CHANGELOG.md](https://github.com/ionic-team/ionic-cli/blob/master/packages/@ionic/cli-plugin-proxy/CHANGELOG.md))

## Older Changes

Older changes (CLI 2 and before) can be viewed in the `2.x` branch's
[CHANGELOG.md](https://github.com/ionic-team/ionic-cli/blob/2.x/CHANGELOG.md).
