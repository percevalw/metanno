const path = require('path');

module.exports = {
    // mode: 'development',
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                use: 'ts-loader',
                exclude: /node_modules|submodules/,
            },
            {
                test: /\.py$/,
                type: 'asset/inline',
                generator: {
                    dataUrl: content => content.toString(),
                },
            },
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false
                }
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.py', '.css'],
        alias: {'@pret-globals': path.resolve('client/dist-globals.ts')}
    },
    optimization: {
        usedExports: true,
    },
    cache: {
        type: 'filesystem',
    }
};
