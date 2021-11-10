// const mymodule = require("react-data-grid/lib/masks/InteractionMasks");
//
// class CustomInteractionMasks extends mymodule.default {
//     onSelectCellRangeEnded = () => {
//         if (!this.state.selectedRange.isDragging)
//             return;
//         const selectedRange = {...this.state.selectedRange, isDragging: false};
//         this.setState({selectedRange}, () => {
//             if (this.props.onCellRangeSelectionCompleted) {
//                 this.props.onCellRangeSelectionCompleted(this.state.selectedRange);
//             }
//
//             // Focus the InteractionMasks, so it can receive keyboard events
//             this.focus();
//         });
//     }
// };
// mymodule.default = CustomInteractionMasks;