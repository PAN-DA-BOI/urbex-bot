const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const shlex = require('shlex');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const app = express();
const port = 3000;

app.use(bodyParser.json());

const KIT_DIRECTORY = 'kits';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'announce') {
        const parts = args.join(' ').split(", ");
        if (parts.length !== 4) {
            message.channel.send("Incorrect number of arguments. Usage: /announce 'location', 'location name', 'date time', 'description'");
            return;
        }

        const [locationName, location, dateTime, description] = parts.map(part => part.replace(/^['"]|['"]$/g, ''));

        const embed = new EmbedBuilder()
            .setTitle(`Announcement for ${locationName}`)
            .setDescription(description)
            .setColor(0x00ff00)
            .addFields(
                { name: 'Location', value: location },
                { name: 'Date and Time', value: dateTime }
            );

        message.channel.send({ embeds: [embed] });
    } else if (command === 'bot') {
        const commandsList = `
        **/announce 'location', 'location name', 'date time', 'description'**
        - Announces when and what we're doing for the adventure.

        **/bot**
        - Shows all the commands the bot knows, and how to use them.

        **/getkit [kit to get]**
        - Gets a kit list from the designated place.

        **/proposal [# of locations (example of three locations)] [location1] [location2] [location3]**
        - Makes a poll to choose where we should go.
        `;
        message.channel.send(commandsList);
    } else if (command === 'getkit') {
        const kitName = args.join(' ');
        const kitPath = path.join(KIT_DIRECTORY, `${kitName}.qit`);

        if (fs.existsSync(kitPath)) {
            const kitContents = fs.readFileSync(kitPath, 'utf8');
            message.channel.send(`Contents of ${kitName} kit:\n${kitContents}`);
        } else {
            message.channel.send(`Kit ${kitName} not found. Tried ${kitPath}`);
        }
    } else if (command === 'proposal') {
        const numLocations = parseInt(args.shift(), 10);
        const locations = args.join(' ');
        const locationList = shlex.split(locations);

        if (locationList.length !== numLocations) {
            message.channel.send("The number of locations provided does not match the specified number.");
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Poll: Choose a Location')
            .setDescription('Vote for the location you prefer.')
            .setColor(0x00ff00);

        locationList.forEach((location, index) => {
            embed.addFields({ name: `Option ${index + 1}`, value: location.replace(/^['"]|['"]$/g, '') });
        });

        const sentMessage = await message.channel.send({ embeds: [embed] });
        for (let i = 0; i < numLocations; i++) {
            await sentMessage.react(`${i + 1}\u20e3`);
        }
    }
});

app.post('/send-notification', (req, res) => {
    const { packet } = req.body;

    if (!packet) {
        return res.status(400).send('Missing packet');
    }

    const channelId = '1339025302780645407'; // Replace with your channel ID
    const channel = client.channels.cache.get(channelId);

    if (channel) {
        channel.send(`Packet received: ${packet}`).then(() => {
            res.send('Notification sent');
        }).catch(error => {
            console.error('Error sending message:', error);
            res.status(500).send('Failed to send notification');
        });
    } else {
        res.status(404).send('Channel not found');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

client.login(process.env.DISCORD_TOKEN);
