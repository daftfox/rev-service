import { Board } from '../base';
import * as extensions from './index';
import { IExtensionClasses, IExtensionKeys } from '../interface';

export const AVAILABLE_EXTENSIONS_CLASSES = ((): IExtensionClasses => {
    const classes = {
        Board: Board,
    };

    for (const extensionName of Object.keys(extensions)) {
        classes[extensionName] = extensions[extensionName];
    }

    return classes;
})();

export const AVAILABLE_EXTENSIONS_KEYS = ((): IExtensionKeys => {
    const keys = {};

    Object.keys(AVAILABLE_EXTENSIONS_CLASSES).forEach((key: string) => {
        keys[key.toUpperCase()] = key;
    });

    return keys;
})();

export const isAvailableExtension = (type: string): boolean => {
    return Object.keys(AVAILABLE_EXTENSIONS_CLASSES).includes(type);
};
