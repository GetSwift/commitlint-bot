// Ours
const commitlint = require("./lib/lint");

module.exports = robot => {
  // For more information on building apps:
  // https://probot.github.io/docs/
  robot.on("pull_request.opened", commitlint);
  robot.on("pull_request.synchronize", commitlint);
  robot.on("issue_comment.created", commitlint);
  robot.on("pull_request.edited", commitlint);

};
