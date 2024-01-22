module.exports = {
    env: {
        browser: false,
        es2021: false,
        mocha: true,
        node: true,
    },
    extends: ["standard", "plugin:prettier/recommended", "plugin:node/recommended"],
    parserOptions: {
        ecmaVersion: 12,
    },
    overrides: [
        {
            // globals: { task: true },
            // files: ["*js"],
            rules: {
                "max-len": [
                    "error",
                    {
                        code: 120,
                        template: 80,
                        tabWidth: 4,
                        comments: 80,
                        ignorePattern: "",
                        ignoreComments: false,
                        ignoreTrailingComments: false,
                        ignoreUrls: false,
                        ignoreStrings: false,
                    },
                ],
            },
        },
    ],
};
