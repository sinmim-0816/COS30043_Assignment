export const getCertImage = (cert) => {
    const images = {
        'U': '/img/universal_logo.png',
        'P13': '/img/p13_logo.png',
        'P18': '/img/p18_logo.png'
    };
    return images[cert] || images['U']; 
};