   export const hello = "hello";
   // import { calcNodeRiskPercentile } from '../node/nodeCalcs'; 
    // import { Link, VizNode, VizGraph } from '../../../../../types/CustomTypes';


    // const findNode = (id: number, nodes: VizNode[]) => {
    //     for (const node of (nodes || [])) {
    //         if (node.id === id) {
    //             return node
    //         }
    //     }
    //     return null
    // };

    // // export const calcLinkRisk = (link: Link, Graph: VizGraph) => {
    // //     // console.log("LINK", link)
    // //     let srcNode = 
    // //         findNode(link.source as any, Graph.nodes) ||
    // //         findNode(link.source.name as any, Graph.nodes);
    // //     let dstNode = 
    // //         findNode(link.target as any, Graph.nodes) ||
    // //         findNode(link.target.name as any, Graph.nodes);

    // //     if (!srcNode || !dstNode) {
    // //         console.error("Missing srcNode/dstNode", srcNode, link.source, dstNode, Graph.nodes);
    // //         return 0;
    // //     }

    // //     const srcRisk = srcNode.risk || 0;
    // //     const dstRisk = dstNode.risk || 0;

    // //     return Math.round((srcRisk + dstRisk) / 2)
    // // };


   //  // export const calcLinkRiskPercentile = (link: Link, Graph: VizGraph) => {
   //  //     const linkRisk = calcLinkRisk(link, Graph);
   //  //     const nodes = [...Graph.nodes].map(node => node.risk);

   //  //     return calcNodeRiskPercentile(linkRisk, nodes);
   //  // };

   //  export const calcLinkParticleWidth = (link: Link, Graph:VizGraph) => {
   //      const linkRiskPercentile = calcLinkRiskPercentile(link, Graph);
   //      if (linkRiskPercentile >= 75) {
   //          return 5
   //      } else if (linkRiskPercentile >= 50) {
   //          return 4
   //      } else if (linkRiskPercentile >= 25) {
   //          return 3
   //      } else {
   //          return 2
   //      }
   //  };
