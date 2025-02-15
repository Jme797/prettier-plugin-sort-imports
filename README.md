# prettier-plugin-remove-unused-imports

A Prettier plugin to remove unused imports from your code.

## Installation

You can install the plugin using Yarn:

```sh
yarn add --dev prettier-plugin-remove-unused-imports
```

## Setup

Add the plugin to your Prettier configuration:

```javascript
const unusedImportPlugin = require('prettier-plugin-remove-unused-imports');

module.exports = {
    plugins: [unusedImportPlugin],
};
```
