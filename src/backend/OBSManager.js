const OBSWebSocket = require('obs-websocket-js').default;
const {EventSubscription} = require('obs-websocket-js');
const obs = new OBSWebSocket();


/**
 * Expressions enum object
 * Used to list all possible expression and match source names
 * TODO: make this global so it is accessible from main as well
 * @type {{Neutral: string, Happy: string, Sad: string, Surprised: string, Fearful: string, Disgusted: string, Angry: string}}
 */
const FaceExpression = {
  Neutral: 'neutral',
  Happy: 'happy',
  Sad: 'sad',
  Surprised: 'surprised',
  Fearful: 'fearful',
  Disgusted: 'disgusted',
  Angry: 'angry'
};


/**
 * Get the key of the FaceExpression object from a string
 * @param {string} str
 * @returns {string} the key for the FaceExpression object if it exists else null
 */
function getExpressionKeyFromString(str) {
  str = str.toLowerCase()
  let key = str.charAt(0).toUpperCase() + str.slice(1);
  if (!(FaceExpression[key])) {
    return null;
  }
  return key;
}


/**
 * Class to handle the connection to OBS
 * as well as setting source visibility based on a given expression
 */
class OBSManager {
  constructor () {
    this.eventSubscriptions = EventSubscription.All | EventSubscription.InputVolumeMeters;
    this.rpcVersion = 1
    this.isConnected = false;

    /**
     * connection options set by the user
     * @type {{id: string, port: string, password: string}}
     */
    this.connectionOptions = {
      ip: '',
      port: '',
      password: '',
    };

    this.currentExpression = null;

    /**
     * Name of the OBS scene that the manager acts on
     * @type {string}
     */
    this.faceSceneName = 'FaceScene';

    /**
     * Array of all items in the OBS FaceScene (this.faceSceneName)
     * including the non-relevant sources
     * @type {array}
     */
    this.faceSceneItems = [];

    /**
     * Object where every item is an OBS source from this.faceSceneItems
     * whose scene name matches a key from FaceExpression
     * so it's only the relevant scenes
     * @type {object}
     */
    this.faceSceneSourcesDict = {};
  }
}


/**
 * Get the full OBS websocket address
 * When using IPv6, the ip has to be in brackets ([])
 * @param {string} ip OBS websocket ip
 * @param {string} port OBS websocket port
 * @returns {string} The websocket address for connecting to OBS
 */
OBSManager.prototype._getFullSocketAddress = function (ip, port) {
  return 'ws://' + ip + ':' + port;
};


/**
 * Connect to OBS websocket
 * @param {{ip: string, port: string, password: string}} options Connection options
 * @returns Promise
 */
OBSManager.prototype.connect = async function (options) {

  let socket_address = this._getFullSocketAddress(options.ip, options.port);
  let successObject = {success: false, message: ''};

  return new Promise((resolve, reject) => {
    obs.connect(socket_address, options.password, {
      eventSubscriptions: this.eventSubscriptions,
      rpcVersion:         this.rpcVersion
    })
    .then((result) => {
      const {
        obsWebSocketVersion,
        negotiatedRpcVersion
      } = result;

      this.isConnected = true;
      msg = `Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`

      successObject = {success: true, message: msg};

      return this._postConnectionInitialSetup();
    })
    .then((result) => {
      resolve(successObject);
    })
    .catch((error) => {
      console.error('Failed to connect', error.code, error.message);
      reject(error);
    });
  });
};


/**
 * Called after connecting to OBS. Initializes scene item list and disables (hides) all sources
 * @returns Promise
 */
OBSManager.prototype._postConnectionInitialSetup = async function () {
  return new Promise((resolve, reject) => {
    this.getSceneItems()
        .then((items) => {
          this.faceSceneItems = items;
          this.faceSceneSourcesDict = this.getSourcesDictFromItems(this.faceSceneItems);
          return this.disableAllInFaceScene();
        })
        .then(() => {
          resolve(true);
        })
        .catch((error) => {
          this.faceSceneItems = [];
          this.faceSceneSourcesDict = {};
          console.log('TODO!')
          reject(error);
        });
  });
};


/**
 * Called after connecting to OBS. Initializes scene items and disables all sources
 * @param {{ip: string, port: string, password: string}} options Connection options
 * @returns Promise
 */
OBSManager.prototype.getSourcesDictFromItems = function(faceSceneItems) {
   let result = faceSceneItems.reduce(
    (dict, item, index) => {
      let key = getExpressionKeyFromString(item.sourceName);
      if (key == null) {
        return dict;
      }
      return (dict[key] = item, dict);
    },
    {}
  );
  return result;
};


/**
 * Disables (hides) all sources in the face scene
 * @returns Promise
 */
OBSManager.prototype.disableAllInFaceScene = async function () {
  let sceneItems = this.faceSceneItems;

  if (!(Array.isArray(sceneItems) && sceneItems.length)) {
    console.error('no face scene items to disable!');
    return;
  }

  return new Promise((resolve, reject) => {
    Promise.all(sceneItems.map(item => this.hideSource(item)))
           .then(() => {
             resolve(true);
           })
           .catch((error) => {
             console.error(error);
             console.error('Something went wrong while trying to disable all items in the Face scene');
             reject(error)
           });
  });
};


/**
 * Sets the given expression (source) to visible and hides all other sources
 * @param {string} expression expression to set visible
 * @returns Promise
 */
OBSManager.prototype.setCurrentExpression = async function(expression = 'happy') {
  let source = this.getExpressionSourceFromString(expression);
  if (source == null) {
    throw new Error('expression key not found: ' + key);
  }

  return new Promise((resolve, reject) => {
    this.disableAllInFaceScene()
      .then(() => {
        this.showSource(source);
        this.currentExpression = FaceExpression[key];
        resolve(expression);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });

};


/**
 * Set the OBS source to enabled or disabled
 * @param {TODO} sourceObject OBS source object to enable or disable
 * @param {bool} enable enable or disable sourceObject
 * @returns Promise<bool|Error> resolves to enable
 */
OBSManager.prototype.setSceneItemState = async function(sourceObject, enable) {
  return new Promise((resolve, reject) => {
    obs.call('SetSceneItemEnabled', {
      sceneName: this.faceSceneName,
      sceneItemId: sourceObject.sceneItemId,
      sceneItemEnabled: enable
    })
    .then((response) => {
      resolve(enable);
    })
    .catch((error) => {
      console.error(error);
      console.error('error while trying to set scene item state');
      reject(error);
    });
  });
};


/**
 * Gets all sources in the faces scene
 * @param {string} sceneName Name of the OBS scene to get the sources of
 * @return Promise<array|Error> resolves to array of scene items
 */
OBSManager.prototype.getSceneItems = async function() {
  return new Promise((resolve, reject) => {
    obs.call('GetSceneItemList', {sceneName: this.faceSceneName})
       .then((response) => {
         resolve(response.sceneItems);
       })
       .catch((error) => {
         console.error(error);
         result = []
         reject(error);
       });
  });
};


// TODO: docs + rewrite?
// maybe separate class
OBSManager.prototype.getExpressionSourceFromKey = function(expressionKey) {
  if (!(expressionKey in this.faceSceneSourcesDict)) {
    return null;
  }
  return this.faceSceneSourcesDict[expressionKey];
};

OBSManager.prototype.getExpressionSourceFromString = function(expression = 'happy') {
  key = getExpressionKeyFromString(expression);
  source = this.getExpressionSourceFromKey(key);
  return source;
};

OBSManager.prototype.showSource = async function(source) {
  return this.setSceneItemState(source, true);
};


OBSManager.prototype.hideSource = async function(source) {
  return this.setSceneItemState(source, false);
};


module.exports = {
  OBSManager,
};
