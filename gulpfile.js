const gulp = require('gulp');

gulp.task('build:icons', function() {
	return gulp.src('icons/*.svg')
		.pipe(gulp.dest('dist/icons'));
}); 