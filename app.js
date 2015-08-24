var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var puppet = require('./puppet');

var app = express();
var port = process.env.PORT || 3000;

var incoming = process.env.INCOMING;
var slashToken = process.env.SLASH;
var command = '/puppet';
var delimiter = '|';
var lastCmd = 'last';

app.use(bodyParser.urlencoded({ extended : true }));

app.use(function (req, res, next) {
  if ((req.body.command !== command) || (slashToken && req.body.token !== slashToken)) {
    return res.status(400).end();
  }

  res.locals.incoming = incoming;
  res.locals.delimiter = delimiter;
  res.locals.lastCmd = lastCmd;

  console.log(req.body.user_name, req.body.text);

  next();
});

app.post('/puppet', puppet);

app.use(function (err, req, res, next) {
  console.error(err);

  if (typeof err === 'string') {
    res.set('Content-Type', 'text/plain');
    return res.status(200).send(err);
  } else {
    return res.status(400).send(err);
  }
});

app.listen(port, function () {
  console.log('Puppeteer listening on port ' + port);
});
