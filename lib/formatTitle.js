const template = `
There were the following issues with this Pull Request

<PLACEHOLDER>

You may need to change the commit messages to comply with the \
repository contributing guidelines.
`;


function formatTitle(title, errors, warnings) {
  let message = "";

    message += `* PR Title: ${title}\n`;
    message += errors.map(e => `  - ✖ ${e.message}\n`).join("");
    message += warnings.map(w => `  - ⚠ ${w.message}\n`).join("");

  return template.replace("<PLACEHOLDER>", message);
}

module.exports = formatTitle;
