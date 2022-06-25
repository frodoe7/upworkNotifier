const { cp, rm, readFile, writeFile, chmod } = require('fs/promises');
const { existsSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const purgeOld = async () => {
  console.log('Purging old files...');
  if (existsSync(path.join(__dirname, 'temp'))) {
    await rm(path.join(__dirname, 'temp'), { recursive: true });
  }
  if (existsSync(path.join(__dirname, 'build'))) {
    await rm(path.join(__dirname, 'build'), { recursive: true });
  }
  await cp(
    path.join(__dirname, 'index.js'),
    path.join(__dirname, 'temp/index.js')
  );
}

const patchNotifier = async () => {
  console.log('Patching notifier...');
  await cp(
    path.join(__dirname, 'node_modules/node-notifier/'),
    path.join(__dirname, 'temp/node-notifier/'), {
      recursive: true,
    }
  );
  for (const filename of ["balloon", "notificationcenter", "toaster"]) {
    const absPath = path.join(__dirname, 'temp/node-notifier/notifiers/', filename + ".js");
    let fileContent = await readFile(absPath, 'utf8');
    fileContent = fileContent.replace(/__dirname,\s*'..\/vendor/, "path.dirname(process.execPath), 'vendor");
    await writeFile(absPath, fileContent, 'utf8');
  }
  {
    const absPath = path.join(__dirname, 'temp/index.js');
    let fileContent = await readFile(absPath, 'utf8');
    fileContent = fileContent.replace(/require\(['"]node\-notifier['"]\)/, "require('./node-notifier')");;
    await writeFile(absPath, fileContent, 'utf8');
  }
}

const patchClipboardy = async () => {
  console.log('Patching clipboardy...');
  await cp(
    path.join(__dirname, 'node_modules/clipboardy/'),
    path.join(__dirname, 'temp/clipboardy/'), {
      recursive: true,
    }
  );
  for (const filename of ["windows", "linux"]) {
    const absPath = path.join(__dirname, 'temp/clipboardy/lib/', filename + ".js");
    let fileContent = await readFile(absPath, 'utf8');
    fileContent = fileContent.replace(/__dirname,\s*'..\/fallbacks\/(linux|windows)/, "path.dirname(process.execPath), 'vendor/clipboardy");
    await writeFile(absPath, fileContent, 'utf8');
  }
  {
    const absPath = path.join(__dirname, 'temp/index.js');
    let fileContent = await readFile(absPath, 'utf8');
    fileContent = fileContent.replace(/require\(['"]clipboardy['"]\)/, "require('./clipboardy')");;
    await writeFile(absPath, fileContent, 'utf8');
  }
}

const patchOpener = async () => {
  console.log('Patching opener...');
  await cp(
    path.join(__dirname, 'node_modules/open/'),
    path.join(__dirname, 'temp/open/'), {
      recursive: true,
    }
  );
  {
    const absPath = path.join(__dirname, 'temp/open/index.js');
    let fileContent = await readFile(absPath, 'utf8');
    fileContent = fileContent.replace("__dirname, 'xdg-open'", "path.dirname(process.execPath), 'vendor/xdg-open'");
    await writeFile(absPath, fileContent, 'utf8');
  }
  {
    const absPath = path.join(__dirname, 'temp/index.js');
    let fileContent = await readFile(absPath, 'utf8');
    fileContent = fileContent.replace(/require\(['"]open['"]\)/, "require('./open')");
    await writeFile(absPath, fileContent, 'utf8');
  }
}

const buildWindows = async () => {
  console.log('Building for Windows...');
  execSync('npx pkg -t node18-win-x64 ./temp/index.js -o ./build/win64/upworkNotifier.exe');
  await cp(
    path.join(__dirname, 'settings.txt'),
    path.join(__dirname, 'build/win64/settings.txt')
  );
  await cp(
    path.join(__dirname, 'template.txt'),
    path.join(__dirname, 'build/win64/template.txt')
  );
  await cp(
    path.join(__dirname, 'logo.png'),
    path.join(__dirname, 'build/win64/logo.png')
  );
  await cp(
    path.join(__dirname, 'temp/node-notifier/vendor/notifu/notifu64.exe'),
    path.join(__dirname, 'build/win64/vendor/notifu/notifu64.exe')
  );
  await cp(
    path.join(__dirname, 'temp/node-notifier/vendor/notifu/LICENSE'),
    path.join(__dirname, 'build/win64/vendor/notifu/LICENSE')
  );
  await cp(
    path.join(__dirname, 'temp/node-notifier/vendor/snoretoast/snoretoast-x64.exe'),
    path.join(__dirname, 'build/win64/vendor/snoretoast/snoretoast-x64.exe')
  );
  await cp(
    path.join(__dirname, 'temp/node-notifier/vendor/snoretoast/LICENSE'),
    path.join(__dirname, 'build/win64/vendor/snoretoast/LICENSE')
  );
  await cp(
    path.join(__dirname, 'temp/open/xdg-open'),
    path.join(__dirname, 'build/win64/vendor/xdg-open')
  );
  await cp(
    path.join(__dirname, 'temp/clipboardy/fallbacks/windows/clipboard_x86_64.exe'),
    path.join(__dirname, 'build/win64/vendor/clipboardy/clipboard_x86_64.exe')
  );
}

const buildMacOS = async () => {
  console.log('Building for MacOS...');
  execSync('npx pkg -t node18-macos-x64 ./temp/index.js -o ./build/macos/upworkNotifier');
  await chmod(path.join(__dirname, 'build/macos/upworkNotifier'), '755');
  await cp(
    path.join(__dirname, 'settings.txt'),
    path.join(__dirname, 'build/macos/settings.txt')
  );
  await cp(
    path.join(__dirname, 'template.txt'),
    path.join(__dirname, 'build/macos/template.txt')
  );
  await cp(
    path.join(__dirname, 'logo.png'),
    path.join(__dirname, 'build/macos/logo.png')
  );
  await cp(
    path.join(__dirname, 'node_modules/node-notifier/vendor/mac.noindex/'),
    path.join(__dirname, 'build/macos/vendor/mac.noindex/'), {
      recursive: true,
    }
  );
  await chmod(path.join(__dirname, 'build/macos/vendor/mac.noindex/terminal-notifier.app/Contents/MacOS/terminal-notifier'), '755');
  await cp(
    path.join(__dirname, 'temp/open/xdg-open'),
    path.join(__dirname, 'build/macos/vendor/xdg-open')
  );
  await chmod(path.join(__dirname, 'build/macos/vendor/xdg-open'), '755');
}

const buildLinux = async () => {
  console.log('Building for Linux...');
  execSync('npx pkg -t node18-linux-x64 ./temp/index.js -o ./build/linux/upworkNotifier');
  await chmod(path.join(__dirname, 'build/linux/upworkNotifier'), '755');
  await cp(
    path.join(__dirname, 'settings.txt'),
    path.join(__dirname, 'build/linux/settings.txt')
  );
  await cp(
    path.join(__dirname, 'template.txt'),
    path.join(__dirname, 'build/linux/template.txt')
  );
  await cp(
    path.join(__dirname, 'logo.png'),
    path.join(__dirname, 'build/linux/logo.png')
  );
  await cp(
    path.join(__dirname, 'temp/open/xdg-open'),
    path.join(__dirname, 'build/linux/vendor/xdg-open')
  );
  await chmod(path.join(__dirname, 'build/linux/vendor/xdg-open'), '755');
  await cp(
    path.join(__dirname, 'temp/clipboardy/fallbacks/linux/xsel'),
    path.join(__dirname, 'build/linux/vendor/clipboardy/xsel')
  );
  await chmod(path.join(__dirname, 'build/linux/vendor/clipboardy/xsel'), '755');
}

const purgeTemp = async () => {
  console.log('Purging temp directory...');
  await rm(path.join(__dirname, 'temp'), { recursive: true });
}

const build = async () => {
  await purgeOld();
  await patchNotifier();
  await patchOpener();
  await patchClipboardy();
  await buildWindows();
  await buildLinux();
  await buildMacOS();
  await purgeTemp();
}

build();