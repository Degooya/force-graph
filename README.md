# force-graph

Force directed graph implementation using [D3.js](https://github.com/d3/d3).

![neo4j browser screenshot](./.github/ForceLayout.png)

## Features

* Compaptible with the the [D3.js data format](#d3js-data-format).
* Force simulation.
* Custom node colors by node type.
* Text nodes + [Font Awesome](http://fontawesome.io/) icon nodes.
* Dynamic graph update.
* Relationship auto-orientation.
* Zoom and pan.
* Compatible with D3.js v5.

## Running

Clone the repository, install all dependencies, build and serve the project.

```bash
> git clone https://github.com/Degooya/force-graph.git
> npm install
> npm start
```

Open `http://localhost:8080` in your favorite browser.

## Documentation

```javascript
var directedGraph = new DirectedGraph('.selector', options);
directedGraph.drawGraph(d3Data);
```

### Options

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| **icons** | *object* | Map node labels to [Font Awesome icons](http://fontawesome.io/icons).<br>Example:<br>`{`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'bicycle': 'fas fa-bicycle',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'compass': 'fas fa-compass',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'feather': 'fas fa-feather'}`<br>`}`. |
| **colors** | *object* | Map node labels to colors.<br>Example:<br>`{`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'bicycle': '#FF1B36',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'compass': '#FFC100',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'feather': '#B6D4FF'`<br>`}`. |
| **nodeRadius** | *int* | Radius of nodes. Default: 23. |
| **arrowSize** | *int* | Size of arrows. Default: 7.5. |
| **relationshipWidth** | *int* | Width of relationships. Default: 1.5. |
| **nodeCaption** | *boolean* | Show the node caption: `true`, `false`. Default: `true`. |
| **relationshipCaption** | *boolean* | Show the relationship caption: `true`, `false`. Default: `true`. |

### JavaScript API

| Function | Description |
| -------- | ----------- |
| **drawGraph**(*d3Data*) | Draws the graph using [D3.js data format](#d3js-data-format). |


### Documentation

#### D3.js data format

```
{
    "nodes": [
        {
            "id": "1",
            "labels": ["User"],
            "properties": {
                "userId": "degoya"
            }
        },
        {
            "id": "8",
            "labels": ["Project"],
            "properties": {
                "name": "Force-Graph",
                "title": "directedGraph.js",
                "description": "Force directed graph implementation using D3.js.",
                "url": "https://github.com/Degooya/force-graph"
            }
        }
    ],
    "relationships": [
        {
            "id": "7",
            "type": "DEVELOPES",
            "startNode": "1",
            "endNode": "8",
            "properties": {
                "from": 1470002400000
            }
        }
    ]
}
```

## What's coming?

* Info panel.
* Pin nodes.
* Toolbar.
* SVG icon support.

## Copyright and license

Copyright (C) 2021 Robert Rieser