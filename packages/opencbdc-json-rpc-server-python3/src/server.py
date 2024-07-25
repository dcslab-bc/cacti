from flask import Flask, request, jsonify
from datetime import datetime
import pytz
import subprocess
import time

g_wallet_0 = ""
g_wallet_1 = ""
g_wallet_2 = ""

app = Flask(__name__)

def log_request(req):
    print(datetime.now(pytz.timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M:%S'), req.remote_addr, req.path)
    print(req.json)

@app.route('/api/opencbdc', methods=['GET'])
def opencbdc():
    return jsonify({
        'deposit': '/api/opencbdc/deposit',
        'getsinglestatus': '/api/opencbdc/getsinglestatus',
        'withdraw': '/api/opencbdc/withdraw',
        'refund': '/api/opencbdc/refund',
        'getbalance': '/api/opencbdc/getbalance',
        'init': '/api/opencbdc/init'
    })

@app.route('/api/opencbdc/init', methods=['POST'])
def init():
    response = {
        "success": True,
    }

    log_request(request)
    return jsonify(response), 200

@app.route('/api/opencbdc/getsecret', methods=['POST'])
def get_secret():
    data = request.get_json()

    address = data.get('address')

    print("Address:", address)

    response = {
        "secret": '0x50216399786df46d2dd627774101951f5dcd8d4b9dd4dadfa125320af1a2ab12',
    }

    log_request(request)
    return jsonify(response), 200



    
@app.route('/api/opencbdc/deposit', methods=['POST'])
def new_contract():
    data = request.get_json()
    contract_address = data.get('contractAddress')
    input_amount = data.get('inputAmount')
    output_amount = data.get('outputAmount')
    expiration = data.get('expiration')
    hash_lock = data.get('hashLock')
    token_address = data.get('tokenAddress')
    receiver = data.get('receiver')
    output_network = data.get('outputNetwork')
    output_address = data.get('outputAddress')

    web3_signing_credential = data.get('web3SigningCredential')
    eth_account = web3_signing_credential.get('ethAccount')
    secret = web3_signing_credential.get('secret')
    credential_type = web3_signing_credential.get('type')
    
    connector_id = data.get('connectorId')
    keychain_id = data.get('keychainId')    
    
    ###
    mint() #TODO: need to move /api/opencbdc/init API
    deposit()
    ###
    

    print("ContractAddress:", contract_address)
    print("InputAmount:", input_amount)
    print("OutputAmount:", output_amount)
    print("Expiration:", expiration)
    print("HashLock:", hash_lock)
    print("TokenAddress", token_address)
    print("Receiver:", receiver)
    print("OutputNetwork:", output_network)
    print("OutputAddress:", output_address)
    print("Web3SigningCredential:", web3_signing_credential)
    print("  EthAccount:", eth_account)
    print("  Secret:", secret)
    print("  Type:", credential_type)
    
    

    response = {
        "success": True,
        "HTLCId": "abcdefg"
    }

    log_request(request)
    return jsonify(response), 200

@app.route('/api/opencbdc/getsinglestatus', methods=['POST'])
def get_single_status():
    data = request.get_json()

    id = data.get('id')
    web3_signing_credential = data.get('web3SigningCredential')
    eth_account = web3_signing_credential.get('ethAccount')
    secret = web3_signing_credential.get('secret')
    credential_type = web3_signing_credential.get('type')
    connector_id = data.get('connectorId')
    keychain_id = data.get('keychainId')
    htlc_id = data.get('HTLCId')
    input_amount = data.get('inputAmount')
    receiver = data.get('receiver')
    hash_lock = data.get('hashLock')
    expiration = data.get('expiration')
    
    ###
    getSingleStatus()
    ###
    
    print("ID:", id)
    print("Web3SigningCredential:", web3_signing_credential)
    print("  ethAccount:", eth_account)
    print("  Secret:", secret)
    print("  Type:", credential_type)
    print("ConnectorId:", connector_id)
    print("KeychainId:", keychain_id)

    print("HTLCId:", htlc_id)
    print("InputAmount:", input_amount)
    print("Receiver:", receiver)
    print("HashLock:", hash_lock)
    print("Expiration:", expiration) 

    log_request(request)
    return jsonify(1), 200

@app.route('/api/opencbdc/withdraw', methods=['POST'])
def withdraw():
    data = request.get_json()
    id = data.get('id')
    secret = data.get('secret')
    web3_signing_credential = data.get('web3SigningCredential')
    eth_account = web3_signing_credential.get('ethAccount')
    web3_secret = web3_signing_credential.get('secret')
    credential_type = web3_signing_credential.get('type')
    connector_id = data.get('connectorId')
    keychain_id = data.get('keychainId')
    gas = data.get('gas')
    htlc_id = data.get('HTLCId')
    
    
    ###
    withdraw()
    ###
    
    print("ID:", id)
    print("Secret:", secret)
    print("Web3SigningCredential:", web3_signing_credential)
    print("  EthAccount:", eth_account)
    print("  Secret:", web3_secret)
    print("  Type:", credential_type)
    print("ConnectorId:", connector_id)
    print("KeychainId:", keychain_id)
    print("Gas:", gas)
    print("HTLCId:", htlc_id)

    response = {
        "success": True,
    }

    log_request(request)
    return jsonify(response), 200

@app.route('/api/opencbdc/refund', methods=['POST'])
def refund():
    
    data = request.get_json()
    id = data.get('id')
    secret = data.get('secret')
    web3_signing_credential = data.get('web3SigningCredential')
    eth_account = web3_signing_credential.get('ethAccount')
    web3_secret = web3_signing_credential.get('secret')
    credential_type = web3_signing_credential.get('type')
    connector_id = data.get('connectorId')
    keychain_id = data.get('keychainId')
    gas = data.get('gas')
    htlc_id = data.get('HTLCId')
    
    ###
    refund()
    ###
    
    
    print("ID:", id)
    print("Secret:", secret)
    print("Web3SigningCredential:", web3_signing_credential)
    print("  EthAccount:", eth_account)
    print("  Secret:", web3_secret)
    print("  Type:", credential_type)
    print("ConnectorId:", connector_id)
    print("KeychainId:", keychain_id)
    print("Gas:", gas)
    print("HTLCId:", htlc_id)

    response = {
        "success": True,
    }

    log_request(request)
    return jsonify(response), 200

@app.route('/api/opencbdc/getbalance', methods=['POST'])
def get_balance():
    data = request.get_json()

    address = data.get('address')

    ###
    getBalance()
    ###

    print("Address:", address)

    response = {
        "balance": 100000000,
    }

    log_request(request)
    return jsonify(response), 200

############################################### open-cbdc
def mint():
    print("mint ~~")
    command = "./build/src/uhs/client/client-cli atomizer-compose.cfg mempool0.dat wallet0.dat newaddress && ./build/src/uhs/client/client-cli atomizer-compose.cfg mempool0.dat wallet0.dat mint 10 5 && ./build/src/uhs/client/client-cli atomizer-compose.cfg mempool1.dat wallet1.dat newaddress && ./build/src/uhs/client/client-cli atomizer-compose.cfg mempool2.dat wallet2.dat newaddress"
    print("[DEBUG for mint] command: " + command)

    # subprocess.run()을 사용하여 커맨드 실행
    result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # result sample
    # [2024-07-22 15:30:40.469] [WARN ] Existing wallet file not found
    # [2024-07-22 15:30:40.469] [WARN ] Existing client file not found
    # usd1qpntykwpf5ate4x6xp8fqthqjjmuwmlah0x7jzm748rznp8h6e34gmrkd8d
    # 97fe9ce2dc2a3950cba75c9e89fac0cc761fd0c55dd77b7b0fd1d344522e1718
    # [2024-07-22 15:30:40.723] [WARN ] Existing wallet file not found
    # [2024-07-22 15:30:40.723] [WARN ] Existing client file not found
    # usd1qqtl28hhuq8vjupuyjpnd5p484qqkfd0rdtay4w3dr3t8hcpd5j8xevtql2
    # [2024-07-22 15:30:40.848] [WARN ] Existing wallet file not found
    # [2024-07-22 15:30:40.848] [WARN ] Existing client file not found
    # usd1qq5mespl5tvvsj943tvnyg92qsw9fqtyckcye27gwjtu0r39fe7lq3haaxf

    # wallet 정보 추출 및 저장
    items = result.stdout.split("\n")
    items = [s for s in items if s.startswith("usd")]
    global g_wallet_0, g_wallet_1, g_wallet_2
    g_wallet_0 = items[0]  # SenderAddr (BoA)
    g_wallet_1 = items[1]  # ReceiverAddr (Hana)
    g_wallet_2 = items[2]  # HTLC_MODULE

    # 실행 결과 출력
    print("stdout (mint):")
    print(result.stdout)

    if result.stderr:
        print("[############ ALERT ############]")
        print("stderr (mint):")
        print(result.stderr)

    print("[DEBUG] wallet:", "PASS" if g_wallet_0 and g_wallet_1 and g_wallet_2 else "FAIL ($$$ Stop your test!! $$$)")
    print("[DEBUG] g_wallet_0:", g_wallet_0)
    print("[DEBUG] g_wallet_1:", g_wallet_1)
    print("[DEBUG] g_wallet_2:", g_wallet_2)
    
    # sync 커맨드 실행
    doSyncAndInfo("0")


def deposit():
    print("deposit ~~")
    # 실행할 커맨드
    command = "./build/src/uhs/client/client-cli atomizer-compose.cfg mempool0.dat wallet0.dat deposit preimage6c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b 3 " + g_wallet_0 + " " + g_wallet_1 + " " + g_wallet_2 + " hashqs3fzunpp0cs3044eaqfkjaj2a12 1819312603 htlcidb239c83a8ff069bd619c9b47c69471207e74ca9cf68cef274891f544f8"
    print("[DEBUG for deposit] command: " + command)

    # subprocess.run()을 사용하여 커맨드 실행
    result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # 실행 결과 출력
    print("stdout (deposit):")
    print(result.stdout)

    if result.stderr:
        print("[############ ALERT ############]")
        print("stderr (deposit):")  
        print(result.stderr)

    # result sample
    # 0: tx_id:
    # 1: 7465d8d84c2168380bed29ac8f9418cb66b9a6fddd547ea19d0d19587561de58
    # 2: Data for recipient importinput:
    # 3: 7465d8d84c2168380bed29ac8f9418cb66b9a6fddd547ea19d0d19587561de58000000...
    # 4: Sentinel responded: Pending

    # wallet 정보 추출 및 저장
    importinput = result.stdout.split("\n")[3]
    print("[DEBUG for deposit] importinput:" + importinput)

    # importinput 값을 Wallet2 (HTLC_MODULE)에 반영
    doHandleImportinput("2", importinput)

    # sync 커맨드 실행
    doSyncAndInfo("2")
    # getBalance("2")  ## "stderr (getBalance): Unknown command" 에러 메시지와 함께 동작 안함

def withdraw():
    print("withdraw ~~")
    command = "./build/src/uhs/client/client-cli atomizer-compose.cfg mempool1.dat wallet1.dat withdraw preimage6c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b htlcidb239c83a8ff069bd619c9b47c69471207e74ca9cf68cef274891f544f8"
    print("[DEBUG for withdraw] command: " + command)

    # subprocess.run()을 사용하여 커맨드 실행
    result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # 실행 결과 출력
    print("stdout (withdraw):")
    print(result.stdout)

    if result.stderr:
        print("[############ ALERT ############]")
        print("stderr (withdraw):")
        print(result.stderr)

    # result sample
    # inputAmount:3
    # receiverAddr:usd1qpxxv7ayg6gy00zcetpla3xf03nqexuml4ceal7acsv00qt7x3805pfkney

    # inputAmount, receiverAddr 값 추출
    data = result.stdout.split("\n")
    filtered_data = [item for item in data if '[' not in item]  # [WARN..과 같은 부가 로그 삭제
    inputAmount = filtered_data[0][12:]
    receiverAddr = filtered_data[1][13:-1]
    print("[DEBUG for withdraw] inputAmount:" + inputAmount)
    print("[DEBUG for withdraw] receiverAddr:" + receiverAddr + " (len: " + str(len(receiverAddr)) + ")")

    # send command (e.g., htlcModule -> receiverAddr)
    importinput = doSendTx("2", receiverAddr, inputAmount)

    # importinput command (receiverAddr wallet 값 업데이트를 위함)
    doHandleImportinput("2", importinput)

    # sync 커맨드 실행
    doSyncAndInfo("1")

def refund():
    print("refund ~~")
    # 실행할 커맨드
    command = "./build/src/uhs/client/client-cli atomizer-compose.cfg mempool1.dat wallet1.dat refund htlcidb239c83a8ff069bd619c9b47c69471207e74ca9cf68cef274891f544f8"
    print("[DEBUG for refund] command: " + command)

    # subprocess.run()을 사용하여 커맨드 실행
    result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # 실행 결과 출력
    print("stdout (refund):")
    print(result.stdout)

    if result.stderr:
        print("[############ ALERT ############]")
        print("stderr (refund):")
        print(result.stderr)

    # result sample
    # inputAmount:3
    # receiverAddr:usd1qpxxv7ayg6gy00zcetpla3xf03nqexuml4ceal7acsv00qt7x3805pfkney

    # inputAmount, receiverAddr 값 추출
    data = result.stdout.split("\n")
    inputAmount = data[0][12:]
    receiverAddr = data[1][13:-1]
    print("[DEBUG for refund] inputAmount:" + inputAmount)
    print("[DEBUG for refund] receiverAddr:" + receiverAddr + " (len: " + str(len(receiverAddr)) + ")")

    # send command (e.g., htlcModule -> receiverAddr)
    importinput = doSendTx("2", receiverAddr, inputAmount)

    # importinput command (receiverAddr wallet 값 업데이트를 위함)
    doHandleImportinput("0", importinput)

    # sync 커맨드 실행
    doSyncAndInfo("0")

def getBalance():
     # 실행할 커맨드
    command = "./build/src/uhs/client/client-cli atomizer-compose.cfg mempool1.dat wallet1.dat info"
    print("[DEBUG for getBalance] command: " + command)
    # subprocess.run()을 사용하여 커맨드 실행
    result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # 실행 결과 출력
    print("stdout (getBalance):")
    print(result.stdout)

    if result.stderr:
        print("[############ ALERT ############]")
        print("stderr (getBalance):")
        print(result.stderr)
    
#TODO: need to API (/api/opencbdc/getSecret)
# def getSecret():
#      # 실행할 커맨드
#     command = "./build/src/uhs/client/client-cli atomizer-compose.cfg mempool1.dat wallet1.dat getSecret htlcidb239c83a8ff069bd619c9b47c69471207e74ca9cf68cef274891f544f8"
#     print("[DEBUG for getSecret] command: " + command)

#     # subprocess.run()을 사용하여 커맨드 실행
#     result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

#     # 실행 결과 출력
#     print("stdout (getSecret):")
#     print(result.stdout)

#     if result.stderr:
#         print("[############ ALERT ############]")
#         print("stderr (getSecret):")
#         print(result.stderr)
    
def getSingleStatus():
    # 실행할 커맨드
    command = "./build/src/uhs/client/client-cli atomizer-compose.cfg mempool1.dat wallet1.dat getStatus htlcidb239c83a8ff069bd619c9b47c69471207e74ca9cf68cef274891f544f8"
    print("[DEBUG for getSingleStatus] command: " + command)

    # subprocess.run()을 사용하여 커맨드 실행
    result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # 실행 결과 출력
    print("stdout (getSingleStatus):")
    print(result.stdout)

    if result.stderr:
        print("[############ ALERT ############]")
        print("stderr (getSingleStatus):")
        print(result.stderr)

def doSendTx(fromWalletNum, toAddress, inputAmount):
    # 파라미터 검사
    if not fromWalletNum or not toAddress or not inputAmount:
        print("FAIL ($$$ Stop your test!! $$$)")
        print("fromWalletNum:" + fromWalletNum)
        print("toAddress:" + toAddress)
        print("inputAmount:" + inputAmount)

    # 실행할 커맨드
    command = "./build/src/uhs/client/client-cli atomizer-compose.cfg mempool" + fromWalletNum + ".dat wallet" + fromWalletNum + ".dat send " + inputAmount + " " + toAddress
    print("[DEBUG for doSendTx] command: " + command)
    print("[DEBUG for doSendTx] [1] Actual command to be executed, [2] Notion manual value by mssong")
    print("[1] " + command)
    print("[2] ./build/src/uhs/client/client-cli atomizer-compose.cfg mempool2.dat wallet2.dat send 3 usd1qptzeddmd8taum08u82vxmnq2fm0djpquppt4558rcxrz3s74k05jrd0rqa")
    # subprocess.run()을 사용하여 커맨드 실행
    result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # 실행 결과 출력
    print("stdout (doSendTx):")
    print(result.stdout)

    if result.stderr:
        print("[############ ALERT ############]")
        print("stderr (doSendTx):")
        print(result.stderr)

    return result.stdout.split("\n")[3]


def doHandleImportinput(targetWalletNum, importInputValue):
    # 파라미터 검사
    if not targetWalletNum or not importInputValue:
        print("FAIL ($$$ Stop your test!! $$$)")

    # 실행할 커맨드
    command = "./build/src/uhs/client/client-cli atomizer-compose.cfg mempool" + targetWalletNum + ".dat wallet" + targetWalletNum + ".dat importinput " + importInputValue
    print("[DEBUG for doHandleImportinput] command: " + command)

    # subprocess.run()을 사용하여 커맨드 실행
    result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # 실행 결과 출력
    print("stdout (doHandleImportinput):")
    print(result.stdout)

    if result.stderr:
        print("[############ ALERT ############]")
        print("stderr (doHandleImportinput):")
        print(result.stderr)

def doSyncAndInfo(targetWalletNum):
    # Atomizer 반영 시간 잠시 대기
    print("Please wait..")
    time.sleep(5)

    # 파라미터 검사
    if not targetWalletNum:
        print("FAIL ($$$ Stop your test!! $$$)")

    # 실행할 커맨드
    command = "./build/src/uhs/client/client-cli atomizer-compose.cfg mempool" + targetWalletNum + ".dat wallet" + targetWalletNum + ".dat sync && ./build/src/uhs/client/client-cli atomizer-compose.cfg mempool" + targetWalletNum + ".dat wallet" + targetWalletNum + ".dat info"
    print("[DEBUG for doSyncAndInfo] command: " + command)

    # subprocess.run()을 사용하여 커맨드 실행
    result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # 실행 결과 출력
    print("[DEBUG] target_wallet: Wallet_" + targetWalletNum)
    print("stdout (doSyncAndInfo):")
    print(result.stdout)

    if result.stderr:
        print("[############ ALERT ############]")
        print("stderr (doSyncAndInfo):")
        print(result.stderr)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=65432)
