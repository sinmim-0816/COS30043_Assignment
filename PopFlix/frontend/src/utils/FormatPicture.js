const backendOrigin = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const resolveBackendAssetPath = (assetPath) => {
    if (!assetPath) {
        return '';
    }

    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
        return assetPath;
    }

    if (assetPath.startsWith('data:') || assetPath.startsWith('blob:')) {
        return assetPath;
    }

    return `${backendOrigin}${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
};