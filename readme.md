# Upwork Notifier
## Features

This tool help the freelancers to be updated about any new posted jobs

- Real time notifications for any new jobs
- Copy cover letter template while opening the job post URL
- Cross-platform working on Windows, MacOS and Linux 
- Configurable

## Downloads (Last update in 17 June 2022)
- [Windows](https://drive.google.com/file/d/17fkQa4MsrxfuY1tFMJlMYltT-yPMsDwH/view?usp=sharing)
- [MacOS](https://drive.google.com/file/d/1KTLb_vKpx4aFiqDlVuoM-nHy9RXkmkMt/view?usp=sharing)
- [Linux](https://drive.google.com/file/d/1vdQNYSw1E_UBfjOkoNpTI0uXzoHk1BB0/view?usp=sharing)

## Getting Start

- Open Upwork on jobs page (with your filters/search preferences)
- Don't forget to select your category from the filters - to not get unrelated jobs
- Click on RSS icon beside "### jobs found" and then select RSS
- Copy the URL and put it into settings.txt file for the URL attribute
- Use the settings.txt file to set the period between the notifications (in seconds)
- Run the executable file, Done

## Configurations

There's 2 files in the project directory

- settings.txt > where the configurations live, there's only 2 props URL and NOTIFICATIONS_INTERVAL as explained in the file
- template.txt > the cover letter template to be copied, keep it blank if you don't need this feature

## Development

This tool is built on top of [node-notifier](https://github.com/mikaelbr/node-notifier)

#### To contribute

- install nodejs
- clone repo
- npm install
- node index.js to test the code
- node build.js to build for Windows/MacOS/Linus (build folder will be generated)

If you find the tool is useful, please star it

[My website](https://ahmedeveloper.com/) for contact purpose
