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


OBSManager.prototype.connect = async function (options) {
  let ip = options.ip;
  let port = options.port;
  let password = options.password;
  let socket_address = this._getFullSocketAddress(ip, port);

  try {
    const {
        obsWebSocketVersion,
        negotiatedRpcVersion
    } = await obs.connect(socket_address, password, {
      eventSubscriptions: this.eventSubscriptions,
      rpcVersion: 1
    });
    console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)

    await this.postConnectionInitialSetup();
    return `Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion}`
  }
  catch (error) {
    console.error('Failed to connect', error.code, error.message);
    return 'Failed to connect: ' + error.code + ' ' + error.message;
  }
};


OBSManager.prototype.postConnectionInitialSetup = async function () {
  await this.getFaceSceneStructure();
  await this.disableAllInFaceScene();
};


OBSManager.prototype.getFaceSceneStructure = async function() {
  this.faceSceneItems = await this.getFaceSceneItems();
  this.faceSceneSourcesDict = this.getFaceSceneSourcesDict();
};


OBSManager.prototype.getFaceSceneSourcesDict = function() {
   let result = this.faceSceneItems.reduce(
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


OBSManager.prototype.getExpressionSourceFromKey = function(expressionKey) {
  if (!(expressionKey in this.faceSceneSourcesDict)) {
    return null;
  }
  return this.faceSceneSourcesDict[expressionKey];
};


OBSManager.prototype.showSource = async function(source) {
  this.setSceneItemState(source, true);
};


OBSManager.prototype.hideSource = async function(source) {
  this.setSceneItemState(source, false);
};

OBSManager.prototype.getExpressionSourceFromString = function(expression = 'happy') {
  key = getExpressionKeyFromString(expression);
  source = this.getExpressionSourceFromKey(key);
  return source;
};


OBSManager.prototype.setCurrentExpression = async function(expression = 'happy') {
  source = this.getExpressionSourceFromString(expression);
  if (source == null) {
    console.log('key not found: ' + key);
    return;
  }

  await this.disableAllInFaceScene();
  await this.showSource(source);
  this.currentExpression = FaceExpression[key];
};


OBSManager.prototype.setSceneItemState = async function(sourceObject, enable) {
  try {
    let response = await obs.call('SetSceneItemEnabled', {
      sceneName: this.faceSceneName,
      sceneItemId: sourceObject.sceneItemId,
      sceneItemEnabled: enable
    });
    return true;
  }
  catch(error) {
    console.log(error);
    console.log('error while trying to get current scene');
    return false;
  }
};


OBSManager.prototype.getFaceSceneItems = async function() {
  let result = [];
  try {
    const response = await obs.call('GetSceneItemList', {sceneName: this.faceSceneName});
    result = response.sceneItems;
  }
  catch(error) {
    console.log(error);
    result = [];
  }
  return result;
};


OBSManager.prototype.disableAllInFaceScene = async function () {
  //groupItems = await this.getFaceGroupItems();
  let sceneItems = this.faceSceneItems;

  if (!(Array.isArray(sceneItems) && sceneItems.length)) {
    console.log('no face scene items to disable!');
    return;
  }

  try {
    for await (const item of sceneItems) {
      this.hideSource(item);
    }
  }
  catch(error) {
    console.log(error);
    console.log('Something went wrong while trying to disable all items in the Face scene');
  }
};


module.exports = {
  OBSManager,
};
