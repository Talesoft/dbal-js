BEM JS
=======

[![Build status](https://img.shields.io/travis/talesoft/bem-js/master.svg?style=flat-square)](https://travis-ci.org/talesoft/bem-js)
[![Coverage](https://img.shields.io/codeclimate/coverage/Talesoft/bem-js.svg)](https://codecov.io/github/Talesoft/bem-js?branch=master)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@talesoft/bem.svg)](https://snyk.io/package/npm/@talesoft/bem)

A small [BEM](http://getbem.com/introduction/) helper function.

Installation
------------

```bash
npm i @talesoft/bem
```

TypeScript supported out-of-the-box.

Usage
-----

```js
import bem from '@talesoft/bem';

// Define a Block
const b = bem('MyComponent');

// Get the class name of the block
b();                                           // "MyComponent"

// First argument defines Modifiers
b({ active: true });                           // "MyComponent MyComponent--active"
b({ colorMode: 'dark' });                      // "MyComponent MyComponent--color-mode-dark"

// Second argument defines Global Modifiers
b({}, { active: true });                       // "MyComponent --active"
b({}, { colorMode: 'dark' });                  // "MyComponent --color-mode-dark"

// Create quick Elements with the e() method
b.e('my-element');                             // "MyComponent__my-element"

// Second argument are Modifiers
b.e('my-element', { active: true });           // "MyComponent__my-element MyComponent__my-element--active"
b.e('my-element', { colorMode: 'dark' });      // "MyComponent__my-element MyComponent__my-element--color-mode-dark"

// Third argument are Global Modifiers
b.e('my-element', {}, { active: true });       // "MyComponent --active"
b.e('my-element', {}, { colorMode: 'dark' });  // "MyComponent --color-mode-dark"

// To DRY, use the createElement() method
const myElement = b.createElement('my-element');

myElement({ active: true });                   // "MyComponent__my-element MyComponent__my-element--active"
myElement({ colorMode: 'dark' });              // "MyComponent__my-element MyComponent__my-element--color-mode-dark"

```

Contributing
------------

Before contributing, check out the [Contribution Guidelines][contribution-guidelines]

Requires: [npm][nodejs-download]

```bash
// Pull project
git clone https://github.com/Talesoft/tick-js

// Enter project directory
cd geometry-js

// Install development dependencies
npm install

// ... make your changes ...

// Run tests
npm run test

// Lint
npm run lint

// Fix linting problems
npm run lint:fix

// Build
npm run build

// ... create branch, commit, push, merge request etc. ...
```

[contribution-guidelines]: https://github.com/Talesoft/bem/blob/master/CONTRIBUTING.md
[nodejs-download]: https://nodejs.org/en/



