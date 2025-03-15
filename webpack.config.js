const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './index.js', // 入力ファイル
  output: {
    filename: 'bundle.js', // 出力されるバンドルファイル
    path: path.resolve(__dirname, 'dist') // 出力先ディレクトリ
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html' // HTMLのテンプレート
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' },
        { from: 'favicon.ico', to: 'favicon.ico' }, // favicon.ico を dist にコピー
      ]
    })
  ],
  resolve: {
    alias: {
      three: path.resolve(__dirname, 'node_modules/three'),
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    open: true, // 自動でブラウザを開く
    historyApiFallback: true, // ルーティング問題を防ぐ
  },
  mode: 'production' // 本番環境用の設定,

};

