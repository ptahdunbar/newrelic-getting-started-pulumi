// Import the New Relic agent configuration module.
require('newrelic');

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    // Deliberately return a server error.
    res.status(500).json({
        message: 'Oh no! Something went wrong.'
    });
});

app.listen(port, () => {
    console.log(`Now listening on port ${port}...`);
});
