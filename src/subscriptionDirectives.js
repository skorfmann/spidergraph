import logger from './logger'
import format from "es6-template-strings"
import { sendMessage } from "./telegramBot"

const subscriptionDirectives = {
  async telegram(resolve, {userName, template}, context) {
    let config = await resolve();

    config.publish = result => {
      const message = format(template, {result, context})
      console.log(message)
      sendMessage(userName, message)
    };
    return config;
  },
  async daemonize(resolve, {}, context) {}
};

export { subscriptionDirectives };
