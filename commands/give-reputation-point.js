import { EmbedBuilder } from "discord.js";
import { reputationPoints } from "../events/ready.js";
import { customChannels } from "../resources/custom-channels.js";
import { customPoints, getCalculatedPoints } from "../resources/custom-points.js";
import { getCustomRole } from "../resources/custom-roles.js";

/**
 * @param {import("discord.js").Interaction} interaction
 */
const giveReputationPoint = async (interaction) => {
  const channel = interaction.guild.channels.cache.find((channel) => channel.name === customChannels.public)
    || interaction.guild.channels.cache.get(interaction.guild.publicUpdatesChannelId);
  const message1 = new EmbedBuilder();
  const message2 = new EmbedBuilder();
  const message3 = new EmbedBuilder();
  const members = await interaction.guild.members.fetch();

  let maker = undefined;
  let makerPoints = undefined;
  let makerRole = undefined;
  let taker = undefined;
  let takerPoints = undefined;
  let takerRole = undefined;
  /**
   * @type { import("discord.js").User }
   */
  let userOption = undefined;

  if (members !== undefined) {
    userOption = interaction.options.getUser("member");
    maker = members.get(interaction.member.id);

    if (userOption !== null) {
      taker = members.get(userOption.id);

      if (taker !== undefined) {
        takerPoints = getCalculatedPoints(
          customPoints.reputationPoints.taker,
          reputationPoints[interaction.guild.id][taker.id].points
        );
        takerRole = getCustomRole(taker);
      }
    }

    if (maker !== undefined) {
      makerPoints = getCalculatedPoints(
        customPoints.reputationPoints.maker,
        reputationPoints[interaction.guild.id][maker.id].points
      );
      makerRole = getCustomRole(maker);
    }
  }

  await interaction.deferReply();

  if (taker.id === interaction.member.id) {
    await interaction.editReply("you can not select yourself");
  } else if (taker.id === interaction.guild.ownerId) {
    await interaction.editReply("you can not select the server owner");
  } else if (userOption.bot) {
    await interaction.editReply("you can not select a bot");
  }else if (reputationPoints[interaction.guild.id][maker.id].gaveTo == taker.id){
    await interaction.editReply(`you already give a reputation points to ${taker}`);
  } else {
    if (reputationPoints[interaction.guild.id][maker.id].gaveTo === "") {
      reputationPoints[interaction.guild.id][maker.id].gaveTo = taker.id;
      reputationPoints[interaction.guild.id][taker.id].points += 1;

      interaction.client.emit("activity", maker, makerPoints);
      interaction.client.emit("activity", taker, takerPoints);

      message1
        .setTitle("🏵 reputation points")
        .setDescription(`${makerRole} *${interaction.member}* gave 1 *reputation point* to ${takerRole} *${taker}*`)
        .addFields({ name: "promotion points", value: `${takerPoints} ⭐`, inline: true })
        .addFields({ name: "to", value: `${taker}`, inline: true })
        .setThumbnail(taker.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `${makerPoints} ⭐ to ${maker.displayName}`, iconURL: `${maker.displayAvatarURL()}` })
        .setTimestamp()
        .setColor(makerRole.color);

      await interaction.editReply({ embeds: [message1] });
    } else {
      const previousTaker = members.get(reputationPoints[interaction.guild.id][maker.id].gaveTo);

      let previousTakerPoints = undefined;
      let previousTakerRole = undefined;

      if (previousTaker !== undefined) {
        previousTakerPoints = getCalculatedPoints(
          customPoints.reputationPoints.taker,
          reputationPoints[interaction.guild.id][previousTaker.id].points
        );
        previousTakerRole = getCustomRole(previousTaker);
      }

      reputationPoints[interaction.guild.id][maker.id].gaveTo = taker.id;
      reputationPoints[interaction.guild.id][taker.id].points += 1;
      reputationPoints[interaction.guild.id][previousTaker.id].points -= 1;

      interaction.client.emit("activity", maker, makerPoints);
      interaction.client.emit("activity", taker, takerPoints);
      interaction.client.emit("activity", previousTaker, -previousTakerPoints);

      message1
        .setTitle("🏵 reputation points")
        .setDescription(`${makerRole} *${interaction.member}* gave 1 *reputation point* to ${takerRole} *${taker}*`)
        .addFields({ name: "promotion points", value: `${takerPoints} ⭐`, inline: true })
        .addFields({ name: "to", value: `${taker}`, inline: true })
        .setThumbnail(taker.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `${makerPoints} ⭐ to ${maker.displayName}`, iconURL: `${maker.displayAvatarURL()}` })
        .setTimestamp()
        .setColor(makerRole.color);
      message2
        .setTitle("🏵 reputation points")
        .setDescription(`${previousTakerRole} *${previousTaker}* lost 1 *reputation point*`)
        .addFields({ name: "promotion points", value: `${-previousTakerPoints} ⭐`, inline: true })
        .addFields({ name: "to", value: `${previousTaker}`, inline: true })
        .setThumbnail(previousTaker.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setColor(previousTakerRole.color);

      await interaction.editReply({ embeds: [message1, message2] });
    }

    if (interaction.channel.id !== channel.id) {
      message3
        .setTitle("🏵 reputation points 🏵")
        .setDescription(`${makerRole} *${interaction.member}* gave 1 *reputation point* to ${takerRole} *${taker}*`)
        .addFields({ name: "promotion points", value: `${customPoints.reputationPoints.taker} ⭐`, inline: true })
        .addFields({ name: "to", value: `${taker}`, inline: true })
        .setThumbnail(taker.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `${customPoints.reputationPoints.maker} ⭐ to ${maker.displayName}`, iconURL: `${maker.displayAvatarURL()}` })
        .setTimestamp()
        .setColor(makerRole.color);

      channel.send({ embeds: [message3] });
    }
  }
};

export { giveReputationPoint };

