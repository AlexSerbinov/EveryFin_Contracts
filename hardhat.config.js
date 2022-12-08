require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  defaultNetwork: "fuji",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      gasPrice: 30000000000,
      gasLimit: 6000000,
      chainId: 43113,
      // accounts: { mnemonic: process.env.MNEMONIC },
      accounts: {
        mnemonic: "bronze elder mind disorder radio jazz filter brass ride wise time fetch",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      gasPrice: 225000000000,
      chainId: 43114,
      accounts: [],
    },
    localhost: {
      url: `http://127.0.0.1:8545`,
      chainId: 31337,
      gasPrice: 3000000000,
      gasMultiplier: 1,
    },
    eth_mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      // url: `https://eth-mainnet.g.alchemy.com/v2/pxHJ_DLdqCcU5vz9ZSNDsmOnYaSuIUUW`,
      chainId: 1,
    },
    hardhat: {
      accounts: {
        mnemonic: "bronze elder mind disorder radio jazz filter brass ride wise time fetch",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
      forking: {
        url: "https://api.avax-test.network/ext/bc/C/rpc",
        blockNumber: 15911387,
        // gasPrice: 30000000000,
        // gasLimit: 30022616,
        // url: "https://api.avax.network/ext/bc/C/rpc",
        // blockNumber: 22510210,
        // url: "https://eth-mainnet.g.alchemy.com/v2/pxHJ_DLdqCcU5vz9ZSNDsmOnYaSuIUUW",
        // blockNumber: 16028959,
      },
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.4.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.5.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      {
        version: "0.8.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
    ],
  },
  paths: {
    sources: "./contracts/",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 3000000000000,
  },
  etherscan: {
    apiKey: {
      // avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY
      avalancheFujiTestnet: "IJ8ZC6H5IFNBBT7TUKHTG22DJ4VQ2R82U6",
    },
  },
};
