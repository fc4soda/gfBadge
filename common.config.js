const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const prdPrefix = 'gfbadge';

module.exports = {
	entry: {
		index: './src/index.js',
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
	},
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			favicon: './static/favicon.ico',
			template: './src/index.html'
		}),
		new MiniCssExtractPlugin({
		}),
	],
};
