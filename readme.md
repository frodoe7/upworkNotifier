# Upwork Notifier
## Features

This tool help the freelancers to be updated about any new posted jobs

- Real time notifications for any new jobs
- Copy cover letter template while opening the job post URL
- Cross-platform working on Windows, MacOS and Linux 
- Configurable

## Downloads (Last update in 17 June 2022)
- [Windows](https://drive.google.com/file/d/1x6_1YUd6Fj29pA468zGw9We52XgN3zmh/view?usp=sharing)
- [MacOS](https://drive.google.com/file/d/1bs3EwUCUMer6YkaJwhUhZMfU6CUVUmEy/view?usp=sharing)
- [Linux](https://drive.google.com/file/d/1p5L51twMV_O80FuOHNUQgeR_3gmbalJs/view?usp=sharing)

## Getting Start

- Open Upwork on jobs page (with your filters/search preferences)
- Click on RSS icon beside "### jobs found" and then select RSS
- Copy the XML Code and put it into config.txt file
- Run the executable file, Done

## Configurations

There's 3 files in the project directory

- config.txt > put your RSS XML code here
- template.txt > the cover letter template to be copied, keep it blank if you don't need this feature
- settings.txt > where the configurations live, there's only 2 props CHECK_INTERVAL and NOTIFICATIONS_INTERVAL as explained in the file

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