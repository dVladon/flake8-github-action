import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
    try {
        const token = core.getInput('gh_token');
        const octokit = github.getOctokit(token);
        
        const sha = core.getInput('commit_sha');
        console.log(sha);

        const check = await octokit.rest.checks.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            name: "Flake8 Check Result",
            head_sha: sha,
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
        // if (error instanceof Error) {
        //     core.setFailed(error.message);
        // }
        throw error;
    }
}

run();