const axios = require('axios')

const core = require('@actions/core')
const github = require('@actions/github')

const webhook = core.getInput('webhook')
const descriptionText = core.getInput('description')

if (!/https:\/\/discord(app|)\.com\/api\/webhooks\/\d+?\/.+/i.exec(webhook)) {
  core.setFailed('The given discord webhook url is invalid. Please ensure you give a **full** url that start with "https://discordapp.com/api/webhooks"')
}

const shortSha = (i) => i.substr(0, 6)
const escapeMd = (str) => str.replace(/([\[\]\\`\(\)])/g, '\\$1')

const { payload: githubPayload } = github.context

const commits = githubPayload.commits.map(i => ` - [\`[${shortSha(i.id)}]\`](${i.url}) ${escapeMd(i.message)} - by ${i.author.name}`)

if (!commits.length) {
  return
}

const beforeSha = githubPayload.before
const afterSha = githubPayload.after
const compareUrl = `${githubPayload.repository.url}/compare/${beforeSha}...${afterSha}`

const descriptionSha = `[[${shortSha(beforeSha)}...${shortSha(afterSha)}\]\`](${compareUrl})`
const descriptionCommits = `***Commits***\n${commits.join('\n')}`

const payload = {
  content: '',
  embeds: [
    {
      title: core.getInput('message-title') || 'Commits received',
      description: `${descriptionSha}\n${descriptionText}\n${descriptionCommits}`
    }
  ]
}

axios
  .post(webhook, payload)
  .then((res) => {
    core.setOutput('result', 'Webhook sent')
  })
  .catch((err) => {
    core.setFailed(`Post to webhook failed, ${err}`)
  })
