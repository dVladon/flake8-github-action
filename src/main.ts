import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

async function runCheck(pathToCheck: string) {
    let out = "";
    let opts = {
        listeners: {
            stdout: (data: Buffer) => {
                out += data.toString();
            },
        },
    };

    await exec.exec(`flake8 --exit-zero --max-line-length=120 ${pathToCheck}`, [], opts);

    return out;
}

async function run() {
    const token = core.getInput('gh_token');
    const sha = core.getInput('commit_sha');
    const checkPath = core.getInput('check_path');

    const octokit = github.getOctokit(token);

    const out = runCheck(checkPath);
    console.log(out);

    // const check = await octokit.rest.checks.create({
    //     owner: github.context.repo.owner,
    //     repo: github.context.repo.repo,
    //     name: "Flake8 Check Result",
    //     head_sha: sha,
    //     status: "completed",
    //     conclusion: "success",
    //     output: {
    //         title: "Flake8 Check Detailed Report",
    //         summary: "",
    //         annotations: [
    //             {
    //                 path: ".github/workflows/flake8.yml",
    //                 start_line: 1,
    //                 end_line: 1,
    //                 annotation_level: "failure",
    //                 message: "[E000] Test error",
    //                 start_column: 1,
    //                 end_column: 1
    //             }
    //         ]
    //     }
    // });
}

run();