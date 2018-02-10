const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')

module.exports = {

  // Webpack checks this file for any additional JS dependencies to be bundled
  entry: [
    path.resolve(__dirname, '../app/index.js')
  ],

  output: {
    // Output folder in which the files will be built
    path: path.resolve(__dirname, '../out'),
    // All the JS files will be bundled in this one minified/obfuscated file
    filename: './js/app.bundle.js'
  },

  module: {

    rules: [

      // Loader for the image files
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: 'img/[name].[ext]'
        }
      },

      // Loader for the fonts
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },

      {
        test: /\.json$/,
        use: 'json-loader'
      },
      
      {
        test: /\.js[x]?$/,
        exclude: /(node_modules|bower_components)/,
        include: path.resolve(__dirname, '../app'),
        loader: 'babel-loader',
        options: {
          presets: ["es2015", "env", "react"],
          plugins: [
              "transform-runtime",
              'transform-decorators-legacy',
              'transform-class-properties'
          ]
        }
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx']
  },

  plugins: [
    // Directly copies certain files
    new CopyWebpackPlugin([
      { from: './app/index.html', to: 'index.html' }
    ]),

    // Declares global packages
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
  ]

}
