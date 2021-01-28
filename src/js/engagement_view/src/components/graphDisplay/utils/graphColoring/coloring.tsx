import { calcLinkRiskPercentile } from '../calculations/link/linkCalcs';
import { LinkType, VizGraph, VizNode } from '../../../../types/CustomTypes'

export const percentToColor = (percentile: number) => {
    const hue = (100 - percentile) * 40 / 100;

    return `hsl(${hue}, 100%, 50%)`;
};

export const calcLinkColor = (link: LinkType, Graph: VizGraph) => {
    const risk = calcLinkRiskPercentile(link, Graph);
    // Default link color if no risk
    if (risk === 0) {
        return 'white'
    }
    return percentToColor(risk);
};



