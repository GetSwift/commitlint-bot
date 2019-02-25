const template = `
There were the following issues with this Pull Request

<PLACEHOLDER>

You may need to change the commit messages to comply with the \
repository contributing guidelines.
`;

/**
 * Formats array of commits warnings/errors as GitHub comment
 *
 * @param {Array} report
 */
function format(commits) {
  let message = "";

  commits.forEach(c => {
    message += `* Commit: ${c.sha}\n`;
    message += c.errors.map(e => `  - ✖ ${e.message}\n`).join("");
    message += c.warnings.map(w => `  - ⚠ ${w.message}\n`).join("");
  });

  return template.replace("<PLACEHOLDER>", message);
}

module.exports = format;
