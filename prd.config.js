const path = require('path');
const merge = require('webpack-merge')
const common = require('./common.config.js')
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(common, {
	mode: 'production',
	devtool: 'source-map',
	optimization: {
		minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].[hash].css',
			//chunkFilename: '[id].[hash].css',
			ignoreOrder: false,
		}),
	],
	output: {
		filename: '[name].[hash].js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: '/gfbadge/'
	},	
	module: {
		rules: [
			{
				test: /\.(sa|sc|c)ss$/i,
				use: [
					"style-loader",
					{
						loader: MiniCssExtractPlugin.loader,
					},
					'css-loader',
					'sass-loader',
				],
			},
			{
				test: /\.(png|svg|jpg|gif|ico)$/,
				use: [
					{
						loader: "file-loader",
						options: {
							name: '[path][name].[ext]',
						}
					}
				]
			}
		]
	},
	resolve: {
		alias: {
			"vue$": "vue/dist/vue.min.js"
		}
	}
});
