import  DirectedGraph from "./scripts/directedgraph";
import "./style.css";

let b = new DirectedGraph(".content", {
  arrowSize: 7.5,
  relationshipWidth: 1.5,
  nodeRadius: 23,
  nodeCaption: true,
  relationshipCaption: true,
  icons: {Tweet: "fab fa-twitter", User: "fas fa-street-view", Hashtag: "fas fa-hashtag" },
  colors: {Tweet: "#00acee", User: "#54ca74",Hashtag: "#796EFF"}
});

b.drawGraph({
  nodes: [
    {
      id: "1",
      labels: ["User"],
      properties: {
        
      },
    },
    {
      id: "2",
      labels: ["Tweet"],
      properties: {

      },
    },
    {
      id: "3",
      labels: ["Hashtag"],
      properties: {
      },
    },
    {
      id: "4",
      labels: ["Tweet"],
      properties: {
      },
    },
    {
      id: "5",
      labels: ["Tweet"],
      properties: {
      },
    },
    {
      id: "6",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "7",
      labels: ["Tweet"],
      properties: {
        
      },
    },
    {
      id: "8",
      labels: ["Hashtag"],
      properties: {
      },
    },
    {
      id: "9",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "10",
      labels: ["Hashtag"],
      properties: {
      },
    },
    {
      id: "11",
      labels: ["Tweet"],
      properties: {
      },
    },
    {
      id: "12",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "13",
      labels: ["Tweet"],
      properties: {
      },
    },
    {
      id: "14",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "15",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "16",
      labels: ["Tweet"],
      properties: {},
    },
    {
      id: "17",
      labels: ["Tweet"],
      properties: {
      },
    },
    {
      id: "18",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "19",
      labels: ["Tweet"],
      properties: {
      },
    },
    {
      id: "20",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "21",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "22",
      labels: ["Tweet"],
      properties: {
      },
    },
    {
      id: "23",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "24",
      labels: ["Tweet"],
      properties: {},
    },
    {
      id: "25",
      labels: ["Tweet"],
      properties: {
      },
    },
    {
      id: "26",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "27",
      labels: ["User"],
      properties: {
      },
    },
    {
      id: "28",
      labels: ["User"],
      properties: {
      },
    },
  ],
  relationships: [
    {
      id: "1",
      type: "POSTED",
      startNode: "1",
      endNode: "2",
      properties: {
        from: 1473581532586,
      },
    },
    {
      id: "2",
      type: "HAS_TAG",
      startNode: "2",
      endNode: "3",
      properties: {
        from: 1473581532586,
      },
    },
    {
      id: "3",
      type: "HAS_TAG",
      startNode: "4",
      endNode: "3",
      properties: {
        from: 1473581532586,
      },
    },
    {
      id: "4",
      type: "POSTED",
      startNode: "28",
      endNode: "4",
      properties: {
        from: 1473581532586,
      },
    },
    {
      id: "5",
      type: "POSTED",
      startNode: "21",
      endNode: "16",
      properties: {
        from: 1473581532586,
      },
    },
    {
      id: "6",
      type: "HAS_TAG",
      startNode: "16",
      endNode: "3",
      properties: {
        from: 1473581532586,
      },
    },
    {
      id: "7",
      type: "POSTED",
      startNode: "18",
      endNode: "13",
      properties: {
        from: 1470002400000,
      },
    },
    {
      id: "8",
      type: "HAS_TAG",
      startNode: "13",
      endNode: "3",
      properties: {},
    },
    {
      id: "9",
      type: "POSTED",
      startNode: "9",
      endNode: "11",
      properties: {},
    },
    {
      id: "10",
      type: "HAS_TAG",
      startNode: "11",
      endNode: "3",
      properties: {},
    },
    {
      id: "11",
      type: "POSTED",
      startNode: "12",
      endNode: "7",
      properties: {},
    },
    {
      id: "12",
      type: "HAS_TAG",
      startNode: "7",
      endNode: "3",
      properties: {},
    },
    {
      id: "13",
      type: "POSTED",
      startNode: "6",
      endNode: "5",
      properties: {},
    },
    {
      id: "14",
      type: "HAS_TAG",
      startNode: "5",
      endNode: "3",
      properties: {},
    },
    {
      id: "15",
      type: "HAS_TAG",
      startNode: "25",
      endNode: "8",
      properties: {},
    },
    {
      id: "16",
      type: "POSTED",
      startNode: "20",
      endNode: "25",
      properties: {},
    },
    {
      id: "17",
      type: "FOLLOWS",
      startNode: "23",
      endNode: "14",
      properties: {},
    },
    {
      id: "18",
      type: "HAS_TAG",
      startNode: "7",
      endNode: "8",
      properties: {},
    },
    {
      id: "19",
      type: "POSTED",
      startNode: "14",
      endNode: "17",
      properties: {},
    },
    {
      id: "20",
      type: "HAS_TAG",
      startNode: "17",
      endNode: "8",
      properties: {},
    },
    {
      id: "21",
      type: "POSTED",
      startNode: "15",
      endNode: "19",
      properties: {},
    },
    {
      id: "22",
      type: "POSTED",
      startNode: "19",
      endNode: "8",
      properties: {},
    },
    {
      id: "23",
      type: "POSTED",
      startNode: "26",
      endNode: "22",
      properties: {},
    },
    {
      id: "24",
      type: "HAS_TAG",
      startNode: "22",
      endNode: "8",
      properties: {},
    },
    {
      id: "25",
      type: "POSTED",
      startNode: "27",
      endNode: "24",
      properties: {},
    },
    {
      id: "26",
      type: "HAS_TAG",
      startNode: "24",
      endNode: "8",
      properties: {},
    },
    {
      id: "27",
      type: "HAS_TAG",
      startNode: "25",
      endNode: "10",
      properties: {},
    },
    {
      id: "28",
      type: "LIKED",
      startNode: "23",
      endNode: "17",
      properties: {},
    },
    {
      id: "29",
      type: "UPDATED",
      startNode: "26",
      endNode: "22",
      properties: {},
    },
    {
      id: "30",
      type: "UPDATED",
      startNode: "18",
      endNode: "13",
      properties: {},
    },
    {
      id: "31",
      type: "LIKED",
      startNode: "18",
      endNode: "13",
      properties: {},
    },
    {
      id: "32",
      type: "DISABLES",
      startNode: "9",
      endNode: "9",
      properties: {},
    },
  ],
});
