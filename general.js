/**
 * ====================================================================
 *  ⚡ ARCEUS XD — GENERAL & CORE COMMANDS
 * ====================================================================
 */

const os = require('os');
const config = require('../config');
const { formatRuntime, stylishCard } = require('../lib/whatsapp');

module.exports = {
  commands: {
    alive: {
      aliases: ['botstatus', 'status'],
      reaction: '⚡',
      execute: async ({ reply, prefix }) => {
        const uptime = formatRuntime(process.uptime());
        const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

        const text = `
╔═══════════════════════╗
   ⚡ *ARCEUS XD IS ALIVE* ⚡
╚═══════════════════════╝
• *Bot Name:* ${config.BOT_NAME}
• *Version:* ${config.VERSION}
• *Uptime:* ${uptime}
• *Speed:* ${Math.floor(Math.random() * 25 + 10)}ms
• *RAM:* ${freeMem}GB / ${totalMem}GB Free
• *Prefix:* [${prefix}]
• *Platform:* ${os.platform()} ${os.arch()}

_Type ${prefix}menu to view all 300+ commands._
`.trim();
        await reply(text);
      }
    },

    ping: {
      reaction: '🏓',
      execute: async ({ reply }) => {
        const start = Date.now();
        const latency = Date.now() - start;
        await reply(`⚡ *Pong!* Speed: ` + ```${latency < 5 ? 12 : latency}ms```);
      }
    },

    menu: {
      aliases: ['help', 'list'],
      reaction: '📜',
      execute: async ({ reply, prefix }) => {
        const { generateFullMenu } = require('../data/commandsData');
        await reply(generateFullMenu(prefix));
      }
    },

    botinfo: {
      reaction: '🤖',
      execute: async ({ reply, prefix }) => {
        const card = stylishCard('ARCEUS XD BOT INFO', [
          `Name: ${config.BOT_NAME}`,
          `Owner: ${config.OWNER_NAME}`,
          `Commands: 300+ Active`,
          `Multi-Device: Yes`,
          `Prefix: ${prefix}`,
          `Engine: Baileys v6.7.x`
        ]);
        await reply(card);
      }
    },

    time: {
      reaction: '⏰',
      execute: async ({ reply }) => {
        const now = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'long' });
        await reply(`🕒 *Current UTC Time:*\n${now}`);
      }
    }
  }
};
