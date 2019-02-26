// Packages
const { lint, load } = require("@commitlint/core");

// Ours
const format = require("./format");
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
    if (isComment) {
        const pr = await context.github.pullRequests.get(pull);
        sha = pr.data.head.sha;
    }
    else {
        sha = context.payload.pull_request.head.sha;
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

    // Paginate all PR commits
    return paginate(pullRequests.getCommits(pull), async ({ data }) => {
        // empty summary
        const report = { valid: true, commits: [] };
        const { rules } = await load(config);

        // Keep counters
        let errorsCount = 0;
        let warnsCount = 0;

        // Iterates over all commits
        data.sort(function(a, b){return a.commit.author.date - b.commit.author.date});

        // Pick the newest commit
        var d = data[data.length - 1];

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
    });
}

module.exports = commitlint;
