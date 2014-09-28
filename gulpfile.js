var gulp = require("gulp"),
	dateformat = require("dateformat"),
	sync = require("gulp-sync")(gulp),
	concat = require("gulp-concat"),
	rename = require("gulp-rename"),
	header = require("gulp-header"),
	sass = require("gulp-sass"),
	base64 = require("gulp-base64"),
	templatecache = require("gulp-angular-templatecache"),
	usemin = require("gulp-usemin"),
	uglify = require("gulp-uglify"),
	minifyCss = require("gulp-minify-css"),
	minifyHtml = require("gulp-minify-html"),
	replace = require("gulp-replace"),
	connect = require("gulp-connect"),
	karma = require("gulp-karma");

var pkg = require("./package.json"),
	banner = [
		"/* " + pkg.name + " v" + pkg.version + " " + dateformat(new Date(), "yyyy-mm-dd"),
		" * " + pkg.homepage,
		" * License: " + pkg.license,
		" */\n\n"
	].join("\n"),
	paths = {
		"index.html": ["index.html"],
		"index.src.html": ["index.src.html"],
		"tmpl": ["directives/*.html", "index/*.html"],
		"js": ["!**/*.tmp.js", "!**/*.test.js",
			"config/*.js", "directives/*.js", "index/*.js", "services/*.js"],
		"css": ["index/*.css"],
		"sass": ["index/*.scss"],
		"test": ["!**/*.tmp.js", "!config/ga.js",
			"lib/angular/angular.js",
			"lib/angular-mocks/angular-mocks.js",
			"lib/angular-ui-bootstrap-bower/ui-bootstrap-tpls.js",
			"lib/angular-animate/angular-animate.js",
			"lib/angular-local-storage/angular-local-storage.js",
			"lib/angular-translate/angular-translate.js",
			"lib/xterm.js/src/xterm.js",
			"config/*.js", "directives/*.js", "index/*.js", "services/*.js"]
	};

gulp.task("build", sync.sync([
	["sass", "js", "tmpl", "bower.json"],
	["css"],
	["index.src.html"],
	["index.html"]
]));

gulp.task("default", ["build", "watch", "connect"]);

gulp.task("sass", function(done) {
	gulp.src(paths.sass)
		.pipe(sass())
		.pipe(base64({
			baseDir: "./",
			maxImageSize: 16 * 1024,
			debug: true
		}))
		.pipe(gulp.dest("index/"))
		.pipe(rename({ extname: ".css" }))
		.pipe(connect.reload())
		.on("end", done);
});

gulp.task("css", function(done) {
	gulp.src(paths.css)
		.pipe(connect.reload())
		.on("end", done);
});

gulp.task("js", function(done) {
	gulp.src(paths.js)
		.pipe(connect.reload())
		.on("end", done);
});

gulp.task("tmpl", function(done) {
	gulp.src(paths.tmpl)
		.pipe(templatecache("angular-template.tmp.js", {
			module: "KDockerWeb",
			root: "./index/"
		}))
		.pipe(gulp.dest("./index/"))
		.pipe(connect.reload())
		.on("end", done);
});

gulp.task("index.src.html", function(done) {
	gulp.src(["index.src.html"])
		.pipe(rename({ basename: "index" }))
		.pipe(gulp.dest("./"))
		.pipe(connect.reload())
		.on("end", done);
});

gulp.task("index.html", function(done) {
	gulp.src(["index.html"])
		.pipe(usemin({
			css: [
				minifyCss(),
				header(banner)
			],
			js: [
				replace(/\.version = \"0\";/, ".version = \"" + pkg.version + "\""),
				uglify(),
				header(banner)
			],
			html: [
				minifyHtml({ empty: true })
			]
		}))
		.pipe(gulp.dest("./"))
		.pipe(connect.reload())
		.on("end", done);
});

gulp.task("bower.json", function(done) {
	gulp.src(["bower.json"])
		.pipe(replace(/"version": "[^"]*"/, "\"version\": \"" + pkg.version + "\""))
		.pipe(gulp.dest("./"))
		.on("end", done);
});

gulp.task("watch", ["build"], function() {
	for (var i in paths) {
		gulp.watch(paths[i], [i]);
	}
});

gulp.task("connect", ["build"], function() {
	connect.server({
		root: "./",
		port: 9000,
		livereload: true
	});
});

gulp.task("test", function(done) {
	gulp.src(paths.test)
		.pipe(karma({
			configFile: "karma.config.js",
			action: "run"
		}))
		.on("error", function(err) {
			console.log(err);
			this.emit("end");
		})
		.on("end", done);
});
