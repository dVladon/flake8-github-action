import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

type Flake8Report = {
    errors: Flake8Error[],
    statistics: Flake8ErrorStatistic[]
}

type Flake8ErrorStatistic = {
    count: string,
    code: string,
    description: string,
}

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

    await exec.exec(`flake8 --exit-zero --max-line-length=120 --color=never --statistics ${pathToCheck}`, [], opts);

    return out;
}

async function parseCheckOutput(raw_output: string): Promise<Flake8Report> {
    const error_reg = new RegExp('^(.*\.py):([0-9]+):([0-9]+): ([A-Za-z][0-9]+) (.*)$');
    const statistic_reg = new RegExp('^([0-9]+).*([A-Za-z][0-9]+) (.*)$');

    let report: Flake8Report = {
        errors: [],
        statistics: [],
    }

    let idx = 0;
    let raw_errors = raw_output.split('\n');
    let current_error_match = raw_errors[idx].match(error_reg);

    while (idx < raw_errors.length && current_error_match) {
        report.errors.push({
            path: current_error_match[1].replace('./', ''),
            start_line: parseInt(current_error_match[2]),
            end_line: parseInt(current_error_match[2]),
            start_column: parseInt(current_error_match[3]),
            end_column: parseInt(current_error_match[3]),
            annotation_level: "failure",
            message: `[${current_error_match[4]}] ${current_error_match[5]}`,
        });

        idx ++;
        current_error_match = raw_errors[idx].match(error_reg);
    }

    for (let i = idx; i < raw_errors.length; i++) {
        let match = raw_errors[i].match(statistic_reg);
        if (match) {
            report.statistics.push({
                count: match[1],
                code: match[2],
                description: match[3],
            });
        }
    }

    return report;
}

async function run() {
    const token = core.getInput('gh_token');
    const sha = core.getInput('commit_sha');
    const checkPath = core.getInput('check_path');

    const octokit = github.getOctokit(token);

    let out = await runCheck(checkPath);
    console.log(out);
    let report = await parseCheckOutput(out);

    if (report.errors.length == 0) {
        await octokit.rest.checks.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            name: "Flake8 Report",
            head_sha: sha,
            status: "completed",
            conclusion: "success",
            output: {
                title: "Flake8 Report",
                summary: "**Issues found:** 0 🟢",
                annotations: []
            }
        });
    } else {
        let summary = `**Issues found:** ${report.errors.length} 🔴\n`
        summary += "#### Stats:\n"

        report.statistics.forEach((s) => {
            summary += `  - [${s.code}] ${s.description}: **${s.count}**\n`
        });

        await octokit.rest.checks.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            name: "Flake8 Report",
            head_sha: sha,
            status: "completed",
            conclusion: "failure",
            output: {
                title: "Flake8 Report",
                summary: summary,
                annotations: report.errors
            }
        });
    }
}

run();