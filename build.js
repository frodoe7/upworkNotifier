const { cp, rm, readFile, writeFile } = require('fs/promises');
const { existsSync } = require('fs');
const { execSync } = require('child_process')
const path = require('path');

const build = async () => {
  if (existsSync(path.join(__dirname, 'temp'))) {
    await rm(path.join(__dirname, 'temp'), { recursive: true });
  }
  if (existsSync(path.join(__dirname, 'build'))) {
    await rm(path.join(__dirname, 'build'), { recursive: true });
  }
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
  await cp(
    path.join(__dirname, 'index.js'),
    path.join(__dirname, 'temp/index.js')
  );
  {
    const absPath = path.join(__dirname, 'temp/index.js');
    let fileContent = await readFile(absPath, 'utf8');
    fileContent = fileContent.replace(/require\(['"]node\-notifier['"]\)/, "require('./node-notifier')");;
    await writeFile(absPath, fileContent, 'utf8');
  }
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
  execSync('npx pkg -t node18-win-x64 ./temp/index.js -o ./build/win64/upworkNotifier.exe');
  await cp(
    path.join(__dirname, 'config.txt'),
    path.join(__dirname, 'build/win64/config.txt')
  );
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
    path.join(__dirname, 'temp/node-notifier/vendor/notifu/'),
    path.join(__dirname, 'build/win64/vendor/notifu/'), {
      recursive: true,
    }
  );
  await cp(
    path.join(__dirname, 'temp/node-notifier/vendor/snoretoast/'),
    path.join(__dirname, 'build/win64/vendor/snoretoast/'), {
      recursive: true,
    }
  );
  await cp(
    path.join(__dirname, 'temp/open/xdg-open'),
    path.join(__dirname, 'build/win64/vendor/xdg-open')
  );
  execSync('npx pkg -t node18-macos-x64 ./temp/index.js -o ./build/macos/upworkNotifier');
  await cp(
    path.join(__dirname, 'config.txt'),
    path.join(__dirname, 'build/macos/config.txt')
  );
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
  await cp(
    path.join(__dirname, 'temp/open/xdg-open'),
    path.join(__dirname, 'build/macos/vendor/xdg-open')
  );
  execSync('npx pkg -t node18-linux-x64 ./temp/index.js -o ./build/linux/upworkNotifier');
  await cp(
    path.join(__dirname, 'config.txt'),
    path.join(__dirname, 'build/linux/config.txt')
  );
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
  await rm(path.join(__dirname, 'temp'), { recursive: true });
}

build();