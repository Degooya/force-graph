import * as d3 from "d3";
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/regular';
import '@fortawesome/fontawesome-free/js/brands';

/**
 * DirectedGraph - A D3.js-based force-directed graph visualization library
 * @param {string} selector - CSS selector for the container element
 * @param {Object} options - Configuration options
 */
export default class DirectedGraph {
    constructor(selector, options = {}) {
        // Default configuration
        this.config = {
            arrowSize: 7.5,
            relationshipWidth: 1.5,
            nodeRadius: 23,
            zoomScale: [0.1, 10],
            colors: {},
            icons: {},
            nodeCaption: true,
            relationshipCaption: true,
            nodeDistance: 3.9, // Multiplier for nodeRadius
            chargeStrength: -180,
            chargeDistanceMax: 500,
            chargeDistanceMin: 3.5, // Multiplier for nodeRadius
            velocityDecay: 0.8,
            alphaDecay: 0.01,
            alphaTarget: 1,
            collisionIterations: 3,
            collisionStrength: 1,
            captionFontSize: 7.5,
            nodeCaptionFontSize: 9.5,
            nodeCaptionOffset: 10,
            ...options
        };

        this.selector = selector;
        this.data = { nodes: [], relationships: [] };
        this.nodes = [];
        this.relationships = [];
        this.classes2colors = {};
        this.numClasses = 0;

        // D3 selections
        this.svg = null;
        this.g = null;
        this.svgNodes = null;
        this.svgRelationships = null;
        this.simulation = null;

        // D3 element selections
        this.node = null;
        this.relationship = null;
        this.relationshipOutline = null;
        this.relationshipOverlay = null;
        this.relationshipText = null;

        this.init();
    }

    /**
     * Initialize the graph
     */
    init() {
        const container = d3.select(this.selector);
        if (container.empty()) {
            throw new Error(`Container not found: ${this.selector}`);
        }

        this.appendGraph(container);
        this.simulation = this.initSimulation();
    }

    /**
     * Draw the graph with new data
     * @param {Object} data - Graph data with nodes and relationships
     */
    drawGraph(data) {
        if (!data || !data.nodes || !data.relationships) {
            console.warn('Invalid data provided to drawGraph');
            return;
        }

        this.data = data;
        this.mapData(data);
        this.updateContent(data.nodes, data.relationships);
    }

    /**
     * Update graph content
     */
    updateContent(nodes, relationships) {
        this.updateRelationships(relationships);
        this.updateNodes(nodes);

        this.simulation.nodes(this.nodes);
        this.simulation.force("link").links(this.relationships);
    }

    /**
     * Map relationship data with source and target references
     */
    mapData(data) {
        data.relationships.forEach(r => {
            const source = this.findNode(r.startNode, data.nodes);
            const target = this.findNode(r.endNode, data.nodes);

            if (!source || !target) {
                console.warn(`Invalid relationship: source or target not found`, r);
                return;
            }

            r.source = source;
            r.target = target;
            r.naturalAngle = 0;
            r.isLoop = () => r.source === r.target;
        });
    }

    /**
     * Find node by ID
     */
    findNode(id, nodes) {
        return nodes.find(node => node.id === id);
    }

    /**
     * Append SVG graph container
     */
    appendGraph(container) {
        this.svg = container
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("class", "directed-graph")
            .call(this.zoom())
            .on("dblclick.zoom", null);

        this.g = this.svg.append("g")
            .attr("width", "100%")
            .attr("height", "100%");

        this.svgRelationships = this.g.append("g")
            .attr("class", "relationships");

        this.svgNodes = this.g.append("g")
            .attr("class", "nodes");
    }

    /**
     * Initialize D3 force simulation
     */
    initSimulation() {
        const parentElement = this.svg.node().parentElement.parentElement;
        const width = parentElement.clientWidth;
        const height = parentElement.clientHeight;

        return d3
            .forceSimulation()
            .velocityDecay(this.config.velocityDecay)
            .force("collide", d3
                .forceCollide()
                .radius(() => this.config.nodeRadius * 2)
                .iterations(this.config.collisionIterations)
                .strength(this.config.collisionStrength)
            )
            .force("link", d3
                .forceLink()
                .distance(() => this.config.nodeRadius * this.config.nodeDistance)
                .id(d => d.id)
            )
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("charge", d3
                .forceManyBody()
                .strength(this.config.chargeStrength)
                .distanceMax(this.config.chargeDistanceMax)
                .distanceMin(this.config.nodeRadius * this.config.chargeDistanceMin)
            )
            .alphaDecay(this.config.alphaDecay)
            .alphaTarget(this.config.alphaTarget)
            .on("tick", () => this.tick());
    }

    /**
     * Create zoom behavior
     */
    zoom() {
        return d3.zoom()
            .scaleExtent(this.config.zoomScale)
            .on("zoom", (event) => {
                this.g.attr("transform", event.transform);
            });
    }

    /**
     * Update relationships
     */
    updateRelationships(relationships) {
        this.relationships = relationships;

        this.relationship = this.svgRelationships
            .selectAll(".relationship")
            .data(this.relationships, d => d.id);

        this.relationship.exit().remove();

        const relationshipEnter = this.relationship
            .enter()
            .append("g")
            .attr("class", "relationship");

        this.relationship = relationshipEnter.merge(this.relationship);

        this.appendOutlineToRelationship(this.relationship);
        this.appendOverlayToRelationship(this.relationship);
        this.appendTextToRelationship(this.relationship);
    }

    /**
     * Append outline to relationship
     */
    appendOutlineToRelationship(selection) {
        const outline = selection.selectAll(".outline")
            .data(d => [d]);

        outline.exit().remove();

        const outlineEnter = outline
            .enter()
            .append("path")
            .attr("class", "outline")
            .attr("fill", "#9a9a9a")
            .attr("stroke", "#a5abb6");

        this.relationshipOutline = outlineEnter.merge(outline);
    }

    /**
     * Append overlay to relationship
     */
    appendOverlayToRelationship(selection) {
        const overlay = selection.selectAll(".overlay")
            .data(d => [d]);

        overlay.exit().remove();

        const overlayEnter = overlay
            .enter()
            .append("path")
            .attr("class", "overlay");

        this.relationshipOverlay = overlayEnter.merge(overlay);
    }

    /**
     * Append text to relationship
     */
    appendTextToRelationship(selection) {
        const text = selection.selectAll(".text")
            .data(d => [d]);

        text.exit().remove();

        const textEnter = text
            .enter()
            .append("text")
            .attr("class", "text")
            .attr("fill", "#000000")
            .attr("font-size", `${this.config.captionFontSize}px`)
            .attr("font-weight", 600)
            .attr("text-anchor", "middle");

        this.relationshipText = textEnter.merge(text)
            .text(d => this.config.relationshipCaption ? d.type : "");
    }

    /**
     * Update nodes
     */
    updateNodes(nodes) {
        this.nodes = nodes;

        this.node = this.svgNodes
            .selectAll(".node")
            .data(this.nodes, d => d.id);

        this.node.exit().remove();

        const nodeEnter = this.node
            .enter()
            .append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", (event, d) => this.dragStarted(d, event))
                .on("drag", (event, d) => this.dragged(d, event))
                .on("end", (event, d) => this.dragEnded(d, event))
            );

        this.node = nodeEnter.merge(this.node);

        this.appendOutlineToNode(this.node);
        this.appendRingToNode(this.node);
        this.appendTextToNode(this.node);
        this.appendIconToNode(this.node);
    }

    /**
     * Append outline circle to node
     */
    appendOutlineToNode(selection) {
        const outline = selection.selectAll(".noutline")
            .data(d => [d]);

        outline.exit().remove();

        const outlineEnter = outline
            .enter()
            .append("circle")
            .attr("class", "noutline")
            .attr("r", this.config.nodeRadius);

        outlineEnter.merge(outline)
            .style("fill", d => this.class2color(d.labels[0]))
            .style("stroke", d => this.class2darkenColor(d.labels[0]));
    }

    /**
     * Append ring to node
     */
    appendRingToNode(selection) {
        const ring = selection.selectAll(".ring")
            .data(d => [d]);

        ring.exit().remove();

        ring.enter()
            .append("circle")
            .attr("class", "ring")
            .attr("r", this.config.nodeRadius)
            .merge(ring);
    }

    /**
     * Append text label to node
     */
    appendTextToNode(selection) {
        const text = selection.selectAll(".nodetext")
            .data(d => [d]);

        text.exit().remove();

        const textEnter = text
            .enter()
            .append("text")
            .attr("class", "nodetext")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .attr("y", this.config.nodeRadius + this.config.nodeCaptionFontSize + this.config.nodeCaptionOffset);

        textEnter.merge(text)
            .html(d => this.config.nodeCaption ? d.labels[0] : "");
    }

    /**
     * Append icon to node
     */
    appendIconToNode(selection) {
        const square = this.getInscribedSquareCoordinates(this.config.nodeRadius);
        const icon = selection.selectAll(".icon")
            .data(d => [d]);

        icon.exit().remove();

        const iconEnter = icon.enter().append("svg");

        iconEnter.merge(icon)
            .attr("class", d => `icon ${this.class2icon(d.labels[0]) || ""}`)
            .attr("height", square.height / 1.5)
            .attr("x", square.x / 1.5)
            .attr("y", square.y / 1.5)
            .attr("width", square.width / 1.5);
    }

    /**
     * Drag event handlers
     */
    dragStarted(d, event) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged(d, event) {
        d.fx = event.x;
        d.fy = event.y;
    }

    dragEnded(d, event) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    /**
     * Simulation tick handler
     */
    tick() {
        this.tickNodes();
        this.tickRelationships();
    }

    tickNodes() {
        if (this.node) {
            this.node.attr("transform", d => `translate(${d.x}, ${d.y})`);
        }
    }

    tickRelationships() {
        if (!this.relationship) return;

        this.layoutRelationships();

        this.relationship.attr("transform", d =>
            `translate(${d.source.x} ${d.source.y}) rotate(${d.naturalAngle + 180})`
        );

        this.tickRelationshipsOutlines();
        this.tickRelationshipsOverlays();
        this.tickRelationshipsTexts();
    }

    tickRelationshipsOutlines() {
        this.relationship.each((relationship, i, nodes) => {
            const rel = d3.select(nodes[i]);
            const outline = rel.select(".outline");
            const text = rel.select(".text");
            const textPadding = 8;
            const textLength = text.node().getComputedTextLength();
            let captionLength = textLength > 0 ? textLength + textPadding : 0;

            if (relationship.arrow) {
                if (captionLength > relationship.arrow.shaftLength) {
                    captionLength = relationship.arrow.shaftLength;
                }
                outline.attr("d", relationship.arrow.outline(captionLength));
            }
        });
    }

    tickRelationshipsOverlays() {
        this.relationshipOverlay.attr("d", d =>
            d.arrow ? d.arrow.overlay(this.config.arrowSize) : ""
        );
    }

    tickRelationshipsTexts() {
        this.relationshipText
            .attr("transform", rel => {
                if (!rel.arrow) return null;
                if (rel.naturalAngle < 90 || rel.naturalAngle > 270) {
                    return `rotate(180 ${rel.arrow.midShaftPoint.x} ${rel.arrow.midShaftPoint.y})`;
                }
                return null;
            })
            .attr("x", rel => rel.arrow ? rel.arrow.midShaftPoint.x : 0)
            .attr("y", rel => rel.arrow ? rel.arrow.midShaftPoint.y + this.config.captionFontSize / 2 - 1 : 0);
    }

    /**
     * Layout relationships with arrows
     */
    layoutRelationships() {
        const nodePairs = this.groupedRelationships();
        this.computeGeometryForNonLoopArrows(nodePairs);
        this.distributeAnglesForLoopArrows(nodePairs);

        nodePairs.forEach(nodePair => {
            const middleIndex = (nodePair.relationships.length - 1) / 2;
            const defaultDeflection = 30;
            const maxTotalDeflection = 150;
            const steps = nodePair.relationships.length - 1;
            const totalDeflection = defaultDeflection * steps;
            const deflectionStep = totalDeflection > maxTotalDeflection
                ? maxTotalDeflection / steps
                : defaultDeflection;

            nodePair.relationships.forEach((rel, i) => {
                const nodeRadius = this.config.nodeRadius;
                const shaftWidth = this.config.relationshipWidth;
                const headWidth = this.config.arrowSize;
                const headHeight = headWidth;

                if (nodePair.isLoop()) {
                    rel.arrow = new LoopArrow(
                        nodeRadius, 40, defaultDeflection, shaftWidth,
                        headWidth, headHeight, rel.captionHeight || 11
                    );
                } else if (i === middleIndex) {
                    rel.arrow = new StraightArrow(
                        nodeRadius, nodeRadius, rel.centreDistance,
                        shaftWidth, headWidth, headHeight,
                        rel.captionLayout || "external"
                    );
                } else {
                    let deflection = deflectionStep * (i - middleIndex);
                    if (nodePair.nodeA !== rel.source) {
                        deflection *= -1;
                    }
                    rel.arrow = new ArcArrow(
                        nodeRadius, nodeRadius, rel.centreDistance, deflection,
                        shaftWidth, headWidth, headHeight,
                        rel.captionLayout || "external"
                    );
                }
            });
        });
    }

    /**
     * Group relationships by node pairs
     */
    groupedRelationships() {
        const groups = {};

        this.data.relationships.forEach(rel => {
            const pair = new NodePair(rel.source, rel.target);
            const key = pair.toString();

            if (!groups[key]) {
                groups[key] = pair;
            }
            groups[key].relationships.push(rel);
        });

        return Object.values(groups);
    }

    /**
     * Compute geometry for non-loop arrows
     */
    computeGeometryForNonLoopArrows(nodePairs) {
        nodePairs.forEach(nodePair => {
            if (nodePair.isLoop()) return;

            const dx = nodePair.nodeA.x - nodePair.nodeB.x;
            const dy = nodePair.nodeA.y - nodePair.nodeB.y;
            const angle = ((Math.atan2(dy, dx) / Math.PI) * 180 + 360) % 360;
            const centreDistance = Math.sqrt(dx * dx + dy * dy);

            nodePair.relationships.forEach(rel => {
                rel.naturalAngle = rel.target === nodePair.nodeA
                    ? (angle + 180) % 360
                    : angle;
                rel.centreDistance = centreDistance;
            });
        });
    }

    /**
     * Distribute angles for loop arrows
     */
    distributeAnglesForLoopArrows(nodePairs) {
        nodePairs.forEach(nodePair => {
            if (!nodePair.isLoop()) return;

            const node = nodePair.nodeA;
            let angles = [];

            this.data.relationships.forEach(rel => {
                if (rel.isLoop()) return;

                if (rel.source === node) {
                    angles.push(rel.naturalAngle);
                }
                if (rel.target === node) {
                    angles.push((rel.naturalAngle + 180) % 360);
                }
            });

            angles = angles.sort((a, b) => a - b);

            if (angles.length > 0) {
                let biggestGap = { start: 0, end: 0 };

                angles.forEach((angle, i) => {
                    const start = angle;
                    const end = i === angles.length - 1 ? angles[0] + 360 : angles[i + 1];

                    if (end - start > biggestGap.end - biggestGap.start) {
                        biggestGap = { start, end };
                    }
                });

                const separation = (biggestGap.end - biggestGap.start) / (nodePair.relationships.length + 1);

                nodePair.relationships.forEach((rel, i) => {
                    rel.naturalAngle = (biggestGap.start + (i + 1) * separation - 90) % 360;
                });
            } else {
                const separation = 360 / nodePair.relationships.length;
                nodePair.relationships.forEach((rel, i) => {
                    rel.naturalAngle = i * separation;
                });
            }
        });
    }

    /**
     * Utility methods
     */
    class2icon(cls) {
        return this.config.icons[cls];
    }

    class2color(cls) {
        let color = this.config.colors[cls] || this.classes2colors[cls];

        if (!color) {
            const colors = this.randomColors();
            color = colors[this.numClasses % colors.length];
            this.classes2colors[cls] = color;
            this.numClasses++;
        }

        return color;
    }

    class2darkenColor(cls) {
        return d3.rgb(this.class2color(cls)).darker(1);
    }

    randomColors() {
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

    getInscribedSquareCoordinates(radius) {
        const hypotenuse = (radius * radius) / 2;
        const leg = Math.sqrt(hypotenuse);
        return { y: -leg, x: -leg, width: leg * 2, height: leg * 2 };
    }

    /**
     * Public API methods
     */
    destroy() {
        if (this.simulation) {
            this.simulation.stop();
        }
        if (this.svg) {
            this.svg.remove();
        }
    }

    restart() {
        if (this.simulation) {
            this.simulation.alpha(1).restart();
        }
    }

    stop() {
        if (this.simulation) {
            this.simulation.stop();
        }
    }
}

/**
 * Helper classes for arrow geometry
 */
class NodePair {
    constructor(node1, node2) {
        if (node1.id < node2.id) {
            this.nodeA = node1;
            this.nodeB = node2;
        } else {
            this.nodeA = node2;
            this.nodeB = node1;
        }
        this.relationships = [];
    }

    isLoop() {
        return this.nodeA === this.nodeB;
    }

    toString() {
        return `${this.nodeA.id}:${this.nodeB.id}`;
    }
}

class StraightArrow {
    constructor(startRadius, endRadius, centreDistance, shaftWidth, headWidth, headHeight, captionLayout) {
        this.length = centreDistance - (startRadius + endRadius);
        this.shaftLength = this.length - headHeight;
        this.deflection = 0;

        const startArrow = startRadius;
        const endShaft = startArrow + this.shaftLength;
        const endArrow = startArrow + this.length;
        const shaftRadius = shaftWidth / 2;
        const headRadius = headWidth / 2;

        this.midShaftPoint = {
            x: startArrow + this.shaftLength / 2,
            y: 0
        };

        this.outline = (shortCaptionLength) => {
            if (captionLayout === "external") {
                const startBreak = startArrow + (this.shaftLength - shortCaptionLength) / 2;
                const endBreak = endShaft - (this.shaftLength - shortCaptionLength) / 2;

                return [
                    "M", startArrow, shaftRadius,
                    "L", startBreak, shaftRadius,
                    "L", startBreak, -shaftRadius,
                    "L", startArrow, -shaftRadius,
                    "Z",
                    "M", endBreak, shaftRadius,
                    "L", endShaft, shaftRadius,
                    "L", endShaft, headRadius,
                    "L", endArrow, 0,
                    "L", endShaft, -headRadius,
                    "L", endShaft, -shaftRadius,
                    "L", endBreak, -shaftRadius,
                    "Z"
                ].join(" ");
            }

            return [
                "M", startArrow, shaftRadius,
                "L", endShaft, shaftRadius,
                "L", endShaft, headRadius,
                "L", endArrow, 0,
                "L", endShaft, -headRadius,
                "L", endShaft, -shaftRadius,
                "L", startArrow, -shaftRadius,
                "Z"
            ].join(" ");
        };

        this.overlay = (minWidth) => {
            const radius = Math.max(minWidth / 2, shaftRadius);
            return [
                "M", startArrow, radius,
                "L", endArrow, radius,
                "L", endArrow, -radius,
                "L", startArrow, -radius,
                "Z"
            ].join(" ");
        };
    }
}

class ArcArrow {
    constructor(startRadius, endRadius, endCentre, deflection, arrowWidth, headWidth, headLength, captionLayout) {
        this.deflection = deflection;

        const square = l => l * l;
        const deflectionRadians = (this.deflection * Math.PI) / 180;

        const startAttach = {
            x: Math.cos(deflectionRadians) * startRadius,
            y: Math.sin(deflectionRadians) * startRadius
        };

        const radiusRatio = startRadius / (endRadius + headLength);
        const homotheticCenter = (-endCentre * radiusRatio) / (1 - radiusRatio);

        const intersectWithOtherCircle = (fixedPoint, radius, xCenter, polarity) => {
            const gradient = fixedPoint.y / (fixedPoint.x - homotheticCenter);
            const hc = fixedPoint.y - gradient * fixedPoint.x;
            const A = 1 + square(gradient);
            const B = 2 * (gradient * hc - xCenter);
            const C = square(hc) + square(xCenter) - square(radius);

            const intersection = {
                x: (-B + polarity * Math.sqrt(square(B) - 4 * A * C)) / (2 * A)
            };
            intersection.y = (intersection.x - homotheticCenter) * gradient;
            return intersection;
        };

        const endAttach = intersectWithOtherCircle(startAttach, endRadius + headLength, endCentre, -1);

        const g1 = -startAttach.x / startAttach.y;
        const c1 = startAttach.y + square(startAttach.x) / startAttach.y;
        const g2 = -(endAttach.x - endCentre) / endAttach.y;
        const c2 = endAttach.y + ((endAttach.x - endCentre) * endAttach.x) / endAttach.y;

        const cx = (c1 - c2) / (g2 - g1);
        const cy = g1 * cx + c1;

        const arcRadius = Math.sqrt(square(cx - startAttach.x) + square(cy - startAttach.y));
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
            y: cy - arcRadius * Math.cos(midShaftAngle)
        };

        const coord = point => `${point.x},${point.y}`;
        const shaftRadius = arrowWidth / 2;
        const headRadius = headWidth / 2;
        const positiveSweep = startAttach.y > 0 ? 0 : 1;
        const negativeSweep = startAttach.y < 0 ? 0 : 1;

        const startTangent = dr => {
            const dx = (dr < 0 ? 1 : -1) * Math.sqrt(square(dr) / (1 + square(g1)));
            const dy = g1 * dx;
            return { x: startAttach.x + dx, y: startAttach.y + dy };
        };

        const endTangent = dr => {
            const dx = (dr < 0 ? -1 : 1) * Math.sqrt(square(dr) / (1 + square(g2)));
            const dy = g2 * dx;
            return { x: endAttach.x + dx, y: endAttach.y + dy };
        };

        const angleTangent = (angle, dr) => ({
            x: cx + (arcRadius + dr) * Math.sin(angle),
            y: cy - (arcRadius + dr) * Math.cos(angle)
        });

        const endNormal = dc => {
            const dx = (dc < 0 ? -1 : 1) * Math.sqrt(square(dc) / (1 + square(1 / g2)));
            const dy = dx / g2;
            return { x: endAttach.x + dx, y: endAttach.y - dy };
        };

        const endOverlayCorner = (dr, dc) => {
            const shoulder = endTangent(dr);
            const arrowTip = endNormal(dc);
            return {
                x: shoulder.x + arrowTip.x - endAttach.x,
                y: shoulder.y + arrowTip.y - endAttach.y
            };
        };

        this.outline = (shortCaptionLength) => {
            if (startAngle > endAngle) {
                return [
                    "M", coord(endTangent(-headRadius)),
                    "L", coord(endNormal(headLength)),
                    "L", coord(endTangent(headRadius)),
                    "Z"
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
                    "M", coord(startTangent(shaftRadius)),
                    "L", coord(startTangent(-shaftRadius)),
                    "A", arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, positiveSweep,
                    coord(angleTangent(startBreak, -shaftRadius)),
                    "L", coord(angleTangent(startBreak, shaftRadius)),
                    "A", arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, negativeSweep,
                    coord(startTangent(shaftRadius)),
                    "Z",
                    "M", coord(angleTangent(endBreak, shaftRadius)),
                    "L", coord(angleTangent(endBreak, -shaftRadius)),
                    "A", arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, positiveSweep,
                    coord(endTangent(-shaftRadius)),
                    "L", coord(endTangent(-headRadius)),
                    "L", coord(endNormal(headLength)),
                    "L", coord(endTangent(headRadius)),
                    "L", coord(endTangent(shaftRadius)),
                    "A", arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, negativeSweep,
                    coord(angleTangent(endBreak, shaftRadius))
                ].join(" ");
            }

            return [
                "M", coord(startTangent(shaftRadius)),
                "L", coord(startTangent(-shaftRadius)),
                "A", arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, positiveSweep,
                coord(endTangent(-shaftRadius)),
                "L", coord(endTangent(-headRadius)),
                "L", coord(endNormal(headLength)),
                "L", coord(endTangent(headRadius)),
                "L", coord(endTangent(shaftRadius)),
                "A", arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, negativeSweep,
                coord(startTangent(shaftRadius))
            ].join(" ");
        };

        this.overlay = (minWidth) => {
            const radius = Math.max(minWidth / 2, shaftRadius);
            return [
                "M", coord(startTangent(radius)),
                "L", coord(startTangent(-radius)),
                "A", arcRadius - radius, arcRadius - radius, 0, 0, positiveSweep,
                coord(endTangent(-radius)),
                "L", coord(endOverlayCorner(-radius, headLength)),
                "L", coord(endOverlayCorner(radius, headLength)),
                "L", coord(endTangent(radius)),
                "A", arcRadius + radius, arcRadius + radius, 0, 0, negativeSweep,
                coord(startTangent(radius))
            ].join(" ");
        };
    }
}

class LoopArrow {
    constructor(nodeRadius, straightLength, spreadDegrees, shaftWidth, headWidth, headLength, captionHeight) {
        const spread = (spreadDegrees * Math.PI) / 180;
        const r1 = nodeRadius;
        const r2 = nodeRadius + headLength;
        const r3 = nodeRadius + straightLength;
        const loopRadius = r3 * Math.tan(spread / 2);
        const shaftRadius = shaftWidth / 2;

        this.shaftLength = loopRadius * 3 + shaftWidth;
        this.deflection = 0;

        const normalPoint = (sweep, radius, displacement) => {
            const localLoopRadius = radius * Math.tan(spread / 2);
            const cy = radius / Math.cos(spread / 2);
            return {
                x: (localLoopRadius + displacement) * Math.sin(sweep),
                y: cy + (localLoopRadius + displacement) * Math.cos(sweep)
            };
        };

        this.midShaftPoint = normalPoint(0, r3, shaftRadius + captionHeight / 2 + 2);

        const startPoint = (radius, displacement) =>
            normalPoint((Math.PI + spread) / 2, radius, displacement);

        const endPoint = (radius, displacement) =>
            normalPoint(-(Math.PI + spread) / 2, radius, displacement);

        const coord = point => `${point.x} ${point.y}`;

        this.outline = () => {
            const inner = loopRadius - shaftRadius;
            const outer = loopRadius + shaftRadius;

            return [
                "M", coord(startPoint(r1, shaftRadius)),
                "L", coord(startPoint(r3, shaftRadius)),
                "A", outer, outer, 0, 1, 1, coord(endPoint(r3, shaftRadius)),
                "L", coord(endPoint(r2, shaftRadius)),
                "L", coord(endPoint(r2, -headWidth / 2)),
                "L", coord(endPoint(r1, 0)),
                "L", coord(endPoint(r2, headWidth / 2)),
                "L", coord(endPoint(r2, -shaftRadius)),
                "L", coord(endPoint(r3, -shaftRadius)),
                "A", inner, inner, 0, 1, 0, coord(startPoint(r3, -shaftRadius)),
                "L", coord(startPoint(r1, -shaftRadius)),
                "Z"
            ].join(" ");
        };

        this.overlay = (minWidth) => {
            const displacement = Math.max(minWidth / 2, shaftRadius);
            const inner = loopRadius - displacement;
            const outer = loopRadius + displacement;

            return [
                "M", coord(startPoint(r1, displacement)),
                "L", coord(startPoint(r3, displacement)),
                "A", outer, outer, 0, 1, 1, coord(endPoint(r3, displacement)),
                "L", coord(endPoint(r2, displacement)),
                "L", coord(endPoint(r2, -displacement)),
                "L", coord(endPoint(r3, -displacement)),
                "A", inner, inner, 0, 1, 0, coord(startPoint(r3, -displacement)),
                "L", coord(startPoint(r1, -displacement)),
                "Z"
            ].join(" ");
        };
    }
}