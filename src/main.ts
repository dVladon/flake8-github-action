import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

type Flake8Error = {
    path: string,
    start_line: number,
    end_line: number,
    start_column: number, 
    end_column: number,
    annotation_level: string,
    message: string,
}

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

async function parseCheckOutput(raw_output: string): Promise<Flake8Error[]> {
    const reg = new RegExp('^(.*\.py):([0-9]+):([0-9]+): ([A-Za-z][0-9]+) (.*)$');
    
    let errors: Flake8Error[] = [];

    raw_output.split('\n').forEach((e) => {
        let match = e.match(reg);
        console.log(e);
        console.log(match);
        if (match) {
            errors.push({
                path: match[1].replace('./', ''),
                start_line: parseInt(match[2]),
                end_line: parseInt(match[2]),
                start_column: parseInt(match[3]),
                end_column: parseInt(match[3]),
                annotation_level: "failure",
                message: `[${match[4]}] ${match[5]}`,
            });
        }
    });

    console.log(errors);

    return errors;
}

async function run() {
    const token = core.getInput('gh_token');
    const sha = core.getInput('commit_sha');
    const checkPath = core.getInput('check_path');

    const octokit = github.getOctokit(token);

    let out = await runCheck(checkPath);
    let errors = await parseCheckOutput(out);

    console.log(errors);

    if (errors.length == 0) {
        await octokit.rest.checks.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            name: "Flake8 Report",
            head_sha: sha,
            status: "completed",
            conclusion: "success",
            output: {
                title: "Flake8 Check Results",
                summary: "No issues found!",
                annotations: []
            }
        });
    } else {
        await octokit.rest.checks.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            name: "Flake8 Report",
            head_sha: sha,
            status: "completed",
            conclusion: "failure",
            output: {
                title: "Flake8 Check Results",
                summary: `Found ${errors.length} issues.`,
                annotations: errors
            }
        });
    }
}

run();