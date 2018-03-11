import logger from './logger';
import {
  forEachField
} from "graphql-tools";
import priceParser from "price-parser"
import currencyFormatter from "currency-formatter"

class Currency {
  constructor(valueString) {
    this.valueString = valueString;
    this.parsed = priceParser.parseFirst(this.valueString);
    if (this.parsed === null) {
      this.parsed = priceParser.parseFirst(this.valueString + ' EUR')
    }
  }

  formatted() {
    if (this.parsed) {
      return currencyFormatter.format(this.value(), { code: this.code() || 'EUR' });
    } else {
      return this.valueString.formatted;
    }
  }

  code() {
    if (this.parsed) {
      return this.parsed.currencyCode.toUpperCase();
    } else {
      return this.valueString.code;
    }
  }

  value() {
    if (this.parsed) {
      return this.parsed.floatValue;
    } else {
      return this.valueString.value;
    }
  }

  symbol() {
    if (this.parsed) {
      return this.parsed.symbol;
    } else {
      return this.valueString.symbol;
    }
  }
}

const mappers = { Currency }

function addMapperFunctionsToSchema(schema, mappers) {
  forEachField(schema, (field, typeName, fieldName) => {
    if (field.type.toString() === "Currency") {
      const originalResolver = field.resolve;
      field.resolve = async (source, args, context, info) => {
        const result = await originalResolver(source, args, context, info);
        logger.debug("Mapping", result, "as Currency");
        return new Currency(result);
      };
    }
  });
}

export {addMapperFunctionsToSchema, mappers}
