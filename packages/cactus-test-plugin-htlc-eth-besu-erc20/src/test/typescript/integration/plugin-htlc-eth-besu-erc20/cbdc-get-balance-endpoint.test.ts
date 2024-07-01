import "jest-extended";

import {
  PluginHtlcOpenCBDC
} from "../../../../../../cactus-plugin-htlc-eth-besu-erc20/src/main/typescript/plugin-htlc-opencbdc";


const testCase = "Test refund endpoint";
describe(testCase, () => {


  test(testCase, async () => {
    const plugin = new PluginHtlcOpenCBDC();
    const getBalanceRequest: any = {
      address: '0xab94eFe55d465a02c5a0a7ca4eD83E98EeddE5aE'
    }
    
    const resBalance = await plugin.getBalance(getBalanceRequest);
    console.log(resBalance);
    expect(resBalance.data).toEqual(66);
  });
});
