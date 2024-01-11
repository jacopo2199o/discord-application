import { promotionPoints, globalPoints } from "../events/ready.js";
import { customRoles } from "../resources/custom-roles.js";

/**
 * @param {import("discord.js").Interaction} interaction
 */
const downgrade = async (interaction) => {
  const guildMembers = await interaction.guild.members.fetch();

  let isDowngrading = false;

  await interaction.deferReply();

  guildMembers.forEach((guildMember) => {
    promotionPoints[guildMember.id] = 10;
    globalPoints[guildMember.id] = 10;

    guildMember.roles.cache.forEach(async (role) => {
      const customRoleIndex = customRoles.findIndex((customRole) => customRole === role.name);

      if (customRoleIndex !== -1) {
        const oldCustomRole = customRoles[customRoleIndex];
        const newCustomRole = customRoles[customRoleIndex + 1];

        isDowngrading = true;

        if (newCustomRole) {
          const oldRole = interaction.guild.roles.cache.find((role) => role.name === oldCustomRole);
          const newRole = interaction.guild.roles.cache.find((role) => role.name === newCustomRole);

          await guildMember.roles.remove(oldRole.id);
          await guildMember.roles.add(newRole.id);
        }
      }
    });
  });

  if (isDowngrading) {
    await interaction.editReply("downgrading...");
  } else {
    await interaction.editReply("nobody to downgrade");
  }
};

export { downgrade };