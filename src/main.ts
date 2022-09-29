import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from "octokit";

async function run() {
    try {
        core.notice('Started Flake8 Github Action.');

        const token = core.getInput('gh-token');
        const octokit = new Octokit({ auth: String(token) });

        const check = await octokit.rest.checks.listForRef({
            check_name: "flake8",
            ...github.context.repo,
            ref: github.context.sha
          });

        console.log(check)
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}

run();