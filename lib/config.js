/**
 * commitlint Conventional Commits rules 
 * 
 * https://conventionalcommits.org
 */
module.exports = {
	rules: {
		'body-leading-blank': [1, 'always'],
		'footer-leading-blank': [1, 'always'],
		'scope-case': [2, 'always', 'lowerCase'],
		'subject-empty': [2, 'never'],
		'subject-min-length': [1, 'always', 20],
		'subject-full-stop': [2, 'never', '.'],
		'type-case': [2, 'always', 'lowerCase'],
		'type-empty': [2, 'never'],
		'type-enum': [
		  2,
		  'always',
		  [
			'build',
			'chore',
			'ci',
			'docs',
			'feat',
			'fix',
			'perf',
			'refactor',
			'revert',
			'style',
			'test',
			'security'
		  ]
		]
	  }
}
