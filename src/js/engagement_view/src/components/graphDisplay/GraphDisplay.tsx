// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { retrieveGraph } from "../../services/graphQLRequests/retrieveGraphReq";

import { calcLinkColor} from "./utils/graphColoring/coloring.tsx";
import { mapLabel } from './utils/graph/labels.tsx';
import { nodeRisk } from './utils/calculations/node/nodeCalcs.tsx'
import { calcLinkDirectionalArrowRelPos, calcLinkParticleWidth  } from './utils/calculations/link/linkCalcs.tsx'
import { mergeGraphs } from './utils/graph/mergeGraphs.tsx'
import { graphQLAdjacencyMatrix } from './utils/graphQL/graphQLAdjacencyMatrix.tsx'
import { Node, LinkType, GraphType } from "../../types/CustomTypes.tsx"

type GraphDisplayProps = {
    lensName: string | null,
    setCurNode: (string) => void,
}

type GraphDisplayState = {
    graphData: AdjacencyMatrix,
    curLensName: string | null,
}

type GraphState = {
    curLensName: LensType[], 
    graphData: GraphType[]
}

export const mapNodeProps = (node: Node, f: (string) => void) => {
    for (const prop in node) {
        if (Object.prototype.hasOwnProperty.call(node, prop)) {
            if (Array.isArray(node[prop])) {
                if (node[prop].length > 0) {
                    if (node[prop][0].uid === undefined) {
                        f(prop)
                    }
                }
            } else {
                f(prop)
            }
        }
    }
};


const updateGraph = async (lensName: string, state: GraphState, setState: (state: GraphState) => void ) => {
    if (!lensName) {
        console.log('Attempted to fetch empty lensName')
        return;
    }

    const curLensName = state.curLensName;

    await retrieveGraph(lensName)
        .then(async (scope) => {
            const update = graphQLAdjacencyMatrix(scope);
            console.debug('state: ', state);
            console.debug('update', update);

            const mergeUpdate = mergeGraphs(state.graphData, update);
            
            if (mergeUpdate !== null) {
                if (curLensName === lensName) {
                    setState({
                        ...state,
                        curLensName: lensName,
                        graphData: mergeUpdate,
                    })
                } else {
                    console.log("Switched lens, updating graph", state.curLensName, 'ln', lensName);
                    setState({
                        ...state,
                        curLensName: lensName,
                        graphData: update,
                    })
                }
            }
        })
        .catch((e) => console.error("Failed to retrieveGraph ", e))
}



const GraphDisplay = ({lensName, setCurNode}: GraphDisplayProps) => {
    const [state, setState]: GraphDisplayState = useState({
        graphData: {nodes: [], links: []}, 
        curLensName: lensName
    });

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

    const graphData = state.graphData;

    // #TODO: ADD ZOOM HANDLERS FOR MAX ZOOM IN/OUT

    return (
        <>
            <ForceGraph2D
                graphData={graphData}
                nodeLabel={(node: Node) => node.nodeLabel}
                enableNodeDrag={true}
                linkDirectionalParticles={1}
                linkDirectionalParticleWidth={(link) => {
                    return calcLinkParticleWidth(link, graphData);
                }}
                linkDirectionalParticleColor={(link) => {
                    return calcLinkColor(link, graphData)
                }}
                linkDirectionalParticleSpeed={0.005}
                onNodeClick={
                    (node: Node, event: string) => {
                        setCurNode(node);
                    }
                }
                linkDirectionalArrowLength={8}
                linkWidth={4}
                linkDirectionalArrowRelPos={(link => {
                    return calcLinkDirectionalArrowRelPos(link, graphData);
                })}
                linkCanvasObjectMode={(() => 'after')}
                linkCanvasObject={((link: LinkType, ctx: any) => {
                    const MAX_FONT_SIZE = 8;
                    const LABEL_NODE_MARGIN = 12;
                    const start = link.source;
                    const end = link.target;
                    // ignore unbound links
                    link.color = calcLinkColor(link, graphData);

                    if (typeof start !== 'object' || typeof end !== 'object') return;
                    // calculate label positioning
                    const textPos = Object.assign(
                        ...['x', 'y'].map((c: any) => (
                            {
                                [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
                            }
                        )) as any
                    );

                    const relLink = {x: end.x - start.x, y: end.y - start.y};

                    const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 8;

                    let textAngle = Math.atan2(relLink.y, relLink.x);
                    // maintain label vertical orientation for legibility
                    if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
                    if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

                    const label = mapLabel(link.label);
                    // estimate fontSize to fit in link length
                    ctx.font = '50px Arial';
                    const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / ctx.measureText(label).width);
                    ctx.font = `${fontSize + 5}px Arial`;

                    let textWidth = ctx.measureText(label).width;

                    textWidth += Math.round(textWidth * 0.25);

                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
                    // draw text label (with background rect)
                    ctx.save();
                    ctx.translate(textPos.x, textPos.y);
                    ctx.rotate(textAngle);
                    ctx.fillStyle = 'rgb(115,222,255,1)';
                    ctx.fillRect(-bckgDimensions[0] / 2, -bckgDimensions[1] / 2, ...bckgDimensions);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'white';
                    //content, left/right, top/bottom
                    ctx.fillText(label, .75, 3);
                    ctx.restore();
                })}
                nodeCanvasObject={((node: Node, ctx: any, globalScale: any) => {
                    // add ring just for highlighted nodes

                    const NODE_R = nodeRisk(node, graphData);
                    ctx.save();

                    // Risk outline color
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, NODE_R * 1.3, 0, 2 * Math.PI, false);
                    ctx.fillStyle = "blue";
                    ctx.fill();
                    ctx.restore();

                    ctx.save();

                    // Node color
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false);

                    ctx.fillStyle = "cyan";
                    ctx.fill();
                    ctx.restore();

                    const label = node.nodeLabel;

                    const fontSize = 15 / globalScale;

                    ctx.font = `${fontSize}px Arial`;

                    const textWidth = ctx.measureText(label).width;

                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
                    // node label color
                    ctx.fillStyle = 'rgba(48, 48, 48, 0.8)';
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'white';
                    ctx.fillText(label, node.x, node.y);

                })}
            />
        </>
    )
}

export default GraphDisplay;
