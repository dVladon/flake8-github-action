import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from "octokit";

async function run() {
    try {
        core.notice('Started Flake8 Github Action.');

        const token = core.getInput('gh-token');
        const octokit = new Octokit({ auth: String(token) });

        const check = await octokit.rest.checks.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            name: "Flake8 Check Result",
            head_sha: github.context.sha,
            status: "completed",
            conclusion: "success",
            output: {
                title: "Flake8 Check Detailed Report",
                summary: "",
                annotations: [
                    {
                        path: ".github/workflows/flake8.yml",
                        start_line: 1,
                        end_line: 1,
                        annotation_level: "failure",
                        message: "[E000] Test error",
                        start_column: 1,
                        end_column: 1
                    }
                ]
            }
        });

        console.log(check)
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}

run();