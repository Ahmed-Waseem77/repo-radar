# Installation

``` shell
git clone <repo link: SSH/HTTP>
cd repo_radar
```
# Features

# Architecture

# Local Development

>[!IMPORTANT]
> You need `$VITE_GITHUB_TOKEN` defined in an `.env` in `radar_repo_app`, for a more usable experience with less rate limits
> Configure a *READ ONLY* Pat token as VITE will bundle it with the app
> you can do `set -a && source .env && set +a` for a key value pair env file

Install Dependencies:

``` shell
npm install
```

npm workspaces are set up with `repo_radar_lib` and `repo_radar_app`

First build the component library

``` shell
npm -w repo_radar_lib run build
# optional: run storybook
npm -w repo_radar_lib run storybook
```

Now you can run the app:
``` shell
# dev server
npm -w repo_radar_app run dev
# building
npm -w repo_radar_app run build
```

# Deployment

This is a monorepo architecture with a component lib, what mostly needs to be done on server is:
1. Install dependencies with `npm install`
2. Build Component Lib
3. Build App
4. Serve App

## Vercel Deployment Commands

1. Install Command

``` shell
npm install 
```

2. Build Command
``` shell
npm run build -w repo_radar_lib && npm run build -w repo_radar_app
```

3. Output Directory: `repo_radar_app/dist`

# GenAI Usage Transparency

GenAI was used so far to aid in the following:
- Scaffolding Stories/Story Prop Data for Components
- Making of Simple Components such as `Pill.tsx` or `Button.tsx`
- Moving code around/refactoring maintaining original code essence
- Wrapping SVG assets in SVG Components under `radar_repo_lib/src/components/Icons/`
- Debugging

Any AI output was reviewed beforehand


