import { EmbedBuilder } from "discord.js";
import { customChannels } from "../resources/custom-channels.js";
import { customPoints, getCalculatedPoints } from "../resources/custom-points.js";
import { addMember } from "../resources/general-utilities.js";
import { referrals, reputationPoints } from "./ready.js";

/**
  * @param { import("discord.js").GuildMember } newMember
*/
const guildMemberAdd = async (newMember) => {
  addMember(newMember);

  const invites = await newMember.guild.invites.fetch();
  /**
   * @type { import("discord.js").GuildMember }
  */
  let inviter = undefined;
  let points = undefined;
  let uses = undefined;
  invites.forEach((invite) => {
    if (invite.uses !== referrals[invite.code]) {
      referrals[invite.code] = invite.uses;
      inviter = invite.guild.members.cache.get(invite.inviter.id);
      uses = invite.uses;

      if (inviter !== undefined) {
        points = getCalculatedPoints(customPoints.guildMemberAdd, reputationPoints[inviter.guild.id][inviter.id].points);
      }
    }
  });

  const message = new EmbedBuilder();

  if (inviter !== undefined) {
    newMember.client.emit("activity", inviter, points);
    message.setTitle("🌱 new member");
    message.setDescription(`*${newMember}*, joined *comando generale*`);
    message.addFields({ name: "inviter", value: `${inviter}`, inline: true });
    message.addFields({ name: "uses", value: `${uses}`, inline: true });
    message.setThumbnail(newMember.displayAvatarURL({ dynamic: true }));
    message.setFooter({ text: `${points} ⭐ to ${inviter.displayName}`, iconURL: `${inviter.displayAvatarURL()}` });
    message.setTimestamp();
    message.setColor("DarkGreen");
  } else {
    message.setTitle("🌱 new member");
    message.setDescription(`*${newMember}*, joined *comando generale*`);
    message.setThumbnail(newMember.displayAvatarURL({ dynamic: true }));
    message.setTimestamp();
    message.setColor("DarkBlue");
  }

  const channel = newMember.guild.channels.cache.find((channel) => channel.name === customChannels.activity)
    ?? newMember.guild.channels.cache.get(newMember.guild.publicUpdatesChannelId);
  channel.send({ embeds: [message] });
};

export { guildMemberAdd };

