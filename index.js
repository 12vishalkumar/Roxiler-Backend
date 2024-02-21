//----------------- Importing required libararies ------------------------//
const express = require("express");
const cors = require('cors');
const app = express();
module.exports = app;
app.use(cors());
app.use(express.json());

//------------------ SQLite DB connection ------------------//
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');


const PORT = 5000;
let db = null;
const initializeDbAndServer = async () => {
    try {
        db = await sqlite.open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        console.log('Connected to the SQLite Database Successfully!');
        app.listen(PORT, function(err){
            if(err){
             console.log("Error in running the server:", err);
            }
            console.log("Server Is Running On Port:", PORT);
        });
    } catch (error) {
        console.error('Failed to connect to SQLite Database:', error);
        process.exit(1); // Exit the process if the database connection fails
    }
};
initializeDbAndServer();

//--------------- Add this right before the app.listen call ----------------//
app.get('/', (req, res) => {
    try{
      res.send('Welcome to my API! Please use /api to access the endpoints.');
    }catch (e) {
      console.error(e.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});


//------------------------- Create an API for transactions -------------------//
app.get('/transactions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        const search = req.query.search ? req.query.search.toLowerCase() : '';
        const selectedMonth = req.query.month.toLowerCase() || 'march';

        const monthMap = {
            'january': '01',
            'february': '02',
            'march': '03',
            'april': '04',
            'may': '05',
            'june': '06',
            'july': '07',
            'august': '08',
            'september': '09',
            'october': '10',
            'november': '11',
            'december': '12',
        };

        const numericMonth = monthMap[selectedMonth.toLowerCase()];
        const sqlQuery = `
            SELECT *
            FROM products
                WHERE
                strftime('%m', dateOfSale) = ?
                AND (
                    lower(title) LIKE '%${search}%'
                    OR lower(description) LIKE '%${search}%'
                    OR CAST(price AS TEXT) LIKE '%${search}%'
                )
            LIMIT ${perPage} OFFSET ${(page - 1) * perPage};
        `;

        const rows = await db.all(sqlQuery,[numericMonth]);
        res.json({
            page,
            perPage,
            transactions: rows
        });
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//-------------------- Create an API for statistics --------------------//
app.get('/statistics', async (req, res) => {
    try {
        console.log('Request received for /statistics');
        const selectedMonth = req.query.month || 'march';
        console.log('Selected Month:', selectedMonth);
        if (!selectedMonth) {
            return res.status(400).json({ error: 'Month parameter is required.' });
        }

        const monthMap = {
            'january': '01',
            'february': '02',
            'march': '03',
            'april': '04',
            'may': '05',
            'june': '06',
            'july': '07',
            'august': '08',
            'september': '09',
            'october': '10',
            'november': '11',
            'december': '12',
        };

        const numericMonth = monthMap[selectedMonth.toLowerCase()];
        if (!numericMonth) {
            return res.status(400).json({ error: 'Invalid month name.' });
        }
        const sqlQuery = `
            SELECT
                SUM(CASE WHEN sold = 1 THEN price ELSE 0 END) as totalSaleAmount,
                COUNT(CASE WHEN sold = 1 THEN 1 END) as totalSoldItems,
                COUNT(CASE WHEN sold = 0 THEN 1 END) as totalNotSoldItems
            FROM products
            WHERE strftime('%m', dateOfSale) = ?;
        `;

        const statistics = await db.get(sqlQuery, [numericMonth]);
        if (!statistics) {
            return res.status(404).json({ error: 'No data found for the selected month.' });
        }
        res.json({
            selectedMonth,
            totalSaleAmount: Math.floor(statistics.totalSaleAmount) || 0,
            totalSoldItems: statistics.totalSoldItems || 0,
            totalNotSoldItems: statistics.totalNotSoldItems || 0
        });
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//------------------------- Create an API for bar chart ----------------//
app.get('/bar-chart', async (req, res) => {
    try {
        const selectedMonth = req.query.month || 'march';

        const monthMap = {
            'january': '01',
            'february': '02',
            'march': '03',
            'april': '04',
            'may': '05',
            'june': '06',
            'july': '07',
            'august': '08',
            'september': '09',
            'october': '10',
            'november': '11',
            'december': '12',
        };

        if (!selectedMonth) {
            return res.status(400).json({ error: 'Month parameter is required.' });
        }
        const numericMonth = monthMap[selectedMonth.toLowerCase()];
        const sqlQuery = `
            SELECT
                priceRanges.priceRange, COUNT(products.price) as itemCount
                FROM (
                    SELECT '0 - 100' as priceRange, 0 as MIN_RANGE, 100 as MAX_RANGE
                    UNION SELECT '101 - 200', 101, 200
                    UNION SELECT '201 - 300', 201, 300
                    UNION SELECT '301 - 400', 301, 400
                    UNION SELECT '401 - 500', 401, 500
                    UNION SELECT '501 - 600', 501, 600
                    UNION SELECT '601 - 700', 601, 700
                    UNION SELECT '701 - 800', 701, 800
                    UNION SELECT '801 - 900', 801, 900
                    UNION SELECT '901-above', 901, 9999999
                ) as priceRanges
            LEFT JOIN products ON strftime('%m', dateOfSale) = ? AND price BETWEEN MIN_RANGE AND MAX_RANGE
            GROUP BY priceRanges.priceRange;
        `;

        const barChartData = await db.all(sqlQuery, [numericMonth]);
        res.json(barChartData);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//--------------------- Create an API for pie chart --------------------//
app.get('/pie-chart', async (req, res) => {
    try {
        const selectedMonth = req.query.month || 'march';
        if (!selectedMonth) {
            return res.status(400).json({ error: 'Month parameter is required.' });
        }

        const monthMap = {
            'january': '01',
            'february': '02',
            'march': '03',
            'april': '04',
            'may': '05',
            'june': '06',
            'july': '07',
            'august': '08',
            'september': '09',
            'october': '10',
            'november': '11',
            'december': '12',
        };

        const numericMonth = monthMap[selectedMonth.toLowerCase()];
        const sqlQuery = `
            SELECT 
                DISTINCT category, COUNT(*) as itemCount
            FROM products
            WHERE strftime('%m', dateOfSale) = ?
            GROUP BY category;
        `;

        const pieChartData = await db.all(sqlQuery, [numericMonth]);
        res.json(pieChartData);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//---------------------- Create an API for combined-data -------------------//
app.get('/combined-data', async (req, res) => {
    try {
        const selectedMonth = req.query.month || 'march';
        const {search, page, perPage} = req.query
        if (!selectedMonth) {
            return res.status(400).json({ error: 'Month parameter is required.' });
        }

        const monthMap = {
            'january': '01',
            'february': '02',
            'march': '03',
            'april': '04',
            'may': '05',
            'june': '06',
            'july': '07',
            'august': '08',
            'september': '09',
            'october': '10',
            'november': '11',
            'december': '12',
        };

        const numericMonth = monthMap[selectedMonth.toLowerCase()];
        const transactionsData = await fetchTransactions(numericMonth,search, page || 1, perPage || 10);
        const statisticsData = await fetchStatistics(numericMonth);
        const barChartData = await fetchBarChart(numericMonth);
        const pieChartData = await fetchPieChart(numericMonth);
        const combinedResponse = {
            transactions: transactionsData,
            statistics: statisticsData,
            barChart: barChartData,
            pieChart: pieChartData,
        };

        res.json(combinedResponse);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//------------------------------------ DATA FETCHING ---------------------------------//
//---------------------------- Function to fetch transactions data -------------------//
async function fetchTransactions(numericMonth, search, page, perPage) {
    const sqlQuery = `
        SELECT *
        FROM products
        WHERE
            strftime('%m', dateOfSale) = ?
            AND (
                lower(title) LIKE '%${search}%'
                OR lower(description) LIKE '%${search}%'
                OR CAST(price AS TEXT) LIKE '%${search}%'
            )
        LIMIT ${perPage} OFFSET ${(page - 1) * perPage};
    `;

    const transactionsData = await db.all(sqlQuery, [numericMonth]);
    return transactionsData;
}

//--------------- Function to fetch statistics data ----------------//
async function fetchStatistics(numericMonth) {
    const sqlQuery = `
      SELECT
        CAST(SUM(CASE WHEN sold = 1 THEN price ELSE 0 END) as INT) as totalSaleAmount,
        COUNT(CASE WHEN sold = 1 THEN 1 END) as totalSoldItems,
        COUNT(CASE WHEN sold = 0 THEN 1 END) as totalNotSoldItems
      FROM products
      WHERE strftime('%m', dateOfSale) = ?;
    `;

    const statisticsData = await db.get(sqlQuery, [numericMonth]);
    return statisticsData;
}

//-------------------------- Function to fetch bar-chart data ----------------//
async function fetchBarChart(numericMonth) {
    const sqlQuery = `
        SELECT
            CASE
                WHEN price BETWEEN 0 AND 100 THEN '0 - 100'
                WHEN price BETWEEN 101 AND 200 THEN '101 - 200'
                WHEN price BETWEEN 201 AND 300 THEN '201 - 300'
                WHEN price BETWEEN 301 AND 400 THEN '301 - 400'
                WHEN price BETWEEN 401 AND 500 THEN '401 - 500'
                WHEN price BETWEEN 501 AND 600 THEN '501 - 600'
                WHEN price BETWEEN 601 AND 700 THEN '601 - 700'
                WHEN price BETWEEN 701 AND 800 THEN '701 - 800'
                WHEN price BETWEEN 801 AND 900 THEN '801 - 900'
                WHEN price >= 901 THEN '901-above'
            END as priceRange,
            COUNT(*) as itemCount
        FROM products
        WHERE strftime('%m', dateOfSale) = ?
        GROUP BY priceRange;
    `;

    const barChartData = await db.all(sqlQuery, [numericMonth]);
    return barChartData;
}

//------------------- Function to fetch pie-chart data ----------------//
async function fetchPieChart(numericMonth) {
    const sqlQuery = `
        SELECT 
            DISTINCT category, COUNT(*) as itemCount
        FROM products
        WHERE strftime('%m', dateOfSale) = ?
        GROUP BY category;
    `;
    
    const pieChartData = await db.all(sqlQuery, [numericMonth]);
    return pieChartData;
}

//------------------------------------- THE END ---------------------------------------//