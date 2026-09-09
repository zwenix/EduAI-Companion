# ESLint Plugin: Firebase Security Rules

A custom ESLint plugin for fully validating Firebase Security Rules (`.rules` files). 

Powered directly by the authoritative ANTLR4 `FirebaseRulesParser` grammar used by Firebase internally, this plugin natively catches syntax errors identically to real deployment pipelines while utilizing custom rule checks for semantic issues.

## Setup and Usage

### 1. Installation

Install the plugin:

```bash
npm install @firebase/eslint-plugin-security-rules --save-dev
```

### 2. Configuration

Add the plugin to your `eslint.config.js` or `.eslintrc` configuration. You must map `.rules` files to use the plugin's custom parser so ESLint correctly applies the syntax validation.

**Flat Config (`eslint.config.js`) - Recommended Setup:**
```javascript
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ...
  },
  firebaseRulesPlugin.configs['flat/recommended'] // Apply recommended rules
];
```

**ESLint v8 Setup**
```js
module.exports = {
  // Other base configs for their JS/TS files
  extends: ['eslint:recommended'], 

  overrides: [
    {
      // 1. Target the specific rules files
      files: ['*.rules'],
      
      // 2. Point to your custom parser so ESLint knows how to read the file
      parser: '@firebase/eslint-plugin-security-rules/parser', 
      
      // 3. Extend your legacy config using the magic string format
      extends: ['plugin:@firebase/security-rules/recommended'],
    }
  ]
};
```

**Flat Config (`eslint.config.js`) - Manual/Explicit Setup:**
```javascript
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    files: ["**/*.rules"],
    plugins: {
      "@firebase/security-rules": firebaseRulesPlugin
    },
    languageOptions: {
      parser: firebaseRulesPlugin.parser,
    },
    rules: {
      "@firebase/security-rules/no-open-reads": "warn",
      "@firebase/security-rules/no-open-writes": "error",
      "@firebase/security-rules/no-redundant-matches": "error"
    }
  }
];
```

### 3. Usage

Run ESLint normally, ensuring it checks `.rules` extensions:

```bash
npx eslint firebase.rules
```

Currently active rules:
*   `no-open-reads`: Warns when `allow read:` is open to the public (`if true`).
*   `no-open-writes`: Errors when `allow write:` is open to the public (`if true`).
*   `no-redundant-matches`: Catches logically redundant `match` definitions in identical scopes.

---

## Adding New Rules

New rules can easily integrate by interacting with the ANTLR4 parse tree exposed by the parser wrapper.

### 1. Structure

1. Add your new rule logic in `src/rules/your-rule-name.ts`.
2. Add your tests in `tests/src/rules/your-rule-name.test.ts`.
3. Export the new rule inside `src/index.ts`.

### 2. Interfacing with the ANTLR4 AST

This plugin creates a custom `Program` wrapper for the ESLint standard AST and passes the canonical ANTLR grammar validation objects into the context services via `services.tree`.

A rudimentary rule template extracting contexts looks like:

```javascript
export default {
    meta: {
        type: "suggestion",
        docs: {
            description: "disallow something",
            category: "Best Practices"
        },
        schema: []
    },
    create(context) {
        return {
            "Program"(node) {
                const sourceCode = context.sourceCode || context.getSourceCode();
                const services = context.parserServices || sourceCode.parserServices || {};
                
                if (!services.tree) return; // ensure tree loaded
                
                // Helper to walk the ANTLR node structure
                function walk(antlrNode, callback) {
                    if (!antlrNode) return;
                    callback(antlrNode);
                    if (antlrNode.children) {
                        for (let child of antlrNode.children) {
                            walk(child, callback);
                        }
                    }
                }
                
                walk(services.tree, (antlrNode) => {
                    // Search for distinct Rule contexts, mapped via the ANTLR grammar definitions 
                    // e.g., "MatchRuleDeclarationContext", "PermissionDeclarationContext"
                    if (antlrNode.constructor && antlrNode.constructor.name === "PermissionDeclarationContext") {
                        // Implement checking logic...
                        
                        // To trigger an error:
                        // context.report({
                        //    node: node, 
                        //    message: "Custom defined lint error message."
                        // });
                    }
                });
            }
        };
    }
};
```

### 3. Writing Tests

The test suite interacts perfectly natively with `RuleTester`. Since the plugin is written in TypeScript, run the build step before testing.

```bash
npm test
```
