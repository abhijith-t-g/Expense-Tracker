const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: ['drizzle/**'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
