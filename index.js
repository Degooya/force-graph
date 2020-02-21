const directedGraph = (selector, _options) => {
  //TODO: Initiate everything, reduce variable

  let data = {},
    nodes = [],
    relationships = [],
    node,
    relationship,
    relationshipOutline,
    relationshipOverlay,
    relationshipText,
    root = selector,
    simulation,
    svg,
    g,
    svgNodes,
    svgRelationships,
    classes2colors = {},
    numClasses = 0;

  let options = {
    arrowSize: 4,
    colors: colors(), //TODO: use other color range
    nodeRadius: 25,
    minCollision: null //FIXME: collision
  };

  const zoom = d3
    .zoom()
    .scaleExtent([0.2, 1]) //TODO: as option
    .on("zoom", zoomed);

  const transform = d3.zoomIdentity.translate(0, 0).scale(1);

  // ----- init

  function init() {
    appendGraph(d3.select(root));
    simulation = initSimulation();

    if (!options.minCollision) {
      options.minCollision = options.nodeRadius * 2;
    }
  }

  init(); // will be moved ?

  function drawGraph(_data) {
    data = _data;
    showData(data);
  }

  // show Data

  function showData(d) {
    updateContent(d.nodes, d.relationships);
  }

  function updateContent(n, r) {
    updateRelationships(r);
    updateNodes(n);

    simulation.nodes(nodes);
    simulation.force("link").links(relationships);
  }

  //---

  function appendGraph(container) {
    svg = container
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("class", "directed-graph")
      .call(zoom)
      .on("dblclick.zoom", null);

    g = svg
      .append("g")
      .attr("width", "100%")
      .attr("height", "100%");

    svgRelationships = g.append("g").attr("class", "relationships");

    svgNodes = g.append("g").attr("class", "nodes");
  }

  function initSimulation() {
    return d3
      .forceSimulation(nodes)
      .velocityDecay(0.2)
      .alphaTarget(1)
      .force(
        "collide",
        d3
          .forceCollide()
          .radius(d => {
            return options.minCollision;
          })
          .iterations(5)
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force(
        "link",
        d3
          .forceLink(relationships)
          .id(d => {
            return d.id;
          })
          .distance(150)
      )
      .force(
        "center",
        d3.forceCenter(
          svg.node().parentElement.parentElement.clientWidth / 2,
          svg.node().parentElement.parentElement.clientHeight / 2
        )
      )
      .on("tick", function() {
        tick();
      })
      .on("end", function() {});
  }
  //---

  function updateRelationships(r) {
    relationships = r;

    relationship = svgRelationships
      .selectAll(".relationship")
      .data(relationships, d => {
        return d.id;
      });

    relationship.exit().remove();

    let relationshipEnter = appendRelationshipToGraph();

    relationship = relationshipEnter.merge(relationship);

    appendOverlayToRelationship(relationship);
    appendTextToRelationship(relationship);
    appendOutlineToRelationship(relationship);
  }

  function appendRelationshipToGraph() {
    return relationship
      .enter()
      .append("g")
      .attr("class", "relationship");
  }

  function appendOutlineToRelationship(n) {
    let r = n.selectAll(".outline").data(d => {
      return [d];
    });

    r.exit().remove();

    let renter = r
      .enter()
      .append("path")
      .attr("fill", "#9a9a9a")
      .attr("stroke", "#a5abb6");

    let rmerge = renter.merge(r).attr("class", "outline");

    relationshipOutline = rmerge;
  }

  function appendOverlayToRelationship(n) {
    let r = n.selectAll(".overlay").data(d => {
      return [d];
    });

    r.exit().remove();

    let renter = r.enter().append("path");

    let rmerge = renter.merge(r);

    rmerge.attr("class", "overlay").attr("fill", d => {
      //TODO: Add overlaycolor as option
    });

    relationshipOverlay = rmerge;
  }

  function appendTextToRelationship(n) {
    let r = n.selectAll(".text").data(d => {
      return [d];
    });

    r.exit().remove();

    let renter = r
      .enter()
      .append("text")
      .attr("class", "text")
      .attr("fill", "#000000")
      .attr("text-anchor", "middle");

    let rmerge = renter.merge(r);

    rmerge.text(d => {
      return d.type; //TODO: chose what to show
    });

    relationshipText = rmerge;
  }

  //---

  function updateNodes(n) {
    nodes = n;

    node = svgNodes.selectAll(".node").data(nodes, d => {
      return d.id;
    });

    node.exit().remove();

    let nodeEnter = appendNodeToGraph();
    node = nodeEnter.merge(node);

    node.on("contextmenu", d => {}); //TODO: Toolbar will be addded in future

    appendRingToNode(node);
    appendOutlineToNode(node);
    
    
    //appendTextUnderNode(node); // TODO: Add Text as option in circle or under. Let the user chose, what text should be shown
    //appendImageToNode(node);  //TODO: Add Images and Icons
    //appendIconToNode(node);
  }

  function appendNodeToGraph() {
    return node
      .enter()
      .append("g")
      .attr("class", d => {
        //TODO: classes for images and icons
        return "node";
      })
      .on("click", d => {
        //TODO: Features will be added
      })
      .on("dblclick", d => {
        //TODO: Features will be added
      })
      .call(
        d3
          .drag()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
      );
  }

  function appendOutlineToNode(node) {
    let n = node.selectAll(".noutline").data(d => {
      return [d];
    });

    n.exit().remove();

    let nenter = n
      .enter()
      .append("circle")
      .attr("class", "noutline")
      .attr("r", options.nodeRadius);

    let nmerge = nenter.merge(n);

    nmerge
      .style("fill", d => {
        // TODO: FIXME: add option of which value should represent the color
        return class2color(d.labels[0]);
      })
      .style("stroke", d => {
        return class2darkenColor(d.labels[0]);
      });
  }

  function appendRingToNode(node) {
    let n = node.selectAll(".ring").data(d => {
      return [d];
    });

    n.exit().remove();

    let nenter = n
      .enter()
      .append("circle")
      .attr("class", "ring")
      .attr("r", options.nodeRadius * 1.16); // TODO: add option of how thick the ring should be

    nenter.merge(n).attr("stroke", d => {
      // TODO: add option of which color should the ring has
      return class2color(d.labels[0]);
    });
  }

  //----

  function class2color(cls) {
    let color = classes2colors[cls];

    if (!color) {
      color = options.colors[numClasses % options.colors.length];
      classes2colors[cls] = color;
      numClasses++;
    }

    return color;
  }

  function class2darkenColor(cls) {
    return d3.rgb(class2color(cls)).darker(1);
  }

  function colors() {
    // TODO: Change to D3 Version on Color

    //return d3.scaleOrdinal().domain(...).range(d3.schemePaired);
    // d3.schemeCategory10,
    // d3.schemeCategory20,

    return [
      "#68bdf6", // light blue
      "#6dce9e", // green #1
      "#faafc2", // light pink
      "#f2baf6", // purple
      "#ff928c", // light red
      "#fcea7e", // light yellow
      "#ffc766", // light orange
      "#405f9e", // navy blue
      "#a5abb6", // dark gray
      "#78cecb", // green #2,
      "#b88cbb", // dark purple
      "#ced2d9", // light gray
      "#e84646", // dark red
      "#fa5f86", // dark pink
      "#ffab1a", // dark orange
      "#fcda19", // dark yellow
      "#797b80", // black
      "#c9d96f", // pistacchio
      "#47991f", // green #3
      "#70edee", // turquoise
      "#ff75ea" // pink
    ];
  }

  function dragEnded(d) {
    if (!d3.event.active) simulation.alphaTarget(0);

    d.fx = null;
    d.fy = null;
  }

  function dragged(d) {
    stickNode(d);
  }

  function stickNode(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragStarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;
  }
  
  function zoomed() {
    g.attr("transform", d3.event.transform);
  }

  //___tick

  function tick() {
    tickNodes();
    tickRelationships();
  }

  function tickNodes() {
    if (node) {
      node.attr("transform", d => {
        return "translate(" + d.x + ", " + d.y + ")";
      });
    }
  }

  function tickRelationships() {
    if (relationship) {
      relationship.attr("transform", d => {
        //TODO: add multiple cases
        return (
          "translate(" +
          d.source.x +
          ", " +
          d.source.y +
          ") rotate(" +
          rotation(d.source, d.target) +
          ")"
        );
      });

      tickRelationshipsTexts();
      tickRelationshipsOutlines();
      tickRelationshipsOverlays();
    }
  }

  function tickRelationshipsOutlines() {
    relationship.each(function(relationship) {
      let rel = d3.select(this),
        outline = rel.select(".outline"),
        text = rel.select(".text");

      outline.attr("d", d => {
        let center = {
            x: 0,
            y: 0
          },
          angle = rotation(d.source, d.target),
          textBoundingBox = text.node().getComputedTextLength(),
          textPadding = 5,
          u = unitaryVector(d.source, d.target),
          textMargin = {
            x:
              (d.target.x -
                d.source.x -
                (textBoundingBox + textPadding) * u.x) *
              0.5,
            y:
              (d.target.y -
                d.source.y -
                (textBoundingBox + textPadding) * u.y) *
              0.5
          },
          n = unitaryNormalVector(d.source, d.target),
          rotatedPointA1 = rotatePoint(
            center,
            {
              x: 0 + (options.nodeRadius + 1) * u.x - n.x,
              y: 0 + (options.nodeRadius + 1) * u.y - n.y
            },
            angle
          ),
          rotatedPointB1 = rotatePoint(
            center,
            {
              x: textMargin.x - n.x,
              y: textMargin.y - n.y
            },
            angle
          ),
          rotatedPointC1 = rotatePoint(
            center,
            {
              x: textMargin.x,
              y: textMargin.y
            },
            angle
          ),
          rotatedPointD1 = rotatePoint(
            center,
            {
              x: 0 + (options.nodeRadius + 1) * u.x,
              y: 0 + (options.nodeRadius + 1) * u.y
            },
            angle
          ),
          rotatedPointA2 = rotatePoint(
            center,
            {
              x: d.target.x - d.source.x - textMargin.x - n.x,
              y: d.target.y - d.source.y - textMargin.y - n.y
            },
            angle
          ),
          rotatedPointB2 = rotatePoint(
            center,
            {
              x:
                d.target.x -
                d.source.x -
                (options.nodeRadius + 1) * u.x -
                n.x -
                u.x * options.arrowSize,
              y:
                d.target.y -
                d.source.y -
                (options.nodeRadius + 1) * u.y -
                n.y -
                u.y * options.arrowSize
            },
            angle
          ),
          rotatedPointC2 = rotatePoint(
            center,
            {
              x:
                d.target.x -
                d.source.x -
                (options.nodeRadius + 1) * u.x -
                n.x +
                (n.x - u.x) * options.arrowSize,
              y:
                d.target.y -
                d.source.y -
                (options.nodeRadius + 1) * u.y -
                n.y +
                (n.y - u.y) * options.arrowSize
            },
            angle
          ),
          rotatedPointD2 = rotatePoint(
            center,
            {
              x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x,
              y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y
            },
            angle
          ),
          rotatedPointE2 = rotatePoint(
            center,
            {
              x:
                d.target.x -
                d.source.x -
                (options.nodeRadius + 1) * u.x +
                (-n.x - u.x) * options.arrowSize,
              y:
                d.target.y -
                d.source.y -
                (options.nodeRadius + 1) * u.y +
                (-n.y - u.y) * options.arrowSize
            },
            angle
          ),
          rotatedPointF2 = rotatePoint(
            center,
            {
              x:
                d.target.x -
                d.source.x -
                (options.nodeRadius + 1) * u.x -
                u.x * options.arrowSize,
              y:
                d.target.y -
                d.source.y -
                (options.nodeRadius + 1) * u.y -
                u.y * options.arrowSize
            },
            angle
          ),
          rotatedPointG2 = rotatePoint(
            center,
            {
              x: d.target.x - d.source.x - textMargin.x,
              y: d.target.y - d.source.y - textMargin.y
            },
            angle
          );

        return (
          "M " +
          rotatedPointA1.x +
          " " +
          rotatedPointA1.y +
          " L " +
          rotatedPointB1.x +
          " " +
          rotatedPointB1.y +
          " L " +
          rotatedPointC1.x +
          " " +
          rotatedPointC1.y +
          " L " +
          rotatedPointD1.x +
          " " +
          rotatedPointD1.y +
          " Z M " +
          rotatedPointA2.x +
          " " +
          rotatedPointA2.y +
          " L " +
          rotatedPointB2.x +
          " " +
          rotatedPointB2.y +
          " L " +
          rotatedPointC2.x +
          " " +
          rotatedPointC2.y +
          " L " +
          rotatedPointD2.x +
          " " +
          rotatedPointD2.y +
          " L " +
          rotatedPointE2.x +
          " " +
          rotatedPointE2.y +
          " L " +
          rotatedPointF2.x +
          " " +
          rotatedPointF2.y +
          " L " +
          rotatedPointG2.x +
          " " +
          rotatedPointG2.y +
          " Z"
        );
      });
    });
  }

  function tickRelationshipsOverlays() {
    relationshipOverlay.attr("d", d => {
      let center = {
          x: 0,
          y: 0
        },
        angle = rotation(d.source, d.target),
        n1 = unitaryNormalVector(d.source, d.target),
        n = unitaryNormalVector(d.source, d.target, 50),
        rotatedPointA = rotatePoint(
          center,
          {
            x: 0 - n.x,
            y: 0 - n.y
          },
          angle
        ),
        rotatedPointB = rotatePoint(
          center,
          {
            x: d.target.x - d.source.x - n.x,
            y: d.target.y - d.source.y - n.y
          },
          angle
        ),
        rotatedPointC = rotatePoint(
          center,
          {
            x: d.target.x - d.source.x + n.x - n1.x,
            y: d.target.y - d.source.y + n.y - n1.y
          },
          angle
        ),
        rotatedPointD = rotatePoint(
          center,
          {
            x: 0 + n.x - n1.x,
            y: 0 + n.y - n1.y
          },
          angle
        );

      return (
        "M " +
        rotatedPointA.x +
        " " +
        rotatedPointA.y +
        " L " +
        rotatedPointB.x +
        " " +
        rotatedPointB.y +
        " L " +
        rotatedPointC.x +
        " " +
        rotatedPointC.y +
        " L " +
        rotatedPointD.x +
        " " +
        rotatedPointD.y +
        " Z"
      );
    });
  }

  function tickRelationshipsTexts() {
    relationshipText.attr("transform", d => {
      let angle = (rotation(d.source, d.target) + 360) % 360,
        mirror = angle > 90 && angle < 270,
        center = {
          x: 0,
          y: 0
        },
        n = unitaryNormalVector(d.source, d.target),
        nWeight = mirror ? 2 : -3,
        point = {
          x: (d.target.x - d.source.x) * 0.5 + n.x * nWeight,
          y: (d.target.y - d.source.y) * 0.5 + n.y * nWeight
        },
        rotatedPoint = rotatePoint(center, point, angle);

      return (
        "translate(" +
        rotatedPoint.x +
        ", " +
        rotatedPoint.y +
        ") rotate(" +
        (mirror ? 180 : 0) +
        ")"
      );
    });
  }

  //___Math----

  function rotate(cx, cy, x, y, angle) {
    let radians = (Math.PI / 180) * angle,
      cos = Math.cos(radians),
      sin = Math.sin(radians),
      nx = cos * (x - cx) + sin * (y - cy) + cx,
      ny = cos * (y - cy) - sin * (x - cx) + cy;

    return {
      x: nx,
      y: ny
    };
  }

  function rotatePoint(c, p, angle) {
    return rotate(c.x, c.y, p.x, p.y, angle);
  }

  function rotation(source, target) {
    return (
      (Math.atan2(target.y - source.y, target.x - source.x) * 180) / Math.PI
    );
  }

  function unitaryNormalVector(source, target, newLength) {
    let center = {
        x: 0,
        y: 0
      },
      vector = unitaryVector(source, target, newLength);

    return rotatePoint(center, vector, 90);
  }

  function unitaryVector(source, target, newLength) {
    let length =
      Math.sqrt(
        Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)
      ) / Math.sqrt(newLength || 1);

    return {
      x: (target.x - source.x) / length,
      y: (target.y - source.y) / length
    };
  }

  return { drawGraph };
};


