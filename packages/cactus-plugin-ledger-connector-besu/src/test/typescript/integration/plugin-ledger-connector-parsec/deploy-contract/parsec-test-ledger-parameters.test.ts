import { ParsecTestLedger } from "@hyperledger/cactus-test-tooling";
import "jest-extended";

const testCase = "PluginLedgerConnectorParsec:deploy-contract";

describe(testCase, () => {
  test("constructor does not throw with the default config", async () => {
    // No options
    const parsecTestLedger = new ParsecTestLedger();

    expect(parsecTestLedger).toBeTruthy();
  });

  test("Parsec environment variables passed correctly", async () => {
    const simpleEnvVars = [
      "PARSEC_MINER_ENABLED",
      "PARSEC_NETWORK=dev",
      "PARSEC_MIN_GAS_PRICE=0",
    ];

    const parsecOptions = {
      envVars: simpleEnvVars,
    };
    const parsecTestLedger = new ParsecTestLedger(parsecOptions);

    expect(parsecTestLedger.envVars).toEqual(simpleEnvVars);
    expect(parsecTestLedger).toBeTruthy();
  });

  test("deploys a Parsec Node on the Rinkeby network", async () => {
    const rinkebyNetworkEnvVars = [
      "PARSEC_MOUNT_TYPE=bind",
      "PARSEC_MINER_ENABLED",
      "PARSEC_MINER_COINBASE=fe3b557e8fb62b89f4916b721be55ceb828dbd73",
      "PARSEC_SOURCE=/<myvolume/parsec/testnode>",
      "PARSEC_NETWORK=rinkeby",
      "PARSEC_MIN_GAS_PRICE=0",
      "PARSEC_TARGET=/var/lib/parsec hyperledger/parsec:latest",
    ];
    const parsecOptions = {
      envVars: rinkebyNetworkEnvVars,
    };

    const parsecTestLedger = new ParsecTestLedger(parsecOptions);

    expect(parsecTestLedger.envVars).toEqual(rinkebyNetworkEnvVars);
    expect(parsecTestLedger).toBeTruthy();
  });

  test("deploys a Parsec Node on the Ropsten network", async () => {
    // const rinkebyNetworkParameters = "--mount type=bind,source=/<myvolume/parsec/testnode>,target=/var/lib/parsec hyperledger/parsec:latest --miner-enabled --miner-coinbase fe3b557e8fb62b89f4916b721be55ceb828dbd73--network=dev --min-gas-price=0";
    const rinkebyNetworkEnvVars = [
      "PARSEC_MOUNT_TYPE=bind",
      "PARSEC_MINER_ENABLED",
      "PARSEC_MINER_COINBASE=fe3b557e8fb62b89f4916b721be55ceb828dbd73",
      "PARSEC_SOURCE=/<myvolume/parsec/testnode>",
      "PARSEC_NETWORK=ropsten",
      "PARSEC_MIN_GAS_PRICE=0",
      "PARSEC_TARGET=/var/lib/parsec hyperledger/parsec:latest",
    ];
    const parsecOptions = {
      envVars: rinkebyNetworkEnvVars,
    };

    const parsecTestLedger = new ParsecTestLedger(parsecOptions);

    expect(parsecTestLedger.envVars).toEqual(rinkebyNetworkEnvVars);
    expect(parsecTestLedger).toBeTruthy();
  });

  test("deploys a Parsec Node on the Goerli network", async () => {
    // const rinkebyNetworkParameters = "--mount type=bind,source=/<myvolume/parsec/testnode>,target=/var/lib/parsec hyperledger/parsec:latest --miner-enabled --miner-coinbase fe3b557e8fb62b89f4916b721be55ceb828dbd73--network=dev --min-gas-price=0";
    const rinkebyNetworkEnvVars = [
      "PARSEC_MOUNT_TYPE=bind",
      "PARSEC_MINER_ENABLED",
      "PARSEC_MINER_COINBASE=fe3b557e8fb62b89f4916b721be55ceb828dbd73",
      "PARSEC_SOURCE=/<myvolume/parsec/testnode>",
      "PARSEC_NETWORK=goerli",
      "PARSEC_MIN_GAS_PRICE=0",
      "PARSEC_TARGET=/var/lib/parsec hyperledger/parsec:latest",
    ];
    const parsecOptions = {
      envVars: rinkebyNetworkEnvVars,
    };

    const parsecTestLedger = new ParsecTestLedger(parsecOptions);

    expect(parsecTestLedger.envVars).toEqual(rinkebyNetworkEnvVars);
    expect(parsecTestLedger).toBeTruthy();
  });

  test("deploys a Parsec Node on the Ethereum main network", async () => {
    const ethereumEnvVars = [
      "PARSEC_TARGET=/var/lib/parsec",
      "PARSEC_PORT=30303:30303",
      "PARSEC_RCP_HTTP_ENABLED",
    ];
    const parsecOptions = {
      envVars: ethereumEnvVars,
    };
    const parsecTestLedger = new ParsecTestLedger(parsecOptions);

    expect(parsecTestLedger.envVars).toEqual(ethereumEnvVars);
    expect(parsecTestLedger).toBeTruthy();
  });
});
