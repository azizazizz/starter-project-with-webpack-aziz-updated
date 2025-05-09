const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/scripts/index.js'),
  },
  output: {
    filename: 'scripts/[name].bundle.js', // Ubah ke folder scripts
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/', // Tambahkan ini
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'src/styles'),
        to: path.resolve(__dirname, 'dist/styles'),
        noErrorOnMissing: true, // Tambahkan ini
      },
      {
        from: path.resolve(__dirname, 'src/public'),
        to: path.resolve(__dirname, 'dist'),
      }
    ]
  }),
  ],
  resolve: {
    extensions: ['.js'],
  },
};