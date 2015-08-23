var cash = {};
var last = {};

module.exports = function (req, res, next) {
  var delimiter = '|';
  var lastCmd = 'last';
  var payload = parseCommand(req, res.locals.delimiter, res.locals.lastCmd);

  sendBot(res.locals.incoming, payload, function (error, response, body) {
    if (error) {
      return next(error);
    } else if (response.statusCode !== 200) {
      return next(body);
    }

    res.status(200).end();
  });

};


function parseCommand (req, delimiter, lastCmd) {
  var input = req.body.text;
  var channel = req.body.channel_id;

  var bot = {};
  var matches = input.split(delimiter);

  if (matches.length < 2) {
    return next('name ' + delimiter + ' icon ' + delimiter + ' message');
  }

  var name = matches[0].trim();

  if (lastCmd && name === lastCmd) {
    last.text = matches[1];
    return last;
  }

  var icon;
  var message;

  if (matches.length === 2) {
    icon = cash[name];
    message = matches[1];
  } else {
    icon = testIcon(matches[1].trim());
    cash[name] = icon;
    message = matches[2];
  }

  bot.username = name;
  bot.text = message;
  bot.channel = channel;

  if (icon) {
    bot['icon_' + icon.type] = icon.value;
  }

  last = bot;

  return bot;
}

function sendBot (token, payload, callback) {
  var uri = 'https://hooks.slack.com/services' + token;

  request({
    uri : uri,
    method : 'POST',
    form : {
      payload : JSON.stringify(payload)
    }
  }, callback);
}

function testIcon (icon) {
  if (!icon) {
    return icon;
  }

  var iconObj = {
    value : icon
  };

  if (/^:.+:$/.test(icon)) {
    iconObj.type = 'emoji';
  } else if (/^http.+\.[a-z]+/.test(icon)) {
    iconObj.type = 'url';
  } else {
    return undefined;
  }

  return iconObj;
}
