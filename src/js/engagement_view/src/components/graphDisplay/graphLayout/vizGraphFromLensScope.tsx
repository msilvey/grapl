import { traverseNodes, traverseNeighbors, mapEdges } from "./graph_traverse";

import { getNodeLabel } from "./labels";

import {
	Lens,
	Link,
	VizGraph,
	BaseNodeProperties,
	VizNode,
	Node,
	Risk,
} from "../../../types/CustomTypes";

export const getNodeType = (node: BaseNodeProperties) => {
	const dgraphType = node.dgraph_type;

	if (dgraphType) {
		if (Array.isArray(dgraphType)) {
			return dgraphType[0];
		}
		return dgraphType;
	}

	console.warn("Unable to find type for node ", node);
	return "Unknown Type";
};

// function randomInt(min: number, max: number) {
// 	let randomNum: number = Math.floor(Math.random() * (max - min + 1) + min);

// 	return randomNum;
// }

// #TODO: write a fucntion to validate data
export const vizGraphFromLensScope = (vizGraphData: Node[]): VizGraph => {
	const nodes: VizNode[] = [];
	const links: Link[] = [];
	const vizNodeMap: Map<number, VizNode> = new Map();

	for (const vizNode of vizGraphData) {
		traverseNeighbors(vizNode, (fromNode, edgeName, toNode) => {
			if (edgeName !== "scope") {
				if (
					getNodeType(fromNode) === "Unknown" ||
					getNodeType(toNode) === "Unknown" ||
					getNodeType(fromNode) === "Risk" ||
					getNodeType(toNode) === "Risk"
				) {
					return;
				}

				links.push({
					source: fromNode.uid,
					name: edgeName,
					target: toNode.uid,
				});
			}
		});

		traverseNodes(vizNode, (node) => {
			const nodeType = getNodeType(node);
	
			if (nodeType === "Unknown" || nodeType === "Risk") {
				return;
			}
	
			const nodeLabel = getNodeLabel(nodeType, node);
			const strippedNode = { ...node };
	
			let riskScore = (node["risk"] || 0) as number;
			let analyzerNames = "";
			let nodeRiskList = (node["risks"] || []) as Risk[];
	
			for (const riskNode of nodeRiskList) {
				riskScore += riskNode.risk_score || 0;
	
				if (analyzerNames && riskNode.analyzer_name) {
					analyzerNames += ", ";
				}
				analyzerNames += riskNode.analyzer_name || "";
			}
	
			mapEdges(node, (edge: string, _neighbor: Node) => {
				// The stripped node is converted to another type, so we can cast to any here
				(strippedNode as any)[edge] = undefined;
			});
	
			const vizNode = {
				name: node.uid,
				// x: 200 + randomInt(1, 5),
				// y: 150 + randomInt(1, 5), // #TODO: might need to add these back, coordinates to add new nodes
				...strippedNode,
				risk_score: riskScore,
				analyzerNames,
				id: node.uid,
				nodeType,
				nodeLabel,
			};
	
			vizNodeMap.set(node.uid, (vizNode as unknown) as VizNode); // as unknown handles destructuring.
		});
	
	}



	const index = {} as { [key: number]: VizNode };

	for (const vizNode of vizNodeMap.values()) {
		index[vizNode.uid] = vizNode;
		nodes.push(vizNode);
	}
	// Return data in format for react-force-graph display
	return {
		nodes,
		links,
		index,
	};
};
