# prettier-remove-unused-imports

A Prettier plugin to remove unused imports from your code.

## Installation

You can install the plugin using Yarn:

```sh
yarn add --dev prettier-remove-unused-imports
```

## Setup

Add the plugin to your Prettier configuration:

```javascript
const unusedImportPlugin = require('prettier-remove-unused-imports');

module.exports = {
    plugins: [unusedImportPlugin],
};
```
