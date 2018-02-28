const path = require('path')
const url = require('url')
const webpack = require('webpack')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')


const ENTRY = (() => {
  const ROUTES_PATH = path.resolve(__dirname,'./src/pages')
  const routesArray = fs.readdirSync(ROUTES_PATH)
  let result = {}
  routesArray.map(item=>result[item]=`@/pages/${item}/${item}.js`)
  return result
})()

const HTML = (() => {
  return Object.keys(ENTRY).map(key=>(
    new HtmlWebpackPlugin({
      filename: `${key}.html`,
      template: `src/pages/${key}/${key}.html`,
      inject: true,
      chunks: ['manifest', 'vendor', key]
    })
  ))
})()

module.exports = {
  entry: ENTRY,
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/',
    filename: 'assets/js/[name].[hash:7].js'
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      (() => {
        // process css
        if (process.env.NODE_ENV !== 'production') {
          return {
            test: /\.css$/,
            use: [
              'style-loader',
              'css-loader',
              'postcss-loader'
            ]
          }
        }
        else {
          return {
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
              fallback: "style-loader",
              use: ["css-loader", "postcss-loader"],
              publicPath: "../../"
            })
          }
        }
      })(),
      {
        test: /\.(js|jsx|mjs)$/,
        include: path.resolve(__dirname, 'src'),
        loader: require.resolve('babel-loader'),
        options: {
          cacheDirectory: true,
        },
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: require.resolve('url-loader'),
        options: {
          limit: 10000,
          name: 'assets/img/[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: ('assets/media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: ('assets/fonts/[name].[hash:7].[ext]')
        }
      }
    ]
  },
  resolve: {
    alias: {
      // 'vue$': 'vue/dist/vue.esm.js',
      '@': path.join(__dirname, './src')
    },
    extensions: ['*', '.js', '.vue', '.json']
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
    overlay: true
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map',
  plugins: [
    ...HTML,
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    new CleanWebpackPlugin(['dist']),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, './src/static'),
        to: 'assets/',
        ignore: ['.*']
      }
    ]),
    new webpack.BannerPlugin({
      banner: `console.log("Last modification time: ${ new Date().toLocaleString() }");`,
      raw: true,
      entryOnly: true,
      test: /\.(js|jsx|mjs)$/
    })
  ]
}

if (process.env.NODE_ENV === 'production') {

  // const getPublicPath = () => {
  //   let urlString = require('./package.json').homepage
  //   let pathname = url.parse(urlString).pathname
  //   if (!pathname) {
  //     return '/'
  //   }
  //   else {
  //     return /\/$/.test(pathname) ? pathname : pathname+'/' 
  //   }
  // }
  module.exports.output.publicPath = './'
  module.exports.devtool = '#source-map'
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new UglifyJsPlugin({
      sourceMap: true,
      uglifyOptions: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    // extract css into its own file
    new ExtractTextPlugin({
      filename: 'assets/css/[name].[hash:7].css'
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin({
      cssProcessorOptions: {
        safe: true
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function (module, count) {
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, './node_modules')
          ) === 0
        )
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      chunks: ['vendor']
    }),
  ])
}
