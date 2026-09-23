/**
 * ====================================================================
 *  ⚡ ARCEUS XD — GROUP ADMIN & MODERATION COMMANDS
 * ====================================================================
 */

const { setGroupSetting, addWarn, resetWarns } = require('../lib/database');

module.exports = {
  commands: {
    tagall: {
      aliases: ['all', 'hidetag'],
      adminOnly: true,
      groupOnly: true,
      reaction: '📢',
      execute: async ({ sock, from, groupMetadata, text, reply }) => {
        const participants = groupMetadata.participants.map(p => p.id);
        const customMsg = text || 'Attention everyone!';
        let mentionText = `📢 *GROUP ANNOUNCEMENT* 📢\n*Message:* ${customMsg}\n\n`;

        participants.forEach(p => {
          mentionText += `◈ @${p.split('@')[0]}\n`;
        });

        await sock.sendMessage(from, { text: mentionText, mentions: participants });
      }
    },

    antilink: {
      adminOnly: true,
      groupOnly: true,
      reaction: '🛡️',
      execute: async ({ from, text, reply }) => {
        const mode = text.toLowerCase();
        if (mode === 'on' || mode === 'enable') {
          await setGroupSetting(from, 'ANTI_LINK', true);
          await reply('🛡️ *Anti-Link Enabled!* Links from non-admins will be deleted automatically.');
        } else if (mode === 'off' || mode === 'disable') {
          await setGroupSetting(from, 'ANTI_LINK', false);
          await reply('🛡️ *Anti-Link Disabled!*');
        } else {
          await reply('Usage: *.antilink on* or *.antilink off*');
        }
      }
    },

    warn: {
      adminOnly: true,
      groupOnly: true,
      botAdminRequired: true,
      reaction: '⚠️',
      execute: async ({ sock, from, msg, reply }) => {
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply('⚠️ Please reply to the user message to give a warning!');

        const userNum = target.replace(/[^0-9]/g, '');
        const count = await addWarn(from, userNum);

        await reply(`⚠️ *WARNING ISSUED* ⚠️\nUser: @${userNum}\nWarnings: [${count}/3]`);
        if (count >= 3) {
          await sock.groupParticipantsUpdate(from, [target], 'remove');
          await resetWarns(from, userNum);
          await reply(`🚫 @${userNum} removed for reaching max 3 warnings.`);
        }
      }
    }
  }
};
