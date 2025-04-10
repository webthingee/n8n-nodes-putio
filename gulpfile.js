const gulp = require('gulp');
const { spawn } = require('child_process');

gulp.task('build:icons', function (cb) {
	const cmd = spawn('node', ['./node_modules/@n8n/nodes-base/dist/scripts/build-icons.js'], {
		stdio: 'inherit',
	});
	cmd.on('close', () => {
		cb();
	});
}); 