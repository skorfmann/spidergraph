# SpiderGraph

GraphQL based web scraper / crawler / spider

You can also find me on twitter at [@skorfmann](https://twitter.com/skorfmann).
## Example

### CLI
```
spidergraph scrape https://www.immobilienscout24.de/expose/54174187,https://www.immonet.de/angebot/33189259 | jq
[
  {
    "info": {
      "query": "immobilienscout24",
      "url": "https://www.immobilienscout24.de/expose/54174187"
    },
    "data": {
      "realEstate": [
        {
          "__typename": "House",
          "title": "Einfamilienhaus, \"Exclusive Stadtvilla\" HH Poppenbüttel",
          "price": "2.700 €"
        }
      ]
    }
  },
  {
    "info": {
      "query": "immonet",
      "url": "https://www.immonet.de/angebot/33189259"
    },
    "data": {
      "realEstate": [
        {
          "__typename": "House",
          "title": "2 Zimmer Maisonettewohnung - Neubau im Universitätsviertel",
          "price": "1390.0 €"
        }
      ]
    }
  }
]
```

## License
MIT License. See the [LICENSE](LICENSE) file.
