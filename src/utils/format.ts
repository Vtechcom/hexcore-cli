import BigNumber from 'bignumber.js';

export const formatId = (id: string | null, begin = 5, last = 5): string => {
    if (!id) return '';
    if (id.length <= begin + last) return id;
    const before = id.substring(0, begin);
    const after = id.substring(id.length - last);
    return before + '...' + after;
};

export const createId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const ROUNDING_CURRENCY: Record<string, any> = {
    tADA: 6,
    ADA: 6,
    lovelace: 1,
};

export function toFixedNumber(number: number, precision: number): string {
    const shift = function (number: string | number, exponent: number) {
        const numArray = ('' + number).split('e');
        return +(numArray[0] + 'e' + (numArray[1] ? +numArray[1] + exponent : exponent));
    };
    return shift(Math.round(shift(number, +precision)), -precision) + '';
}

export function truncateToDecimals(num: number, dec: string): string {
    const calcDec = Math.pow(10, ROUNDING_CURRENCY[dec]);
    return Number((Math.trunc(num * calcDec) / calcDec).toFixed(ROUNDING_CURRENCY[dec])).toLocaleString('en-US', {
        minimumFractionDigits: ROUNDING_CURRENCY[dec],
    });
}

export function recursiveToCamel<T extends Record<string, any>>(item: Record<string, any>): T {
    if (Array.isArray(item)) {
        return item.map((el: Record<string, any>) => recursiveToCamel(el)) as Record<string, any> as T;
    } else if (typeof item === 'function' || item !== Object(item)) {
        return item as Record<string, any> as T;
    }
    return Object.fromEntries(
        Object.entries(item as Record<string, unknown>).map(([key, value]: [string, unknown]) => [
            key.replace(/([_][a-z])/gi, c => c.toUpperCase().replace(/[_]/g, '')),
            recursiveToCamel(value as Record<string, any>),
        ]),
    ) as Record<string, any> as T;
}

export function convertKeysToSnakeCase<T extends Record<string, any>>(obj: Record<string, any>): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(convertKeysToSnakeCase) as Record<string, any> as T;
    }

    return Object.keys(obj).reduce((acc, key) => {
        const snakeCaseKey = key.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);
        // @ts-ignore
        acc[snakeCaseKey] = convertKeysToSnakeCase(obj[key]);
        return acc;
    }, {}) as Record<string, any> as T;
}

export function formatNumber(value: number | string | null, decimalPlaces?: number): string {
    return BigNumber(value || 0).toFormat(decimalPlaces);
}

export function hexToUtf8(hex: string): string {
    return Buffer.from(hex, 'hex').toString('utf8');
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}
