import logger from './logger';
import {
  forEachField
} from "graphql-tools";
import priceParser from "price-parser"
import currencyFormatter from "currency-formatter"

class Currency {
  constructor(valueString) {
    this.valueString = valueString;
    console.log(this.valueString)
    this.parsed = priceParser.parseFirst(this.valueString);
    if (this.parsed === null) {
      this.parsed = priceParser.parseFirst(this.valueString + ' EUR')
    }
  }

  formatted() {
    return currencyFormatter.format(this.value(), { code: this.code() || 'EUR' });
  }

  code() {
    return this.parsed.currencyCode.toUpperCase();
  }

  value() {
    return this.parsed.floatValue;
  }

  symbol() {
    return this.parsed.symbol;
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
