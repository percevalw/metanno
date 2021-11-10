import React from "react";
import "./style.css";
import Color from "color";
import PropTypes from "prop-types";
import SpanComponent from "../SpanComponent";
//import "@blueprintjs/core/lib/css/blueprint.css";
// import '@jupyterlab/notebook/style/index.css'

const Button = ({label, secondary, color, onMouseDown}) => {
    const hsl = Color(color).hsl();
    // hsl.color[2] = Math.max(hsl.color[2], 60);
    return (<div className="toolbar-button">
        <div className="bp3-button bp3-minimal toolbar-button-component button" onMouseDown={onMouseDown}>
            <div style={{background: hsl.toString(), color: hsl.isLight() ? '#464646' : 'white' }} className="toolbar-button-text">
                <span>{label}</span>
            </div>
            {secondary
                ? <div style={{background: 'white', color: "#464646"}} className="toolbar-button-secondary"><span>{secondary}</span></div>
                : null}
        </div>
    </div>);
};
const Spacer = () => {
    return <div className="toolbar-spacer" />;
};

export default class Toolbar extends React.Component {
    constructor(props) {
        super(props);
    }

    renderComponent = ({type, ...props}, idx) => {
        if (type === "button")
            return <Button
                label={props.label}
                color={props.color}
                secondary={props.secondary}
                onMouseDown={() => this.props.onButtonPress(idx)}
            />;
        else if (type === "spacer") {
            return <Spacer />
        }
        else {
            throw Error(`Unkown toolbar component type "${type}"`)
        }
    };

    render() {
        return (
            <div className="toolbar">
                <div className="toolbar-content">
                    {/*<Button label="Lateralité" secondary="l" color='#45ed5b' />
                    <Button label="Negation" secondary="n" color='#ff5b5b' />
                    <Button label="Quadrant" shortcut="q" color='#0f8edc' />
                    <Button label="Cible" shortcut="c" color='black' />
                    <Button label="Temporalité" shortcut="t" color='yellow' />*/}
                    {this.props.buttons.map(this.renderComponent)}
                </div>
            </div>
        );
    }
}


Toolbar.propTypes = {
    buttons: PropTypes.arrayOf(PropTypes.object),
    onButtonPress: PropTypes.func,
};

SpanComponent.defaultProps = {
    buttons: [],
};