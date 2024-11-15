const { SlashCommandBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
var fs = require('fs');
try {
    var soapConfig = require('../soapConfig.json');
} catch(err) {
    var soapConfig = {};
}

function updateSoapConfig() {
    fs.writeFileSync("soapConfig.json", JSON.stringify(soapConfig, null, 2));
}

async function createSoap(interaction) {
    // console.log(interaction.member.roles.cache.toJSON());

    if (!(interaction.member.roles.cache.has('1292913472270635048') || interaction.member.roles.cache.has('1292667501284556871'))) {
        await interaction.reply({ content: "You do not have permission to create soap channels.", ephemeral: true });
        return // instead of one big if() how about a little thing that just returns instead
    }

    var soapeeMember = interaction.options.getMember('soapee');
    var soapCategory = await interaction.client.channels.fetch("1306358144443875328");
    var newChannel = await interaction.guild.channels.create({
        parent: soapCategory,
        name: "\u{1f9fc}-soap-" + soapeeMember.user.username,
        reason: "New SOAP Transfer",
        type: ChannelType.GuildText,
        permissionOverwrites: [
            {
                id: soapeeMember.user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            },
            ...soapCategory.permissionOverwrites.cache.map((p) => {
                return {
                    id: p.id,
                    allow: p.allow.toArray(),
                    deny: p.deny.toArray(),
                };
            })
        ]
    });
    var botMessage = await newChannel.send(soapeeMember.toString() + `
Please follow these directions for your SOAP Transfer and then await further instructions.

1. Ensure your 3DS is modded and region changed to your desired region, if not, do that first.
2. Visit [this](<https://github.com/advancedhelpees/essentialsubmit/releases/latest>) page and install the Essential Submitter app, following the directions on that page. If you encounter any issues installing the submission app please let us know and we will assist.
3. Find the app on your [homescreen](<https://bluehax.xyz/soaps/images/ciasubmit.png>) or the [homebrew launcher](<https://bluehax.xyz/soaps/images/3dsxsubmit.png>) and run it
4. Press \`Y\` and input your discord username
5. Tap on the soap cat to submit your essential.exefs (Any issues, let us know)
6. Post the serial number from the sticker on your console:
    * Old 3DS / Old 3DS XL / old 2DS / New 3DS XL - sticker on the backplate or under the back cover
    * New 3DS (small) - Under the top cover plate
    * New 2DS XL - Under the cartridge cover flap
7. Also post that you successfully submitted your essential.exefs
8. Wait for further instructions

You are being assisted by: N/A (Please wait...)`);
    soapConfig[newChannel.id] = {
        botMessage: botMessage.id
    }
    await interaction.reply({ content: "New SOAP Channel was created: " + newChannel.toString() });
    if (interaction.client.botOutput) interaction.client.botOutput.send("SOAP Channel was created: " + newChannel.name);
    console.log("SOAP Channel created: " + newChannel.name);
}

async function soapComplete(interaction) {
    if (!(interaction.member.roles.cache.has('1292913472270635048') || interaction.member.roles.cache.has('1292667501284556871'))) {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        return
    }

    var message = "The SOAP Transfer has completed! Please boot normally (with the SD inserted into the console), and then go to `System Settings -> Other Settings -> Profile -> Region Settings` and ensure the desired country is selected.\n\nThen try opening the Nintendo eShop.\n\n";
    if (interaction.options.getBoolean('lottery')) {
        message += "You hit the SOAP lottery! No system transfer was needed for this SOAP. If you are trying to transfer your old console to this one, you can do it right away.";
    } else {
        message += "A system transfer was required to do this SOAP. If you are trying to transfer from or to this console, you will need to wait a week.";
    }
    message += "\n\nPlease let us know if the Nintendo eShop functions or not.";
    await interaction.channel.send(message);
    await interaction.deferReply({flags: MessageFlags.Ephemeral});
    await interaction.deleteReply();
}

async function soapDelete(interaction) {
    if (!((interaction.member.roles.cache.has('1292913472270635048') || interaction.member.roles.cache.has('1292667501284556871')) && interaction.channel.parent?.id == "1306358144443875328")) {
        await interaction.reply({ content: "You cannot delete this channel.", ephemeral: true });
        return
    }
    var channelName = interaction.channel.name;
    if(soapConfig.hasOwnProperty(interaction.channel.id)) {
        delete soapConfig[interaction.channel.id];
        updateSoapConfig();
    }
    await interaction.channel.delete("SOAP Channel Delete");
    if (interaction.client.botOutput) interaction.client.botOutput.send("SOAP Channel was deleted: " + channelName);
    console.log("SOAP Channel deleted: " + channelName);
}

async function soapCall(interaction) {
    if (!((interaction.member.roles.cache.has('1292913472270635048') || interaction.member.roles.cache.has('1292667501284556871')) && interaction.channel.parent?.id == "1306358144443875328")) {
        await interaction.reply({content: "You cannot call this SOAP either because you don't have permission to, or because you are not in a SOAP channel.", ephemeral: true});
        return;
    }
    if(!soapConfig.hasOwnProperty(interaction.channel.id) || !soapConfig[interaction.channel.id].hasOwnProperty("botMessage")) {
        await interaction.reply({content: "This SOAP channel doesn't have a stored bot message.", ephemeral: true});
        return;
    }

    var deleteCall = false;
    if(soapConfig[interaction.channel.id].hasOwnProperty("userCalled")) {
        if(soapConfig[interaction.channel.id].userCalled != interaction.user.id) {
            await interaction.reply({content: "This SOAP has already been called by: <@" + soapConfig[interaction.channel.id].userCalled + ">", ephemeral: true});
            return;
        }
        delete soapConfig[interaction.channel.id].userCalled;
        deleteCall = true;
    } else {
        soapConfig[interaction.channel.id].userCalled = interaction.user.id;
    }
    updateSoapConfig();
    try {
        let botMessage = await interaction.channel.messages.fetch(soapConfig[interaction.channel.id].botMessage);
        await botMessage.edit(botMessage.content.split("\n").slice(0, -1).join("\n") + "\nYou are being assisted by: "  + (deleteCall ? "N/A (Please wait...)" : interaction.user.toString()));
        await interaction.reply({content: deleteCall ? "You removed your call." : "You called the SOAP channel!", ephemeral: true});
    } catch(err) {
        await interaction.reply({content: (deleteCall ? "You removed your call" : "You called the SOAP channel") + ", but the initial message couldn't be updated.", ephemeral: true});
        console.error(err);
    }
}

module.exports = {
    commands: [
        {
            data: new SlashCommandBuilder()
                .setName("soap")
                .setDescription("Create a soap channel.")
                .addUserOption(option =>
                    option.setName("soapee").setDescription("The person who will be added to the soap channel.").setRequired(true)
                ),
            handler: createSoap
        },
        {
            data: new SlashCommandBuilder()
                .setName("soapcomplete")
                .setDescription("Sends a SOAP complete message.")
                .addBooleanOption(option =>
                    option.setName("lottery").setDescription("Did they win the SOAP lottery?").setRequired(false)
                ),
            handler: soapComplete
        },
        {
            data: new SlashCommandBuilder()
                .setName("soapdelete")
                .setDescription("Deletes a SOAP channel."),
            handler: soapDelete
        },
        {
            data: new SlashCommandBuilder()
                .setName("soapcall")
                .setDescription("Call (say that you are doing) a SOAP."),
            handler: soapCall
        }
    ]
};