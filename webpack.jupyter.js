const path = require('path');

module.exports = {
    ...(process.env.PRET_COVERAGE ? { devtool: 'inline-source-map' } : {}),
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
        usedExports: !process.env.PRET_COVERAGE,
        minimize: process.env.PRET_COVERAGE ? false : undefined,
    },
    cache: {
        type: 'filesystem',
    }
};
