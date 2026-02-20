/**
 * Worker in-process para jobs Plexi
 * Fila em memória - sem Redis/BullMQ
 */

const { processTicket } = require('./processor');

const queue = [];
let processing = false;
let options = null;

function init(opts) {
  options = opts;
}

function enqueue(ticketId) {
  if (!ticketId) return;
  if (queue.includes(ticketId)) {
    console.log(`[Plexi Worker] Ticket ${ticketId} já na fila, ignorando`);
    return;
  }
  queue.push(ticketId);
  setImmediate(processQueue);
}

async function processQueue() {
  if (processing || queue.length === 0 || !options) return;
  processing = true;

  while (queue.length > 0) {
    const ticketId = queue.shift();
    try {
      await processTicket(ticketId, options);
    } catch (err) {
      console.error(`[Plexi Worker] Erro ao processar ${ticketId}:`, err);
    }
  }

  processing = false;
}

module.exports = { init, enqueue, processQueue };
