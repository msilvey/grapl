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


// import { nodeRisk } from "./utils/calculations/node/nodeCalcs.tsx";
// import {
//   calcLinkDirectionalArrowRelPos,
//   calcLinkParticleWidth,
// } from "./utils/calculations/link/linkCalcs.tsx";
import { mapLabel } from "./graphLayout/labels";
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

			ctx.beginPath(); // add ring to highlight hovered & neighbor nodes
			ctx.arc(node.x, node.y, NODE_R * 1.4, 0, 2 * Math.PI, false);
			ctx.fillStyle = node === hoverNode ? "red" : riskOutline(node.risk_score); // hovered node || risk score outline
			ctx.fill();

			// Node color
			ctx.beginPath();
			ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false); // risk
			ctx.fillStyle =
				node === clickedNode ? "#DEFF00" : nodeFillColor(node.dgraph_type[0]);
			ctx.fill();
			ctx.restore();

			const label = node.nodeLabel;
			ctx.font = '50px Roboto';
			const fontSize = Math.min(98, NODE_R / ctx.measureText(label).width);
			ctx.font = `${fontSize + 5}px Roboto`;

			const textWidth = ctx.measureText(label).width;

			const labelBkgdDimensions = [textWidth, fontSize].map(
				(n) => n + fontSize * 0.2
			);

			ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
			
			ctx.fillRect(
				node.x - labelBkgdDimensions[0] / 2, // rectangle x coordinate
				node.y - labelBkgdDimensions[1] - 2.75, // rectangle y coordinate
				labelBkgdDimensions[0] + 1.25 , // rectangle width 
				labelBkgdDimensions[1] + 5.5, // rectangle height
			);

			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#ffffff";
			ctx.fillText(label, node.x, node.y);
		},
		[hoverNode, clickedNode]
	);

	const linkStyling = ((link: any, ctx: any) => {
		const MAX_FONT_SIZE = 8;
		const LABEL_NODE_MARGIN = 8 * 1.5;

		const start = link.source;
		const end = link.target;

		link.color = calcLinkColor(link, data);

		// ignore unbounded links
		if (typeof start !== 'object' || typeof end !== 'object') return;

		// Edge label positioning calculations
		const textPos = {
			x: (start.x + (end.x - start.x) / 2) ,
			y: (start.y + (end.y - start.y) / 2)
		};

		const relLink = {x: end.x - start.x, y: end.y - start.y};
		const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 8;

		let textAngle = Math.atan2(relLink.y, relLink.x);

		// Maintain label vertical orientation for legibility
		if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
		if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

		const label = mapLabel(link.name);

		// Estimate fontSize to fit in link length
		ctx.font = '50px Roboto';
		const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / ctx.measureText(label).width);
		ctx.font = `${fontSize + 5}px Roboto`;
		let textWidth = ctx.measureText(label).width;
		textWidth += Math.round(textWidth * 0.25);

		// Draw text label
		ctx.save();
		ctx.translate(textPos.x, textPos.y);
		ctx.rotate(textAngle);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';	
		ctx.fillText(label, .75, 3); //Content, left/right, top/bottom
		ctx.restore();
	})

	return (
		<ForceGraph2D
			graphData={data}
			ref={fgRef}
			nodeRelSize={NODE_R}
			nodeLabel={"nodeLabel"} // tooltip on hover, actual label is in nodeCanvasObject
			nodeColor={(node) => "rgba(255, 255, 255, .15)"}
			nodeCanvasObjectMode={(node) =>
				highlightNodes.has(node) ? "before" : "after"
			}
			nodeCanvasObject={nodeStyling}
			onNodeClick={(_node, ctx) => {
				const node = _node as VizNode;
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
			linkDirectionalArrowLength={10}
			linkDirectionalArrowRelPos={1}
			linkDirectionalParticleSpeed={0.005}
			linkDirectionalParticleColor={(link) => "#919191"}
			linkDirectionalParticles={1}
			linkDirectionalParticleWidth={(link) =>
				highlightLinks.has(link)
					? calcLinkParticleWidth(link as Link, data as VizGraph) + 2
					: calcLinkParticleWidth(link as Link, data as VizGraph) + 1
			}
			linkCanvasObjectMode={(() => 'after')}
			linkCanvasObject={linkStyling}
			warmupTicks={100}
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
