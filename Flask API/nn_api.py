import pydload
import uuid
import json
import time
import requests
import logging

from flask import Flask, request
from flask_cors import CORS, cross_origin

from nudenet import NudeClassifier
classifier = NudeClassifier("models/classifier_model")
app = Flask(__name__)
cors = CORS(app)

# @app.route('/hello')
# @cross_origin()
# def hello():
#     return "Hello World!"

@app.route('/nudenet', methods=['GET', 'POST'])
def nudenet_classifier_from_url():
    if request.method == 'GET':
        url = request.args.get('url')
    elif request.method == 'POST':
        url = request.json['url']

    try:
        path = str(uuid.uuid4())
        dload_status = pydload.dload(url, path)
        
        if not dload_status:
            return json.dumps({'error': 'File too large to download'})
        res = classifier.classify(path)[path]
        for key, value in res.items():
            res[key] = str(value)
        return json.dumps(res)
    except Exception as ex:
        return json.dumps({'error': str(ex)})


if __name__ == '__main__':
    app.run(debug=False, threaded=True, port=5004, host='172.18.121.51')
