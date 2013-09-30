var marked = require('marked');
var injector = require('connect-injector');
var ejs = require('ejs');
var fs = require('fs');
var Deferred = require('promised-io').Deferred;
var pygmentize = require('pygmentize-bundled');
var path = require('path');

marked.setOptions({
	gfm: true,
	highlight: function(code, lang, callback) {
		pygmentize({
			lang: lang,
			format: 'html'
		},
		code,
		function(err, result) {
			if(err) return callback(err);
			callback(null, result.toString().replace(/highlight/, 'codehilite highlight'));
		});
	},
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: false,
	langPrefix: 'lang-'
});

var opts = {};

var setConfig = function(options) {
	opts = options;
};

var convert = function(md, req) {
	var deferred = new Deferred();
	var markupDef = new Deferred();

	marked(md, opts, function(err, content) {
		if(err) {
			markupDef.reject(err);
		}
		else {
			markupDef.resolve(content);
		}
	});

	var rel = '';

	for(var i = 0; i < req.url.match(/\//g).length; i++) {
		rel += '../';
	}

	rel += path.relative(process.cwd(), __dirname);

	var styles = [];

	styles.push(rel + '/topcoat/css/topcoat-desktop-light.min.css');
	styles.push(rel + '/theme/' + opts.theme + '.css');

	markupDef.promise.then(function(markup) {
		ejs.renderFile(__dirname + '/wrapper.ejs', {
			markup: markup,
			styles: styles
		}, function(err, html) {
			if(err) {
				deferred.reject(err);
			}
			else {
				deferred.resolve(html);
			}
		});
	}, function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

var parser = injector(function(req, res) {
	return /(\.md|\.markdown)$/.test(req.url)
}, function(callback, data, req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	var promise = convert(data.toString(), req);

	promise.then(function(html) {
		callback(null, html)
	}, function(err) {
		console.log(err);
	});
});

var themes = fs.readdirSync(__dirname + '/theme').map(function(file) {
	return file.replace(/.css/, '');
});

module.exports = {
	config: setConfig,
	parser: parser,
	themes: themes
};