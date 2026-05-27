export const LAYOUT_CONFIG = {
    'IMAX': { 
        rows: 12, 
        cols: 15, 
        type: 'standard',
        aisleAfter: [5, 15],
        price: 35.0
    },
    'DOLBY': { 
        rows: 10, 
        cols: 16, 
        type: 'standard',
        aisleAfter: [4, 12],
        price: 30.0
    },
    '4DX': { 
        rows: 8, 
        cols: 12, 
        type: 'motion-block',
        aisleAfter: [3, 9],
        price: 45.0
    },
    'LUXE': { 
        rows: 7, 
        cols: 10, 
        type: 'wide-premium',
        aisleAfter: [2, 8], 
        price: 50.0
    },
    'INDULGE': { 
        rows: 5, 
        cols: 8, 
        type: 'recliner',
        aisleAfter: [4], 
        price: 85.0
    },
    'BEANIE': { 
        rows: 4, 
        cols: 6, 
        type: 'beanbag',
        aisleAfter: [3],
        price: 40.0
    },
    'JUNIOR': { 
        rows: 6, 
        cols: 10, 
        type: 'kid-size',
        aisleAfter: [3, 7], 
        price: 25.0
    }
};