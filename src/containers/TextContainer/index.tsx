import React, {useCallback} from "react";
import {useSelector} from "react-redux";
import TextComponent from "../../components/TextComponent";
import Toolbar from "../../components/Toolbar";
import Loading from "../../components/Loading";
import {cachedReconcile} from "../../utils";
import {PyTextData, TextMethods, ToolbarData, ToolbarMethods} from "../../types";

const TextContainer = ({
    id,
    stateId,

    onButtonPress,
    onKeyPress,
    onClickSpan,
    onMouseEnterSpan,
    onMouseLeaveSpan,
    onMouseSelect,
    registerActions,
    selectState,
}: {
    id: string;
    stateId: string;
    className?: string,
    selectState: (/*state: object, id: string*/) => PyTextData;
} & ToolbarMethods & TextMethods) => {
    const {
        spans,
        text,
        mouse_selection,
        buttons,
        styles,
        loading,
    } = useSelector(useCallback(cachedReconcile(
        (state: object): PyTextData & ToolbarData & {loading: boolean} => {
            let derived = null;
            if (selectState && state && state[stateId]) {
                derived = selectState()
            }
            return (derived
                ? {
                    text: '',
                    spans: [],
                    mouse_selection: [],
                    buttons: [],
                    styles: [],
                    ...derived,
                    loading: false
                }
                : {loading: true})
        }),
        [id, selectState],
    ));


    if (loading) {
        return (
            <div className={"container is-loading"}>
                <Loading/>
            </div>);
    }
    return (
        <div className={`container ${buttons.length > 0 ? "has-toolbar" : ''}`}>
            {buttons.length > 0
                ? <Toolbar
                    buttons={buttons}
                    onButtonPress={idx => onButtonPress(idx, mouse_selection)}/>
                : null}
            <TextComponent
                id={id}
                spans={spans}
                text={text}
                styles={styles}
                mouseSelection={mouse_selection}

                onKeyPress={onKeyPress}
                onClickSpan={onClickSpan}
                onMouseEnterSpan={onMouseEnterSpan}
                onMouseLeaveSpan={onMouseLeaveSpan}
                onMouseSelect={onMouseSelect}//mouse_selection => this.setState(state => ({...state, mouse_selection}))}
                registerActions={registerActions}
            />
        </div>
    )
};

export default TextContainer;