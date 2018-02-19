
class Currency {
  constructor(valueString) {
    this.valueString = valueString;
  }

  formatted() {
    return 'Sweet' + this.valueString;
  }
}

export default { Currency }