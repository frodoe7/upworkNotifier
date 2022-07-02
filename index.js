const xml2js = require('xml2js');
const clipboard = require('clipboardy');
const { execSync } = require('child_process');
const notifier = require('node-notifier');
const { Notify } = require('node-dbus-notifier');
const { readFile, readFileSync } = require('fs');
const axios = require('axios');
const open = require('open');
const path = require('path');

const rootPath = process.pkg ? path.dirname(process.execPath) : __dirname;
const isLinux = process.platform === 'linux';
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';

const { get } = axios;

const CHECK_INTERVAL = 300000;
let NOTIFICATIONS_INTERVAL;

let timeNow;

// Start loading config files and settings
const start = async () => {
  try {
    let URL;
    let settings = readFileSync(path.join(rootPath, 'settings.txt'));
    settings = settings.toString();

    let lines = settings.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('=') && lines[i].includes('URL')) {
        let line = lines[i].replace(/\s+/g, '');
        let value = line.replace('URL=', '');
        URL = value;
      }

      if (
        lines[i].includes('=') &&
        lines[i].includes('NOTIFICATIONS_INTERVAL')
      ) {
        let line = lines[i].replace(/\s+/g, '');
        let value = line.split('=')[1];
        NOTIFICATIONS_INTERVAL = parseInt(value);
      }
    }
    if (isLinux) {
      const notify = new Notify({
        appName: 'Upwork Notifier',
        appIcon: path.join(rootPath, 'logo.png'),
        summary: 'Success',
        body: 'Started the tracker in success',
        timeout: 5000,
      });
      notify.show();
    } else {
      notifier.notify({
        title: 'Success',
        message: 'Started the tracker in success',
        icon: path.join(rootPath, 'logo.png'),
        contentImage: path.join(rootPath, 'logo.png'),
        sound: true,
      });
    }
    fetchData(URL);
  } catch (err) {
    if (isLinux) {
      const notify = new Notify({
        appName: 'Upwork Notifier',
        appIcon: path.join(rootPath, 'logo.png'),
        summary: 'Error',
        body: 'Error in reading the config file',
        timeout: 5000,
      });
      notify.show();
    } else {
      notifier.notify({
        title: 'Error',
        message: 'Error in reading the config file',
        icon: path.join(rootPath, 'logo.png'),
        contentImage: path.join(rootPath, 'logo.png'),
        sound: true,
      });
    }
  }
};

// Fetching the data from Upwork for the target URL
const fetchData = async (URL) => {
  timeNow = Date.now() + CHECK_INTERVAL;
  let output = await get(URL);
  var parser = new xml2js.Parser({ explicitArray: false });
  parser.parseStringPromise(output.data).then((output) => {
    checkJobs(output.rss.channel.item, URL);
  });
};

// Check the jobs and notify the user
const checkJobs = (jobs, URL, index = 0) => {
  setTimeout(() => {
    if (Date.now() >= timeNow) {
      fetchData(URL);
      return;
    }
    else {
      makeNotification(jobs[index]);
      checkJobs(jobs, URL, index + 1);
    }
  }, NOTIFICATIONS_INTERVAL * 1000);
};

// Take the job props and notify the user about it
const makeNotification = (job) => {
  if (!job) return;
  if (isLinux) {
    const notify = new Notify({
      appName: 'Upwork Notifier',
      appIcon: path.join(rootPath, 'logo.png'),
      summary: job.title,
      body: job.description,
      timeout: 5000,
    });
    notify.addAction('Apply', () => {
      open(job.link).finally(() => {
        copyTemplateToClipboard();
      });
    });
    notify.show();
  } else if (isWindows) {
    notifier.notify(
      {
        title: job.title,
        message: job.description,
        sound: true,
        icon: path.join(rootPath, 'logo.png'),
        contentImage: path.join(rootPath, 'logo.png'),
        actions: ['Apply'],
      },
      (error, response, metadata) => {
        if (response === 'Apply' || response === 'apply') {
          open(job.link).finally(() => {
            copyTemplateToClipboard();
          });
        }
      }
    );
  } else if (isMac) {
    notifier.notify({
      title: job.title,
      message: job.description,
      sound: true,
      icon: path.join(rootPath, 'logo.png'),
      contentImage: path.join(rootPath, 'logo.png'),
      link: job.link,
    });
  }
};

// Copy the cover letter template to the clipboard
const copyTemplateToClipboard = () => {
  readFile(path.join(rootPath, 'template.txt'), {}, (err, data) => {
    if (data?.toString().length > 0) {
      clipboard.writeSync(data.toString());
    }
  });
};

// Start a click handler if the device is MacOS
if (isMac) {
  notifier.on('click', function (notifierObject, options, event) {
    open(options.link).finally(() => {
      copyTemplateToClipboard();
    });
  });
}

// exit the application
const exit = (something) => {
  console.log(something);
  process.exit();
};

//do something when app is closing
process.on('exit', exit);

//catches ctrl+c event
process.on('SIGINT', exit);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exit);
process.on('SIGUSR2', exit);

//catches uncaught exceptions
process.on('uncaughtException', exit);

start();
