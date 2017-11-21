const Discordie = require('discordie');
const Events = Discordie.Events;
const steem = require('steem');
const client = new Discordie();

function beginsWith(name) {
    return function (event) {
        const content = event.message.content;
        return content.indexOf(name) === 0;
    }
}

const UPVOTE_COMMAND = {
    check: beginsWith("$upvote"),
    apply: function (event) {
        const content = event.message.content;
        const params = content.replace("$upvote ", "").split(' ');
        const url = params[0];
        const limit = params.length > 1 ? parseFloat(params[1]) : 7.5;
        var weightPercentage = limit * 100;
        var urlSplitter = url.split('@');
		var authorAndPermalink = urlSplitter[1].split('/');
		var author = authorAndPermalink[0];
		var permalink = authorAndPermalink[1];
		upvote(author, permalink, event, weightPercentage, limit);
    },
    help: "`$upvote url percentage`\nf.e.: `$upvote https://steemit.com/culture/@unmentionable/unmentionably-artsy-picks-of-the-day-curated-beauty-vol-5 10`",
    name: '$upvote'
};

function upvote(author, permalink, event, weightPercentage, limit) {
	steem.broadcast.voteAsync(
      process.env.STEEMKEY,
      'unmentionable',
      author,
      permalink,
      weightPercentage,
      function(err, result) {
        if(err)
          event.message.channel.sendMessage('Not able to vote now ' + err);
        if(result)
          event.message.channel.sendMessage('Done! @' + author + ' post has received a ' + limit + '% upvote from @unmentionable!');
      })
}

const COMMANDS = [UPVOTE_COMMAND];

function checkCommands(event) {
    COMMANDS.filter(function (command) {
        try {
            const content = event.message.content;
            if (command.help && content === command.name) {
                event.message.channel.sendMessage(command.help);
                return false;
            }
            return command.check(event);
        } catch (err) {
            collectError(event, command, err);
        }

    }).forEach(function (command) {
        try {
            command.apply(event);
        } catch (err) {
            collectError(event, command, err);
        }
    });
}

function collectError(event, command, error) {
    event.message.channel.sendMessage("Error  for command `" +
        command.name + "` on event: \n```\n" +
        event.message + "\n```\n is: \n```\n" +
        error.stack + "\n```");
}

client.connect({
    token: process.env.DISCORDTOKEN
});

client.Dispatcher.on(Events.GATEWAY_READY, e => {
    console.log('Connected as: ' + client.User.username);
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
    if (e.message.author.bot) {
        return;
    }
    checkCommands(e);
});

