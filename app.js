const express = require('express');
const path = require('path');
const favicon = require('static-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');


const app = express();
// view engine setup
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

app.use(favicon(path.join(__dirname, 'img', 'fav.ico')));
// eslint-disable-next-line max-len
const logPattern = `:remote-addr :remote-user [:date[clf]] :method :url HTTP/:http-version :status - :res[content-length] bytes - :response-time ms`;
app.use(logger(logPattern));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false,
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));// add nginx and keep this as a backup


// set up routes
const routes = require('./routes');
app.use('/', routes);

// / catch 404 and forwarding to error handler
app.use(function(req, res, next) {
  const err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

// / error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

module.exports = app;
