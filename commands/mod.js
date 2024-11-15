const {SlashCommandBuilder, InteractionWebhook, ModalSubmitFields} = require('discord.js');

function hasMod(member) {
    return member.roles.cache.has('1292685951394385951') || member.roles.cache.has('1292667501284556871');
}

async function banKick(interaction, ban) {
    if(!hasMod(interaction.member)) {
        await interaction.reply({content:`You do not have permission to ${ban?"ban":"kick"} users.`});
        return;
    }
    var user = interaction.options.getUser('member');
    var reason = interaction.options.getString("reason");
    var dmMsg = `You have been ${ban?"banned":"kicked"} from Bluehax!\nReason: ${reason??"No reason given."}\n${
        ban ?
        "This ban does not expire. There is currently no official appeal process." :
        "You can rejoin the server, but make sure to read the rules before participating."
    }`;

    // Attempt to send DM
    try {
        await user.send(dmMsg);
    } catch(err) {
        if(interaction.client.botOutput) await interaction.client.botOutput.send(`Unable to send DM: ${user.username}`);
    }

    // Attempt to ban/kick member
    try {
        if(ban) await interaction.guild.members.ban(user.id,{reason});
        else await interaction.guild.members.kick(user.id,{reason});
        var msg = `${user.username} has been ${ban?"banned":"kicked"} from the server.`;
        await interaction.reply({content:msg});
        if(interaction.client.botOutput) await interaction.client.botOutput.send(msg);
    } catch(err) {
        await interaction.reply({content:"Unable to "+(ban?"ban":"kick")+" user: " + user.username});
        if(interaction.client.botOutput) await interaction.client.botOutput.send("Unable to "+(ban?"ban":"kick")+" user: " + user.username);
    }
}

async function rebootBot(interaction) {
    if(!hasMod(interaction.member)) {
        await interaction.reply({content:"You can't reboot the bot.",ephemeral: true});
        return;
    }
    await interaction.reply({content:"Rebooting..."});
    if(interaction.client.botOutput) await interaction.client.botOutput.send("Rebooting...");
    console.log("Rebooting...");
    await interaction.client.destroy();
}

module.exports = {
    commands: [
        {
            data: new SlashCommandBuilder()
                .setName("ban")
                .setDescription("Ban a user from this server.")
                .addUserOption(option=>
                    option.setName("member").setDescription("Member to ban").setRequired(true)
                ).addStringOption(option=>
                    option.setName("reason").setDescription("Reason for the ban").setRequired(false)
                ),
            handler: interaction=>{banKick(interaction,true)}
        },
        {
            data: new SlashCommandBuilder()
                .setName("kick")
                .setDescription("Kick a user from this server.")
                .addUserOption(option=>
                    option.setName("member").setDescription("Member to kick").setRequired(true)
                ).addStringOption(option=>
                    option.setName("reason").setDescription("Reason for the kick").setRequired(false)
                ),
            handler: interaction=>{banKick(interaction,false)}
        },
        {
            data: new SlashCommandBuilder()
                .setName("rebootbot")
                .setDescription("Reboots the bot"),
            handler: rebootBot
        }
    ]
}