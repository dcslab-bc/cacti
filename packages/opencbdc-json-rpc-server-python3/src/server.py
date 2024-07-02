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
        'message': 'Please send a post message as one of the following URLs.',
        'initialize': '/api/opencbdc/initialize',
        'newcontract': '/api/opencbdc/newcontract',
        'getsinglestatus': '/api/opencbdc/getsinglestatus',
        'withdraw': '/api/opencbdc/withdraw',
        'refund': '/api/opencbdc/refund',
        'getbalance': '/api/opencbdc/getbalance'
    })

@app.route('/api/opencbdc/newcontract', methods=['POST'])
def new_contract():
    data = request.get_json()

    contract_address = data.get('contractAddress')
    keychain_id = data.get('keychainId')
    signing_credential = data.get('signingCredential')
    eth_account = signing_credential.get('ethAccount')
    secret = signing_credential.get('secret')
    credential_type = signing_credential.get('type')
    input_amount = data.get('inputAmount')
    output_amount = data.get('outputAmount')
    receiver = data.get('receiver')
    expiration = data.get('expiration')
    hash_lock = data.get('hashLock')
    output_network = data.get('outputNetwork')
    output_address = data.get('outputAddress')

    print("ContractAddress:", contract_address)
    print("KeychainId:", keychain_id)
    print("SigningCredential:", signing_credential)
    print("  EthAccount:", eth_account)
    print("  Secret:", secret)
    print("  Type:", credential_type)
    print("InputAmount:", input_amount)
    print("OutputAmount:", output_amount)
    print("Receiver:", receiver)
    print("Expiration:", expiration)
    print("HashLock:", hash_lock)
    print("OutputNetwork:", output_network)
    print("OutputAddress:", output_address)

    log_request(request)
    return '', 204

@app.route('/api/opencbdc/getsinglestatus', methods=['POST'])
def get_single_status():
    data = request.get_json()

    htlc_id = data.get('HTLCId')
    contract_address = data.get('contractAddress')
    keychain_id = data.get('keychainId')
    signing_credential = data.get('signingCredential')
    eth_account = signing_credential.get('ethAccount')
    secret = signing_credential.get('secret')
    credential_type = signing_credential.get('type')
    input_amount = data.get('inputAmount')
    receiver = data.get('receiver')
    hash_lock = data.get('hashLock')
    expiration = data.get('expiration')

    print("HTLCId:", htlc_id)
    print("ContractAddress:", contract_address)
    print("KeychainId:", keychain_id)
    print("SigningCredential:", signing_credential)
    print("  EthAccount:", eth_account)
    print("  Secret:", secret)
    print("  Type:", credential_type)
    print("InputAmount:", input_amount)
    print("Receiver:", receiver)
    print("HashLock:", hash_lock)
    print("Expiration:", expiration) 

    log_request(request)
    return jsonify(33)

@app.route('/api/opencbdc/withdraw', methods=['POST'])
def withdraw():
    data = request.get_json()

    htlc_id = data.get('HTLCId')
    keychain_id = data.get('keychainId')
    signing_credential = data.get('signingCredential')
    eth_account = signing_credential.get('ethAccount')
    secret = signing_credential.get('secret')
    credential_type = signing_credential.get('type')
    
    print("HTLCId:", htlc_id)
    print("KeychainId:", keychain_id)
    print("SigningCredential:", signing_credential)
    print("  EthAccount:", eth_account)
    print("  Secret:", secret)
    print("  Type:", credential_type)

    response = {
        "transactionReceipt": {}
    }

    log_request(request)
    return jsonify(response), 200

@app.route('/api/opencbdc/refund', methods=['POST'])
def refund():
    data = request.get_json()
    
    htlc_id = data.get('HTLCId')
    keychain_id = data.get('keychainId')
    signing_credential = data.get('signingCredential')
    eth_account = signing_credential.get('ethAccount')
    secret = signing_credential.get('secret')
    credential_type = signing_credential.get('type')

    print("HTLCId:", htlc_id)
    print("KeychainId:", keychain_id)
    print("SigningCredential:", signing_credential)
    print("  EthAccount:", eth_account)
    print("  Secret:", secret)
    print("  Type:", credential_type)

    response = {
        "transactionReceipt": {}
    }

    log_request(request)
    return jsonify(response), 200

@app.route('/api/opencbdc/getbalance', methods=['POST'])
def get_balance():
    data = request.get_json()

    keychain_id = data.get('keychainId')
    address = data.get('address')

    print("KeychainId:", keychain_id)
    print("Address:", address)

    log_request(request)
    return '', 204

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8765)
