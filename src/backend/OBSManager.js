const OBSWebSocket = require('obs-websocket-js').default;
const {EventSubscription} = require('obs-websocket-js');
const obs = new OBSWebSocket();

const FaceExpression = {
  Neutral: 'neutral',
  Happy: 'happy',
  Sad: 'sad',
  Surprised: 'surprised',
  Fearful: 'fearful',
  Disgusted: 'disgusted',
  Angry: 'angry'
};


function getExpressionKeyFromString(str) {
  str = str.toLowerCase()
  let key = str.charAt(0).toUpperCase() + str.slice(1);
  if (!(FaceExpression[key])) {
    return null;
  }
  return key;
}


class OBSManager {
  constructor () {
    this.eventSubscriptions = EventSubscription.All | EventSubscription.InputVolumeMeters;
    this.connectionOptions = { // things the user can set
      ip: '',
      port: '',
      password: '',
    };
    this.faceSceneName = 'FaceScene';
    this.currentSceneName = null;
    this.currentExpression = null;
    this.faceSceneItems = [];
    this.faceSceneSourcesDict = {};
    this.triggerScenes = [];
  }
}


OBSManager.prototype._getFullSocketAddress = function (ip, port) {
  return 'ws://' + ip + ':' + port;
};


OBSManager.prototype.updateConnectionOptions = function (options) {


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
  this.setup_listeners();
  await this.getFaceSceneStructure();
  await this.disableAllInFaceScene();
};


OBSManager.prototype.getFaceSceneStructure = async function() {
  this.currentSceneName = await this.getCurrentScene();
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
}


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
}


OBSManager.prototype.setCurrentExpression = async function(expression = 'happy') {
  source = this.getExpressionSourceFromString(expression);
  if (source == null) {
    console.log('key not found: ' + key);
    return;
  }

  await this.disableAllInFaceScene();
  await this.showSource(source);
  this.currentExpression = FaceExpression[key];
}


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


OBSManager.prototype.getCurrentScene = async function() {
  try {
    const scene = await obs.call('GetCurrentProgramScene');
    this.currentSceneName = scene.currentProgramSceneName;
    return scene;
  }
  catch(error) {
    console.log(error);
    console.log('error while trying to get current scene');
    return null;
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


OBSManager.prototype.setup_listeners = function () {
  obs.on('CurrentProgramSceneChanged', this.onCurrentSceneChanged);
};


OBSManager.prototype.onCurrentSceneChanged = function (event) {
  // disable / enable
  this.currentSceneName = event.sceneName;
  console.log('Current scene changed to')
  console.log(event);
};


module.exports = {
  OBSManager,
};

/*async function main() {
  obsman = new OBSManager();
  await obsman.connect({
    ip: '10.40.106.37',
    port: '4455',
    password: 'OoKCMr5Aa1QjqMFh'
  });

  //await obsman.showSource('surprised');
  //await obsman.showExpression('HaPPy');
  await obsman.setCurrentExpression('surprised');
  await obsman.setCurrentExpression('aasd');
  await obsman.setCurrentExpression(FaceExpression.Happy);
  await obsman.setCurrentExpression(FaceExpression.Surprised);
}

main();
*/
