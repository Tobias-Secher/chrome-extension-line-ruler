// ─── Crosshair ────────────────────────────────────────────────────────────

var _crosshairActive = false;
var _crosshairH = null;
var _crosshairV = null;
var _crosshairMoveHandler = null;

function setCrosshair(enable) {
  if (enable === _crosshairActive) return;
  _crosshairActive = enable;

  if (enable) {
    _crosshairH = document.createElement('div');
    _crosshairH.style.cssText =
      'position:fixed;left:0;top:0;width:100%;height:1px;' +
      'background:rgba(255,255,255,0.55);pointer-events:none;' +
      'box-shadow:0 0 0 1px rgba(0,0,0,0.25);z-index:2147483647;';

    _crosshairV = document.createElement('div');
    _crosshairV.style.cssText =
      'position:fixed;left:0;top:0;width:1px;height:100%;' +
      'background:rgba(255,255,255,0.55);pointer-events:none;' +
      'box-shadow:0 0 0 1px rgba(0,0,0,0.25);z-index:2147483647;';

    host.appendChild(_crosshairH);
    host.appendChild(_crosshairV);

    _crosshairMoveHandler = function (e) {
      _crosshairH.style.top = e.clientY + 'px';
      _crosshairV.style.left = e.clientX + 'px';
    };
    document.addEventListener('mousemove', _crosshairMoveHandler);
  } else {
    document.removeEventListener('mousemove', _crosshairMoveHandler);
    _crosshairMoveHandler = null;
    if (_crosshairH) { _crosshairH.remove(); _crosshairH = null; }
    if (_crosshairV) { _crosshairV.remove(); _crosshairV = null; }
  }
}
