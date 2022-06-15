var xml2js = require('xml2js');
let { NotificationCenter, WindowsToaster, NotifySend } = require('node-notifier');
const { readFile, readFileSync } = require('fs');
const { get } = require('axios').default;
const open = require('open');
const { copy } = require('copy-paste');
const JRs = require('json-records');
const path = require('path');

const rootPath = process.pkg ? path.dirname(process.execPath) : __dirname;

const storage = new JRs(path.join(rootPath, 'data.json'));

let CHECK_INTERVAL;
let NOTIFICATIONS_INTERVAL;

let notifier;

let notificationCenterNotifier = new NotificationCenter({
  withFallback: true,
});

let windowsToasterNotifier = new WindowsToaster({
  withFallback: true,
});

let notifySendNotifier = new NotifySend();

// Return the notification wrapper based on the operating system
const setNotifierWrapper = () => {
  let opsys = process.platform;
  if (opsys == 'darwin') {
    notifier = notificationCenterNotifier;
  } else if (opsys == 'win32' || opsys == 'win64') {
    notifier = windowsToasterNotifier;
  } else if (opsys == 'linux') {
    notifier = notifySendNotifier;
  }
};

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

        notifier.notify({
          title: 'Success',
          message: 'Started the tracker in success',
          icon: path.join(rootPath, 'logo.png'),
          sound: true,
        });
        startInterval(URL);
      });
    });
  } catch (err) {
    notifier.notify({
      title: 'Error',
      message: 'Error in reading the config file',
      icon: path.join(rootPath, 'logo.png'),
      sound: true,
    });
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
  notifier.notify({
    title: job.title,
    message: job.description,
    sound: true,
    icon: path.join(rootPath, 'logo.png'),
    open: job.link,
  }, (error, response, metadata) => {
    console.log(error, response, metadata);
    if (response === "activate") {
      open(job.link).finally(() => {
        copyTemplateToClipboard();
      });
    }
  });
};

// Copy the cover letter template to the clipboard
const copyTemplateToClipboard = () => {
  readFile(path.join(rootPath, 'template.txt'), {}, (err, data) => {
    if (data?.toString().length > 0) {
      copy(data.toString());
    }
  });
};

storage.remove();
setNotifierWrapper();
start();
