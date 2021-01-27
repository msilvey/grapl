import React, {useState} from "react";

import Button from "@material-ui/core/Button";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import {
    ToggleNodeTableProps,
} from "types/LensAndNodeTableTypes";


import {NodeDetails} from '../LensAndNodeTableContainer'

import { useStyles } from '../styles';


export function ToggleNodeDetailTable({curNode}: ToggleNodeTableProps) {
    const [toggled, toggle] = useState(true);
    const classes = useStyles();
    return (
        <div>
            <div className={classes.header}>
                <b className={classes.title}> Node Details</b>
                <Button
                    className = {classes.button}
                    onClick={
                        () => { toggle(toggled => !toggled) }
                    }> 	
                    <ExpandMoreIcon className={classes.expand}/> 
                </Button>
            </div>

            <div className="nodeToggle">
                {
                    toggled && curNode && 
                        <>
                            { <NodeDetails node={curNode}/> }
                        </>
                }
            </div>
        </div>
    )
}