# SpiderGraph

GraphQL based web scraper / crawler / spider

You can also find me on twitter at [@skorfmann](https://twitter.com/skorfmann).

[![CircleCI](https://circleci.com/gh/skorfmann/spidergraph.svg?style=svg)](https://circleci.com/gh/skorfmann/spidergraph)

## Example

### CLI

#### Scrape

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

#### Crawl

```
spidergraph crawl https://www.immobilienscout24.de/Suche/S-T/Wohnung-Miete/Hamburg/Hamburg
[{"info":{"query":"immobilienscout24","url":"https://www.immobilienscout24.de/expose/89156209"},"data":{"realEstate":[{"__typename":"House","title":"Wellingsbüttel - 2 Zimmer","price":"1.093,63 €"}]}}]
[{"info":{"query":"immobilienscout24","url":"https://www.immobilienscout24.de/expose/102498094"},"data":{"realEstate":[{"__typename":"House","title":"Ruhiges Wohnen mit Kamin in zentraler Lage","price":"1.863 €"}]}}]
[{"info":{"query":"immobilienscout24","url":"https://www.immobilienscout24.de/expose/99130149"},"data":{"realEstate":[{"__typename":"House","title":"Hochwertig sanierte Wohnung im Zweifamilienhaus mit Garten","price":"3.800 €"}]}}]
...
```

## License
MIT License. See the [LICENSE](LICENSE) file.
