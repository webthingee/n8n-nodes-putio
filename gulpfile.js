import gulp from 'gulp';

gulp.task('build:icons', function() {
	return gulp.src('icons/*.svg')
		.pipe(gulp.dest('dist/icons'));
}); 