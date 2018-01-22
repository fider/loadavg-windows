const os = require('os');
const {MockMethod} = require('./mock-method');



class MockPlatform extends MockMethod {
    constructor() {
        super();

        this._platform = os.platform();
    }

    mock() {
        super.mock(os, 'platform', this, this._getPlarform)
    }

    set(platform) {        
        this._platform = platform;
    }

    _getPlarform() {
        return this._platform;
    }
}



module.exports.platform = new MockPlatform();