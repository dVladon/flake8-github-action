"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const github = __importStar(require("@actions/github"));
function runCheck(pathToCheck) {
    return __awaiter(this, void 0, void 0, function* () {
        let out = "";
        let opts = {
            listeners: {
                stdout: (data) => {
                    out += data.toString();
                },
            },
        };
        yield exec.exec(`flake8 --exit-zero --max-line-length=120 ${pathToCheck}`, [], opts);
        return out;
    });
}
function parseCheckOutput(raw_output) {
    return __awaiter(this, void 0, void 0, function* () {
        const error_reg = new RegExp('^(.*\.py):([0-9]+):([0-9]+): ([A-Za-z][0-9]+) (.*)$');
        const statistic_reg = new RegExp('^([0-9]+).*([A-Za-z][0-9]+) (.*)$');
        let report = {
            errors: [],
            statistics: [],
        };
        let idx = 0;
        let raw_errors = raw_output.split('\n');
        let current_error_match = raw_errors[idx].match(error_reg);
        while (current_error_match) {
            report.errors.push({
                path: current_error_match[1].replace('./', ''),
                start_line: parseInt(current_error_match[2]),
                end_line: parseInt(current_error_match[2]),
                start_column: parseInt(current_error_match[3]),
                end_column: parseInt(current_error_match[3]),
                annotation_level: "failure",
                message: `[${current_error_match[4]}] ${current_error_match[5]}`,
            });
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
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = core.getInput('gh_token');
        const sha = core.getInput('commit_sha');
        const checkPath = core.getInput('check_path');
        const octokit = github.getOctokit(token);
        let out = yield runCheck(checkPath);
        console.log(out);
        let report = yield parseCheckOutput(out);
        if (report.errors.length == 0) {
            yield octokit.rest.checks.create({
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
        }
        else {
            let summary = `**Issues found:** ${report.errors.length} 🔴\n`;
            summary += "#### Stats:\n";
            summary += "  Count  |    Description\n";
            summary += "--------------------------";
            report.statistics.forEach((s) => {
                summary += `     ${s.count} | [${s.code}] - ${s.description}\n`;
            });
            yield octokit.rest.checks.create({
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
    });
}
run();
