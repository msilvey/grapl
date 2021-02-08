import { Lens, VizNode } from "types/CustomTypes";
import { getNodeType, vizGraphFromLensScope } from "components/graphDisplay/graphLayout/vizGraphFromLensScope";
import { baseNodeData } from "./engagementView/data/baseNodeData";
import {mergeNodes} from "components/graphDisplay/graphLayout/mergeGraphs";

import {graphVizData, receivedData} from "./engagementView/data/graphVizData";
import {initialNodeX, initialNodeY} from "./engagementView/data/mergeGraphData";

// graphQLAdjacencyMatrix
test("get node type from dGraph type", () => {
	expect(getNodeType(baseNodeData)).toBe("Risk");
});

test("create graph from lens scope for graph display vizualization", () => {
	expect(vizGraphFromLensScope(receivedData as unknown as Lens)).toMatchObject(graphVizData ); 
})

test("nodes merge successfully", () => {
	expect(mergeNodes(initialNodeX as unknown as VizNode, initialNodeY as unknown as VizNode)).toBeTruthy();
})