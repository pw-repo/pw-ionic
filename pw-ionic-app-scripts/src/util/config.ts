import { join, resolve } from 'path';
import { accessSync, readJSONSync, statSync } from 'fs-extra';

import { Logger } from '../logger/logger';
import { BuildContext, TaskInfo } from './interfaces';
import { getBooleanPropertyValue, objectAssign } from './helpers';
import { FileCache } from './file-cache';
import * as Constants from './constants';

/**
 * Create a context object which is used by all the build tasks.
 * Filling the config data uses the following hierarchy, which will
 * keep going down the list until it, or if it, finds data.
 *
 * 1) Get from the passed in context variable
 * 2) Get from the config file set using the command-line args
 * 3) Get from environment variable
 * 4) Get from package.json config property
 * 5) Get environment variables
 *
 * Lastly, Ionic's default configs will always fill in any data
 * which is missing from the user's data.
 */
export function generateContext(context?: BuildContext): BuildContext {
  if (!context) {
    context = {};
  }

  if (!context.fileCache) {
     context.fileCache = new FileCache();
  }

  context.isProd = [
    context.isProd,
    hasArg('--prod')
  ].find(val => typeof val === 'boolean');

  setProcessEnvVar(Constants.ENV_VAR_IONIC_ENV, (context.isProd ? Constants.ENV_VAR_PROD : Constants.ENV_VAR_DEV));

  // If context is prod then the following flags must be set to true
  context.runAot = [
    context.runAot,
    context.isProd || hasArg('--aot'),
  ].find(val => typeof val === 'boolean');

  context.runMinifyJs = [
    context.runMinifyJs,
    context.isProd || hasArg('--minifyJs')
  ].find(val => typeof val === 'boolean');

  context.runMinifyCss = [
    context.runMinifyCss,
    context.isProd || hasArg('--minifyCss')
  ].find(val => typeof val === 'boolean');

  context.optimizeJs = [
    context.optimizeJs,
    context.isProd || hasArg('--optimizeJs')
  ].find(val => typeof val === 'boolean');

  if (typeof context.isWatch !== 'boolean') {
    context.isWatch = hasArg('--watch');
  }

  setProcessEnvVar(Constants.ENV_VAR_IONIC_AOT, `${context.runAot}`);
  Logger.debug(`${Constants.ENV_VAR_IONIC_AOT} set to ${context.runAot}`);

  setProcessEnvVar(Constants.ENV_VAR_IONIC_MINIFY_JS, `${context.runMinifyJs}`);
  Logger.debug(`${Constants.ENV_VAR_IONIC_MINIFY_JS} set to ${context.runMinifyJs}`);

  setProcessEnvVar(Constants.ENV_VAR_IONIC_MINIFY_CSS, `${context.runMinifyCss}`);
  Logger.debug(`${Constants.ENV_VAR_IONIC_MINIFY_CSS} set to ${context.runMinifyCss}`);

  setProcessEnvVar(Constants.ENV_VAR_IONIC_OPTIMIZE_JS, `${context.optimizeJs}`);
  Logger.debug(`${Constants.ENV_VAR_IONIC_OPTIMIZE_JS} set to ${context.optimizeJs}`);

  setProcessEnvVar(Constants.ENV_VAR_IONIC_MINIFY_JS, `${context.runMinifyJs}`);
  Logger.debug(`${Constants.ENV_VAR_IONIC_MINIFY_JS} set to ${context.runMinifyJs}`);

  context.rootDir = resolve(context.rootDir || getConfigValue(context, '--rootDir', null, Constants.ENV_VAR_ROOT_DIR, Constants.ENV_VAR_ROOT_DIR.toLowerCase(), processCwd));
  setProcessEnvVar(Constants.ENV_VAR_ROOT_DIR, context.rootDir);
  Logger.debug(`rootDir set to ${context.rootDir}`);

  context.tmpDir = resolve(context.tmpDir || getConfigValue(context, '--tmpDir', null, Constants.ENV_VAR_TMP_DIR, Constants.ENV_VAR_TMP_DIR.toLowerCase(), join(context.rootDir, Constants.TMP_DIR)));
  setProcessEnvVar(Constants.ENV_VAR_TMP_DIR, context.tmpDir);
  Logger.debug(`tmpDir set to ${context.tmpDir}`);

  context.srcDir = resolve(context.srcDir || getConfigValue(context, '--srcDir', null, Constants.ENV_VAR_SRC_DIR, Constants.ENV_VAR_SRC_DIR.toLowerCase(), join(context.rootDir, Constants.SRC_DIR)));
  setProcessEnvVar(Constants.ENV_VAR_SRC_DIR, context.srcDir);
  Logger.debug(`srcDir set to ${context.srcDir}`);

  const deepLinksDir = resolve(getConfigValue(context, '--deepLinksDir', null, Constants.ENV_VAR_DEEPLINKS_DIR, Constants.ENV_VAR_DEEPLINKS_DIR.toLowerCase(), context.srcDir));
  setProcessEnvVar(Constants.ENV_VAR_DEEPLINKS_DIR, deepLinksDir);
  Logger.debug(`deepLinksDir set to ${deepLinksDir}`);

  context.wwwDir = resolve(context.wwwDir || getConfigValue(context, '--wwwDir', null, Constants.ENV_VAR_WWW_DIR, Constants.ENV_VAR_WWW_DIR.toLowerCase(), join(context.rootDir, Constants.WWW_DIR)));
  setProcessEnvVar(Constants.ENV_VAR_WWW_DIR, context.wwwDir);
  Logger.debug(`wwwDir set to ${context.wwwDir}`);

  context.wwwIndex = getConfigValue(context, '--wwwIndex', null, Constants.ENV_VAR_HTML_TO_SERVE, Constants.ENV_VAR_HTML_TO_SERVE.toLowerCase(), 'index.html');
  setProcessEnvVar(Constants.ENV_VAR_HTML_TO_SERVE, context.wwwIndex);
  Logger.debug(`wwwIndex set to ${context.wwwIndex}`);

  context.buildDir = resolve(context.buildDir || getConfigValue(context, '--buildDir', null, Constants.ENV_VAR_BUILD_DIR, Constants.ENV_VAR_BUILD_DIR.toLowerCase(), join(context.wwwDir, Constants.BUILD_DIR)));
  setProcessEnvVar(Constants.ENV_VAR_BUILD_DIR, context.buildDir);
  Logger.debug(`buildDir set to ${context.buildDir}`);

  const fontsDir = resolve(getConfigValue(context, '--fontsDir', null, Constants.ENV_VAR_FONTS_DIR, Constants.ENV_VAR_FONTS_DIR.toLowerCase(), join(context.wwwDir, 'assets', 'fonts')));
  setProcessEnvVar(Constants.ENV_VAR_FONTS_DIR, fontsDir);
  Logger.debug(`fontsDir set to ${fontsDir}`);

  context.sourcemapDir = resolve(context.sourcemapDir || getConfigValue(context, '--sourcemapDir', null, Constants.ENV_VAR_SOURCEMAP_DIR, Constants.ENV_VAR_SOURCEMAP_DIR.toLowerCase(), Constants.SOURCEMAP_DIR));
  setProcessEnvVar(Constants.ENV_VAR_SOURCEMAP_DIR, context.sourcemapDir);
  Logger.debug(`sourcemapDir set to ${context.sourcemapDir}`);

  context.pagesDir = resolve(context.pagesDir || getConfigValue(context, '--pagesDir', null, Constants.ENV_VAR_PAGES_DIR, Constants.ENV_VAR_PAGES_DIR.toLowerCase(), join(context.srcDir, 'pages')));
  setProcessEnvVar(Constants.ENV_VAR_PAGES_DIR, context.pagesDir);
  Logger.debug(`pagesDir set to ${context.pagesDir}`);

  context.componentsDir = resolve(context.componentsDir || getConfigValue(context, '--componentsDir', null, Constants.ENV_VAR_COMPONENTS_DIR, Constants.ENV_VAR_COMPONENTS_DIR.toLowerCase(), join(context.srcDir, 'components')));
  setProcessEnvVar(Constants.ENV_VAR_COMPONENTS_DIR, context.componentsDir);
  Logger.debug(`componentsDir set to ${context.componentsDir}`);

  context.directivesDir = resolve(context.directivesDir || getConfigValue(context, '--directivesDir', null, Constants.ENV_VAR_DIRECTIVES_DIR, Constants.ENV_VAR_DIRECTIVES_DIR.toLowerCase(), join(context.srcDir, 'directives')));
  setProcessEnvVar(Constants.ENV_VAR_DIRECTIVES_DIR, context.directivesDir);
  Logger.debug(`directivesDir set to ${context.directivesDir}`);

  context.pipesDir = resolve(context.pipesDir || getConfigValue(context, '--pipesDir', null, Constants.ENV_VAR_PIPES_DIR, Constants.ENV_VAR_PIPES_DIR.toLowerCase(), join(context.srcDir, 'pipes')));
  setProcessEnvVar(Constants.ENV_VAR_PIPES_DIR, context.pipesDir);
  Logger.debug(`pipesDir set to ${context.pipesDir}`);

  context.providersDir = resolve(context.providersDir || getConfigValue(context, '--providersDir', null, Constants.ENV_VAR_PROVIDERS_DIR, Constants.ENV_VAR_PROVIDERS_DIR.toLowerCase(), join(context.srcDir, 'providers')));
  setProcessEnvVar(Constants.ENV_VAR_PROVIDERS_DIR, context.providersDir);
  Logger.debug(`providersDir set to ${context.providersDir}`);

  context.nodeModulesDir = join(context.rootDir, Constants.NODE_MODULES);
  setProcessEnvVar(Constants.ENV_VAR_NODE_MODULES_DIR, context.nodeModulesDir);
  Logger.debug(`nodeModulesDir set to ${context.nodeModulesDir}`);

  context.ionicAngularDir = resolve(context.ionicAngularDir || getConfigValue(context, '--ionicAngularDir', null, Constants.ENV_VAR_IONIC_ANGULAR_DIR, Constants.ENV_VAR_IONIC_ANGULAR_DIR.toLowerCase(), join(context.nodeModulesDir, Constants.IONIC_ANGULAR)));
  setProcessEnvVar(Constants.ENV_VAR_IONIC_ANGULAR_DIR, context.ionicAngularDir);
  Logger.debug(`ionicAngularDir set to ${context.ionicAngularDir}`);

  const angularDir = resolve(getConfigValue(context, '--angularDir', null, Constants.ENV_VAR_ANGULAR_CORE_DIR, Constants.ENV_VAR_ANGULAR_CORE_DIR.toLowerCase(), join(context.nodeModulesDir, Constants.AT_ANGULAR, 'core')));
  setProcessEnvVar(Constants.ENV_VAR_ANGULAR_CORE_DIR, angularDir);
  Logger.debug(`angularDir set to ${angularDir}`);
  context.angularCoreDir = angularDir;

  const typescriptDir = resolve(getConfigValue(context, '--typescriptDir', null, Constants.ENV_VAR_TYPESCRIPT_DIR, Constants.ENV_VAR_TYPESCRIPT_DIR.toLowerCase(), join(context.nodeModulesDir, Constants.TYPESCRIPT)));
  setProcessEnvVar(Constants.ENV_VAR_TYPESCRIPT_DIR, typescriptDir);
  Logger.debug(`typescriptDir set to ${typescriptDir}`);
  context.typescriptDir = typescriptDir;

  const defaultCoreCompilerFilePath = join(context.ionicAngularDir, 'compiler');
  context.coreCompilerFilePath = resolve(context.coreCompilerFilePath || getConfigValue(context, '--coreCompilerFilePath', null, Constants.ENV_VAR_CORE_COMPILER_FILE_PATH, Constants.ENV_VAR_CORE_COMPILER_FILE_PATH.toLowerCase(), defaultCoreCompilerFilePath));
  setProcessEnvVar(Constants.ENV_VAR_CORE_COMPILER_FILE_PATH, context.coreCompilerFilePath);
  Logger.debug(`coreCompilerFilePath set to ${context.coreCompilerFilePath}`);

  const defaultCoreDir = context.ionicAngularDir;
  context.coreDir = resolve(context.coreDir || getConfigValue(context, '--coreDir', null, Constants.ENV_VAR_CORE_DIR, Constants.ENV_VAR_CORE_DIR.toLowerCase(), defaultCoreDir));
  setProcessEnvVar(Constants.ENV_VAR_CORE_DIR, context.coreDir);
  Logger.debug(`coreDir set to ${context.coreDir}`);

  const rxjsDir = resolve(getConfigValue(context, '--rxjsDir', null, Constants.ENV_VAR_RXJS_DIR, Constants.ENV_VAR_RXJS_DIR.toLowerCase(), join(context.nodeModulesDir, Constants.RXJS)));
  setProcessEnvVar(Constants.ENV_VAR_RXJS_DIR, rxjsDir);
  Logger.debug(`rxjsDir set to ${rxjsDir}`);

  const ionicAngularTemplatesDir = join(context.ionicAngularDir, 'templates');
  setProcessEnvVar(Constants.ENV_VAR_IONIC_ANGULAR_TEMPLATE_DIR, ionicAngularTemplatesDir);
  Logger.debug(`ionicAngularTemplatesDir set to ${ionicAngularTemplatesDir}`);

  context.platform = getConfigValue(context, '--platform', null, Constants.ENV_VAR_PLATFORM, null, null);
  setProcessEnvVar(Constants.ENV_VAR_PLATFORM, context.platform);
  Logger.debug(`platform set to ${context.platform}`);

  context.target = getConfigValue(context, '--target', null, Constants.ENV_VAR_TARGET, null, null);
  setProcessEnvVar(Constants.ENV_VAR_TARGET, context.target);
  Logger.debug(`target set to ${context.target}`);

  const ionicAngularEntryPoint = resolve(getConfigValue(context, '--ionicAngularEntryPoint', null, Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT, Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT.toLowerCase(), join(context.ionicAngularDir, 'index.js')));
  setProcessEnvVar(Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT, ionicAngularEntryPoint);
  Logger.debug(`ionicAngularEntryPoint set to ${ionicAngularEntryPoint}`);

  const appScriptsDir = join(__dirname, '..', '..');
  setProcessEnvVar(Constants.ENV_VAR_APP_SCRIPTS_DIR, appScriptsDir);
  Logger.debug(`appScriptsDir set to ${appScriptsDir}`);

  const generateSourceMap = getConfigValue(context, '--generateSourceMap', null, Constants.ENV_VAR_GENERATE_SOURCE_MAP, Constants.ENV_VAR_GENERATE_SOURCE_MAP.toLowerCase(), context.isProd || context.runMinifyJs ? null : 'true');
  setProcessEnvVar(Constants.ENV_VAR_GENERATE_SOURCE_MAP, generateSourceMap);
  Logger.debug(`generateSourceMap set to ${generateSourceMap}`);

  const sourceMapTypeValue = getConfigValue(context, '--sourceMapType', null, Constants.ENV_VAR_SOURCE_MAP_TYPE, Constants.ENV_VAR_SOURCE_MAP_TYPE.toLowerCase(), Constants.SOURCE_MAP_TYPE_EXPENSIVE);
  setProcessEnvVar(Constants.ENV_VAR_SOURCE_MAP_TYPE, sourceMapTypeValue);
  Logger.debug(`sourceMapType set to ${sourceMapTypeValue}`);

  const moveSourceMaps = getConfigValue(context, '--moveSourceMaps', null, Constants.ENV_VAR_MOVE_SOURCE_MAPS, Constants.ENV_VAR_MOVE_SOURCE_MAPS.toLowerCase(), 'true');
  setProcessEnvVar(Constants.ENV_VAR_MOVE_SOURCE_MAPS, moveSourceMaps);
  Logger.debug(`moveSourceMaps set to ${moveSourceMaps}`);

  const tsConfigPathValue = resolve(getConfigValue(context, '--tsconfig', null, Constants.ENV_TS_CONFIG, Constants.ENV_TS_CONFIG.toLowerCase(), join(context.rootDir, 'tsconfig.json')));
  setProcessEnvVar(Constants.ENV_TS_CONFIG, tsConfigPathValue);
  Logger.debug(`tsconfig set to ${tsConfigPathValue}`);

  const readConfigJson = getConfigValue(context, '--readConfigJson', null, Constants.ENV_READ_CONFIG_JSON, Constants.ENV_READ_CONFIG_JSON.toLowerCase(), 'true');
  setProcessEnvVar(Constants.ENV_READ_CONFIG_JSON, readConfigJson);
  Logger.debug(`readConfigJson set to ${readConfigJson}`);

  const appEntryPointPathValue = resolve(getConfigValue(context, '--appEntryPoint', null, Constants.ENV_APP_ENTRY_POINT, Constants.ENV_APP_ENTRY_POINT.toLowerCase(), join(context.srcDir, 'app', 'main.ts')));
  setProcessEnvVar(Constants.ENV_APP_ENTRY_POINT, appEntryPointPathValue);
  Logger.debug(`appEntryPoint set to ${appEntryPointPathValue}`);

  context.appNgModulePath = resolve(getConfigValue(context, '--appNgModulePath', null, Constants.ENV_APP_NG_MODULE_PATH, Constants.ENV_APP_NG_MODULE_PATH.toLowerCase(), join(context.srcDir, 'app', 'app.module.ts')));
  setProcessEnvVar(Constants.ENV_APP_NG_MODULE_PATH, context.appNgModulePath);
  Logger.debug(`appNgModulePath set to ${context.appNgModulePath}`);


  context.componentsNgModulePath = resolve(getConfigValue(context, '--componentsNgModulePath', null, Constants.ENV_COMPONENTS_NG_MODULE_PATH, Constants.ENV_COMPONENTS_NG_MODULE_PATH.toLowerCase(), join(context.srcDir, 'components', 'components.module.ts')));
  setProcessEnvVar(Constants.ENV_COMPONENTS_NG_MODULE_PATH, context.componentsNgModulePath);
  Logger.debug(`componentsNgModulePath set to ${context.componentsNgModulePath}`);

  context.pipesNgModulePath = resolve(getConfigValue(context, '--pipesNgModulePath', null, Constants.ENV_PIPES_NG_MODULE_PATH, Constants.ENV_PIPES_NG_MODULE_PATH.toLowerCase(), join(context.srcDir, 'pipes', 'pipes.module.ts')));
  setProcessEnvVar(Constants.ENV_PIPES_NG_MODULE_PATH, context.pipesNgModulePath);
  Logger.debug(`pipesNgModulePath set to ${context.pipesNgModulePath}`);

  context.directivesNgModulePath = resolve(getConfigValue(context, '--directivesNgModulePath', null, Constants.ENV_DIRECTIVES_NG_MODULE_PATH, Constants.ENV_DIRECTIVES_NG_MODULE_PATH.toLowerCase(), join(context.srcDir, 'directives', 'directives.module.ts')));
  setProcessEnvVar(Constants.ENV_DIRECTIVES_NG_MODULE_PATH, context.directivesNgModulePath);
  Logger.debug(`directivesNgModulePath set to ${context.directivesNgModulePath}`);

  const appNgModuleClass = getConfigValue(context, '--appNgModuleClass', null, Constants.ENV_APP_NG_MODULE_CLASS, Constants.ENV_APP_NG_MODULE_CLASS.toLowerCase(), 'AppModule');
  setProcessEnvVar(Constants.ENV_APP_NG_MODULE_CLASS, appNgModuleClass);
  Logger.debug(`appNgModuleClass set to ${appNgModuleClass}`);

  const pathToGlobUtil = join(getProcessEnvVar(Constants.ENV_VAR_APP_SCRIPTS_DIR), 'dist', 'util', 'glob-util.js');
  setProcessEnvVar(Constants.ENV_GLOB_UTIL, pathToGlobUtil);
  Logger.debug(`pathToGlobUtil set to ${pathToGlobUtil}`);

  const cleanBeforeCopy = getConfigValue(context, '--cleanBeforeCopy', null, Constants.ENV_CLEAN_BEFORE_COPY, Constants.ENV_CLEAN_BEFORE_COPY.toLowerCase(), null);
  setProcessEnvVar(Constants.ENV_CLEAN_BEFORE_COPY, cleanBeforeCopy);
  Logger.debug(`cleanBeforeCopy set to ${cleanBeforeCopy}`);

  context.outputJsFileName = getConfigValue(context, '--outputJsFileName', null, Constants.ENV_OUTPUT_JS_FILE_NAME, Constants.ENV_OUTPUT_JS_FILE_NAME.toLowerCase(), 'main.js');
  setProcessEnvVar(Constants.ENV_OUTPUT_JS_FILE_NAME, context.outputJsFileName);
  Logger.debug(`outputJsFileName set to ${context.outputJsFileName}`);

  context.outputCssFileName = getConfigValue(context, '--outputCssFileName', null, Constants.ENV_OUTPUT_CSS_FILE_NAME, Constants.ENV_OUTPUT_CSS_FILE_NAME.toLowerCase(), 'main.css');
  setProcessEnvVar(Constants.ENV_OUTPUT_CSS_FILE_NAME, context.outputCssFileName);
  Logger.debug(`outputCssFileName set to ${context.outputCssFileName}`);

  const webpackFactoryPath = join(getProcessEnvVar(Constants.ENV_VAR_APP_SCRIPTS_DIR), 'dist', 'webpack', 'ionic-webpack-factory.js');
  setProcessEnvVar(Constants.ENV_WEBPACK_FACTORY, webpackFactoryPath);
  Logger.debug(`webpackFactoryPath set to ${webpackFactoryPath}`);

  const webpackLoaderPath = join(getProcessEnvVar(Constants.ENV_VAR_APP_SCRIPTS_DIR), 'dist', 'webpack', 'loader.js');
  setProcessEnvVar(Constants.ENV_WEBPACK_LOADER, webpackLoaderPath);
  Logger.debug(`webpackLoaderPath set to ${webpackLoaderPath}`);

  const cacheLoaderPath = join(getProcessEnvVar(Constants.ENV_VAR_APP_SCRIPTS_DIR), 'dist', 'webpack', 'cache-loader.js');
  setProcessEnvVar(Constants.ENV_CACHE_LOADER, cacheLoaderPath);
  Logger.debug(`cacheLoaderPath set to ${cacheLoaderPath}`);

  const aotWriteToDisk = getConfigValue(context, '--aotWriteToDisk', null, Constants.ENV_AOT_WRITE_TO_DISK, Constants.ENV_AOT_WRITE_TO_DISK.toLowerCase(), null);
  setProcessEnvVar(Constants.ENV_AOT_WRITE_TO_DISK, aotWriteToDisk);
  Logger.debug(`aotWriteToDisk set to ${aotWriteToDisk}`);

  const printWebpackDependencyTree = getConfigValue(context, '--printWebpackDependencyTree', null, Constants.ENV_PRINT_WEBPACK_DEPENDENCY_TREE, Constants.ENV_PRINT_WEBPACK_DEPENDENCY_TREE.toLowerCase(), null);
  setProcessEnvVar(Constants.ENV_PRINT_WEBPACK_DEPENDENCY_TREE, printWebpackDependencyTree);
  Logger.debug(`printWebpackDependencyTree set to ${printWebpackDependencyTree}`);
  const typeCheckOnLint = getConfigValue(context, '--typeCheckOnLint', null, Constants.ENV_TYPE_CHECK_ON_LINT, Constants.ENV_TYPE_CHECK_ON_LINT.toLowerCase(), null);
  setProcessEnvVar(Constants.ENV_TYPE_CHECK_ON_LINT, typeCheckOnLint);
  Logger.debug(`typeCheckOnLint set to ${typeCheckOnLint}`);

  const bailOnLintError = getConfigValue(context, '--bailOnLintError', null, Constants.ENV_BAIL_ON_LINT_ERROR, Constants.ENV_BAIL_ON_LINT_ERROR.toLowerCase(), null);
  setProcessEnvVar(Constants.ENV_BAIL_ON_LINT_ERROR, bailOnLintError);
  Logger.debug(`bailOnLintError set to ${bailOnLintError}`);

  const enableLint = getConfigValue(context, '--enableLint', null, Constants.ENV_ENABLE_LINT, Constants.ENV_ENABLE_LINT.toLowerCase(), 'true');
  setProcessEnvVar(Constants.ENV_ENABLE_LINT, enableLint);
  Logger.debug(`enableLint set to ${enableLint}`);

  const disableLogging = getConfigValue(context, '--disableLogging', null, Constants.ENV_DISABLE_LOGGING, Constants.ENV_DISABLE_LOGGING.toLowerCase(), null);
  setProcessEnvVar(Constants.ENV_DISABLE_LOGGING, disableLogging);
  Logger.debug(`disableLogging set to ${disableLogging}`);

  const startWatchTimeout = getConfigValue(context, '--startWatchTimeout', null, Constants.ENV_START_WATCH_TIMEOUT, Constants.ENV_START_WATCH_TIMEOUT.toLowerCase(), '3000');
  setProcessEnvVar(Constants.ENV_START_WATCH_TIMEOUT, startWatchTimeout);
  Logger.debug(`startWatchTimeout set to ${startWatchTimeout}`);

  const ngModuleFileNameSuffix = getConfigValue(context, '--ngModuleFileNameSuffix', null, Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX, Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX.toLowerCase(), '.module.ts');
  setProcessEnvVar(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX, ngModuleFileNameSuffix);
  Logger.debug(`ngModuleFileNameSuffix set to ${ngModuleFileNameSuffix}`);

  const polyfillName = getConfigValue(context, '--polyfillFileName', null, Constants.ENV_POLYFILL_FILE_NAME, Constants.ENV_POLYFILL_FILE_NAME.toLowerCase(), 'polyfills.js');
  setProcessEnvVar(Constants.ENV_POLYFILL_FILE_NAME, polyfillName);
  Logger.debug(`polyfillName set to ${polyfillName}`);

  const purgeUnusedFonts = getConfigValue(context, '--purgeUnusedFonts', null, Constants.ENV_PURGE_UNUSED_FONTS, Constants.ENV_PURGE_UNUSED_FONTS.toLowerCase(), 'true');
  setProcessEnvVar(Constants.ENV_PURGE_UNUSED_FONTS, purgeUnusedFonts);
  Logger.debug(`purgeUnusedFonts set to ${purgeUnusedFonts}`);

  /* Provider Path Stuff */
  setProcessEnvVar(Constants.ENV_ACTION_SHEET_CONTROLLER_CLASSNAME, 'ActionSheetController');
  setProcessEnvVar(Constants.ENV_ACTION_SHEET_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'action-sheet', 'action-sheet-controller.js'));
  setProcessEnvVar(Constants.ENV_ACTION_SHEET_VIEW_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'action-sheet', 'action-sheet.js'));
  setProcessEnvVar(Constants.ENV_ACTION_SHEET_COMPONENT_PATH, join(context.ionicAngularDir, 'components', 'action-sheet', 'action-sheet-component.js'));
  setProcessEnvVar(Constants.ENV_ACTION_SHEET_COMPONENT_FACTORY_PATH, join(context.ionicAngularDir, 'components', 'action-sheet', 'action-sheet-component.ngfactory.js'));

  setProcessEnvVar(Constants.ENV_ALERT_CONTROLLER_CLASSNAME, 'AlertController');
  setProcessEnvVar(Constants.ENV_ALERT_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'alert', 'alert-controller.js'));
  setProcessEnvVar(Constants.ENV_ALERT_VIEW_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'alert', 'alert.js'));
  setProcessEnvVar(Constants.ENV_ALERT_COMPONENT_PATH, join(context.ionicAngularDir, 'components', 'alert', 'alert-component.js'));
  setProcessEnvVar(Constants.ENV_ALERT_COMPONENT_FACTORY_PATH, join(context.ionicAngularDir, 'components', 'alert', 'alert-component.ngfactory.js'));

  setProcessEnvVar(Constants.ENV_APP_ROOT_COMPONENT_PATH, join(context.ionicAngularDir, 'components', 'app', 'app-root.js'));

  setProcessEnvVar(Constants.ENV_LOADING_CONTROLLER_CLASSNAME, 'LoadingController');
  setProcessEnvVar(Constants.ENV_LOADING_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'loading', 'loading-controller.js'));
  setProcessEnvVar(Constants.ENV_LOADING_VIEW_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'loading', 'loading.js'));
  setProcessEnvVar(Constants.ENV_LOADING_COMPONENT_PATH, join(context.ionicAngularDir, 'components', 'loading', 'loading-component.js'));
  setProcessEnvVar(Constants.ENV_LOADING_COMPONENT_FACTORY_PATH, join(context.ionicAngularDir, 'components', 'loading', 'loading-component.ngfactory.js'));

  setProcessEnvVar(Constants.ENV_MODAL_CONTROLLER_CLASSNAME, 'ModalController');
  setProcessEnvVar(Constants.ENV_MODAL_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'modal', 'modal-controller.js'));
  setProcessEnvVar(Constants.ENV_MODAL_VIEW_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'modal', 'modal.js'));
  setProcessEnvVar(Constants.ENV_MODAL_COMPONENT_PATH, join(context.ionicAngularDir, 'components', 'modal', 'modal-component.js'));
  setProcessEnvVar(Constants.ENV_MODAL_COMPONENT_FACTORY_PATH, join(context.ionicAngularDir, 'components', 'modal', 'modal-component.ngfactory.js'));

  setProcessEnvVar(Constants.ENV_PICKER_CONTROLLER_CLASSNAME, 'PickerController');
  setProcessEnvVar(Constants.ENV_PICKER_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'picker', 'picker-controller.js'));
  setProcessEnvVar(Constants.ENV_PICKER_VIEW_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'picker', 'picker.js'));
  setProcessEnvVar(Constants.ENV_PICKER_COMPONENT_PATH, join(context.ionicAngularDir, 'components', 'picker', 'picker-component.js'));
  setProcessEnvVar(Constants.ENV_PICKER_COMPONENT_FACTORY_PATH, join(context.ionicAngularDir, 'components', 'picker', 'picker-component.ngfactory.js'));

  setProcessEnvVar(Constants.ENV_POPOVER_CONTROLLER_CLASSNAME, 'PopoverController');
  setProcessEnvVar(Constants.ENV_POPOVER_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'popover', 'popover-controller.js'));
  setProcessEnvVar(Constants.ENV_POPOVER_VIEW_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'popover', 'popover.js'));
  setProcessEnvVar(Constants.ENV_POPOVER_COMPONENT_PATH, join(context.ionicAngularDir, 'components', 'popover', 'popover-component.js'));
  setProcessEnvVar(Constants.ENV_POPOVER_COMPONENT_FACTORY_PATH, join(context.ionicAngularDir, 'components', 'popover', 'popover-component.ngfactory.js'));

  setProcessEnvVar(Constants.ENV_SELECT_POPOVER_CLASSNAME, 'SelectPopover');
  setProcessEnvVar(Constants.ENV_SELECT_POPOVER_COMPONENT_PATH, join(context.ionicAngularDir, 'components', 'select', 'select-popover-component.js'));
  setProcessEnvVar(Constants.ENV_SELECT_POPOVER_COMPONENT_FACTORY_PATH, join(context.ionicAngularDir, 'components', 'select', 'select-popover-component.ngfactory.js'));

  setProcessEnvVar(Constants.ENV_TOAST_CONTROLLER_CLASSNAME, 'ToastController');
  setProcessEnvVar(Constants.ENV_TOAST_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'toast', 'toast-controller.js'));
  setProcessEnvVar(Constants.ENV_TOAST_VIEW_CONTROLLER_PATH, join(context.ionicAngularDir, 'components', 'toast', 'toast.js'));
  setProcessEnvVar(Constants.ENV_TOAST_COMPONENT_PATH, join(context.ionicAngularDir, 'components', 'toast', 'toast-component.js'));
  setProcessEnvVar(Constants.ENV_TOAST_COMPONENT_FACTORY_PATH, join(context.ionicAngularDir, 'components', 'toast', 'toast-component.ngfactory.js'));

  const parseDeepLinks = getConfigValue(context, '--parseDeepLinks', null, Constants.ENV_PARSE_DEEPLINKS, Constants.ENV_PARSE_DEEPLINKS.toLowerCase(), 'true');
  setProcessEnvVar(Constants.ENV_PARSE_DEEPLINKS, parseDeepLinks);
  Logger.debug(`parseDeepLinks set to ${parseDeepLinks}`);

  const skipReadIonicAngular = getConfigValue(context, '--skipIonicAngularVersion', null, Constants.ENV_SKIP_IONIC_ANGULAR_VERSION, Constants.ENV_SKIP_IONIC_ANGULAR_VERSION.toLowerCase(), 'false');
  setProcessEnvVar(Constants.ENV_SKIP_IONIC_ANGULAR_VERSION, skipReadIonicAngular);
  Logger.debug(`skipReadIonicAngular set to ${skipReadIonicAngular}`);


  if (!isValidBundler(context.bundler)) {
    context.bundler = bundlerStrategy(context);
    Logger.debug(`bundler set to ${context.bundler}`);
  }

  context.inlineTemplates = true;

  checkDebugMode();

  if (getBooleanPropertyValue(Constants.ENV_DISABLE_LOGGING)) {
    console.debug = () => { };
    console.error = () => { };
    console.info = () => { };
    console.log = () => { };
    console.trace = () => { };
    console.warn = () => { };
  }

  return context;
}

export function getUserConfigFile(context: BuildContext, task: TaskInfo, userConfigFile: string) {
  if (!context) {
    context = generateContext(context);
  }

  if (userConfigFile) {
    return resolve(userConfigFile);
  }

  const defaultConfig = getConfigValue(context, task.fullArg, task.shortArg, task.envVar, task.packageConfig, null);
  if (defaultConfig) {
    return join(context.rootDir, defaultConfig);
  }

  return null;
}


export function fillConfigDefaults(userConfigFile: string, defaultConfigFile: string): any {
  let userConfig: any = null;

  if (userConfigFile) {
    try {
      // check if exists first, so we can print a more specific error message
      // since required config could also throw MODULE_NOT_FOUND
      statSync(userConfigFile);
      // create a fresh copy of the config each time
      userConfig = require(userConfigFile);

      // if user config returns a function call it to determine proper object
      if (typeof userConfig === 'function') {
         userConfig = userConfig();
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.error(`Config file "${userConfigFile}" not found. Using defaults instead.`);
      } else {
        console.error(`There was an error in config file "${userConfigFile}". Using defaults instead.`);
        console.error(e);
      }
    }
  }

  const defaultConfig = require(join('..', '..', 'config', defaultConfigFile));

  // create a fresh copy of the config each time
  // always assign any default values which were not already supplied by the user
  return objectAssign({}, defaultConfig, userConfig);
}

export function bundlerStrategy(context: BuildContext): string {
  return Constants.BUNDLER_WEBPACK;
}


function isValidBundler(bundler: any) {
  return bundler === Constants.BUNDLER_WEBPACK;
}


export function getConfigValue(context: BuildContext, argFullName: string, argShortName: string, envVarName: string, packageConfigProp: string, defaultValue: string) {
  if (!context) {
    context = generateContext(context);
  }

  // first see if the value was set in the command-line args
  const argVal = getArgValue(argFullName, argShortName);
  if (argVal !== null) {
    return argVal;
  }

  // next see if it was set in the environment variables
  // which also checks if it was set in the package.json config property
  const envVar = getProcessEnvVar(envVarName);
  if (envVar !== null) {
    return envVar;
  }

  const packageConfig = getPackageJsonConfig(context, packageConfigProp);
  if (packageConfig !== null) {
    return packageConfig;
  }

  // return the default if nothing above was found
  return defaultValue;
}


function getArgValue(fullName: string, shortName: string): string {
  for (var i = 2; i < processArgv.length; i++) {
    var arg = processArgv[i];
    if (arg === fullName || (shortName && arg === shortName)) {
      var val = processArgv[i + 1];
      if (val !== undefined && val !== '') {
        return val;
      }
    }
  }
  return null;
}


export function hasConfigValue(context: BuildContext, argFullName: string, argShortName: string, envVarName: string, defaultValue: boolean) {
  if (!context) {
    context = generateContext(context);
  }

  if (hasArg(argFullName, argShortName)) {
    return true;
  }

  // next see if it was set in the environment variables
  // which also checks if it was set in the package.json config property
  const envVar = getProcessEnvVar(envVarName);
  if (envVar !== null) {
    return true;
  }

  const packageConfig = getPackageJsonConfig(context, envVarName);
  if (packageConfig !== null) {
    return true;
  }

  // return the default if nothing above was found
  return defaultValue;
}


export function hasArg(fullName: string, shortName: string = null): boolean {
  return !!(processArgv.some(a => a.toLowerCase() === fullName.toLowerCase()) ||
    (shortName !== null && processArgv.some(a => a.toLowerCase() === shortName.toLowerCase())));
}


export function replacePathVars(context: BuildContext, filePath: string | string[] | { [key: string]: any }): any {
  if (Array.isArray(filePath)) {
    return filePath.map(f => replacePathVars(context, f));
  }

  if (typeof filePath === 'object') {
    const clonedFilePaths = Object.assign({}, filePath);
    for (let key in clonedFilePaths) {
      clonedFilePaths[key] = replacePathVars(context, clonedFilePaths[key]);
    }
    return clonedFilePaths;
  }

  return filePath.replace('{{SRC}}', context.srcDir)
    .replace('{{WWW}}', context.wwwDir)
    .replace('{{TMP}}', context.tmpDir)
    .replace('{{ROOT}}', context.rootDir)
    .replace('{{BUILD}}', context.buildDir);
}

export function getNodeBinExecutable(context: BuildContext, cmd: string) {
  let cmdPath = join(context.rootDir, 'node_modules', '.bin', cmd);

  try {
    accessSync(cmdPath);
  } catch (e) {
    cmdPath = null;
  }

  return cmdPath;
}


let checkedDebug = false;
function checkDebugMode() {
  if (!checkedDebug) {
    if (hasArg('--debug') || getProcessEnvVar('ionic_debug_mode') === 'true') {
      processEnv.ionic_debug_mode = 'true';
    }
    checkedDebug = true;
  }
}


export function isDebugMode() {
  return (processEnv.ionic_debug_mode === 'true');
}

let processArgv: string[];
export function setProcessArgs(argv: string[]) {
  processArgv = argv;
}
setProcessArgs(process.argv);

export function addArgv(value: string) {
  processArgv.push(value);
}

let processEnv: any;
export function setProcessEnv(env: any) {
  processEnv = env;
}
setProcessEnv(process.env);

export function setProcessEnvVar(key: string, value: any) {
  if (key && value) {
    processEnv[key] = value;
  }
}

export function getProcessEnvVar(key: string): any {
  const val = processEnv[key];
  if (val !== undefined) {
    if (val === 'true') {
      return true;
    }
    if (val === 'false') {
      return false;
    }
    return val;
  }
  return null;
}

let processCwd: string;
export function setCwd(cwd: string) {
  processCwd = cwd;
}
setCwd(process.cwd());


export function getPackageJsonConfig(context: BuildContext, key: string): any {
  const packageJsonData = getAppPackageJsonData(context);
  if (packageJsonData && packageJsonData.config) {
    const val = packageJsonData.config[key];
    if (val !== undefined) {
      if (val === 'true') {
        return true;
      }
      if (val === 'false') {
        return false;
      }
      return val;
    }
  }
  return null;
}


let appPackageJsonData: any = null;
export function setAppPackageJsonData(data: any) {
  appPackageJsonData = data;
}

function getAppPackageJsonData(context: BuildContext) {
  if (!appPackageJsonData) {
    try {
      appPackageJsonData = readJSONSync(join(context.rootDir, 'package.json'));
    } catch (e) {}
  }

  return appPackageJsonData;
}
