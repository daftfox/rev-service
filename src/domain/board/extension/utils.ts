import { Board } from '../base';
import * as extensions from './index';
import { IExtensionClasses, IExtensionKeys } from '../interface';

export const AVAILABLE_EXTENSIONS_CLASSES = ((): IExtensionClasses => {
    const classes = {
        Board,
    };

    for (const extension of Object.keys(extensions)) {
        classes[extension] = extensions[extension];
    }

    return classes;
})();

export const AVAILABLE_EXTENSIONS_KEYS = ((): IExtensionKeys => {
    const keys = {
        Board: 'Board',
    };

    for (const extension of Object.keys(extensions)) {
        keys[extension] = extensions[extension].name;
    }

    return keys;
})();

export const isAvailableExtension = (type: string): boolean => {
    return Object.keys(AVAILABLE_EXTENSIONS_CLASSES).includes(type);
};
