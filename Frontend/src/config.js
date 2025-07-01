const config = {
    development: {
        API_BASE_URL: 'http://localhost:5000/api/v1'
    },
    production: {
        API_BASE_URL: 'https://jumpandlearn.onrender.com'
    }
};

// Detect environment (Netlify sets NODE_ENV automatically)
const environment = window.location.hostname === 'localhost' ? 'development' : 'production';
const API_CONFIG = config[environment];

export default API_CONFIG;