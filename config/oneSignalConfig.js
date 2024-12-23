const OneSignal = require('onesignal-node');

const client = new OneSignal.Client({
    userAuthKey: 'os_v2_app_dggo5ncekzhjpazrk4pj7hofgvrkbmuzb4ueooezstbwtqxth2viiblo62jee6kfe3oeaw2nstm7gw2dpxgibw2h6sbrrvd7mivqfly',
    app: { appAuthKey: 'os_v2_app_dggo5ncekzhjpazrk4pj7hofgvrkbmuzb4ueooezstbwtqxth2viiblo62jee6kfe3oeaw2nstm7gw2dpxgibw2h6sbrrvd7mivqfly', appId: '198ceeb4-4456-4e97-8331-571e9f9dc535' },
});

module.exports = client;
