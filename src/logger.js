import winston from 'winston'

const transports = {
  console:  new winston.transports.Console({
              level: 'debug',
              handleExceptions: true,
              json: false,
              colorize: true
            })
          }

let logger = new winston.Logger({
    transports: [
      transports.console
    ],
    exitOnError: false
})

logger.stream = {
    write: function(message, encoding){
      logger.info(message);
    }
};

export { logger, transports };

export default logger
