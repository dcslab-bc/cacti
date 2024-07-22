from flask import Flask, request, jsonify
from datetime import datetime
import pytz

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
        'getbalance': '/api/opencbdc/getbalance'
    })

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

    print("Address:", address)

    response = {
        "balance": 100000000,
    }

    log_request(request)
    return jsonify(response), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8765)
