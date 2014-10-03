'use strict'; // don't be a dummy

var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');

var app = express();
var port = process.env.PORT || 3000;

var args = process.argv;
var team = args[2];
var token = args[3];
var botCache = {};

var command = '/puppet';
var commandToken = args[4];


function parseCommand (req, res, next) {
  var input = req.body.text;
  var channel = req.body.channel_name;

  var bot = {};
  var matches = input.match(/^(.+)\s(".+")$/);

  // ensure message is wrapped in quotation marks
  if (!matches) {
    return next('name :icon: "message"');
  }

  var message = matches[2];
  var attributes = matches[1];
  var attrTokens = attributes.split(' ');
  var icon = testIcon(attrTokens[attrTokens.length - 1]);

  // test if icon exists
  if (icon) {
    bot['icon_' + icon.type] = icon.value;
    attrTokens.pop();
  }

  // set bot name, message, channel
  bot.username = attrTokens.join(' ');
  bot.text = message.slice(1, -1);
  bot.channel = '#' + channel;

  // check for saved icon and set new icon
  var lastBot = botCache[bot.username.replace(/\s+/g, '_')];
  if (!icon && lastBot) {
    bot['icon_' + lastBot.type] = lastBot.value;
  } else {
    botCache[bot.username.replace(/\s+/g, '_')] = icon;
  }

  // stash bot
  res.bot = bot;
  next();
}

function sendBot (req, res, next) {
  var uri = 'https://' + team + '.slack.com/services/hooks/incoming-webhook';

  // bot must be POSTed as stringified JSON
  request({
    uri : uri,
    method : 'POST',
    form : {
      payload : JSON.stringify(res.bot)
    },
    qs : {
      token : token
    }
  }, function (error, response, body) {
    if (error) {
      return next(error);
    } else if (response.statusCode !== 200) {
      return next(body);
    }

    return res.status(200).end();
  });
}

// checks type and validity of icon
function testIcon (icon) {
  if (!icon) {
    return icon;
  }

  var iconObj = {
    value : icon
  };

  if (/:.+:/.test(icon)) {
    iconObj.type = 'emoji';
  } else if (/http.+\.[a-z]{3}/.test(icon)) {
    iconObj.type = 'url';
  } else {
    return undefined;
  }

  return iconObj;
}

app.use(bodyParser.urlencoded({
  extended : true
}));

// verify incoming webhook credentials have been provided
app.use(function (req, res, next) {
  if (!team || !token) {
    return res.status(404).send('Server error!');
  }

  next();
});

// authorize
app.use(function (req, res, next) {
  if ((req.body.command !== command)
    || (commandToken && req.body.token !== commandToken)) {

    return res.status(400).end();
  }

  next();
});


app.post('/puppet', parseCommand, sendBot);


// error handler
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
