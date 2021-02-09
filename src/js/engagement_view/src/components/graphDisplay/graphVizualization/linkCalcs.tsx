import { VizGraph, Link, VizNode } from "../../../types/CustomTypes";
import { calcNodeRiskPercentile } from "./nodeCalcs";
import { riskOutline } from "./nodeStyling";

const findNode = (id: number, nodes: VizNode[]) => {
	for (const node of nodes || []) {
		if (node.id === id) {
			return node;
		}
	}
	return null;
};

export const calcLinkRisk = (link: Link, Graph: VizGraph) => {
		let sourceNode: any =
			findNode(link.source, Graph.nodes) || 
			findNode((link as any).source.name, Graph.nodes);
		let targetNode: any=
			findNode(link.target as any, Graph.nodes) ||
			findNode((link as any).target.name as any, Graph.nodes);

	const srcRisk: number = (sourceNode.risk_score) || 0;
	const dstRisk: number = (targetNode.risk_score) || 0;

	if (!sourceNode || !targetNode) {
		console.error(
			"Missing srcNode/dstNode",
			sourceNode,
			link.source,
			targetNode,
			Graph.nodes
		);
		return 0;
	}
	return Math.round((srcRisk + dstRisk) / 2);
};

export const calcLinkRiskPercentile = (link: Link, Graph: VizGraph) => {
	const linkRisk = calcLinkRisk(link, Graph);
	const nodes = [...Graph.nodes].map((node) => node.risk);

	return calcNodeRiskPercentile(linkRisk, nodes);
};

export const calcLinkColor = (link: Link, Graph: VizGraph): string => {	
    const risk = calcLinkRiskPercentile(link, Graph);
	return riskOutline(risk) as string;   
};
	
export const calcLinkParticleWidth = (link: Link, Graph: VizGraph): number => {
	const linkRiskPercentile = calcLinkRiskPercentile(link, Graph);
	if (linkRiskPercentile >= 75) {
		return 5;
	} else if (linkRiskPercentile >= 50) {
		return 4;
	} else if (linkRiskPercentile >= 25) {
		return 3;
	} else {
		return 2;
	}
};
