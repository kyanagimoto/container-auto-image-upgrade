import * as core from '@actions/core'
import * as semver from 'semver'
import axios from 'axios'
import jq from 'jqts';
import {Convert, Response} from './response'
//import {wait} from './wait'

async function run(): Promise<void> {
  try {
    //const repoName = core.getInput('repo-name', {required: true})
    const repoName = "elastic/apm-server"

    let url =
      'https://hub.docker.com/v2/repositories/' +
      repoName +
      '/tags?page_size=100'
    const res = await axios.get<Response[]>(url)
    const response = JSON.parse(JSON.stringify(res.data))

    const pattern = jq.compile('.results | map(.name) | .[]');
    const versions = pattern.evaluate(response)
    console.log(versions)
    const latest = semver.maxSatisfying(JSON.parse(JSON.stringify(versions)), '*')
    const latest_major = semver.major(JSON.parse(JSON.stringify(versions)))
    const latest_minor = semver.minor(JSON.parse(JSON.stringify(versions)))
    const latest_patch = semver.patch(JSON.parse(JSON.stringify(versions)))
    
    core.setOutput('latest', latest)
    core.setOutput('latest_major', latest_major)
    core.setOutput('latest_minor', latest_minor)
    core.setOutput('latest_patch', latest_patch)
    
    core.exportVariable('latest', latest)
    core.exportVariable('latest_major', latest_major)
    core.exportVariable('latest_minor', latest_minor)
    core.exportVariable('latest_patch', latest_patch)

  } catch (error) {
    console.log(error)
  }
}

run()
