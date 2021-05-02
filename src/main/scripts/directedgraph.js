import * as d3 from "d3";

import '@fortawesome/fontawesome-free/js/fontawesome'
import '@fortawesome/fontawesome-free/js/solid'
import '@fortawesome/fontawesome-free/js/regular'
import '@fortawesome/fontawesome-free/js/brands'

export default function DirectedGraph(_selector, _options) {
  let data = {},
    nodes = [],
    relationships = [],
    node,
    relationship,
    relationshipOutline,
    relationshipOverlay,
    relationshipText,
    selector,
    simulation,
    svg,
    g,
    svgNodes,
    svgRelationships,
    highlight,
    classes2colors = {},
    numClasses = 0;

  let options = {
    arrowSize: 7.5,
    relationshipWidth: 1.5,
    nodeRadius: 23,
    zoomScale: undefined, //TODO:
    colors: {},
    icons: {},
    nodeCaption: true,
    relationshipCaption: true,
  };

  // ----- init

  init(_selector, _options);

  //---

  function init(_selector, _options) {
    selector = _selector;
    options = { ...options, ..._options };

    appendGraph(d3.select(selector));
    simulation = initSimulation();
  }

  function drawGraph(_data) {
    data = _data;
    showData(data);
  }

  // components/graph
  function findNode(id, nodes) {
    let match;
    nodes.forEach((node) => {
      if (node.id == id) match = node;
    });
    return match;
  }

  function showData(d) {
    mapData(d);
    updateContent(d.nodes, d.relationships);
  }

  function mapData(d) {
    d.relationships.map((r) => {
      let source = findNode(r.startNode, d.nodes);
      let target = findNode(r.endNode, d.nodes);

      (r.source = source),
        (r.target = target),
        (r.naturalAngle = 0),
        (r.isLoop = function () {
          return this.source === this.target;
        });
      return r;
    });
  }

  //---

  function zoom() {
    return d3.zoom().scaleExtent([0.2, 1]).on("zoom", zoomed);
  }

  function transform() {
    return d3.zoomIdentity.translate(0, 0).scale(1);
  }

  function updateContent(n, r) {
    updateRelationships(r);
    updateNodes(n);

    simulation.nodes(nodes);
    simulation.force("link").links(relationships);
  }

  // ---utils

  function NodePair(node1, node2) {
    this.nodeA;
    this.nodeB;
    this.relationships = [];

    if (node1.id < node2.id) {
      this.nodeA = node1;
      this.nodeB = node2;
    } else {
      this.nodeA = node2;
      this.nodeB = node1;
    }
    return this;
  }

  NodePair.prototype = {
    isLoop: function () {
      return this.nodeA === this.nodeB;
    },
    toString: function () {
      return `${this.nodeA.id}:${this.nodeB.id}`;
    },
  };

  function StraightArrow(
    startRadius,
    endRadius,
    centreDistance,
    shaftWidth,
    headWidth,
    headHeight,
    captionLayout
  ) {
    this.length;
    this.midShaftPoint;
    this.outline;
    this.overlay;
    this.shaftLength;
    this.deflection = 0;

    this.length = centreDistance - (startRadius + endRadius);
    this.shaftLength = this.length - headHeight;

    const startArrow = startRadius;
    const endShaft = startArrow + this.shaftLength;
    const endArrow = startArrow + this.length;
    const shaftRadius = shaftWidth / 2;
    const headRadius = headWidth / 2;

    this.midShaftPoint = {
      x: startArrow + this.shaftLength / 2,
      y: 0,
    };

    // for shortCaptionLength we use textBoundingBox = text.node().getComputedTextLength(),
    this.outline = function (shortCaptionLength) {
      if (captionLayout === "external") {
        const startBreak =
          startArrow + (this.shaftLength - shortCaptionLength) / 2;
        const endBreak = endShaft - (this.shaftLength - shortCaptionLength) / 2;

        return [
          "M",
          startArrow,
          shaftRadius,
          "L",
          startBreak,
          shaftRadius,
          "L",
          startBreak,
          -shaftRadius,
          "L",
          startArrow,
          -shaftRadius,
          "Z",
          "M",
          endBreak,
          shaftRadius,
          "L",
          endShaft,
          shaftRadius,
          "L",
          endShaft,
          headRadius,
          "L",
          endArrow,
          0,
          "L",
          endShaft,
          -headRadius,
          "L",
          endShaft,
          -shaftRadius,
          "L",
          endBreak,
          -shaftRadius,
          "Z",
        ].join(" ");
      } else {
        return [
          "M",
          startArrow,
          shaftRadius,
          "L",
          endShaft,
          shaftRadius,
          "L",
          endShaft,
          headRadius,
          "L",
          endArrow,
          0,
          "L",
          endShaft,
          -headRadius,
          "L",
          endShaft,
          -shaftRadius,
          "L",
          startArrow,
          -shaftRadius,
          "Z",
        ].join(" ");
      }
    };

    this.overlay = function (minWidth) {
      const radius = Math.max(minWidth / 2, shaftRadius);
      return [
        "M",
        startArrow,
        radius,
        "L",
        endArrow,
        radius,
        "L",
        endArrow,
        -radius,
        "L",
        startArrow,
        -radius,
        "Z",
      ].join(" ");
    };
  }

  function ArcArrow(
    startRadius,
    endRadius,
    endCentre,
    _deflection,
    arrowWidth,
    headWidth,
    headLength,
    captionLayout
  ) {
    this.deflection = _deflection;
    const square = (l) => l * l;

    const deflectionRadians = (this.deflection * Math.PI) / 180;
    const startAttach = {
      x: Math.cos(deflectionRadians) * startRadius,
      y: Math.sin(deflectionRadians) * startRadius,
    };

    const radiusRatio = startRadius / (endRadius + headLength);
    const homotheticCenter = (-endCentre * radiusRatio) / (1 - radiusRatio);

    const intersectWithOtherCircle = function (
      fixedPoint,
      radius,
      xCenter,
      polarity
    ) {
      const gradient = fixedPoint.y / (fixedPoint.x - homotheticCenter);
      const hc = fixedPoint.y - gradient * fixedPoint.x;

      const A = 1 + square(gradient);
      const B = 2 * (gradient * hc - xCenter);
      const C = square(hc) + square(xCenter) - square(radius);

      const intersection = {
        x: (-B + polarity * Math.sqrt(square(B) - 4 * A * C)) / (2 * A),
      };
      intersection.y = (intersection.x - homotheticCenter) * gradient;

      return intersection;
    };

    const endAttach = intersectWithOtherCircle(
      startAttach,
      endRadius + headLength,
      endCentre,
      -1
    );

    const g1 = -startAttach.x / startAttach.y;
    const c1 = startAttach.y + square(startAttach.x) / startAttach.y;
    const g2 = -(endAttach.x - endCentre) / endAttach.y;
    const c2 =
      endAttach.y + ((endAttach.x - endCentre) * endAttach.x) / endAttach.y;

    const cx = (c1 - c2) / (g2 - g1);
    const cy = g1 * cx + c1;

    const arcRadius = Math.sqrt(
      square(cx - startAttach.x) + square(cy - startAttach.y)
    );
    const startAngle = Math.atan2(startAttach.x - cx, cy - startAttach.y);
    const endAngle = Math.atan2(endAttach.x - cx, cy - endAttach.y);
    let sweepAngle = endAngle - startAngle;
    if (this.deflection > 0) {
      sweepAngle = 2 * Math.PI - sweepAngle;
    }

    this.shaftLength = sweepAngle * arcRadius;
    if (startAngle > endAngle) {
      this.shaftLength = 0;
    }

    let midShaftAngle = (startAngle + endAngle) / 2;
    if (this.deflection > 0) {
      midShaftAngle += Math.PI;
    }
    this.midShaftPoint = {
      x: cx + arcRadius * Math.sin(midShaftAngle),
      y: cy - arcRadius * Math.cos(midShaftAngle),
    };

    const startTangent = function (dr) {
      const dx = (dr < 0 ? 1 : -1) * Math.sqrt(square(dr) / (1 + square(g1)));
      const dy = g1 * dx;
      return {
        x: startAttach.x + dx,
        y: startAttach.y + dy,
      };
    };

    const endTangent = function (dr) {
      const dx = (dr < 0 ? -1 : 1) * Math.sqrt(square(dr) / (1 + square(g2)));
      const dy = g2 * dx;
      return {
        x: endAttach.x + dx,
        y: endAttach.y + dy,
      };
    };

    const angleTangent = (angle, dr) => ({
      x: cx + (arcRadius + dr) * Math.sin(angle),
      y: cy - (arcRadius + dr) * Math.cos(angle),
    });

    const endNormal = function (dc) {
      const dx =
        (dc < 0 ? -1 : 1) * Math.sqrt(square(dc) / (1 + square(1 / g2)));
      const dy = dx / g2;
      return {
        x: endAttach.x + dx,
        y: endAttach.y - dy,
      };
    };

    const endOverlayCorner = function (dr, dc) {
      const shoulder = endTangent(dr);
      const arrowTip = endNormal(dc);
      return {
        x: shoulder.x + arrowTip.x - endAttach.x,
        y: shoulder.y + arrowTip.y - endAttach.y,
      };
    };

    const coord = (point) => `${point.x},${point.y}`;

    const shaftRadius = arrowWidth / 2;
    const headRadius = headWidth / 2;
    const positiveSweep = startAttach.y > 0 ? 0 : 1;
    const negativeSweep = startAttach.y < 0 ? 0 : 1;

    this.outline = function (shortCaptionLength) {
      if (startAngle > endAngle) {
        return [
          "M",
          coord(endTangent(-headRadius)),
          "L",
          coord(endNormal(headLength)),
          "L",
          coord(endTangent(headRadius)),
          "Z",
        ].join(" ");
      }

      if (captionLayout === "external") {
        let captionSweep = shortCaptionLength / arcRadius;
        if (this.deflection > 0) {
          captionSweep *= -1;
        }

        const startBreak = midShaftAngle - captionSweep / 2;
        const endBreak = midShaftAngle + captionSweep / 2;

        return [
          "M",
          coord(startTangent(shaftRadius)),
          "L",
          coord(startTangent(-shaftRadius)),
          "A",
          arcRadius - shaftRadius,
          arcRadius - shaftRadius,
          0,
          0,
          positiveSweep,
          coord(angleTangent(startBreak, -shaftRadius)),
          "L",
          coord(angleTangent(startBreak, shaftRadius)),
          "A",
          arcRadius + shaftRadius,
          arcRadius + shaftRadius,
          0,
          0,
          negativeSweep,
          coord(startTangent(shaftRadius)),
          "Z",
          "M",
          coord(angleTangent(endBreak, shaftRadius)),
          "L",
          coord(angleTangent(endBreak, -shaftRadius)),
          "A",
          arcRadius - shaftRadius,
          arcRadius - shaftRadius,
          0,
          0,
          positiveSweep,
          coord(endTangent(-shaftRadius)),
          "L",
          coord(endTangent(-headRadius)),
          "L",
          coord(endNormal(headLength)),
          "L",
          coord(endTangent(headRadius)),
          "L",
          coord(endTangent(shaftRadius)),
          "A",
          arcRadius + shaftRadius,
          arcRadius + shaftRadius,
          0,
          0,
          negativeSweep,
          coord(angleTangent(endBreak, shaftRadius)),
        ].join(" ");
      } else {
        return [
          "M",
          coord(startTangent(shaftRadius)),
          "L",
          coord(startTangent(-shaftRadius)),
          "A",
          arcRadius - shaftRadius,
          arcRadius - shaftRadius,
          0,
          0,
          positiveSweep,
          coord(endTangent(-shaftRadius)),
          "L",
          coord(endTangent(-headRadius)),
          "L",
          coord(endNormal(headLength)),
          "L",
          coord(endTangent(headRadius)),
          "L",
          coord(endTangent(shaftRadius)),
          "A",
          arcRadius + shaftRadius,
          arcRadius + shaftRadius,
          0,
          0,
          negativeSweep,
          coord(startTangent(shaftRadius)),
        ].join(" ");
      }
    };

    this.overlay = function (minWidth) {
      const radius = Math.max(minWidth / 2, shaftRadius);

      return [
        "M",
        coord(startTangent(radius)),
        "L",
        coord(startTangent(-radius)),
        "A",
        arcRadius - radius,
        arcRadius - radius,
        0,
        0,
        positiveSweep,
        coord(endTangent(-radius)),
        "L",
        coord(endOverlayCorner(-radius, headLength)),
        "L",
        coord(endOverlayCorner(radius, headLength)),
        "L",
        coord(endTangent(radius)),
        "A",
        arcRadius + radius,
        arcRadius + radius,
        0,
        0,
        negativeSweep,
        coord(startTangent(radius)),
      ].join(" ");
    };
  }

  function LoopArrow(
    nodeRadius,
    straightLength,
    spreadDegrees,
    shaftWidth,
    headWidth,
    headLength,
    captionHeight
  ) {
    this.outline;
    this.overlay, this.shaftLength;
    this.midShaftPoint;

    const spread = (spreadDegrees * Math.PI) / 180;
    const r1 = nodeRadius;
    const r2 = nodeRadius + headLength;
    const r3 = nodeRadius + straightLength;
    const loopRadius = r3 * Math.tan(spread / 2);
    const shaftRadius = shaftWidth / 2;
    this.shaftLength = loopRadius * 3 + shaftWidth;

    function Point(_x, _y) {
      this.x;
      this.y;

      this.x = _x;
      this.y = _y;
    }

    Point.prototype = {
      toString: function () {
        return `${this.x} ${this.y}`;
      },
    };

    const normalPoint = function (sweep, radius, displacement) {
      const localLoopRadius = radius * Math.tan(spread / 2);
      const cy = radius / Math.cos(spread / 2);
      return new Point(
        (localLoopRadius + displacement) * Math.sin(sweep),
        cy + (localLoopRadius + displacement) * Math.cos(sweep)
      );
    };

    this.midShaftPoint = normalPoint(
      0,
      r3,
      shaftRadius + captionHeight / 2 + 2
    );
    const startPoint = (radius, displacement) =>
      normalPoint((Math.PI + spread) / 2, radius, displacement);
    const endPoint = (radius, displacement) =>
      normalPoint(-(Math.PI + spread) / 2, radius, displacement);

    this.outline = function () {
      const inner = loopRadius - shaftRadius;
      const outer = loopRadius + shaftRadius;
      return [
        "M",
        startPoint(r1, shaftRadius),
        "L",
        startPoint(r3, shaftRadius),
        "A",
        outer,
        outer,
        0,
        1,
        1,
        endPoint(r3, shaftRadius),
        "L",
        endPoint(r2, shaftRadius),
        "L",
        endPoint(r2, -headWidth / 2),
        "L",
        endPoint(r1, 0),
        "L",
        endPoint(r2, headWidth / 2),
        "L",
        endPoint(r2, -shaftRadius),
        "L",
        endPoint(r3, -shaftRadius),
        "A",
        inner,
        inner,
        0,
        1,
        0,
        startPoint(r3, -shaftRadius),
        "L",
        startPoint(r1, -shaftRadius),
        "Z",
      ].join(" ");
    };

    this.overlay = function (minWidth) {
      const displacement = Math.max(minWidth / 2, shaftRadius);
      const inner = loopRadius - displacement;
      const outer = loopRadius + displacement;
      return [
        "M",
        startPoint(r1, displacement),
        "L",
        startPoint(r3, displacement),
        "A",
        outer,
        outer,
        0,
        1,
        1,
        endPoint(r3, displacement),
        "L",
        endPoint(r2, displacement),
        "L",
        endPoint(r2, -displacement),
        "L",
        endPoint(r3, -displacement),
        "A",
        inner,
        inner,
        0,
        1,
        0,
        startPoint(r3, -displacement),
        "L",
        startPoint(r1, -displacement),
        "Z",
      ].join(" ");
    };
  }

  //---utils

  function appendGraph(container) {
    svg = container
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("class", "directed-graph")
      .call(zoom())
      .on("dblclick.zoom", null);

    g = svg.append("g").attr("width", "100%").attr("height", "100%");

    svgRelationships = g.append("g").attr("class", "relationships");

    svgNodes = g.append("g").attr("class", "nodes");
  }

  function initSimulation() {
    return (
      d3
        .forceSimulation()
        .velocityDecay(0.8)
        .force(
          "collide",
          d3
            .forceCollide(options.nodeRadius)
            .radius(function (d) {
              return options.nodeRadius * 2;
            })
            .iterations(3)
            .strength(1)
        )
        .force("charge", d3.forceManyBody().strength())
        .force(
          "link",
          d3
            .forceLink()
            .distance(() => {
              return options.nodeRadius * 3.9;
            })

            .id(function (d) {
              return d.id;
            })
        )
        .force(
          "center",
          d3.forceCenter(
            svg.node().parentElement.parentElement.clientWidth / 2,
            svg.node().parentElement.parentElement.clientHeight / 2
          )
        )

        .force(
          "charge",
          d3
            .forceManyBody()
            .strength(-600)
            .distanceMax(400)
            .distanceMin(options.nodeRadius * 3.5)
        )
        //.alphaDecay(0.01)
        //.alphaTarget(1)
        .on("tick", function () {
          tick();
        })
    );
  }

  function layoutRelationships() {
    const nodePairs = groupedRelationships();
    computeGeometryForNonLoopArrows(nodePairs);
    distributeAnglesForLoopArrows(nodePairs, data.relationships);

    return (() => {
      const result = [];
      for (var nodePair of Array.from(nodePairs)) {
        for (var relationship of Array.from(nodePair.relationships)) {
          delete relationship.arrow;
        }

        var middleRelationshipIndex = (nodePair.relationships.length - 1) / 2;
        var defaultDeflectionStep = 30;
        const maximumTotalDeflection = 150;
        const numberOfSteps = nodePair.relationships.length - 1;
        const totalDeflection = defaultDeflectionStep * numberOfSteps;

        var deflectionStep =
          totalDeflection > maximumTotalDeflection
            ? maximumTotalDeflection / numberOfSteps
            : defaultDeflectionStep;

        result.push(
          (() => {
            for (let i = 0; i < nodePair.relationships.length; i++) {
              var ref;
              relationship = nodePair.relationships[i];
              const nodeRadius = options.nodeRadius;
              const shaftWidth = options.relationshipWidth;
              const headWidth = options.arrowSize;
              const headHeight = headWidth;

              if (nodePair.isLoop()) {
                relationship.arrow = new LoopArrow(
                  nodeRadius,
                  40,
                  defaultDeflectionStep,
                  shaftWidth,
                  headWidth,
                  headHeight,
                  relationship.captionHeight || 11
                );
              } else {
                if (i === middleRelationshipIndex) {
                  relationship.arrow = new StraightArrow(
                    nodeRadius,
                    nodeRadius,
                    relationship.centreDistance,
                    shaftWidth,
                    headWidth,
                    headHeight,
                    relationship.captionLayout || "external"
                  );
                } else {
                  let deflection =
                    deflectionStep * (i - middleRelationshipIndex);

                  if (nodePair.nodeA !== relationship.source) {
                    deflection *= -1;
                  }

                  relationship.arrow = new ArcArrow(
                    nodeRadius,
                    nodeRadius,
                    relationship.centreDistance,
                    deflection,
                    shaftWidth,
                    headWidth,
                    headHeight,
                    relationship.captionLayout || "external"
                  );
                }
              }
            }
          })()
        );
      }
      return result;
    })();
  }

  //FIXME:DONT HAVE TO REPEAT

  function groupedRelationships() {
    const groups = {};
    for (const relationship of Array.from(data.relationships)) {
      let nodePair = new NodePair(relationship.source, relationship.target);
      nodePair = groups[nodePair] != null ? groups[nodePair] : nodePair;
      nodePair.relationships.push(relationship);
      groups[nodePair] = nodePair;
    }
    return (() => {
      const result = [];
      for (const ignored in groups) {
        const pair = groups[ignored];
        result.push(pair);
      }
      return result;
    })();
  }

  function computeGeometryForNonLoopArrows(nodePairs) {
    const square = (distance) => distance * distance;
    return (() => {
      const result = [];
      for (var nodePair of Array.from(nodePairs)) {
        if (!nodePair.isLoop()) {
          const dx = nodePair.nodeA.x - nodePair.nodeB.x;
          const dy = nodePair.nodeA.y - nodePair.nodeB.y;
          var angle = ((Math.atan2(dy, dx) / Math.PI) * 180 + 360) % 360;
          var centreDistance = Math.sqrt(square(dx) + square(dy));
          result.push(
            (() => {
              const result1 = [];
              for (const relationship of Array.from(nodePair.relationships)) {
                relationship.naturalAngle =
                  relationship.target === nodePair.nodeA
                    ? (angle + 180) % 360
                    : angle;
                result1.push((relationship.centreDistance = centreDistance));
              }
              return result1;
            })()
          );
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  function distributeAnglesForLoopArrows(nodePairs, relationships) {
    return (() => {
      const result = [];
      for (var nodePair of Array.from(nodePairs)) {
        if (nodePair.isLoop()) {
          var i, separation;
          let angles = [];
          const node = nodePair.nodeA;
          for (var relationship of Array.from(relationships)) {
            if (!relationship.isLoop()) {
              if (relationship.source === node) {
                angles.push(relationship.naturalAngle);
              }
              if (relationship.target === node) {
                angles.push(relationship.naturalAngle + 180);
              }
            }
          }
          angles = angles.map((a) => (a + 360) % 360).sort((a, b) => a - b);
          if (angles.length > 0) {
            var end, start;
            var biggestGap = {
              start: 0,
              end: 0,
            };
            for (i = 0; i < angles.length; i++) {
              const angle = angles[i];
              start = angle;
              end = i === angles.length - 1 ? angles[0] + 360 : angles[i + 1];
              if (end - start > biggestGap.end - biggestGap.start) {
                biggestGap.start = start;
                biggestGap.end = end;
              }
            }
            separation =
              (biggestGap.end - biggestGap.start) /
              (nodePair.relationships.length + 1);
            result.push(
              (() => {
                const result1 = [];
                for (i = 0; i < nodePair.relationships.length; i++) {
                  relationship = nodePair.relationships[i];
                  result1.push(
                    (relationship.naturalAngle =
                      (biggestGap.start + (i + 1) * separation - 90) % 360)
                  );
                }
                return result1;
              })()
            );
          } else {
            separation = 360 / nodePair.relationships.length;

            result.push(
              (() => {
                const result2 = [];
                for (i = 0; i < nodePair.relationships.length; i++) {
                  relationship = nodePair.relationships[i];
                  result2.push((relationship.naturalAngle = i * separation));
                }
                return result2;
              })()
            );
          }
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  //--- visulize or Graph component

  function updateRelationships(r) {
    relationships = r;

    relationship = svgRelationships
      .selectAll(".relationship")
      .data(relationships, (d) => {
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
    return relationship.enter().append("g").attr("class", "relationship");
  }

  function appendOutlineToRelationship(n) {
    let r = n.selectAll(".outline").data((d) => {
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
    let r = n.selectAll(".overlay").data((d) => {
      return [d];
    });

    r.exit().remove();

    let renter = r.enter().append("path");

    let rmerge = renter.merge(r);

    rmerge.attr("class", "overlay").attr("fill", (d) => {
      //TODO: Add overlaycolor as option
    });

    relationshipOverlay = rmerge;
  }

  function appendTextToRelationship(n) {
    let r = n.selectAll(".text").data((d) => {
      return [d];
    });

    r.exit().remove();

    let renter = r
      .enter()
      .append("text")
      .attr("class", "text")
      .attr("fill", "#000000")
      //TODO: Make fontsize dynamic
      .attr("font-size", "7.5px")
      .attr("font-weight", 600)
      .attr("text-anchor", "middle");

    let rmerge = renter.merge(r);

    rmerge.text((d) => {
      return options.relationshipCaption ? d.type : ""; //TODO: chose what to show
    });

    relationshipText = rmerge;
  }

  //---

  function updateNodes(n) {
    nodes = n;

    node = svgNodes.selectAll(".node").data(nodes, (d) => {
      return d.id;
    });

    node.exit().remove();

    let nodeEnter = appendNodeToGraph();
    node = nodeEnter.merge(node);

    node.on("contextmenu", (d) => {}); //TODO: Toolbar will be addded in future

    appendRingToNode(node);
    appendOutlineToNode(node);

    appendTextUnderNode(node);
    appendIconToNode(node);
    //appendImageToNode(node);
  }

  function appendNodeToGraph() {
    return node
      .enter()
      .append("g")
      .attr("class", (d) => {
        //TODO: classes for images and icons
        return "node";
      })
      .on("click", (d) => {
        //TODO: Features will be added
      })
      .on("dblclick", (d) => {
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
    let n = node.selectAll(".noutline").data((d) => {
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
      .style("fill", (d) => {
        // TODO: FIXME: add option of which value should represent the color
        return class2color(d.labels[0]);
      })
      .style("stroke", (d) => {
        return class2darkenColor(d.labels[0]);
      });
  }

  function appendRingToNode(node) {
    let n = node.selectAll(".ring").data((d) => {
      return [d];
    });

    n.exit().remove();

    let nenter = n
      .enter()
      .append("circle")
      .attr("class", "ring")
      .attr("r", options.nodeRadius); // TODO: add option of how thick the ring should be

    nenter.merge(n).attr("stroke", (d) => {
      // TODO: add option of which color should the ring has
      //return class2color(d.labels[0]);
    });
  }

  function appendTextUnderNode(node) {
    var n = node.selectAll(".nodetext").data(function (d) {
      return [d];
    });

    n.exit().remove();

    var nenter = n
      .enter()
      .append("text")
      .attr("class", "nodetext")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      //TODO: make fontsize dynamic| 9.5
      .attr("y", (d) => {
        return `${options.nodeRadius + 9.5 + 10}px`;
      });

    nenter.merge(n).html(function (d) {
      return options.nodeCaption ? `${d.labels}` : "";
    });
  }

  function appendImageToNode(node) {
    const squareCoordinates = getInscribedSquareCoordinates(options.nodeRadius);

    var n = node.selectAll(".image").data(function (d) {
      return [d];
    });

    n.exit().remove();

    var nenter = n.enter().append("image").attr("class", "image");

    // TODO: Adjust position to node size
    nenter
      .merge(n)
      .attr("xlink:href", function (d) {
        if (options.images[d.labels[0]] !== undefined)
          properties.images[d.labels[0]];
      })
      .attr("height", function (d) {
        return `${squareCoordinates.height}px`;
      })
      .attr("x", function (d) {
        return `${squareCoordinates.x}px`;
      })
      .attr("y", function (d) {
        return `${squareCoordinates.y}px`;
      })
      .attr("width", function (d) {
        return `${squareCoordinates.widht}px`;
      });
  }

  function appendIconToNode(node) {
    const squareCoordinates = getInscribedSquareCoordinates(options.nodeRadius);

    var n = node.selectAll(".icon").data(function (d) {
      return [d];
    });

    n.exit().remove();

    var nenter = n.enter().append("svg");

    nenter
      .merge(n)
      .attr("class", function (d) {
        return `icon ${class2icon(d.labels[0]) || ""}`;
      })
      .attr("height", function (d) {
        return `${squareCoordinates.height / 1.5}px`;
      })
      .attr("x", function (d) {
        return `${squareCoordinates.x / 1.5}px`;
      })
      .attr("y", function (d) {
        return `${squareCoordinates.y / 1.5}px`;
      })
      .attr("width", function (d) {
        return `${squareCoordinates.widht / 1.5}px`;
      });
  }

  //---- util

  function class2icon(cls) {
    return options.icons[cls];
  }

  function class2color(cls) {
    let color = options.colors[cls] || classes2colors[cls];

    if (!color) {
      color = randomColors()[numClasses % randomColors().length];
      classes2colors[cls] = color;
      numClasses++;
    }

    return color;
  }

  function class2darkenColor(cls) {
    return d3.rgb(class2color(cls)).darker(1);
  }

  function randomColors() {
    return [
      "rgb(255, 187, 120)",
      "rgb(148, 103, 189)",
      "rgb(174, 199, 232)",
      "rgb(31, 119, 180)",
      "rgb(152, 223, 138)",
      "rgb(84, 202, 116)",
      "rgb(227, 67, 67)",
      "rgb(121, 110, 255)",
      "rgb(242, 246, 251)"
    ];
  }

  function getInscribedSquareCoordinates(radius) {
    let hypotenuse = (radius * radius) / 2;
    let leg = Math.sqrt(hypotenuse);

    return { y: -leg, x: -leg, widht: leg * 2, height: leg * 2 };
  }

  //----visulization

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
      node.attr("transform", (d) => {
        return "translate(" + d.x + ", " + d.y + ")";
      });
    }
  }

  function tickRelationships() {
    //TODO: add multiple cases

    layoutRelationships();

    if (relationship) {
      layoutRelationships();

      relationship.attr("transform", (d) => {
        return `translate(${d.source.x} ${d.source.y}) rotate(${
          d.naturalAngle + 180
        })`;
      });

      tickRelationshipsTexts();
      tickRelationshipsOutlines();
      tickRelationshipsOverlays();
    }
  }

  function tickRelationshipsOutlines() {
    relationship.each(function (relationship) {
      // FIXME:

      let rel = d3.select(this),
        outline = rel.select(".outline"),
        text = rel.select(".text"),
        textPadding = 8,
        textLength = text.node().getComputedTextLength(),
        captionLength = textLength > 0 ? textLength + textPadding : 0;

      outline.attr("d", (d) => {
        if (captionLength > d.arrow.shaftLength) {
          captionLength = d.arrow.shaftLength;
        }

        return d.arrow.outline(captionLength);
      });
    });
  }

  function tickRelationshipsOverlays() {
    relationshipOverlay.attr("d", (d) => {
      return d.arrow.overlay(options.arrowSize);
    });
  }

  function tickRelationshipsTexts() {
    relationshipText.attr("transform", (rel) => {
      if (rel.naturalAngle < 90 || rel.naturalAngle > 270) {
        return `rotate(180 ${rel.arrow.midShaftPoint.x} ${rel.arrow.midShaftPoint.y})`;
      } else {
        return null;
      }
    });
    relationshipText.attr("x", (rel) => rel.arrow.midShaftPoint.x);
    relationshipText.attr(
      "y",
      //TODO: Make the fontsize and padding dynamic
      (rel) => rel.arrow.midShaftPoint.y + parseFloat(8.5) / 2 - 1
    );
  }

  return { drawGraph };
}
