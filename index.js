const xml2js = require('xml2js');
const clipboard = require('clipboardy');
const notifier = require('node-notifier');
const { Notify } = require('node-dbus-notifier');
const { readFile, readFileSync } = require('fs');
const axios = require('axios');
const open = require('open');
const JRs = require('json-records');
const path = require('path');

const rootPath = process.pkg ? path.dirname(process.execPath) : __dirname;
const isLinux = process.platform === 'linux';
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';

const { get } = axios;
const storage = new JRs(path.join(rootPath, 'data.json'));

let CHECK_INTERVAL;
let NOTIFICATIONS_INTERVAL;

// Start loading config files and settings
const start = () => {
  try {
    readFile(path.join(rootPath, 'config.txt'), {}, (err, data) => {
      const content = data?.toString();
      var parser = new xml2js.Parser({ explicitArray: false });
      parser.parseStringPromise(content).then((jsonData) => {
        const URL = jsonData?.rss?.channel?.link;

        let settings = readFileSync(path.join(rootPath, 'settings.txt'));
        settings = settings.toString();

        let lines = settings.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('=') && lines[i].includes('CHECK_INTERVAL')) {
            let line = lines[i].replace(/\s+/g, '');
            let value = line.split('=')[1];
            CHECK_INTERVAL = parseInt(value) * 1000;
          }

          if (
            lines[i].includes('=') &&
            lines[i].includes('NOTIFICATIONS_INTERVAL')
          ) {
            let line = lines[i].replace(/\s+/g, '');
            let value = line.split('=')[1];
            NOTIFICATIONS_INTERVAL = parseInt(value) * 1000;
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
        startInterval(URL);
      });
    });
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

// Starting the check interval for the target URL
const startInterval = (URL) => {
  setInterval(() => {
    const allJobs = storage.get();
    fetchData(URL);
    checkCachedJobs(allJobs);
  }, CHECK_INTERVAL);
};

// Fetching the data from Upwork for the target URL
const fetchData = async (URL) => {
  let output = await get(URL);
  var parser = new xml2js.Parser({ explicitArray: false });
  parser.parseStringPromise(output.data).then((output) => {
    saveIt(output.rss.channel.item);
  });
};

// Save the fetched jobs in JSON file
const saveIt = (data) => {
  data.map((job) => {
    if (!job.title) return;
    let j = Object.assign(job);
    j.notified = false;
    storage.add(j);
  });
};

// Check the stored jobs and notify the user or delete the already notified jobs
const checkCachedJobs = (jobs, index = 0) => {
  setTimeout(() => {
    if (jobs.length === index + 1 || jobs[index] === undefined) return;
    if (jobs[index].notified) {
      storage.remove((record) => record.title === jobs[index].title);
    } else {
      makeNotification(jobs[index]);
      storage.update((record) => record.title === jobs[index].title, {
        notified: true,
      });
    }
    checkCachedJobs(jobs, index + 1);
  }, NOTIFICATIONS_INTERVAL);
};

// Take the job props and notify the user about it
const makeNotification = (job) => {
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
    notifier.notify({
      title: job.title,
      message: job.description,
      sound: true,
      icon: path.join(rootPath, 'logo.png'),
      contentImage: path.join(rootPath, 'logo.png'),
      actions: ["Apply"],
    }, (error, response, metadata) => {
      if (response === "Apply" || response === "apply") {
        open(job.link).finally(() => {
          copyTemplateToClipboard();
        });
      }
    });
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

if (isMac) {
  notifier.on('click', function (notifierObject, options, event) {
    open(options.link).finally(() => {
      copyTemplateToClipboard();
    });
  });
}

storage.remove();
start();
