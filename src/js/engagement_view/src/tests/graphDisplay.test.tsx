import { Lens, VizNode } from "types/CustomTypes";
import { getNodeType, vizGraphFromLensScope } from "components/graphDisplay/graphLayout/vizGraphFromLensScope";
import { baseNodeData } from "./engagementView/data/baseNodeData";
import {mergeNodes} from "components/graphDisplay/graphLayout/mergeGraphs";

import {vizGraphData, vizGraphReturnData} from "./engagementView/data/graphVizData";
import {mergeGraphs} from "components/graphDisplay/graphLayout/mergeGraphs";
import {initalGraphData, curGraphData, updatedGraphData, outputGraphData} from "./engagementView/data/mergeGraphData"; 
import {initialNodeX, initialNodeY} from "./engagementView/data/mergeNodeData";

// graphQLAdjacencyMatrix
test("get node type from dGraph type", () => {
	expect(getNodeType(baseNodeData)).toBe("Risk");
});

test("create graph from lens scope for graph display vizualization", () => {
	expect(vizGraphFromLensScope(vizGraphData as any)).toMatchObject(vizGraphReturnData); 
})

test("merge graph data HAS changed and graph WILL be updated", () => {
	expect(mergeGraphs(initalGraphData as any, updatedGraphData as any)).toMatchObject(updatedGraphData)
})

test("merge graph data has NOT changed and graph WILL NOT be updated", () => {
	expect(mergeGraphs(initalGraphData as any, updatedGraphData as any)).toBe(null)
})

// test("nodes merge successfully", () => {
// 	expect(mergeNodes(initialNodeX as unknown as VizNode, initialNodeY as unknown as VizNode)).toBeTruthy();
// })
