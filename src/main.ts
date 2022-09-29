import * as core from "@actions/core"
import * as github from "@actions/github"

(async () => {
    try {
        core.notice('Started Flake8 Github Action.')
    } catch (error) {
        core.setFailed('Error when executing action!');
    }
})();