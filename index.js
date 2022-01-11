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
  return hass.services.call("turn_on", "light", {
    entity_id: "light.dooropenner_on_off",
  });
};

const closeDoor = () => {
  return hass.services.call("turn_off", "light", {
    entity_id: "light.dooropenner_on_off",
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

const getDoorState = () => {
  return hass.states.get("light", "dooropenner_on_off").then((state) => {
    return state.state;
  });
};

let count = 0;

const checkState = async () => {
  const state = await getDoorState();

  if (state === "on") {
    count++;
  } else {
    count = 0;
  }

  if (count >= 7) {
    bot.sendMessage(adminId, "Door was open!");
    await closeDoor();
  }
};

setInterval(checkState, 1000);
