const core = require('@actions/core');

async function run() {
  try {
    const greeting = core.getInput('greeting');
    const message = `${greeting} — running JavaScript action.`;

    core.info(message);
    core.setOutput('message', message);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
