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
        'newContract': '/api/opencbdc/newContract',
        'getSingleStatus': '/api/opencbdc/getSingleStatus',
        'withdraw': '/api/opencbdc/withdraw',
        'refund': '/api/opencbdc/refund',
        'getBalance': '/api/opencbdc/getBalance'
    })

@app.route('/api/opencbdc/initialize', methods=['POST'])
def initialize():
    log_request(request)
    return '', 204

@app.route('/api/opencbdc/newContract', methods=['POST'])
def new_contract():
    log_request(request)
    return '', 204

@app.route('/api/v1/plugins/@hyperledger/cactus-plugin-htlc-eth-besu-erc20/get-single-status', methods=['POST'])
def cactus_get_single_status():
    log_request(request)
    return jsonify(77)

@app.route('/api/opencbdc/getSingleStatus', methods=['POST'])
def get_single_status():
    log_request(request)
    return jsonify(33)

@app.route('/api/opencbdc/withdraw', methods=['POST'])
def withdraw():
    log_request(request)
    return jsonify(55)

@app.route('/api/opencbdc/refund', methods=['POST'])
def refund():
    log_request(request)
    return '', 204

@app.route('/api/opencbdc/getBalance', methods=['POST'])
def get_balance():
    log_request(request)
    return '', 204

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8765)
