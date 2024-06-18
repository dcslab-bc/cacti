import "jest-extended";
import {
  WithdrawRequest,
} from "@hyperledger/cactus-plugin-htlc-eth-besu-erc20";

import {
  PluginHtlcOpenCBDC
} from "../../../../../../cactus-plugin-htlc-eth-besu-erc20/src/main/typescript/plugin-htlc-opencbdc";


const testCase = "Test withdraw endpoint";
describe(testCase, () => {


  test(testCase, async () => {
    const plugin = new PluginHtlcOpenCBDC();
    const withdrawRequest: any = {
      HTLCId: '0x632a02d785a0886745d01c095d001522b4eb3283bff5e6fe53c500c45aa0c0fb',
      web3SigningCredential: {
        ethAccount: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        secret: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
        type: 'PRIVATE_KEY_HEX'
      },
      connectorId: 'ff74336f-6533-429e-b8a3-10764dbff304',
      keychainId: '8ce20052-3768-4035-a974-749805228b2c'
    };
    const resWithdraw = await plugin.withdraw(withdrawRequest);
    console.log(resWithdraw);
    expect(resWithdraw.data).toEqual(555);
  });
});