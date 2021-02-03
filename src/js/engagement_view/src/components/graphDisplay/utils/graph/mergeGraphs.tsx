import {mapNodeProps} from '../../GraphDisplay';
import {VizGraph, VizNode} from '../../../../types/CustomTypes'; 

// merges y into x, returns true if update occurred
const mergeNodes = (x: VizNode, y: VizNode) => {
    let merged = false;
    mapNodeProps(y, (prop: string) => {
        if (!Object.prototype.hasOwnProperty.call(x, prop)) {
            if ((x as any)[prop] !== (y as any)[prop]) {
                (x as any)[prop] = (y as any)[prop];
                merged = true;
            }
        }
    });
    return merged;
};


export const mergeGraphs = (curGraph: VizGraph, graphUpdate: VizGraph): VizGraph | null => {
    // Merges two graphs into a new graph
    // returns 'null' if there are no updates to be made

    if (!graphUpdate.nodes && !graphUpdate.links) {
        // empty update
        return null
    }

    const outputGraph: VizGraph = {nodes: [], links: [], index: []};

    let updated = false;

    const nodes = new Map();
    const links = new Map();

    for (const node of curGraph.nodes) {
        nodes.set(node.uid, node)
    }

    for (const newNode of graphUpdate.nodes) {
        const node = nodes.get(newNode.uid);
        if (node) {
            if (mergeNodes(node, newNode)) {
                updated = true;
            }
        } else {
            nodes.set(newNode.uid, newNode);
            console.debug('new node added ', newNode);
            updated = true;
        }
    }

    for (const link of curGraph.links) {
        if (link) {
            const source = link.source;
            const target = link.target;
            links.set(
                source + link.name + target,
                link,
            )
        }
    }

    for (const newLink of graphUpdate.links) {
        const newLinkSource =  newLink.source || newLink.source;
        const newLinkTarget =  newLink.target || newLink.target;
        const link = links.get(newLinkSource + newLink.name + newLinkTarget);
        if (!link) {
            console.debug('newlink', newLink)
            links.set(newLink.source + newLink.name + newLink.target, newLink);
            updated = true;
        }
    }

    outputGraph.nodes = Array.from(nodes.values());
    outputGraph.links = Array.from(links.values());

    for (const node of nodes.values()){
        outputGraph.index[node.uid] = node;
    }

    if (updated) {
        return outputGraph;
    } else {
        return null;
    }
}