var {
  MessageEmbed
} = require(`discord.js`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const {
  MessageButton,
  MessageActionRow,
  MessageSelectMenu
} = require('discord.js')
module.exports = {
  name: "setup-music",
  category: "⚙️ Settings",
  aliases: ["setupmusic"],
  cooldown: 10,
  usage: "setup-music #Channel",
  description: "Setup a Music Request Channel",
  memberpermissions: ["ADMINISTRATOR"],
  type: "music",
  run: async (client, message, args, cmduser, text, prefix, player, es, ls) => {
    //first declare all embeds
    var embeds = [
      new MessageEmbed()
      .setColor("#FFD700")
      .setImage("https://media.discordapp.net/attachments/922681442885054565/939360656082231306/Superimposed1644025555840.png?width=576&height=243"),
      new MessageEmbed()
      .setColor("#FFD700")
      .setImage("https://cdn.discordapp.com/attachments/922681442885054565/939360655675379792/20220205_013906.gif")
      .setDescription("**HOW TO USE THE BOT:**\nType your favorite song title with the artist name or simply by copy-paste the song/video URL on the text box")
      .setFooter(`I support Youtube, Spotify, Soundcloud and direct MP3 Links!`)
    ]
    // var Emojis = [
    //   "0️⃣",
    //   "1️⃣",
    //   "2️⃣",
    //   "3️⃣",
    //   "4️⃣",
    //   "5️⃣",
    //   "6️⃣",
    //   "7️⃣",
    //   "8️⃣",
    //   "9️⃣",
    //   "🔟",
    //   "🟥",
    //   "🟧",
    //   "🟨",
    //   "🟩",
    //   "🟦",
    //   "🟪",
    //   "🟫",
    // ]
    //now we add the components!
    var components = [
      // new MessageActionRow().addComponents([
      //   new MessageSelectMenu()
      //   .setCustomId("MessageSelectMenu")
      //   .addOptions(["Pop", "Strange-Fruits", "Gaming", "Chill", "Rock", "Jazz", "Blues", "Metal", "Magic-Release", "NCS | No Copyright Music", "Default"].map((t, index) => {
      //     return {
      //       label: t.substr(0, 25),
      //       value: t.substr(0, 25),
      //       description: `Load a Music-Playlist: "${t}"`.substr(0, 50),
      //       emoji: Emojis[index]
      //     }
      //   }))
      // ]),
      new MessageActionRow().addComponents([
        new MessageButton().setStyle('SECONDARY').setCustomId('Skip').setEmoji(`⏭`).setDisabled(),
        new MessageButton().setStyle('SECONDARY').setCustomId('Stop').setEmoji(`⏹`).setDisabled(),
        new MessageButton().setStyle('SECONDARY').setCustomId('Pause').setEmoji('⏸').setDisabled(),
        new MessageButton().setStyle('SECONDARY').setCustomId('Autoplay').setEmoji('🎶').setDisabled(),
        new MessageButton().setStyle('SECONDARY').setCustomId('Shuffle').setEmoji('🔀').setDisabled(),
      ]),
      new MessageActionRow().addComponents([
        new MessageButton().setStyle('SECONDARY').setCustomId('Song').setEmoji(`🔂`).setDisabled(),
        new MessageButton().setStyle('SECONDARY').setCustomId('Queue').setEmoji(`🔁`).setDisabled(),
        new MessageButton().setStyle('SECONDARY').setCustomId('vdown').setEmoji('🔉').setDisabled(),
        new MessageButton().setStyle('SECONDARY').setCustomId('vup').setEmoji('🔊').setDisabled(),
        new MessageButton().setStyle('SECONDARY').setCustomId('Forward').setEmoji('⏩').setDisabled(),
      ]),
    ]
    let channel = message.mentions.channels.first();
    if (!channel) return message.reply(":x: **You forgot to ping a Text-Channel!**")
    //send the data in the channel
    channel.send({
      embeds,
      components
    }).then(msg => {
      client.musicsettings.set(message.guild.id, channel.id, "channel");
      client.musicsettings.set(message.guild.id, msg.id, "message");
      //send a success message
      return message.reply(`✅ **Successfully setupped the Music System in:** <#${channel.id}>`)
    });
  },
};
