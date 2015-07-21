var gulp = require('gulp');
var twig = require('gulp-twig');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var connect = require('gulp-connect');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');
var imagemin = require('gulp-imagemin');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var addsrc = require('gulp-add-src');

var paths = {
  templates: './source/templates/**/*.twig',
  sass: './source/stylesheets/**/*.scss',
  js: './source/javascripts/**/*.js',
  images: './source/images/**/*',
  public: './source/public/**/*',
  dist: './dist/'
};

var env = process.env.ASSET_ENV || '';
var isProduction = env.toLowerCase() === 'production';

// Templates
gulp.task('templates', function() {
  var YOUR_LOCALS = {};
  return gulp.src([paths.templates, '!./source/templates/**/_*.twig'])
    .pipe(twig({}))
    .pipe(connect.reload())
    .pipe(gulp.dest(paths.dist))
});

// CSS
gulp.task('sass', function() {
  var includePaths = [
    './bower_components/bourbon/app/assets/stylesheets',
    './bower_components/normalize-scss'
  ];

  var sassOptions = {
    outputStyle: 'expanded',
    includePaths: includePaths
  };

  if (isProduction) {
    sassOptions.outputStyle = 'compressed';
  }

  return gulp.src(paths.sass)
    .pipe(isProduction ? gutil.noop() : sourcemaps.init())
    .pipe(sass(sassOptions))
    .pipe(isProduction ? gutil.noop() : sourcemaps.write())
    .pipe(connect.reload())
    .pipe(gulp.dest(paths.dist));
});

// JS
gulp.task('js', function () {
  var modules = [
    './source/javascripts/modules/**/*.js',
    './source/javascripts/main.js'
  ];

  var lib = [
    './bower_components/baseline-modernizr/baseline-modernizr.js',
    './bower_components/jquery/dist/jquery.js',
    './bower_components/underscore/underscore.js',
    './bower_components/respondto/src/respondto.js',
    './bower_components/fancybox/source/jquery.fancybox.js',
    './bower_components/fancybox/source/helpers/jquery.fancybox-media.js',
    './bower_components/parsleyjs/dist/parsley.js'
  ];

  return gulp.src(modules)
    .pipe(isProduction ? gutil.noop() : sourcemaps.init())
    .pipe(concat("application.js"))
    .pipe(babel())
    .pipe(addsrc.prepend(lib))
    .pipe(concat("application.js"))
    .pipe(isProduction ? gutil.noop() : sourcemaps.write("."))
    .pipe(isProduction ? uglify() : gutil.noop())
    .pipe(connect.reload())
    .pipe(gulp.dest(paths.dist));
});

// Images
gulp.task('images', function() {
  var images = [
    './bower_components/fancybox/source/**/*.png',
    './bower_components/fancybox/source/**/*.gif',
    paths.images
  ];

  return gulp.src(images)
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: []
    }))
    .pipe(gulp.dest(paths.dist));
});

// Public
// Files under the public folder are brought over into dist
// without any processing.
gulp.task('public', function() {
  return gulp.src(paths.public)
    .pipe(gulp.dest(paths.dist));
});

// Rename files with revisions
gulp.task('revisionRename', ['build'], function(){
  return gulp.src(['dist/**/*.css', 'dist/**/*.js'])
    .pipe(rev())
    .pipe(gulp.dest(paths.dist))
    .pipe(rev.manifest())
    .pipe(gulp.dest(paths.dist));
});

// Replace CSS/JS refs with revved versions
gulp.task('revision', ['revisionRename'], function(){
  var manifest = gulp.src(paths.dist + '/rev-manifest.json');

  return gulp.src(paths.dist + '/**/*.html')
    .pipe(revReplace({manifest: manifest}))
    .pipe(gulp.dest(paths.dist));
});

// Server
gulp.task('server', function() {
  connect.server({
    root: paths.dist,
    livereload: true
  });
});

// Watch
gulp.task('watch', function() {
  gulp.watch(paths.templates, ['templates']);
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.js, ['js']);
  gulp.watch(paths.images, ['images']);
  gulp.watch(paths.public, ['public']);
});

// Build
gulp.task('build', ['templates', 'sass', 'js', 'images', 'public']);

// Default
gulp.task('default', ['watch', 'build', 'server']);
