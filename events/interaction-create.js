import { communities } from "./ready.js";
import { ranks } from "../resources/ranks.js";
import { sendMesseges } from "../resources/general-utilities.js";
/**
 * @param {import("discord.js").Interaction} interaction
 */
const execute = async (interaction) => {
  /**
  * @type { import("../community.js").Community }
  */
  const community = communities.get(interaction.guildId);
  const messages = [];

  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === "check-activity") {
    const members = await interaction.client.guilds.resolve(community.id)
      .members.fetch();

    let isDowngrading = false;

    await interaction.deferReply();

    members.forEach((member) => {
      if (/* !member.user.bot && */ member.id !== community.admin) {
        member.roles.cache.forEach(async (role) => {
          const rankIndex = ranks.findIndex((rank) => rank === role.name);

          // trovata corrispondenza col nome ruolo
          if (rankIndex !== -1) {
            const oldRank = ranks[rankIndex];
            const newRank = ranks[rankIndex + 1];

            isDowngrading = true;

            // alle volte l'indice potrebbe essere maggiore della lunghezza del vettore (es. ruolo membro)
            if (newRank) {
              const oldRole = interaction.guild.roles.cache.find((role) => role.name === oldRank);
              const newRole = interaction.guild.roles.cache.find((role) => role.name === newRank);

              await member.roles.remove(oldRole.id);
              await member.roles.add(newRole.id);
            }
          }
        });
      }
    });

    if (isDowngrading) {
      await interaction.editReply("starting monthly downgrade...");
    } else {
      await interaction.editReply("nobody to downgrade");
    }
  } else if (interaction.commandName === "check-landing") {
    const members = await interaction.client.guilds.resolve(community.id)
      .members.fetch();

    await interaction.deferReply();

    members.forEach((member) => {
      if (!member.user.bot) {

        // controllo registrazione incompleta
        if (!member.roles.cache.some((role) => role.name === "italiano")) {
          if (!member.roles.cache.some((role) => role.name === "international")) {
            messages.push(`membro senza ruolo lingua: [${member.displayName}, ${member.nickname}, ${member.user.username}]`);
          }
        }

        // controllo doppia dichiarazione lingua
        if (member.roles.cache.some((role) => role.name === "italiano")) {
          if (member.roles.cache.some((role) => role.name === "international")) {
            messages.push(`membro con doppio ruolo lingua: [${member.displayName}, ${member.nickname}, ${member.user.username}]`);
          }
        }
      }
    });

    if (!messages.length) {
      await interaction.editReply("tutti i membri sono registrati correttamente");
    } else {
      sendMesseges(community, messages);
    }
  } else {
    console.error(`no command matching ${interaction.commandName} was found.`);
    return interaction.reply({ content: `comando inesistente / ${interaction.commandName}`, ephemeral: true });
  }
};

export { execute };