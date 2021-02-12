import { GraphState } from "../../../types/GraphDisplayTypes";

import { retrieveGraph } from "../../../services/graphQLRequests/retrieveGraphReq";
import { vizGraphFromLensScope } from "../graphLayout/vizGraphFromLensScope";
import { mergeGraphs } from "../graphLayout/mergeGraphs";

export const updateGraph = async (
	lensName: string,
	engagementState: GraphState,
	setEngagementState: (engagementState: GraphState) => void
) => {
	if (!lensName) {
		console.log("No lens names");
		return;
	}

	const curLensName = engagementState.curLensName;

	await retrieveGraph(lensName)
		.then(async (scope) => {
			const update = vizGraphFromLensScope(scope);
			const mergeUpdate = mergeGraphs(engagementState.graphData, update);

			if (mergeUpdate !== null) {
				if (curLensName === lensName) {
					setEngagementState({
						...engagementState,
						curLensName: lensName,
						graphData: mergeUpdate,
					});
				} else {
					setEngagementState({
						...engagementState,
						curLensName: lensName,
						graphData: update,
					});
				}
			}
		})
		.catch((e) => console.error("Failed to retrieveGraph ", e));
};
