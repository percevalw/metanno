import React from "react";

const subscribers: ((any) => void)[] = [];
const preventBlurCallbacks: (() => void)[] = [];

const remove = (subscribers, callback) => {
    const removeIndex = subscribers.findIndex(item => item === callback);
    subscribers.splice( removeIndex, 1 );
};

export const hyperlinkSubscribe = (callback) => {
    subscribers.push(callback);
    return () => remove(subscribers, callback);
};

export const preventBlurSubscribe = (callback) => {
    preventBlurCallbacks.push(callback);
};

export const hyperlinkPublish = (value, event: React.MouseEvent<HTMLElement>) => {
    subscribers.forEach(sub => sub(value));
    console.log("Preventing blur");
    preventBlurCallbacks.forEach(cb => cb());
    preventBlurCallbacks.length = 0;
};