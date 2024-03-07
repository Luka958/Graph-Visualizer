const path = require('path');

// run 'npm run build' in terminal
// in package.json add -> "build": "webpack"

module.exports = {
    // a mode can be the production or development
    mode: 'development',
    // path to entry file
    entry: './public/scripts/drawing.js',
    output: {
        // path to output file
        path: path.resolve(__dirname, 'public/dist'),
        filename: 'bundle.js'
    },
    // re-bundles after every change
    watch: true,
    // enable babel for decorators feature
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    }
}