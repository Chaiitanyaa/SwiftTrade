1. first setup mongosh: mongodb://localhost:27017

2. skip: then in mongosh create the following database:
	use tradingdb
	db.createCollection("users")
	db.createCollection("transactions")
	db.createCollection("wallets")


3. install nodeJS and run the follwoing commands to run the server:
	
	npm install
	npm install uuid
	
	install dependancies
	
		express
		
	
	node src/server.js

then  Expected Output:
	MongoDB connected successfully
	Server running on http://localhost:5000

4. API Testing in Postman

Register a New User (POST /api/users/register)
- Method: POST
- URL: http://localhost:5000/api/users/register
- Headers: Content-Type: application/json
- Body:

{
  "user_name": "VanguardETF",
  "password": "Vang@123",
  "name": "Vanguard Corp."
}

- Expected Response:
{
  "success": true,
  "data": null
}


Log In (POST /api/users/login)
- Method: POST
- URL: http://localhost:5000/api/users/login
- Headers: Content-Type: application/json
- Body:

{
  "user_name": "VanguardETF",
  "password": "Vang@123"
}

- Expected Response:

{
  "success": true,
  "data": { "token": "<JWT_TOKEN>" }
}

Access Transactions (GET /api/transactions)
- Method: GET
- URL: http://localhost:5000/api/transactions
- Headers:
  Authorization: Bearer <JWT_TOKEN>
- Expected Response:

{
    "success": true,
    "data": {
        "message": "This is a protected transaction route!"
    }
}


5. from here you can now test the remaining Api requestions:

	but remember for the POST requests the header must be following:
		
		**note only exception is the Login request for now only Authorization is required look steps 4**
		
		Authorization: Bearer <your_jwt_token>
		Content-Type: application/json
		
	and for Get requests the header only:
		Authorization: Bearer <your_jwt_token>
		
		
6. here is the list of the currect API links implemented:

	http://localhost:5000/api/users/register
	
	http://localhost:5000/api/stocks/createStock
	
	http://localhost:5000/api/stocks/addStockToUser
	
	http://localhost:5000/api/stocks/getStockPortfolio
	
	http://localhost:5000/api/stocks/placeStockOrder
	
	http://localhost:5000/api/transactions/getStockTransactions
	
	
	
	If also you need to access the mongodb database and check manullay here is some usefull commands:
	
		use tradingdb
		show collections
		db.stocks.find().pretty()
		db.users.find().pretty()
		
		
		for deleting a stock and retesting: db.stocks.deleteOne({ stock_name: "Google" })
	
	



