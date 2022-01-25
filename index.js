const TelegramBot = require("node-telegram-bot-api");
const HomeAssistant = require("homeassistant");

const token = process.env.TELEGRAM_TOKEN;
const adminId = process.env.ADMIN_ID;
const bot = new TelegramBot(token, { polling: true });

console.log("Starting...");

const hass = new HomeAssistant({
  host: process.env.HA_HOST,
  port: "8123",
  token: process.env.HA_TOKEN,
  ignoreCert: false,
});

const openDoor = () => {
  return hass.services.call("turn_on", "switch", {
    entity_id: "switch.sonoff_1001423211_2",
  });
};

let to = -1;
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  console.log("Received message", JSON.stringify(msg, null, 2));

  if (chatId != adminId) return;

  if (msg.text === "/open 🚪") {
    bot.sendMessage(chatId, "You sure?", {
      reply_markup: {
        keyboard: [["/confirm 🚪"]],
      },
    });
    to = setTimeout(() => {
      bot.sendMessage(chatId, "Timeout!", {
        reply_markup: {
          keyboard: [["/open 🚪"]],
        },
      });
    }, 5000);
    return;
  }

  if (msg.text === "/confirm 🚪") {
    bot.sendMessage(chatId, "Ok!", {
      reply_markup: {
        keyboard: [["/open 🚪"]],
      },
    });
    openDoor();
    clearTimeout(to);
    return;
  }

  bot.sendMessage(chatId, "I don't understand you", {
    reply_markup: {
      keyboard: [["/open 🚪"]],
    },
  });
});
