const {Client, Collection, Events, GatewayIntentBits, REST, Routes} = require('discord.js');
var fs = require('fs');
var path = require('path');
var config = require('./config.json');
var client = new Client({intents:[GatewayIntentBits.Guilds]});

var appCommands = [];
client.commands = new Collection();

var commandsFolderPath = path.join(__dirname, 'commands');
var commandFiles = fs.readdirSync(commandsFolderPath).filter(f=>f.endsWith(".js"));

for (var file of commandFiles) {
    var filePath = path.join(commandsFolderPath, file);
    try {
        var {commands} = require(filePath);
        for(var command of commands) {
            client.commands.set(command.data.name, command);
            //console.log(command.data.name, command.data.toJSON());
            appCommands.push(command.data.toJSON());
        }
    } catch(err) {
        console.error("Failed to load command file: " + filePath + "\n" + err);
    }
}

client.once(Events.ClientReady, async()=>{
    console.log("Bot is online!");
    try {
        client.botOutput = await client.channels.fetch("1292923871540023440");
        await client.botOutput.send("Bot is online!");
    } catch(err) {
        console.log("Failed to send welcome message.");
    }

    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;

        var command = client.commands.get(interaction.commandName);
        if(!command) {
            await interaction.reply("Could not find command...for some reason.");
            if(client.botOutput) await client.botOutput.send("Could not found command: " + interaction.commandName);
        }
        try {
            await command.handler(interaction);
        } catch (err) {
            if(client.botOutput) await client.botOutput.send("Error handling command: \"" + interaction.commandName + "\"\n"+err);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    });
});


client.login(config.token);

const rest = new REST().setToken(config.token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${appCommands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(config.clientId, config.guildId),
			{ body: appCommands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
