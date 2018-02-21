import logger from './logger';
import {
  forEachField
} from "graphql-tools";

class Currency {
  constructor(valueString) {
    this.valueString = valueString;
  }

  formatted() {
    return 'Sweet' + this.valueString;
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

export default addMapperFunctionsToSchema