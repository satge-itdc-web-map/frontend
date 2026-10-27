// Configuration centralisée - modifiez uniquement ce fichier ou le .env si le serveur change
const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://64.177.43.210:4000',
  MAP_TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  OSRM_URL: 'https://router.project-osrm.org/route/v1',
};

export default config;