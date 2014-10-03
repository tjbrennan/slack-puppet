slack-puppet
============

user controlled puppet bot


Slack configuration
-------------------

Requires two integrations:

- a slash command to send input to the script
- an incoming webhook for the script to post as a "bot"

If the slash command doesn't match the command in the script, it will return `404`.

Input format is `name icon "message"`

Emoji and urls may be used as icons.
