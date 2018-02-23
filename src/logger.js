import winston from 'winston'

const transports = {
  file: new winston.transports.File({
          level: 'info',
          filename: './logs/combined.log',
          handleExceptions: true,
          json: true,
          maxsize: 5242880, //5MB
          maxFiles: 5,
          colorize: false
        }),
  console:  new winston.transports.Console({
              level: 'debug',
              handleExceptions: true,
              json: false,
              colorize: true
            })
          }

let logger = new winston.Logger({
    transports: [
      transports.file,
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
