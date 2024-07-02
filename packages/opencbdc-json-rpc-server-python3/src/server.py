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

    signing_credential = data.get('signingCredential')
    opencbdc_account = signing_credential.get('opencbdcAccount')
    secret = signing_credential.get('secret')
    credential_type = signing_credential.get('type')
    input_amount = data.get('inputAmount')
    output_amount = data.get('outputAmount')
    receiver = data.get('receiver')
    expiration = data.get('expiration')
    hash_lock = data.get('hashLock')
    output_network = data.get('outputNetwork')
    output_address = data.get('outputAddress')

    print("SigningCredential:", signing_credential)
    print("  OpencbdcAccount:", opencbdc_account)
    print("  Secret:", secret)
    print("  Type:", credential_type)
    print("InputAmount:", input_amount)
    print("OutputAmount:", output_amount)
    print("Receiver:", receiver)
    print("Expiration:", expiration)
    print("HashLock:", hash_lock)
    print("OutputNetwork:", output_network)
    print("OutputAddress:", output_address)

    response = {
        "status": True,
        "HTLCId": "abcdefg"
    }

    log_request(request)
    return jsonify(response), 200

@app.route('/api/opencbdc/getsinglestatus', methods=['POST'])
def get_single_status():
    data = request.get_json()

    htlc_id = data.get('HTLCId')
    contract_address = data.get('contractAddress')
    keychain_id = data.get('keychainId')
    signing_credential = data.get('signingCredential')
    opencbdc_account = signing_credential.get('opencbdcAccount')
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
    print("  OpencbdcAccount:", opencbdc_account)
    print("  Secret:", secret)
    print("  Type:", credential_type)
    print("InputAmount:", input_amount)
    print("Receiver:", receiver)
    print("HashLock:", hash_lock)
    print("Expiration:", expiration) 

    log_request(request)
    return jsonify(1), 200

@app.route('/api/opencbdc/withdraw', methods=['POST'])
def withdraw():
    data = request.get_json()

    htlc_id = data.get('HTLCId')
    signing_credential = data.get('signingCredential')
    opencbdc_account = signing_credential.get('opencbdcAccount')
    secret = signing_credential.get('secret')
    credential_type = signing_credential.get('type')
    
    print("HTLCId:", htlc_id)
    print("SigningCredential:", signing_credential)
    print("  OpencbdcAccount:", opencbdc_account)
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
    signing_credential = data.get('signingCredential')
    opencbdc_account = signing_credential.get('opencbdcAccount')
    secret = signing_credential.get('secret')
    credential_type = signing_credential.get('type')

    print("HTLCId:", htlc_id)
    print("SigningCredential:", signing_credential)
    print("  OpencbdcAccount:", opencbdc_account)
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

    address = data.get('address')

    print("Address:", address)

    log_request(request)
    return jsonify(100000000), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8765)
