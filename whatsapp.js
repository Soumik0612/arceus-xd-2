/**
 * ====================================================================
 *  ⚡ ARCEUS XD — WHATSAPP HELPER FUNCTIONS
 * ====================================================================
 */

const axios = require('axios');

async function getBuffer(url, options = {}) {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch (e) {
    throw new Error(`Failed to fetch buffer from ${url}: ${e.message}`);
  }
}

function formatRuntime(seconds) {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const dDisplay = d > 0 ? d + (d === 1 ? ' day, ' : ' days, ') : '';
  const hDisplay = h > 0 ? h + (h === 1 ? ' hr, ' : ' hrs, ') : '';
  const mDisplay = m > 0 ? m + (m === 1 ? ' min, ' : ' mins, ') : '';
  const sDisplay = s > 0 ? s + (s === 1 ? ' sec' : ' secs') : '';
  return dDisplay + hDisplay + mDisplay + sDisplay || '0 secs';
}

function stylishCard(title, bodyLines = []) {
  return [
    `┏━━❐◈  *${title}* ◈`,
    ...bodyLines.map(line => `┃◈ ${line}`),
    `┗❐◈`
  ].join('\n');
}

module.exports = {
  getBuffer,
  formatRuntime,
  stylishCard
};
