// @ts-nocheck
// NOTE: Not using ts-check in this filet to support plugins. We won't always have the same.
// type because we don't know what the data looks like. To avoid littering the codebase ":any", we're using no-check

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { ForceGraph2D } from "react-force-graph";
import { retrieveGraph } from "../../services/graphQLRequests/retrieveGraphReq";

// import { calcLinkColor } from "./utils/graphColoring/coloring.tsx";
// import { mapLabel } from "./utils/graph/labels.tsx";
// import { nodeRisk } from "./utils/calculations/node/nodeCalcs.tsx";
// import {
//   calcLinkDirectionalArrowRelPos,
//   calcLinkParticleWidth,
// } from "./utils/calculations/link/linkCalcs.tsx";
import { mergeGraphs } from "./utils/graph/mergeGraphs.tsx";
import { graphQLAdjacencyMatrix } from "./utils/graphQL/graphQLAdjacencyMatrix.tsx";
import { Node, GraphType } from "../../types/CustomTypes.tsx";

type GraphDisplayProps = {
  lensName: string | null;
  setCurNode: (string) => void;
};

type GraphDisplayState = {
  graphData: any;
  curLensName: string | null;
  lensSelected: boolean;
};

type GraphState = {
  curLensName: string;
  graphData: GraphType[];
};

export const mapNodeProps = (node: Node, f: (string) => void) => {
  for (const prop in node) {
    if (Object.prototype.hasOwnProperty.call(node, prop)) {
      if (Array.isArray(node[prop])) {
        if (node[prop].length > 0) {
          if (node[prop][0].uid === undefined) {
            f(prop);
          }
        }
      } else {
        f(prop);
      }
    }
  }
};

const updateGraph = async ( lensName: string, engagementState: GraphState, setEngagementState: (engagementState: GraphState) => void, ) => {
    if (!lensName) {
        console.log('No lens names');
        return;
    }   
    console.log("engagement state,", engagementState)
    const curLensName = engagementState.curLensName
    await retrieveGraph(lensName)
        .then(async (scope) => {
            const update = graphQLAdjacencyMatrix(scope);
            console.debug('update', update);

            const mergeUpdate = mergeGraphs(engagementState.graphData, update);
            
            if (mergeUpdate !== null) {
                if (curLensName === lensName) {
                    setEngagementState({
                        ...engagementState,
                        curLensName: lensName,
                        graphData: mergeUpdate,
                    })
                } else {
                    console.log("Switched lens, updating graph", engagementState.curLensName, 'ln', lensName);
                    setEngagementState({
                        ...engagementState,
                        curLensName: lensName,
                        graphData: update,
                    })
                }
            }
        }
      )
      .catch((e) => console.error("Failed to retrieveGraph ", e))
  }


const NODE_R = 8;

// get gData using GraplData
const defaultGraphDisplayState = (lensName: string): GraphDisplayState => {
  return {
      graphData: {nodes: [], links: []},
      curLensName: lensName,
      intervalMap: {},
  }
}


const GraphDisplay = ({lensName, setCurNode}: defaultGraphDisplayState) => {
  const [state, setState] = React.useState(defaultGraphDisplayState(lensName));

  useEffect(() => {
    const interval = setInterval(async () => {
        if (lensName) {
            console.debug('updating graph');
            await updateGraph(lensName, state, setState);
        }
    }, 1000);
    console.debug('setting lensName', lensName);
    return () => {
        clearInterval(interval);
    };
}, [lensName, state, setState]);

const data = useMemo(() => {
  const graphData = state.graphData;

  graphData.index = {};
  graphData.nodes.forEach(node => graphData.index[node.id] = node);

  // cross-link node objects
  graphData.links.forEach(link => {
    
    console.log("nodes in graph data ", graphData.nodes)
    console.log("hardcoded data", graphData.index[50019])
    console.log("link", link)
    console.log("link.source", link.source)

    // undefined
    const a = graphData.index[link.source];
    const b = graphData.index[link.target];

    console.log("a", a);
    console.log("b", b);

    !a.neighbors && (a.neighbors = []);
    !b.neighbors && (b.neighbors = []);
    
    a.neighbors.push(b);
    b.neighbors.push(a);

    !a.links && (a.links = []);
    !b.links && (b.links = []);
    
    a.links.push(link);
    b.links.push(link);
  });

  return graphData;
});


  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [clickedNode, setClickedNode] = useState(new Set());

  // const hoveredNode = new Set(); 

  const updateHighlight = () => {
    setHighlightNodes(highlightNodes);
    setHighlightLinks(highlightLinks);
  };

  const handleNodeHover = node => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      console.log("current node", node)
      highlightNodes.add(node);
      node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor));
      node.links.forEach((link) => highlightLinks.add(link));
    }
    setHoverNode(node || null);
    updateHighlight();
  };

  const handleLinkHover = link => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (link) {
      highlightLinks.add(link);
      highlightNodes.add(link.source);
      highlightNodes.add(link.target);
    }
    updateHighlight();
  };

  const nodeStyling = useCallback(
    (node, ctx, globalScale) => {
      // add ring to highlight hovered & neighbor nodes
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_R * 1.4, 0, 2 * Math.PI, false);
      ctx.fillStyle = node === hoverNode ? "red" : "purple"; // hovered node || risk score outline
      ctx.fill();

      // Node color
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false); // risk 
      ctx.fillStyle = node === clickedNode ? "magenta" : "darksalmon";
      ctx.fill();
      ctx.restore();

      // label
      const label = node.id;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(
        (n) => n + fontSize * 0.2
      ); 

      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(
        node.x - bckgDimensions[0] / 2,
        node.y - bckgDimensions[1] / 2,
        ...bckgDimensions
      );

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.fillText(label, node.x, node.y);
    },
    [hoverNode,clickedNode] 
  );

  return (
    <ForceGraph2D
      graphData={data}
      nodeRelSize={NODE_R}
      nodeLabel={"id"}
      nodeColor={node => "rgba(255, 255, 255, .15)"}
      onNodeClick={(node, ctx) => {
        node.fx = null;
        node.fy = null;

        setHoverNode(node || null);
        setClickedNode(node || null);
      }}
      onNodeDragEnd={(node) => {
        node.fx = node.x;
        node.fy = node.y;
      }}
      linkColor={(link) => (highlightLinks.has(link) ? "aliceblue" : "#c0c0c0")}
      linkWidth={(link) => (highlightLinks.has(link) ? 8 : 3)}
      linkDirectionalParticleColor={link => "cyan"}
      linkDirectionalArrowLength={8.5}
      linkDirectionalArrowRelPos={1}
      linkDirectionalParticles={3}
      linkDirectionalParticleWidth={(link) =>
        highlightLinks.has(link) ? 9 : 0
      }
      nodeCanvasObjectMode={(node) =>
        highlightNodes.has(node) ? "before" : "after"
      }
      nodeCanvasObject={nodeStyling}
      onNodeHover={handleNodeHover}
      onLinkHover={handleLinkHover}
    />
  );
};

export default GraphDisplay; //GraphDispaly
