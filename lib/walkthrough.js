var markdown = require('markdown').markdown;
var injector = require('connect-injector');
var ejs = require('ejs');
var fs = require('fs');
var Deferred = require('promised-io').Deferred;

var convert = function(md) {
	var markup = markdown.toHTML(md);
	var deferred = new Deferred();

	var css = fs.readFileSync(__dirname + '/topcoat-desktop-light.min.css');

	ejs.renderFile(__dirname + '/wrapper.ejs', {
		markup: markup,
		css: css
	}, function(err, html) {
		if(err) {
			deferred.reject(err);
		}
		else {
			deferred.resolve(html);
		}
	});

	return deferred.promise;
};

var walkthrough = injector(function(req, res) {
	return /(\.md|\.markdown)$/.test(req.url)
}, function(callback, data, req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	var promise = convert(data.toString());

	promise.then(function(html) {
		callback(null, html)
	}, function(err) {
		console.log(err);
	});
});

module.exports = walkthrough;