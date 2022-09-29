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
        const reg = new RegExp('/^(.*py):(\d+):(\d+):\s(\w\d+)\s(.*)$/');
        let errors = [];
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
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = core.getInput('gh_token');
        const sha = core.getInput('commit_sha');
        const checkPath = core.getInput('check_path');
        const octokit = github.getOctokit(token);
        let out = yield runCheck(checkPath);
        let errors = yield parseCheckOutput(out);
        console.log(errors);
        if (errors.length == 0) {
            yield octokit.rest.checks.create({
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
        }
        else {
            yield octokit.rest.checks.create({
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
    });
}
run();
