import { traverseNodes, traverseNeighbors, mapEdges } from "../graph/graph_traverse"
import { getNodeLabel } from '../graph/labels';
import {Lens, Link, VizGraph, BaseNodeProperties, VizNode, Node, Risk} from "../../../../types/CustomTypes"

const getNodeType = (node: BaseNodeProperties) => {
    const dgraphType = node.dgraph_type;

    if (dgraphType) {
        if (Array.isArray(dgraphType)) {
            return dgraphType[0]
        }
        return dgraphType
    }

    console.warn('Unable to find type for node ', node);
    return 'Unknown';
};

function randomInt(min: number, max: number) // min and max included
{
    let randomNum: number = Math.floor(Math.random() * (max - min + 1) + min);
    return randomNum;
}


export const vizGraphFromLensScope = (inputGraph: Lens): VizGraph => {
    const nodes: VizNode[] = []; 
    const links: Link[] = [];
    const nodeMap: Map<number, VizNode> = new Map();

    traverseNeighbors(
        inputGraph, 
        (fromNode, edgeName, toNode) => {
            if(edgeName !== 'scope'){
                
                if(getNodeType(fromNode) === 'Unknown'){
                    return;
                }

                if(getNodeType(toNode) === 'Unknown'){
                    return;
                }

                if(getNodeType(fromNode) === 'Risk'){
                    return;
                }

                if(getNodeType(toNode) === 'Risk'){
                    return;
                }
                
                links.push({
                    source: fromNode.uid,
                    name: edgeName, 
                    target: toNode.uid
                })
        } 
    })

    traverseNodes(inputGraph, (node) => {
        const nodeType = getNodeType(node);

        if(nodeType === 'Unknown'){
            return;
        }

        if(nodeType === 'Risk'){
            return; 
        }

        const nodeLabel = getNodeLabel(nodeType, node);

        const strippedNode = {...node};

        let riskScore = (node["risk"] || 0) as number;
        let analyzerNames = "";
        let nodeRisks = (node["risks"] || []) as Risk[];
    
        for(const riskNode of nodeRisks){
            riskScore += riskNode.risk_score || 0;

            if (analyzerNames && riskNode.analyzer_name) {
                analyzerNames += ", "
            }
            
            analyzerNames += riskNode.analyzer_name || "";
        }

        mapEdges(node, (edge: string, _neighbor:  Node) => {
            // The stripped node is converted to another type, so we can cast to any here
            (strippedNode as any)[edge] = undefined;
        })

        const vizNode = {
            name: node.uid,
            x: 200 + randomInt(1, 5),
            y: 150 + randomInt(1, 5),
            ...strippedNode,
            riskScore,
            analyzerNames,
            id: node.uid,
            nodeType,
            nodeLabel,
        };

        nodeMap.set(node.uid, vizNode as unknown as VizNode); // as unknown handles destructuring. 
    })

    const index = {} as {[key: number]: VizNode};

    for (const vizNode of (nodeMap.values())) {
        index[vizNode.uid] = vizNode;
        nodes.push(vizNode);
    }

    return {
        nodes, 
        links,
        index,
    }
}
