import React from "react";
import "./style.css";
import Color from "color";
import {ButtonData, ToolbarData} from '../../types'

export const Button = ({text, secondary, color, onClick}: ButtonData) => {
    const hsl = Color(color).hsl();
    // hsl.color[2] = Math.max(hsl.color[2], 60);
    return (<div className="toolbar-button">
        <div className="bp3-button bp3-minimal toolbar-button-component button" onMouseDown={onClick}>
            <div style={{background: hsl.toString(), color: hsl.isLight() ? '#464646' : 'white' }} className="toolbar-button-text">
                <span>{text}</span>
            </div>
            {secondary
                ? <div style={{background: 'white', color: "#464646"}} className="toolbar-button-secondary"><span>{secondary}</span></div>
                : null}
        </div>
    </div>);
};

export const Spacer = () => {
    return <div className="toolbar-spacer" />;
};

export default class Toolbar extends React.Component<{
    side: 'top' | 'bottom',
}> {

    constructor(props) {
        super(props);
    }

    /*renderComponent = ({type, ...props}: ButtonData, idx) => {
        if (type === "button")
            return <Button
                text={props.text}
                color={props.color}
                secondary={props.secondary}
                onClick={() => this.props.onButtonPress(idx)}
            />;
        else if (type === "spacer") {
            return <Spacer />
        }
        else {
            throw Error(`Unkown toolbar component type "${type}"`)
        }
    };*/

    render() {
        return (
            <div className={`toolbar toolbar-wrap toolbar-${this.props.side}`}>
                <div className="toolbar-content">
                    {this.props.children}
                </div>
            </div>
        );
    }
}
