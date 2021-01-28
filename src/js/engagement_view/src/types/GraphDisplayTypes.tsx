export type GraphDisplayProps = {
    lensName: string | null,
    setCurNode: string | void,
}

export type GraphDisplayState = {
    graphData: any,
    curLensName: string | null,
    lensSelected: boolean 
}

export type GraphState = {
    curLensName: string, 
    graphData: any
}
