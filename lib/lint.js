// Packages
const { lint, load } = require("@commitlint/core");

// Ours
const format = require("./format");
const formatTitle = require("./formatTitle");
const checkComments = require("./comments");

/**
 * Runs commitlint against all commits of the pull request and sets an appropriate
 * status check
 */
async function commitlint(context) {
    const isComment = context.event == "issue_comment";

    // only process the magic words
    if(isComment && !(/.*?test\s+this\s+(please)?/i.exec(context.payload.comment.body)))
        return;

    // 1. Extract necessary info

    let config = await context.config("commitlint.yml");
    console.log(config);
    // load defaults
    if (!config) config = require("./config");

    const pull = context.issue();

    let sha
    let prTitle
    if (isComment) {
        const pr = await context.github.pullRequests.get(pull);
        sha = pr.data.head.sha;
        prTitle = pr.data.title
    }
    else {
        sha = context.payload.pull_request.head.sha;
        prTitle = context.payload.pull_request.title
    }

    const repo = context.repo();

    // GH API
    const { paginate, issues, repos, pullRequests } = context.github;

    // Hold this PR info
    const statusInfo = { ...repo, sha, context: "commitlint+" };

    // Pending
    await repos.createStatus({
        ...statusInfo,
        state: "pending",
        description: "Waiting for the status to be reported"
    });

    console.log(prTitle);

    // Paginate all PR commits
    return paginate(pullRequests.getCommits(pull), async ({ data }) => {
        // empty summary
        const report = { valid: true, commits: [] };
        const { rules } = await load(config);

        // Keep counters
        let errorsCount = 0;
        let warnsCount = 0;

        // Pick the newest non merge commit
        data = data.filter(x => x.parents.length < 2)
            .sort(function(a, b){return a.commit.author.date - b.commit.author.date});
        var d = data[data.length - 1];
        console.log(d);

        const { valid, errors, warnings } = await lint(d.commit.message, rules);
        if (!valid) {
            report.valid = false;
        }

        if (errors.length > 0 || warnings.length > 0) {
            // Update counts
            errorsCount += errors.length;
            warnsCount += warnings.length;

            report.commits.push({ sha: d.sha, errors, warnings });
        }

        // Also check the PR Title. Given we squash, this is all that really matters
        let prError = false;
        console.log("Linting PR Title: ", prTitle );
        const prResult = await lint(prTitle, rules);
        if (!prResult.valid) {
            report.valid = false;
        }

        if (prResult.errors.length > 0 || prResult.warnings.length > 0) {
            // Update counts
            // errorsCount += prResult.errors.length;
            // warnsCount += prResult.warnings.length;
            prError = true;
            // const prErrors = prResult.errors;
            // const prWarnings = prResult.warnings;
            // report.commits.push({ sha: d.sha, prErrors, prWarnings });
        }

        // Final status
        await repos.createStatus({
            ...statusInfo,
            state: report.valid ? "success" : "failure",
            description: `found ${errorsCount} problems, ${warnsCount} warnings`
        });

        // Get commit
        const comment = await checkComments(issues, pull);

        // Write a comment with the details (if any)
        if (errorsCount > 0 || warnsCount > 0) {
            const message = format(report.commits);
            if (comment) {
                // edits previous bot comment if found
                await issues.editComment({ ...pull, id: comment.id, body: message });
            } else {
                // if no previous comment create a new one
                await issues.createComment({ ...pull, body: message });
            }
        } else {
            if (comment) {
                // edits previous bot comment if found
                await issues.deleteComment({ ...pull, comment_id: comment.id });
            }
        }

        if (prError) {
            await issues.createComment({ ...pull, body: formatTitle(prTitle, prResult.errors, prResult.warnings) });
        }
    });
}

module.exports = commitlint;
