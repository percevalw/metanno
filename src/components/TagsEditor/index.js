import React from "react";
import {BaseEditorComponent} from "@handsontable/react";
import TagsInput from "react-tagsinput";
import autoResize from 'handsontable/lib/autoResize/autoResize';
import NativeListener from 'react-native-listener';

export default class TagsEditor extends BaseEditorComponent {
    constructor(props) {
        super(props);

        this.inputRef = null;
        this.editorRef = null;
        this.rendererRef = null;
        this.cellRef = null;
        this.state = {
            editorMode: false,
            value: props.value || [],
        };
        if (props.isEditor) {
            this.autoResize = autoResize();
        }
    }

    stopEventPropagation(e) {
        e.stopPropagation();
    }

    setValue(value, callback) {
        this.setState((state, props) => {
            return {value: value};
        }, callback);
    }

    beginEditing(initialValue, event) {
        this.hotCustomEditorInstance._fullEditMode = false;
        const el = this.TD.children[0].children[0];
        for (let key in el) {
            if (key.startsWith('__reactInternalInstance$')) {
                const fiberNode = el[key];

                this.cellRef = fiberNode && fiberNode.return && fiberNode.return.stateNode;
                break
            }
        }
        const bb = el.getBoundingClientRect();
        this.autoResize.init(el, {minWidth: bb.width, minHeight: bb.height}, true);
        return super.beginEditing(initialValue, event);
    }

    getValue() {
        return this.cellRef.state.value;
    }

    open = () => {
        this.cellRef.setState(state => ({
            editorMode: true,
            editor: this,
            value: state.value,
        }));
    };

    close = () => {
        this.autoResize.unObserve();
        this.cellRef.setState(state => ({
            editorMode: false,
            editor: null,
            value: state.value,
        }));
    };

    prepare(row, col, prop, td, originalValue, cellProperties) {
        super.prepare(row, col, prop, td, originalValue, cellProperties);

        // const tdPosition = td.getBoundingClientRect();

        // this.editorRef.current.style.left = tdPosition.left + "px";
        // this.editorRef.current.style.top = tdPosition.top + "px";
    }

    handleChange = (value) => {
        console.log("handleChang", value);
        this.setState(state => ({...state, value: value}));
    };

    finishEditing = (restoreOriginalValue, ctrlDown, callback) => {
        console.log("Finish editing");
        if (this.cellRef && this.cellRef.inputRef) {
            this.cellRef.inputRef.accept();
        }
        super.finishEditing(restoreOriginalValue, ctrlDown, callback);
    };

    handleKeyDown = (event) => {
        console.log("My event !", event, event.key, event.defaultPrevented);
        if (!this.state.editorMode)
            return;
        this.inputRef && this.inputRef.handleKeyDown(event);
        console.log("After input handled",event, event.key, event.defaultPrevented);
        if (event.defaultPrevented)
            event.stopPropagation();
            return;
        console.log("Will finally handle", event.key);
        if ([9, 13].indexOf(event.keyCode) !== -1) {
            event.preventDefault();
            this.state.editor.finishEditing();
        }
    };

    render() {
        if (this.props.isRenderer)
            return (
                <div tabIndex={-1} ref={ref => {this.rendererRef = ref}}>
                    <NativeListener
                        onKeyDown={this.handleKeyDown}
                        onFocus={(event) => {this.state.editorMode && this.inputRef && this.inputRef.handleFocus(event)}}
                        onBlur={(event) => {this.state.editorMode && this.inputRef && this.inputRef.handleBlur(event)}}
                    >
                            <TagsInput ref={(obj) => {
                                this.inputRef = obj;
                                obj && obj.input.focus();
                            }}
                                       inputProps={{
                                           onKeyDown: () => {console.log("ok")},
                                           onFocus: () => {
                                           },
                                           onBlur: () => {
                                           },
                                       }}
                                       value={this.state.value || []}
                                       onChange={this.handleChange}
                                       className={`react-tagsinput ${!this.state.editorMode ? 'disabled' : ''}`}
                                       disabled={!this.state.editorMode}/>
                    </NativeListener>
                </div>
            );
        return <div ref={ref => {this.editorRef = ref}} style={{position: 'absolute', background: 'transparent'}} />;
    }

    // componentDidUpdate() {
    //     if (this.props.isRenderer && this.state.editor && this.state.editor.editorRef) {
    //         const tdPosition = this.props.TD.getBoundingClientRect();
    //         console.log(this.state.editor.editorRef, tdPosition);
    //         this.state.editor.editorRef.style.left = tdPosition.left + "px";
    //         this.state.editor.editorRef.style.top = tdPosition.top + "px";
    //         this.state.editor.editorRef.style.width = tdPosition.width + "px";
    //         this.state.editor.editorRef.style.height = tdPosition.height + "px";
    //     }
    // }
}
