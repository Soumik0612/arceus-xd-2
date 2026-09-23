/**
 * ====================================================================
 *  ⚡ ARCEUS XD — CONFIGURATION FILE
 *  Customize your bot settings, prefixes, owner details & automations
 * ====================================================================
 */

module.exports = {
  // Bot Identity
  BOT_NAME: process.env.BOT_NAME || 'Arceus XD',
  VERSION: '2.4.0',
  OWNER_NAME: process.env.OWNER_NAME || 'Arceus Master',
  OWNER_NUMBER: (process.env.OWNER_NUMBER || '15550192834').replace(/[^0-9]/g, ''),
  SUDO_USERS: (process.env.SUDO_USERS || '15550192834,15559876543').split(',').map(s => s.trim().replace(/[^0-9]/g, '')),

  // Command Prefix Settings
  PREFIX: process.env.PREFIX || '.',
  MULTI_PREFIX: true,
  ACCEPTED_PREFIXES: ['.', '!', '#', '/', '$', '?'],

  // Work Mode: 'public' (everyone can use commands) or 'private' (owner/sudo only)
  WORK_TYPE: process.env.WORK_TYPE || 'public',

  // Authentication Mode
  USE_PAIRING_CODE: process.env.USE_PAIRING_CODE !== 'false', // true for 8-digit code, false for QR
  PAIRING_NUMBER: process.env.PAIRING_NUMBER || '',
  SESSION_DIR: './session',

  // Group Automation Flags (Defaults)
  GROUP_DEFAULTS: {
    WELCOME: true,
    GOODBYE: true,
    ANTI_LINK: true,
    ANTI_BADWORD: true,
    ANTI_BOT: true,
    ANTI_FOREIGN: false,
    ANTI_SPAM: true,
    ANTI_VIEWONCE: false,
    MAX_WARNS: 3,
    AUTO_STICKER: false,
    CHATBOT: false
  },

  // Owner & System Automations
  ALWAYS_ONLINE: true,
  AUTO_READ: false,
  AUTO_RECORDING: false,
  AUTO_TYPING: false,
  AUTO_REACT: true,
  ANTI_CALL: true,
  ANTI_CALL_MSG: '🚫 *ARCEUS XD ANTI-CALL* 🚫\nIncoming calls are automatically rejected by bot policy.',
  ANTI_DELETE: true,
  ANTI_EDIT: true,

  // Automatic Startup Group & Channel Connections
  AUTO_JOIN_GROUP: true,
  AUTO_JOIN_GROUP_LINK: process.env.AUTO_JOIN_GROUP_LINK || 'https://chat.whatsapp.com/L123AbcDef456Ghi789',
  AUTO_JOIN_GREETING: true,
  AUTO_FOLLOW_CHANNEL: true,
  OFFICIAL_CHANNEL_JID: process.env.OFFICIAL_CHANNEL_JID || '120363025111111111@newsletter',
  OFFICIAL_CHANNEL_LINK: 'https://whatsapp.com/channel/0029Va9ArceusXD99',

  // Custom Stylized Headers
  THEME_STYLE: {
    HEADER: '┏━━❐◈',
    BULLET: '┃◈',
    FOOTER: '┗❐◈',
    LINE: '═══════════════════════'
  },

  // Welcome / Goodbye Templates
  WELCOME_MESSAGE: `👋 Welcome @user to *@group*!\n\n📜 Please read the group rules and enjoy your stay!\n⚡ Powered by *Arceus XD*`,
  GOODBYE_MESSAGE: `👋 Goodbye @user. We will miss you in *@group*!`,

  // API Keys (Optional external fallbacks)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY || ''
};
