import React, {
	useEffect,
	useState,
	useMemo,
	useCallback,
	useRef,
} from "react";
import { ForceGraph2D } from "react-force-graph";
import { nodeFillColor, riskOutline } from "./graphVizualization/nodeStyling";
import {
	calcLinkParticleWidth,
	calcLinkColor,
} from "./graphVizualization/linkCalcs";

// import { calcLinkColor } from "./utils/graphColoring/coloring.tsx";
// import { mapLabel } from "./utils/graph/labels.tsx";
// import { nodeRisk } from "./utils/calculations/node/nodeCalcs.tsx";
// import {
//   calcLinkDirectionalArrowRelPos,
//   calcLinkParticleWidth,
// } from "./utils/calculations/link/linkCalcs.tsx";

import { updateGraph } from "./graphUpdates/updateGraph";
import { Link, VizNode, VizGraph } from "../../types/CustomTypes";
import {
	GraphState,
	GraphDisplayState,
	GraphDisplayProps,
} from "../../types/GraphDisplayTypes";

type HoverState = VizNode | null;
type ClickedNodeState = VizNode | null;

const NODE_R = 8;

const defaultGraphDisplayState = (
	lensName: string | null
): GraphDisplayState => {
	return {
		graphData: { index: {}, nodes: [], links: [] },
		curLensName: lensName,
	};
};

const defaultHoverState = (): HoverState => {
	return null;
};
const defaultClickedState = (): ClickedNodeState => {
	return null;
};

const GraphDisplay = ({ lensName, setCurNode }: GraphDisplayProps) => {
	const fgRef: any = useRef(); // fix graph to canvas
	const [state, setState] = React.useState(defaultGraphDisplayState(lensName));
	useEffect(() => {
		const interval = setInterval(async () => {
			if (lensName) {
				await updateGraph(lensName, state as GraphState, setState); // state is safe cast, check that lens name is not null
			}
		}, 5000);
		return () => {
			clearInterval(interval);
		};
	}, [lensName, state, setState]);

	const data = useMemo(() => {
		const graphData = state.graphData;
		console.log("graphData", graphData);
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
			node.fx = node.x;
			node.fy = node.y;
			// console.log("FX", node.fx, node.x)

			ctx.beginPath(); // add ring to highlight hovered & neighbor nodes
			ctx.arc(node.x, node.y, NODE_R * 1.4, 0, 2 * Math.PI, false);
			ctx.fillStyle = node === hoverNode ? "red" : riskOutline(node.riskScore); // hovered node || risk score outline
			ctx.fill();

			// Node color
			ctx.beginPath();
			ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false); // risk
			ctx.fillStyle =
				node === clickedNode ? "magenta" : nodeFillColor(node.dgraph_type[0]);
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
			ref={fgRef}
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
			linkColor={(link) =>
				highlightLinks.has(link)
					? "aliceblue"
					: calcLinkColor(link as Link, data as VizGraph)
			}
			linkWidth={(link) => (highlightLinks.has(link) ? 10 : 7)}
			linkDirectionalParticleColor={(link) => "red"}
			linkDirectionalArrowLength={10}
			linkDirectionalArrowRelPos={1}
			linkDirectionalParticles={1}
			linkDirectionalParticleWidth={(link) =>
				highlightLinks.has(link)
					? calcLinkParticleWidth(link as Link, data as VizGraph) + 2
					: calcLinkParticleWidth(link as Link, data as VizGraph) + 1
			}
			nodeCanvasObjectMode={(node) =>
				highlightNodes.has(node) ? "before" : "after"
			}
			nodeCanvasObject={nodeStyling}
			cooldownTicks={100}
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
