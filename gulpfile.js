var gulp = require('gulp');

gulp.task('default', async function () {
  return gulp.src('./node_modules/@picocss/pico/css/pico.min.css')
   .pipe(gulp.dest('./src/frontend/css/'));
});
