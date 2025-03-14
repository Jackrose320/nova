// database
const db = require('@nexirift/db');

async function fetchData() {
    try {
        const data = await db.query('SELECT * FROM users');  
        console.log(JSON.stringify(data));  // Output data as JSON for Python
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchData();