const ffi = require('ffi-napi')

function cancelTitleBarMenu(win) {
    let user32 = ffi.Library('user32', {
        'GetSystemMenu': ['int', ['int', 'bool']]
    })
    let hwnd = win.getNativeWindowHandle()
    user32.GetSystemMenu(hwnd.readUInt32LE(0), true);
}

module.exports = cancelTitleBarMenu