const { toJson } = require('xml2json');
let {
  NotificationCenter,
  WindowsToaster,
  NotifySend,
} = require('node-notifier');
const { readFile, readFileSync } = require('fs');
const { get } = require('axios').default;
const open = require('open');
const { copy } = require('copy-paste');
const JRs = require('json-records');
const path = require('path');
const storage = new JRs('data.json');

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
const setNotifierWrapper = (cb) => {
  let opsys = process.platform;
  if (opsys == 'darwin') {
    notifier = notificationCenterNotifier;
  } else if (opsys == 'win32' || opsys == 'win64') {
    notifier = windowsToasterNotifier;
  } else if (opsys == 'linux') {
    notifier = notifySendNotifier;
  }

  cb();
};

// Start loading config files and settings
const start = () => {
  try {
    readFile('./config.txt', {}, (err, data) => {
      const content = data?.toString();
      let jsonData = toJson(content);
      jsonData = JSON.parse(jsonData);
      const URL = jsonData?.rss?.channel?.link;

      let settings = readFileSync('./settings.txt');
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
        contentImage: path.join(__dirname, 'logo.png'),
        sound: true,
      });
      startInterval(URL);
    });
  } catch (err) {
    notifier.notify({
      title: 'Error',
      message: 'Error in reading the config file',
      contentImage: path.join(__dirname, 'logo.png'),
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
  output = toJson(output.data.toString());
  output = JSON.parse(output);
  saveIt(output.rss.channel.item);
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
    contentImage: path.join(__dirname, 'logo.png'),
    link: job.link,
  });
};

// Copy the cover letter template to the clipboard
const copyTemplateToClipboard = () => {
  readFile('./template.txt', {}, (err, data) => {
    if (data?.toString().length > 0) {
      copy(data.toString());
    }
  });
};

// Click handler to open the job URL and copy the template if exist
const settingNotifierWrapperCB = () => {
  notifier.on('click', function (notifierObject, options, event) {
    open(options.link).finally(() => {
      copyTemplateToClipboard();
    });
  });
};

storage.remove();
setNotifierWrapper(settingNotifierWrapperCB);
start();
