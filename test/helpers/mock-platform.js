const os = require('os');
const {MockMethod} = require('./mock-method');



class MockPlatform extends MockMethod {
    constructor() {
        super();

        this._platform = os.platform();
    }

    mock() {
        super.mock(os, 'platform', this, this._getPlatform)
    }

    set(platform) {        
        this._platform = platform;
    }

    _getPlatform() {
        return this._platform;
    }
}



module.exports.platform = new MockPlatform();