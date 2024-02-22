# Backend task
<p align="justify">✍ This project involves the creation of a suite of RESTful APIs designed to manage, analyze, and visualize transaction data. The goal is to build a robust backend system that can initialize a database with seed data from a third-party API, offer detailed transaction listings with search and pagination features, and provide insights through statistical analysis and chart data generation.</p>


### Click the Go Live button and see the live👉 [Go Live](https://roxiler-backend-uslm.onrender.com)

### Data Source Initialization
   - <b style="color:black">Task:</b> Develop an API endpoint to seed the database with initial data.
   - <b style="color:black">Source:</b> Data will be fetched from <b style="color:black">https://s3.amazonaws.com/roxiler.com/product_transaction.json</b> using a GET request.
   - <b style="color:black">Details:</b> The API should parse the JSON response and populate the database accordingly, ensuring an efficient structure for future queries.
### List All Transactions
   - ##### Method: GET
   - ##### Features:
       - ###### Support search and pagination.
       - ###### Filter transactions based on search parameters (product title, description, price).
       - ###### Return all records for a given page number  
       - ###### Default pagination: page = 1, per page = 10.
### Generate Statistics
   - ##### Method: GET
   - ##### Output:
      - ###### Total sale amount for the selected month.
      - ###### Total number of sold items for the selected month.
      - ###### Total number of not sold items for the selected month.

### Chart Data APIs
   - ##### Method: GET
   - ##### <b style="color:black"> =Description:</b>  Create an API to provide data for a bar chart, including price ranges and the count of items within those ranges for the selected month, regardless of the year.
### Input Parameters:
   - ###### <p align="justify">All APIs should accept a month parameter, representing any month from January to December, and should compare this against the dateOfSale field in the data, regardless of the year.</p>
