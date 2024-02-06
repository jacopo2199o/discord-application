import { EmbedBuilder } from "discord.js";
import { about } from "../commands/about.js";
import { chartGlobalPoints } from "../commands/chart-global-points.js";
import { chartPromotionPoints } from "../commands/chart-promotion-points.js";
import { chartReputationPoints } from "../commands/chart-reputation-points.js";
import { chartSeniorityPoints } from "../commands/chart-seniority-points.js";
import { checkMembers } from "../commands/check-members.js";
import { clear } from "../commands/clear.js";
import { givePromotionPoints } from "../commands/give-promotion-points.js";
import { giveReputationPoint } from "../commands/give-reputation-point.js";
import { rollDice } from "../commands/roll-dice.js";
import { save } from "../commands/save.js";
import { viewPromotionPoints } from "../commands/view-promotion-points.js";
import { viewReputationPoints } from "../commands/view-reputation-points.js";
import { customChannels } from "../resources/custom-channels.js";
import { customPoints, getCalculatedPoints } from "../resources/custom-points.js";
import { getCustomRole } from "../resources/custom-roles.js";
import { reputationPoints } from "./ready.js";
import { takePromotionPoints } from "./take-promotion-points.js";

/**
 * @param {import("discord.js").Interaction} interaction
 */
const interactionCreate = async (interaction) => {
  if (interaction.guild === null) {
    const invite = "https://discord.com/api/oauth2/authorize?client_id=1149977789496311888&permissions=8&scope=bot";
    await interaction.deferReply();
    await interaction.editReply(`my commands work only into servers - invite link: ${invite}`);
    return;
  }

  if (interaction.isChatInputCommand()) {
    const maker = interaction.member;

    if (maker === undefined) {
      return console.error(maker);
    }

    const makerRole = getCustomRole(maker);

    if (makerRole === undefined) {
      return console.error(makerRole);
    }

    const makerPoints = getCalculatedPoints(customPoints.interactionCreate, reputationPoints[maker.guild.id][maker.id].points);
    let channelName = undefined;

    if (interaction.channel.isThread()) {
      channelName = interaction.channel.parent.name;
    } else {
      channelName = interaction.channel.name;
    }

    let isValidCommand = true;

    if (interaction.commandName === "about") {
      about(interaction);
    } else if (interaction.commandName === "chart-promotion-points") {
      chartPromotionPoints(interaction);
    } else if (interaction.commandName === "chart-reputation-points") {
      chartReputationPoints(interaction);
    } else if (interaction.commandName === "chart-global-points") {
      chartGlobalPoints(interaction);
    } else if (interaction.commandName === "chart-seniority-points") {
      chartSeniorityPoints(interaction);
    } else if (interaction.commandName === "check-members") {
      checkMembers(interaction);
    } else if (interaction.commandName === "clear") {
      clear(interaction);
    } else if (interaction.commandName === "give-promotion-points") {
      givePromotionPoints(interaction);
    } else if (interaction.commandName === "give-reputation-point") {
      giveReputationPoint(interaction);
    } else if (interaction.commandName === "roll-dice") {
      rollDice(interaction);
    } else if (interaction.commandName === "save") {
      save(interaction);
    } else if (interaction.commandName === "view-promotion-points") {
      viewPromotionPoints(interaction);
    } else if (interaction.commandName === "view-reputation-points") {
      viewReputationPoints(interaction);
    } else {
      console.error(`no command matching ${interaction.commandName} was found`);
      interaction.reply({ content: `invalid command /${interaction.commandName}`, ephemeral: true });
      isValidCommand = false;
    }

    if (isValidCommand === true) {
      interaction.client.emit("activity", interaction.member, makerPoints);
      const message = new EmbedBuilder();
      message.setTitle("⚙️ command");
      message.setDescription(`${makerRole} *${interaction.member}* used */${interaction.commandName}* in *${channelName}*`);
      message.addFields({ name: "promotion points", value: `${makerPoints} ⭐`, inline: true });
      message.addFields({ name: "to", value: `${interaction.member}`, inline: true });
      message.setThumbnail(interaction.member.displayAvatarURL({ dynamic: true }));
      message.setTimestamp();
      message.setColor(makerRole.color);
      const channel = interaction.guild.channels.cache.find((channel) => channel.name === customChannels.public)
        ?? interaction.guild.channels.cache.get(interaction.guild.publicUpdatesChannelId);
      channel.send({ embeds: [message] });
    }
  } else if (interaction.isButton()) {
    if (interaction.component.customId === "takePromotionPoints") {
      takePromotionPoints(interaction);
    }
  }
};

export { interactionCreate };

