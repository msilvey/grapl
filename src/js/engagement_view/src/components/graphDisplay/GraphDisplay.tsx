// NOTE: Not using ts-check in this filet to support plugins. We won't always have the same.
// type because we don't know what the data looks like. To avoid littering the codebase ":any", we're using no-check

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { ForceGraph2D } from "react-force-graph";
import { retrieveGraph } from "../../services/graphQLRequests/retrieveGraphReq";
import { nodeFillColor, riskOutline } from "./graphVizualization/nodeStyling";

// import { calcLinkColor } from "./utils/graphColoring/coloring.tsx";
// import { mapLabel } from "./utils/graph/labels.tsx";
// import { nodeRisk } from "./utils/calculations/node/nodeCalcs.tsx";
// import {
//   calcLinkDirectionalArrowRelPos,
//   calcLinkParticleWidth,
// } from "./utils/calculations/link/linkCalcs.tsx";
import { mergeGraphs } from "./graphLayout/mergeGraphs";
import { vizGraphFromLensScope } from "./graphLayout/vizGraphFromLensScope";
import { Link, NodeProperties, VizNode } from "../../types/CustomTypes";
import {
	GraphState,
	GraphDisplayState,
	GraphDisplayProps,
} from "../../types/GraphDisplayTypes";

export const mapNodeProps = (
	node: NodeProperties,
	f: (propName: string) => void
) => {
	for (const prop in node) {
		const nodeProp = node[prop];

		if (Object.prototype.hasOwnProperty.call(node, prop)) {
			if (Array.isArray(nodeProp)) {
				if (nodeProp.length > 0) {
					if (nodeProp[0].uid === undefined) {
						f(prop);
					}
				}
			} else {
				f(prop);
			}
		}
	}
};

type HoverState = VizNode | null;
type ClickedNodeState = VizNode | null;

const defaultHoverState = (): HoverState => {
	return null;
};
const defaultClickedState = (): ClickedNodeState => {
	return null;
};

const updateGraph = async (
	lensName: string,
	engagementState: GraphState,
	setEngagementState: (engagementState: GraphState) => void
) => {
	if (!lensName) {
		console.log("No lens names");
		return;
	}
  const curLensName = engagementState.curLensName;
  
	await retrieveGraph(lensName)
		.then(async (scope) => {
      // console.log("scope", scope)
      const update = vizGraphFromLensScope(scope);
      // console.log("Update", update)

			const mergeUpdate = mergeGraphs(engagementState.graphData, update);

			if (mergeUpdate !== null) {
				if (curLensName === lensName) {
					setEngagementState({
						...engagementState,
						curLensName: lensName,
						graphData: mergeUpdate,
					});
				} else {
					console.log(
						"Switched lens, updating graph",
						engagementState.curLensName,
						"ln",
						lensName
					);
					setEngagementState({
						...engagementState,
						curLensName: lensName,
						graphData: update,
					});
				}
			}
		})
		.catch((e) => console.error("Failed to retrieveGraph ", e));
};

const NODE_R = 8;

// get gData using GraplData
const defaultGraphDisplayState = (
	lensName: string | null
): GraphDisplayState => {
	return {
		graphData: { index: {}, nodes: [], links: [] },
		curLensName: lensName,
	};
};

const GraphDisplay = ({ lensName, setCurNode }: GraphDisplayProps) => {
	const [state, setState] = React.useState(defaultGraphDisplayState(lensName));

	useEffect(() => {
		const interval = setInterval(async () => {
			if (lensName) {
				// console.debug("updating graph");
				await updateGraph(lensName, state as GraphState, setState); // state is safe cast, check that lens name is not null
			}
		}, 5000);
		// console.debug("setting lensName", lensName);
		return () => {
			clearInterval(interval);
		};
	}, [lensName, state, setState]);

	const data = useMemo(() => {
    const graphData = state.graphData;
    console.log("graphData", graphData)
    // console.log("graphData", graphData)

		// graphData.index = {};
		// graphData.nodes.forEach((node) => (graphData.index[node.uid] = node));
    // graphData.nodes.forEach((node) => (node.neighbors = []));
    //   graphData.nodes.forEach((node) => (node.links = []));

		// // cross-link node objects
		// graphData.links.forEach((link) => {
    //   const a = graphData.index[link.source];
    //   const b = graphData.index[link.target];
    //   console.log("a,b")
		// 	if (a === undefined || b === undefined) {
		// 		console.error("graphData index", a, b);
		// 		return;
		// 	}
		// 	!a.neighbors && (a.neighbors = []);
		// 	!b.neighbors && (b.neighbors = []);
		// 	a.neighbors.push(b);
		// 	b.neighbors.push(a);
		// 	!a.links && (a.links = []);
		// 	!b.links && (b.links = []);
		// 	a.links.push(link);
    //   b.links.push(link);
      
		// });

		return graphData;
	}, [state]);

	const [highlightNodes, setHighlightNodes] = useState(new Set());
	const [highlightLinks, setHighlightLinks] = useState(new Set());
	const [hoverNode, setHoverNode] = useState(defaultHoverState());
	const [clickedNode, setClickedNode] = useState(defaultClickedState());

	const updateHighlight = () => {
		setHighlightNodes(highlightNodes);
		setHighlightLinks(highlightLinks);
	};

	const handleNodeHover = (node: VizNode) => {
		highlightNodes.clear();
		highlightLinks.clear();
		if (node) {
			highlightNodes.add(node);
			node.neighbors?.forEach((neighbor) => highlightNodes.add(neighbor));
			node.links?.forEach((link) => highlightLinks.add(link));
		}
		setHoverNode(node || null);
		updateHighlight();
	};

	const handleLinkHover = (link: Link) => {
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
			ctx.fillStyle = node === hoverNode ? "red" : riskOutline(node.riskScore); // hovered node || risk score outline
			ctx.fill();

			// Node color
			ctx.beginPath();
			ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false); // risk
			ctx.fillStyle = node === clickedNode ? "magenta" :  nodeFillColor(node.dgraph_type[0]);
			ctx.fill();
			ctx.restore();

			// label
			const label = node.nodeLabel;
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
		[hoverNode, clickedNode]
	);

	return (
		<ForceGraph2D
			graphData={data}
			nodeRelSize={NODE_R}
			nodeLabel={"nodeLabel"} // tooltip on hover, actual label is in nodeCanvasObject
			nodeColor={(node) => "rgba(255, 255, 255, .15)"}
			onNodeClick={(_node, ctx) => {
				const node = _node as VizNode;
				node.fx = undefined;
				node.fy = undefined;

        setCurNode(node);
				setHoverNode(node || null);
        setClickedNode(node || null);
			}}
			onNodeDragEnd={(node) => {
				node.fx = node.x;
				node.fy = node.y;
			}}
			linkColor={(link) => (highlightLinks.has(link) ? "aliceblue" : "#c0c0c0")}
			linkWidth={(link) => (highlightLinks.has(link) ? 8 : 3)}
			linkDirectionalParticleColor={(link) => "cyan"}
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
			// onNodeHover={(_node) => {
			// 	if (!_node) {
			// 		return;
			// 	}
			// 	const node = _node as VizNode;
			// 	handleNodeHover(node);
			// }}
			// onLinkHover={(_link) => {
			// 	if (!_link) {
			// 		return;
			// 	}
			// 	const link = _link as Link;
			// 	handleLinkHover(link);
			// }}
		/>
	);
};

export default GraphDisplay; //GraphDispaly
