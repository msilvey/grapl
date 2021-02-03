import { Lens } from "types/CustomTypes";
import { getNodeType, vizGraphFromLensScope } from "../../components/graphDisplay/utils/graphQL/graphQLAdjacencyMatrix";
import {
	baseNodeData,
} from "../engagementView/data/baseNodeData";
import {graphVizData} from "../engagementView/data/graphVizData";

test("get node type from dGraph type", () => {
	expect(getNodeType(baseNodeData)).toBe("Risk");
});


test("create visualization graph from lens scope", () => {
	expect(vizGraphFromLensScope(graphVizData as unknown as Lens)).toBe("true"); 
})