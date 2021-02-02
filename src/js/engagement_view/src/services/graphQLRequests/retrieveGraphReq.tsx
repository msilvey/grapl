import {Lens, Node} from '../../types/CustomTypes';
import {unpackPluginNodes} from './utils_retrieveGraph/unpackPluginNodes';
import {expandLensScopeQuery} from './utils_retrieveGraph/expandLensScopeQuery';

import DEV_API_EDGES from '../constants';
import {apiFetchWithBody} from '../fetch';

export const retrieveGraph = async (lens: string): Promise<Lens> => {
    const expandScopeQueryData = expandLensScopeQuery(lens);
    
    const lensScopeQuery = JSON.stringify({ query: expandScopeQueryData })

    const queryResponse = 
        await apiFetchWithBody(`${DEV_API_EDGES.graphQL}/graphQlEndpoint/graphql`, "POST", lensScopeQuery)
            .then(res => res)
            .then(res => {
                if(res.errors){
                    console.log("Unable to retrieve graph data ", res.errors)
                }
                console.log('Retrieved Graph Data: ', res);
                return res
            })
            .then((res) => res.data)
            .then((res) => res.lens_scope);

    const lensWithScopeData = await queryResponse;
    
    console.debug('LensWithScope: ', lensWithScopeData);

    unpackPluginNodes(lensWithScopeData.scope);

    return lensWithScopeData;
};

// const validateLensScopeResponse = (rawResponse: object): LensWithScopeResponse => {
    
// }