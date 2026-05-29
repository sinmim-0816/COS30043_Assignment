const backendOrigin = 'http://localhost:3000';

export const resolveBackendAssetPath = (assetPath) => {
    if (!assetPath) {
        return '';
    }

    if (assetPath.startsWith('data:') || assetPath.startsWith('blob:')) {
        return assetPath;
    }

    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
        return assetPath;
    }

    return `${backendOrigin}${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
};

export const resolveCinemaImage = (imagePath) => {
    if (!imagePath) {
        return '';
    }

    return resolveBackendAssetPath(imagePath);
};
