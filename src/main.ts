import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
    try {
        core.notice('Started Flake8 Github Action.');
    } catch (error) {
        core.setFailed('Error hapenned');
    }
}

run();