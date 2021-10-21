# get-latest-version
Get latest docker image version from "hub.docker.com"  
Exclude prerelease version, like alpha, beta, rc, etc...

## Usage
```yaml
on:
  schedule:
    - cron: '0 0 * * 1'
  workflow_dispatch:

jobs:
  get-latest-version:
    runs-on: ubuntu-latest
    steps:
    - use: kyanagimoto/get-latest-version@main
      with:
        repo-name: 'elastic/filebeat'
```

### Output
| key | Value |
| --- | ----- |
| latest | latest version |
| latest_major | latest major version |
| latest_minor | latest minor version |
| latest_patch | latest patch version |

## How to build
```shell
npm run-script build
```
or
```shell
tsc src/main.ts --outDir lib/
node lib/main.js
```
