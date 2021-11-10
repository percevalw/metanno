import React, { useCallback } from 'react';
import { useDrag, useDrop, DragObjectWithType } from 'react-dnd';

import { HeaderRendererProps } from 'react-data-grid';

function useCombinedRefs(...refs) {
    return useCallback(handle => {
        for (const ref of refs) {
            if (typeof ref === 'function') {
                ref(handle);
            } else if (ref !== null && 'current' in ref) {
                ref.current = handle;
            }
        }
    }, refs);
}

export default function ({ onColumnsReorder, ...props }) {
    const [{ isDragging }, drag] = useDrag({
        item: { key: props.column.key, type: 'COLUMN_DRAG' },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    });

    const [{ isOver }, drop] = useDrop({
        accept: 'COLUMN_DRAG',
        drop({ key, type }) {
            if (type === 'COLUMN_DRAG') {
                onColumnsReorder(key, props.column.key);
            }
        },
        collect: monitor => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop()
        })
    });

    return (
        <div
            ref={useCombinedRefs(drag, drop)}
            style={{
                opacity: isDragging ? 0.5 : 1,
                backgroundColor: isOver ? '#ececec' : 'inherit',
                cursor: 'move'
            }}
        >
            {props.column.name}
        </div>
    );
}