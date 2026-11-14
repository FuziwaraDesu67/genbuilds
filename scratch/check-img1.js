const fs = require('fs');

// Let's copy media_1793809991034_930c359a.png to artifacts and inspect
const src = 'C:/Users/AMD/.gemini/antigravity/brain/40659808-9ea6-4c22-b13c-1465c4676c01/.user_uploaded/media_1793809991034_930c359a.png';
console.log('Exists:', fs.existsSync(src));
