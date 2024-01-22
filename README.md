# Introduction

EveryFin is an aggregation of DeFi services intended for retail customerss to build a platform that allows anyone to enter the DeFi spacemanage
digital  money. This includes the full suite of services starting from transferring fiat into crypto and back, makjng payments and transfers, investing into DeFi products such as staking, lending or investing into crypto indexes, store and send crypto, as well as basic trading, staking, lending, and investing into crypto indexes and others. The goal is to build a platform is non-custodial, pay-per-use and simple to use platform with a focus on the best user experience. The available DeFi investments are curated by EveryFin with considerations given to security and liquidity. 

EveryFin’s mission is create trust in digital money by giving everyone access and making it simple to use. for the end customer segment, with a focus on the Swiss marketsp, that makes products available that are actively curated by EveryFin. 

# Project Description

In the MVP phase EveryFin only works on the avalanche network and includes 3 big parts. 
- Trading
- Stacking
- Landing 

EveryFin does not develop own exchange, staking and lending mechanisms, only connects to existing smart contracts. And takes a small commission for some operations. 


 As an example with trading: We build a functionality on the frontend similar to Trader Joe's XYZ or Uniswap. 
 When making an exchange, the funds first go through our proxy contracts where the commission is charged, and the remaining amount of funds goes to [TraderJoeV2Router02 Address](https://snowtrace.io/address/0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C3)     


The basic architecture scheme looks like: 

User UI -> EveryFin Proxy contracts -> Traget contract  

We are currently working on a proxy contract for trading part using Trader Joe's XYZ. And this part is in active development and is not finished yet



## Tech Stack

**Smart Contracts:** Solidity

**Tests/Deploy scripts:** Node, Hardhat, Ganache, Mocha, Chai

## Launch

Clone the project

```bash
  git clone https://git.machinadev.com/everyfin/EveryFin_Contracts
```

Go to the project directory

```bash
  cd EveryFin_Contracts
```

Install dependencies

```bash
  npm install
```

## Running Tests

The testnet network (fuji) does not contain all the trading pairs we need, and in order not to spend a lot of real money on development we use a local fork of the main avalanche network. 

You can set the block number you need or add/modify the necessary networks in the file hardhat.config.js 

To run the test:
```bash
  npm run test
```


## Deployment

Also you can deploy to contracts to the avalanche mainnet network and test all using Metamask, Remix or any other tool
```bash
 npm run deploy:avalanche
```
Or you can deploy to avalance testnet (fuji), but for this change the adress of TraderJoeV2Router02 and WAVAX addresses in deployment files.
```bash
npm run deploy:fuji
```
## Environment Variables

You can run this project with your variables, just add it to your .env file (look .env.example)

`MNEMONIC`

`SNOWTRACE_API_KEY`

`INFURA_KEY`

The project will also run without .env, The project code, if there is no .env, will use some of its own safe variables



## Roadmap

- Trading functional using proxy contracts on Avalanche network, using [Trader Joe XYZ](https://traderjoexyz.com/trade) 

- Staking functional using  proxy contracts on Avalanche network, using [Benqi.fi Staking](https://staking.benqi.fi/stake)

- Lending functional using proxy contracts on Avalanche network, using [Benqi.fi Lending](https://app.benqi.fi/markets)

## Author

Oleksandr Serbinov

- Email: olexandr.serbinov@machinalabs.net
- Telegram: [serbinov](https://t.me/serbinov)

Feel free to ask any questions or or suggest your ideas.