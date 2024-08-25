const path = require('path');
const webpack = require('webpack'); 

module.exports = function (isProduction) {
    return {
        mode: isProduction ? 'production' : 'development',
        entry: "./src/client/js/app.js",
        output: {
            filename: "app.js",
            path: path.resolve(__dirname, 'bin/client/js'),
        },
        module: {
            rules: getRules(isProduction) // Use the defined function for rules
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY),
                'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN),
                'process.env.FIREBASE_DATABASE_URL': JSON.stringify(process.env.FIREBASE_DATABASE_URL),
                'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID),
                'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET),
                'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID),
                'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.FIREBASE_APP_ID)
            })
        ]
    };
};

// Function to define rules based on the environment
function getRules(isProduction) {
    if (isProduction) {
        return [
            {
                test: /\.(?:js|mjs|cjs)$/, // Match JavaScript files
                exclude: /node_modules/, // Exclude node_modules
                use: {
                    loader: 'babel-loader', // Use Babel loader for transpiling
                    options: {
                        presets: [
                            ['@babel/preset-env', { targets: "defaults" }] // Use preset-env with default targets
                        ]
                    }
                }
            }
        ];
    }
    return [];
}
