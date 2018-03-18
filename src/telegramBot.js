import TelegramBot from "node-telegram-bot-api"
import { subscriptions } from "./subscriptions";
import { pubsub, CHANNEL } from "./pubsub";

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let channels = {}

const sendMessage = async (name, message) => {
  bot.getChat(name).then(channel => {
    bot.sendMessage(channel.id, message);
  });
}

// pubsub.subscribe(CHANNEL, payload => {
//   console.log(`New message received on channel ${CHANNEL}`);
//   try {
//     const url = payload[CHANNEL][0].info.url;
//     sendMessage("@immogramHH", `We found a new property matching your criteria ${url}`)
//   } catch (error) {
//     console.error(`Error trying to send message`);
//     console.error(error.message);
//   }
// });

export { sendMessage }
