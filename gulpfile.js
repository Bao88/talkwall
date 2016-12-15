var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    styledown = require('gulp-styledown'),
    newer = require('gulp-newer'),
    imagemin = require('gulp-imagemin'),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    cheerio = require('gulp-cheerio'),
    inject = require('gulp-inject'),
    path = require('path'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    tslint = require("gulp-tslint"),
    cssnano = require('gulp-cssnano'),
    ts = require('gulp-typescript'),
    del = require('del'),
    typedoc = require("gulp-typedoc");

var config = {
    project: '/',
    bower: 'bower_components/',
    src: {
        root: 'src/',
        ts: 'src/js/**/*.ts',
        js: 'src/js/**/*.js',
        scss: 'src/scss/**/*.scss',
        css: 'src/css',
        fonts: 'src/fonts/**',
        partials: 'src/js/components/**/*.html',
        partials_sass: 'src/js/components/**/*.scss',
        images: 'src/images/**',
        languages: 'src/languages/**'
    },
    dist: {
        root: 'dist/',
        js: 'dist/js/',
        css: 'dist/css/',
        fonts: 'dist/fonts/',
        images: 'dist/images/',
        languages: 'dist/languages/',
        partials: 'dist/js/components/'
    }
};

var sassOptions = {
    errLogToConsole: true,
    outputStyle: 'expanded'
};

function showError (error) {
    console.log(error.toString());
    this.emit('end');
}


gulp.task('clean:dist', function () {
    return del([
        'dist/*'
    ]);
});

gulp.task('sass', function() {
    return gulp.src(config.src.scss)
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest(config.src.css))
        .pipe(gulp.dest(config.dist.css));
});


gulp.task("ts-lint", function() {
    return gulp.src(config.src.ts)
        .pipe(tslint())
        .pipe(tslint.report("verbose"))
});


gulp.task("typescripts", function () {
    return gulp.src(config.src.ts)
        .pipe(tsProject())
        .pipe(gulp.dest('src/js/'));
});


gulp.task('javascripts', function() {
    return gulp.src('src/js/output.js')
        .pipe(concat('main.min.js'))
        .pipe(gulp.dest(config.dist.js));
});


gulp.task('images', function() {
    return gulp.src(config.src.images)
        .pipe(newer(config.dist.images))
        //.pipe(imagemin())
        .pipe(gulp.dest(config.dist.images));
});

gulp.task('copy-index-html', function() {
    return gulp.src('src/index_dist.html')
        .pipe(rename("index.html"))
        .pipe(gulp.dest(config.dist.root));
});

gulp.task('copy-json', function() {
    return gulp.src('src/*.json')
        .pipe(gulp.dest(config.dist.root));
});

gulp.task('copy-images', function () {
    return gulp.src(config.src.images)
        .pipe(gulp.dest(config.dist.images))
});

gulp.task('copy-partials-html', function() {
    return gulp.src(config.src.partials)
        .pipe(gulp.dest(config.dist.partials));
});

gulp.task('copy-languages', function () {
    return gulp.src(config.src.languages)
        .pipe(gulp.dest(config.dist.languages))
});


gulp.task('copy-fonts', function () {
    return gulp.src(config.src.fonts)
        .pipe(gulp.dest(config.dist.fonts))
});

var tsProject = ts.createProject({
    declaration: false,
    target: "ES5",
    out: 'output.js'
});



gulp.task('svg-store', function () {
    var svgs = gulp
        .src(config.src.icons)
        .pipe(svgmin(function (file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: true
                    }
                }]
            }
        }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
            },
            parserOptions: { xmlMode: true }
        }))
        .pipe(svgstore({ inlineSvg: true }));
    function fileContents (filePath, file) {
        return file.contents.toString();
    }
    return gulp
        .src('./src/layout/partials/svg-icons.nunjucks')
        .pipe(inject(svgs, { transform: fileContents }))
        .pipe(gulp.dest('./src/layout/partials/'));
});


gulp.task('watch', function() {
    gulp.watch(config.src.scss, gulp.series('sass'));
    gulp.watch(config.src.js, gulp.series('javascripts' )).on('change', browserSync.reload);
    gulp.watch(config.src.images, gulp.series('images'));
});

gulp.task('watchreload', function() {
    gulp.watch('./src/scss/*.scss', gulp.series('visitrackersass'));
    gulp.watch('./src/js/components/**/*.scss', gulp.series('visitrackersass'));
    gulp.watch('./src/css/main*.css').on('change', browserSync.reload);
    gulp.watch('./src/js/**/*.js').on('change', browserSync.reload);
    gulp.watch(['./src/js/components/*.html', './www/js/components/*.html']).on('change', browserSync.reload);
});


gulp.task('browserSync', function() {
    return browserSync({
        open: false,
        server: {
            baseDir: "src",
            index: "index.html"
        },
        watchOptions: {
            debounceDelay: 1000
        }
    });
});

gulp.task("typedoc", function() {
    return gulp
        .src(["src/js/**/*.ts"])
        .pipe(typedoc({
            module: "commonjs",
            target: "es5",
            out: "docs/",
            name: "Talkwall client"
        }))
        ;
});


gulp.task('css', gulp.series('sass'));
gulp.task('dev', gulp.series('sass', 'ts-lint', 'typescripts', 'javascripts'));
gulp.task('watchsass', gulp.series('sass', gulp.parallel('browserSync', 'watch')));
gulp.task('default', gulp.series('clean:dist', 'sass', 'typescripts', 'javascripts', 'images', 'copy-index-html', 'copy-images', 'copy-partials-html', 'copy-languages', 'copy-fonts', 'copy-json', 'typedoc'));
