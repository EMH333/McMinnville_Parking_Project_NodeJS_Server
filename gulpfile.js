// Gulp.js configuration
const gulp = require('gulp');
const newer = require('gulp-newer');
const concat = require('gulp-concat');
const stripdebug = require('gulp-strip-debug');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const cssnano = require('cssnano');
const babel = require('gulp-babel');
const log = require('fancy-log');

// development mode?
const devBuild = true; // (process.env.NODE_ENV !== 'production'),

// folders
folder = {
  src: 'webDev/',
  build: 'public/',
};

// JavaScript processing
gulp.task('js', function() {
  let jsbuild = gulp.src(folder.src + 'js/**/*.js');
  // .pipe(concat('main.js'));

  if (!devBuild) {
    jsbuild = jsbuild
        .pipe(stripdebug())
        .pipe(babel({
          presets: ['@babel/env'],
        }))
        .pipe(uglify().on('error', function(err) {
          log.error(err);
        }));
  }

  return jsbuild.pipe(gulp.dest(folder.build + 'js/'));
});

// CSS processing
gulp.task('css', function() {
  const postCssOpts = [
    autoprefixer({
      browsers: ['last 2 versions', '> 2%'],
    }),
    mqpacker,
  ];

  if (!devBuild) {
    postCssOpts.push(cssnano);
  }

  return gulp.src(folder.src + 'scss/style.scss')
      .pipe(sass({
        outputStyle: 'nested',
        imagePath: 'images/',
        precision: 3,
        errLogToConsole: true,
      }))
      .pipe(postcss(postCssOpts))
      .pipe(gulp.dest(folder.build + 'css/'));
});

gulp.task('img', function() {
  const
    out = folder.build + 'images/';
  const imgbuild = gulp.src(folder.src + 'images/**/*').pipe(newer(out));

  return imgbuild.pipe(gulp.dest(out));
});


// watch for changes
gulp.task('watcher', function() {
  // javascript changes
  gulp.watch(folder.src + 'js/**/*.js', gulp.task('js'));

  // css changes
  gulp.watch(folder.src + 'css/**/*', gulp.task('css'));

  // image changes
  gulp.watch(folder.src + 'images/**/*', gulp.task('img'));

  // gulp.watch(folder.src + 'components/**/*', ['vue']); //vue component changes
});


// gulp.task('run', ['html', 'js', 'css', 'fonts', 'json', 'img', 'sw']);
gulp.task('run', gulp.parallel('js', 'css', 'img'));
gulp.task('watch', gulp.series('run', 'watcher'));

gulp.task('default', gulp.series('run'));
