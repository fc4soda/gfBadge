const path = require('path');
const merge = require('webpack-merge')
const common = require('./common.config.js')
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

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
		new webpack.DefinePlugin({
			PRD_PREFIX: JSON.stringify('gfbadge/'),
			SITE_PV_URL: JSON.stringify('https://www.fc4soda.moe/kis3/stats?view=count&url=fc4soda.github.io/gfbadge.html&format=json'),
			SITE_PV_CHART_URL: JSON.stringify('https://www.fc4soda.moe/kis3/stats?view=months&url=fc4soda.github.io/gfbadge.html&format=chart'),
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
