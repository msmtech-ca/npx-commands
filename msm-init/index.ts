#! /usr/bin/env node
import fs from 'node:fs';

try {

    const projectName = process.argv[2]

    if (!projectName) {
        throw Error('Please pass in the project name as first argument.')
    }

    const data = fs.readFileSync('package.json', 'utf8');
    if (!data) {
        throw Error('Could not load package.json')
    }
    const config = JSON.parse(data)

    config['scripts']["d"] = `aws-vault exec main -- chamber exec ${projectName}/dev -- npm run dev`
    config['scripts']["env:d:exec"] = `aws-vault exec main -- chamber exec ${projectName}/dev -- `
    config['scripts']["env:d:write"] = `aws-vault exec main -- chamber write ${projectName}/dev`
    config['scripts']["env:d:read"] = `aws-vault exec main -- chamber read ${projectName}/dev`
    config['scripts']["env:d:delete"] = `aws-vault exec main -- chamber delete ${projectName}/dev`
    config['scripts']["env:d:list"] = `aws-vault exec main -- chamber env ${projectName}/dev`
    config['scripts']["env:d:import"] = `aws-vault exec main -- chamber import ${projectName}/dev`
    config['scripts']["env:d:export"] = `aws-vault exec main -- chamber export ${projectName}/dev`
    config['scripts']["env:p:write"] = `aws-vault exec main -- chamber write ${projectName}/prod`
    config['scripts']["env:p:read"] = `aws-vault exec main -- chamber read ${projectName}/prod`
    config['scripts']["env:p:delete"] = `aws-vault exec main -- chamber delete ${projectName}/prod`
    config['scripts']["env:p:list"] = `aws-vault exec main -- chamber env ${projectName}/prod`
    config['scripts']["env:p:import"] = `aws-vault exec main -- chamber import ${projectName}/prod`
    config['scripts']["env:p:export"] = `aws-vault exec main -- chamber export ${projectName}/prod`
    config['scripts']["env:c:write"] = `aws-vault exec main -- chamber write ${projectName}/cicd`
    config['scripts']["env:c:read"] = `aws-vault exec main -- chamber read ${projectName}/cicd`
    config['scripts']["env:c:delete"] = `aws-vault exec main -- chamber delete ${projectName}/cicd`
    config['scripts']["env:c:list"] = `aws-vault exec main -- chamber env ${projectName}/cicd`
    config['scripts']["env:c:import"] = `aws-vault exec main -- chamber import ${projectName}/cicd`
    config['scripts']["env:c:export"] = `aws-vault exec main -- chamber export ${projectName}/cicd`

    fs.writeFileSync('package.json', JSON.stringify(config, null, 4))

    console.log(`Project: ${projectName} has been initiated.`)

} catch (err) {
    console.error(err);
}