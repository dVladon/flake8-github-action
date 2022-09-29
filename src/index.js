const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    try {
        core.notice('Started Flake8 Github Action.')
    } catch (error) {
        core.setFailed(error.message);
    }
});