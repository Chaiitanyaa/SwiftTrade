# SwiftTrade

SwiftTrade is a full-stack day trading application that allows users to manage their stock trading activities efficiently. The application supports a wide range of features, including account management, real-time stock price updates, and transaction auditing.

## Features

- View account balance and transaction history
- Add money to the account through a wallet
- Get current stock prices
- Buy shares with market orders
- Set automated sell points with limit orders
- Review complete transaction history
- Cancel pending limit orders
- Full auditing capabilities with transaction logs

## Technology Stack

- **Front-End**: React.js
- **Back-End**: Node.js with Express.js
- **Database**: MongoDB
- **Real-Time Updates**: WebSockets

## Getting Started

### Prerequisites

- Docker compose

### Install & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/Chaiitanyaa/SwiftTrade.git
   ```

2. Run the Docker Containers
   ```bash
   docker compose up --build
   ```

3. Load test data (Deletes all existing data)
   ```bash
   curl localhost:5000/api/loadTestData
   ```

