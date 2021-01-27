import React from "react";

import Button from "@material-ui/core/Button";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';

import { useStyles } from '../styles';

import { SelectLensProps } from "types/LensAndNodeTableTypes"

export function SelectLens(props: SelectLensProps) {
    const classes = useStyles();
    return (
        <>
            <TableHead className = {classes.head}>
                <TableRow>
                    <TableCell align="left">
                        <b> Lens Name </b>
                    </TableCell>
                    <TableCell align="right">
                        <b> Risk </b>
                    </TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                <TableRow key={props.uid}>
                    <TableCell component="th" scope="row" align="left">
                    <Button 
                        className = {classes.lensName}
                        onClick={ () => { props.setLens(props.lens) }}
                    >
                        {props.lens_type + " :\t\t" + props.lens}
                    </Button>
                    </TableCell>
                    <TableCell component="th" scope="row" align = "right">
                        {props.score} 
                    </TableCell>    
                </TableRow>
            </TableBody>
        </>
    )
}