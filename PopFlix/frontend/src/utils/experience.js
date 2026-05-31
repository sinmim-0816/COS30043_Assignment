export const EXPERIENCE_NAMES = ['IMAX', 'DOLBY', '4DX', 'LUXE', 'INDULGE', 'BEANIE', 'JUNIOR'];

export const EXPERIENCE_COLORS = {
    'IMAX': { bg: '#0071ba', text: 'white' },
    'DOLBY': { bg: '#6b6b6b', text: 'white' },
    '4DX': { bg: '#e11d48', text: 'white' },
    'LUXE': { bg: '#d4af37', text: 'black' },
    'INDULGE': { bg: '#8b5cf6', text: 'white' },
    'BEANIE': { bg: '#37cc50', text: 'white' },
    'JUNIOR': { bg: '#facc15', text: 'black' }
};

export const getExperienceStyle = (name) => {
    const theme = EXPERIENCE_COLORS[name] || { bg: '#ccc', text: '#000' };
    
    return {
        color: theme.bg,
        textColor: theme.text,
        hoverBg: `${theme.bg}1A`,
    };
};

export const getExpButtonStyle = (name) => {
    const style = getExperienceStyle(name);
    return {
        '--exp-color': style.color,
        '--exp-text': style.textColor,
        '--exp-hover-bg': style.hoverBg,
    }
};
