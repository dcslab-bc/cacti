import "jest-extended";

import {
  PluginHtlcOpenCBDC
} from "../../../../../../cactus-plugin-htlc-eth-besu-erc20/src/main/typescript/plugin-htlc-opencbdc";


const testCase = "Test refund endpoint";
describe(testCase, () => {


  test(testCase, async () => {
    const plugin = new PluginHtlcOpenCBDC();
    const refundRequest: any = {
      HTLCId: '0x1186a343f8f03f4a0c9de40592245c3d5599da2d4ac8f17fb63694d419c04f2c',
      signingCredential: {
        cbdcAccount: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        secret: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
        type: 'PRIVATE_KEY_HEX'
      },
    }
    
    const resRefund = await plugin.refund(refundRequest);
    console.log(resRefund);
    expect(resRefund.status).toEqual(200);
  });
});
