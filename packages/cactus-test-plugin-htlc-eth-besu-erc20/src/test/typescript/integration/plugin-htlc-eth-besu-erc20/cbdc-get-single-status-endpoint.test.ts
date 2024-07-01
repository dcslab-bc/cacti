import "jest-extended";

import {
  PluginHtlcOpenCBDC
} from "../../../../../../cactus-plugin-htlc-eth-besu-erc20/src/main/typescript/plugin-htlc-opencbdc";

const testCase = "Test get single status";
describe(testCase, () => {
  test(testCase, async () => {
    const plugin = new PluginHtlcOpenCBDC();

    const res = await plugin.getSingleStatus({
      HTLCId: "abcdefg",
      signingCredential: {"cbdcAccount":"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1","secret":"0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d","type":"PRIVATE_KEY_HEX"},
      inputAmount: 10,
      receiver: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
      hashLock: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
      expiration: 2147483648,
    });
    expect(res.status).toEqual(200);
    expect(res.data).toEqual(1);
  });
});
