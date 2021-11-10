const path = require('path');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
const nodeExternals = require('webpack-node-externals');
// Custom webpack rules
const rules = [
    // babel-loader for pure javascript (es6) => javascript (es5)
    {
        'test': /\.(jsx?)$/,
        'loaders': ['babel-loader'],
        'exclude': [/node_modules/, nodeModulesPath]
    },
    {test: /\.css$/, use: ['style-loader', 'css-loader']},
    {test: /\.svg$/, use: ['raw-loader']}
];

const resolve = {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".webpack.js", ".web.js", ".ts", ".js", ".tsx", ".jsx", ".css"],
    symlinks: false,
    //alias: {'react-dom': '@hot-loader/react-dom'},
};

module.exports = [
    /**
     * Notebook extension
     *
     * This bundle only contains the part of the JavaScript that is run on load of
     * the notebook.
     */
    //{
    //    entry: [
    //        './src/extension.js',
    //    ],
    //    output: {
    //        filename: 'index.js',
    //        path: path.resolve(__dirname, 'metanno', 'nbextension', 'static'),
    //        libraryTarget: 'amd'
    //    },
    //    module: {
    //        rules: rules
    //    },
    //    devtool: 'source-map',
    //    externals: [(context, request, callback) => {
    //        /src\/extension/.test(request) ? callback() : callback(null, 'commonjs ' + request);
    //    }], // Replace by nodeExternals for standalone build, for now this only package src/extension and you also  have to run yarn webpack --watch for dev
    //    resolve,
    //},

    /**
     * Embeddable metanno bundle
     *
     * This bundle is almost identical to the notebook extension bundle. The only
     * difference is in the configuration of the webpack public path for the
     * static assets.
     *
     * The target bundle is always `dist/index.js`, which is the path required by
     * the custom widget embedder.
     */
    /*{
        entry: './src/index.ts',
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist'),
            libraryTarget: 'amd',
            library: "metanno",
            publicPath: 'https://unpkg.com/metanno@' + version + '/dist/'
        },
        devtool: 'source-map',
        module: {
            rules: rules
        },
        externals,
        resolve,
    },*/


    /**
     * Documentation widget bundle
     *
     * This bundle is used to embed widgets in the package documentation.
     */
    /*{
        entry: './src/index.ts',
        output: {
            filename: 'embed-bundle.js',
            path: path.resolve(__dirname, 'docs', 'source', '_static'),
            library: "metanno",
            libraryTarget: 'amd'
        },
        module: {
            rules: rules
        },
        devtool: 'source-map',
        externals,
        resolve,
    },*/
    /**
     * Documentation widget bundle
     *
     * This bundle is used to embed widgets in the package documentation.
     */
    /*{
        mode: 'development',
        entry: [
            //'react-hot-loader/patch',
            // 'webpack-dev-server/client?http://0.0.0.0:3000', // WebpackDevServer host and port
            // 'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
            './src/jupyter/plugin.ts',
        ],
        devtool: 'source-map',
        output: {
            filename: 'plugin.ts',
            //path: '/usr/local/anaconda3/share/jupyter/lab/staging/node_modules/metanno/dist', //path.resolve(__dirname, 'dist'),
            path: path.resolve(__dirname, 'dist'),
            library: "metanno",
            libraryTarget: 'amd',
        },
        module: {
            rules: rules
        },
        optimization: {
            // We no not want to minimize our code.
            minimize: false
        },
        // devtool: 'source-map',
        target: 'node',
        externals: [nodeExternals()],
        resolve,
        //plugins: [
        //    new webpack.HotModuleReplacementPlugin(),
        //],
    }*/
    {
        entry: [
            './src/jupyter/plugin.ts',
        ],
        output: {
            path: path.resolve(__dirname, 'lib'),
            filename: '[name].js',
            sourceMapFilename: '[name].js.map',
            library: "metanno",
            libraryTarget: 'amd',
        },
        module: {
            rules: rules
        },
        optimization: {
            // We no not want to minimize our code.
            minimize: false
        },
        target: 'node',
        externals: [nodeExternals()],
        resolve,
    }

];
