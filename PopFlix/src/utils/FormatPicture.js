const backendOrigin = 'http://localhost:3000';

export const resolveCinemaImage = (imagePath) => {
    if (!imagePath) {
        return '';
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    return `${backendOrigin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};