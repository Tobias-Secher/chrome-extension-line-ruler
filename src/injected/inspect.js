// ─── DOM Spacing Inspector ────────────────────────────────────────────────

var _inspectActive = false;
var _inspectInterceptor = null;
var _inspectSelected = null;
var _inspectHovered = null;
var _inspectOverlayEls = [];
var _inspectHandlers = {};

// ── Colors ───────────────────────────────────────────────────────────────

var INSPECT_BLUE_OUTLINE = 'rgba(59,130,246,0.9)';
var INSPECT_BLUE_FILL = 'rgba(59,130,246,0.08)';
var INSPECT_GREEN_OUTLINE = 'rgba(34,197,94,0.9)';
var INSPECT_GREEN_FILL = 'rgba(34,197,94,0.08)';
var INSPECT_LINE_COLOR = 'rgba(255,100,100,0.9)';

// ── Main toggle ──────────────────────────────────────────────────────────

function setInspectMode(enable) {
  if (enable && _inspectActive) return;
  if (!enable && !_inspectActive) return;

  if (enable) {
    _inspectActive = true;

    _inspectInterceptor = document.createElement('div');
    _inspectInterceptor.id = '__rl-inspect-interceptor';
    _inspectInterceptor.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100vw',
      'height:100vh',
      'pointer-events:all',
      'cursor:crosshair',
      'background:transparent',
      'z-index:2147483646',
    ].join(';');
    host.appendChild(_inspectInterceptor);

    _inspectHandlers.mousemove = _inspectOnMouseMove;
    _inspectHandlers.click = _inspectOnClick;
    _inspectHandlers.keydown = _inspectOnKeyDown;
    _inspectHandlers.scroll = _inspectOnScroll;
    _inspectHandlers.resize = _inspectOnResize;

    _inspectInterceptor.addEventListener('mousemove', _inspectHandlers.mousemove);
    _inspectInterceptor.addEventListener('click', _inspectHandlers.click);
    document.addEventListener('keydown', _inspectHandlers.keydown, true);
    window.addEventListener('scroll', _inspectHandlers.scroll, true);
    window.addEventListener('resize', _inspectHandlers.resize);
  } else {
    _inspectActive = false;

    if (_inspectInterceptor) {
      _inspectInterceptor.removeEventListener('mousemove', _inspectHandlers.mousemove);
      _inspectInterceptor.removeEventListener('click', _inspectHandlers.click);
      _inspectInterceptor.parentNode && _inspectInterceptor.parentNode.removeChild(_inspectInterceptor);
      _inspectInterceptor = null;
    }
    document.removeEventListener('keydown', _inspectHandlers.keydown, true);
    window.removeEventListener('scroll', _inspectHandlers.scroll, true);
    window.removeEventListener('resize', _inspectHandlers.resize);
    _inspectHandlers = {};

    _inspectClearAll();
  }
}

// ── Event handlers ───────────────────────────────────────────────────────

function _inspectElementFromPoint(x, y) {
  _inspectInterceptor.style.pointerEvents = 'none';
  var el = document.elementFromPoint(x, y);
  _inspectInterceptor.style.pointerEvents = 'all';
  if (el && host.contains(el)) return null;
  return el;
}

function _inspectOnMouseMove(e) {
  var el = _inspectElementFromPoint(e.clientX, e.clientY);

  if (_inspectSelected) {
    // Check if selected element still exists
    if (!document.contains(_inspectSelected)) {
      _inspectSelected = null;
      _inspectHovered = null;
      _inspectClearOverlays();
      if (el) {
        _inspectHovered = el;
        _inspectRenderHover();
      }
      return;
    }

    // Check if selected is in viewport
    var selRect = _inspectSelected.getBoundingClientRect();
    if (!_inspectIsInViewport(selRect)) {
      _inspectClearOverlays();
      return;
    }

    // Skip hover on selected element itself
    if (el === _inspectSelected) {
      _inspectHovered = null;
      _inspectClearOverlays();
      _inspectDrawHighlight(selRect, 'selected');
      return;
    }

    if (!el) {
      _inspectHovered = null;
      _inspectClearOverlays();
      _inspectDrawHighlight(selRect, 'selected');
      return;
    }

    _inspectHovered = el;
    _inspectRender();
  } else {
    // Selection mode — just highlight hovered
    if (!el) {
      _inspectHovered = null;
      _inspectClearOverlays();
      return;
    }
    _inspectHovered = el;
    _inspectRenderHover();
  }
}

function _inspectOnClick(e) {
  e.preventDefault();
  e.stopPropagation();

  var el = _inspectElementFromPoint(e.clientX, e.clientY);
  if (!el) return;

  if (el === _inspectSelected) {
    // Deselect — return to selection mode
    _inspectSelected = null;
    _inspectHovered = null;
    _inspectClearOverlays();
  } else {
    // Select new reference
    _inspectSelected = el;
    _inspectHovered = null;
    _inspectClearOverlays();
    _inspectDrawHighlight(_inspectSelected.getBoundingClientRect(), 'selected');
  }
}

function _inspectOnKeyDown(e) {
  if (e.key === 'Escape' && _inspectActive) {
    e.preventDefault();
    e.stopPropagation();
    setInspectMode(false);
    window.__UITools.pendingUpdate = { type: 'inspectExit' };
  }
}

function _inspectOnScroll() {
  if (!_inspectSelected) return;
  if (!document.contains(_inspectSelected)) {
    _inspectSelected = null;
    _inspectHovered = null;
    _inspectClearOverlays();
    return;
  }
  var selRect = _inspectSelected.getBoundingClientRect();
  if (!_inspectIsInViewport(selRect)) {
    _inspectClearOverlays();
    return;
  }
  if (_inspectHovered && document.contains(_inspectHovered)) {
    _inspectRender();
  } else {
    _inspectClearOverlays();
    _inspectDrawHighlight(selRect, 'selected');
  }
}

function _inspectOnResize() {
  _inspectOnScroll();
}

// ── Rendering ────────────────────────────────────────────────────────────

function _inspectClearOverlays() {
  for (var i = 0; i < _inspectOverlayEls.length; i++) {
    var el = _inspectOverlayEls[i];
    el.parentNode && el.parentNode.removeChild(el);
  }
  _inspectOverlayEls = [];
}

function _inspectClearAll() {
  _inspectClearOverlays();
  _inspectSelected = null;
  _inspectHovered = null;
}

function _inspectRenderHover() {
  _inspectClearOverlays();
  if (!_inspectHovered) return;
  _inspectDrawHighlight(_inspectHovered.getBoundingClientRect(), 'hovered');
}

function _inspectRender() {
  _inspectClearOverlays();
  if (!_inspectSelected || !_inspectHovered) return;

  var selRect = _inspectSelected.getBoundingClientRect();
  var hovRect = _inspectHovered.getBoundingClientRect();

  _inspectDrawHighlight(selRect, 'selected');
  _inspectDrawHighlight(hovRect, 'hovered');
  _inspectComputeMeasurements(selRect, hovRect);
}

function _inspectDrawHighlight(rect, type) {
  var outlineColor = type === 'selected' ? INSPECT_BLUE_OUTLINE : INSPECT_GREEN_OUTLINE;
  var fillColor = type === 'selected' ? INSPECT_BLUE_FILL : INSPECT_GREEN_FILL;

  var el = document.createElement('div');
  el.style.cssText = [
    'position:fixed',
    'top:' + rect.top + 'px',
    'left:' + rect.left + 'px',
    'width:' + rect.width + 'px',
    'height:' + rect.height + 'px',
    'outline:2px solid ' + outlineColor,
    'background:' + fillColor,
    'pointer-events:none',
    'z-index:2147483645',
    'box-sizing:border-box',
  ].join(';');
  host.appendChild(el);
  _inspectOverlayEls.push(el);
}

// ── Measurement computation ──────────────────────────────────────────────

function _inspectComputeMeasurements(selRect, hovRect) {
  // Check containment (internal mode)
  var selContainsHov = selRect.left <= hovRect.left && selRect.right >= hovRect.right &&
                       selRect.top <= hovRect.top && selRect.bottom >= hovRect.bottom;
  var hovContainsSel = hovRect.left <= selRect.left && hovRect.right >= selRect.right &&
                       hovRect.top <= selRect.top && hovRect.bottom >= selRect.bottom;

  if (selContainsHov) {
    _inspectDrawInset(selRect, hovRect);
    return;
  }
  if (hovContainsSel) {
    _inspectDrawInset(hovRect, selRect);
    return;
  }

  // Check overlap on each axis
  var hOverlap = Math.min(selRect.right, hovRect.right) - Math.max(selRect.left, hovRect.left);
  var vOverlap = Math.min(selRect.bottom, hovRect.bottom) - Math.max(selRect.top, hovRect.top);

  // Both axes overlap — elements visually overlap, no measurements
  if (hOverlap > 0 && vOverlap > 0) return;

  var showHorizontal = false;
  var showVertical = false;

  if (hOverlap > 0 && vOverlap <= 0) {
    // Horizontal overlap → show vertical distance
    showVertical = true;
  } else if (vOverlap > 0 && hOverlap <= 0) {
    // Vertical overlap → show horizontal distance
    showHorizontal = true;
  } else {
    // No overlap on either axis → show both
    showHorizontal = true;
    showVertical = true;
  }

  if (showHorizontal) {
    var leftEdge, rightEdge;
    if (selRect.right <= hovRect.left) {
      leftEdge = selRect.right;
      rightEdge = hovRect.left;
    } else {
      leftEdge = hovRect.right;
      rightEdge = selRect.left;
    }
    var hDist = rightEdge - leftEdge;
    if (hDist > 0) {
      var midY;
      if (vOverlap > 0) {
        midY = (Math.max(selRect.top, hovRect.top) + Math.min(selRect.bottom, hovRect.bottom)) / 2;
      } else {
        midY = (selRect.top + selRect.bottom + hovRect.top + hovRect.bottom) / 4;
      }
      _inspectDrawLine(leftEdge, midY, hDist, true, Math.round(hDist));
    }
  }

  if (showVertical) {
    var topEdge, bottomEdge;
    if (selRect.bottom <= hovRect.top) {
      topEdge = selRect.bottom;
      bottomEdge = hovRect.top;
    } else {
      topEdge = hovRect.bottom;
      bottomEdge = selRect.top;
    }
    var vDist = bottomEdge - topEdge;
    if (vDist > 0) {
      var midX;
      if (hOverlap > 0) {
        midX = (Math.max(selRect.left, hovRect.left) + Math.min(selRect.right, hovRect.right)) / 2;
      } else {
        midX = (selRect.left + selRect.right + hovRect.left + hovRect.right) / 4;
      }
      _inspectDrawLine(midX, topEdge, vDist, false, Math.round(vDist));
    }
  }
}

// ── Draw measurement line + label ────────────────────────────────────────

function _inspectDrawLine(x, y, length, isHorizontal, value) {
  var line = document.createElement('div');
  if (isHorizontal) {
    line.style.cssText = [
      'position:fixed',
      'top:' + (y - 0.5) + 'px',
      'left:' + x + 'px',
      'width:' + length + 'px',
      'height:1px',
      'background:' + INSPECT_LINE_COLOR,
      'pointer-events:none',
      'z-index:2147483646',
    ].join(';');
  } else {
    line.style.cssText = [
      'position:fixed',
      'top:' + y + 'px',
      'left:' + (x - 0.5) + 'px',
      'width:1px',
      'height:' + length + 'px',
      'background:' + INSPECT_LINE_COLOR,
      'pointer-events:none',
      'z-index:2147483646',
    ].join(';');
  }
  host.appendChild(line);
  _inspectOverlayEls.push(line);

  // End caps
  var capSize = 5;
  if (isHorizontal) {
    _inspectDrawCap(x, y - capSize, 1, capSize * 2);
    _inspectDrawCap(x + length - 1, y - capSize, 1, capSize * 2);
  } else {
    _inspectDrawCap(x - capSize, y, capSize * 2, 1);
    _inspectDrawCap(x - capSize, y + length - 1, capSize * 2, 1);
  }

  // Label
  var lbl = document.createElement('span');
  lbl.textContent = value + 'px';
  lbl.style.cssText = [
    'position:fixed',
    'font:9px monospace',
    'color:#fff',
    'background:rgba(0,0,0,0.7)',
    'padding:1px 4px',
    'border-radius:2px',
    'pointer-events:none',
    'white-space:nowrap',
    'z-index:2147483647',
  ].join(';');

  // Temporarily add to measure width
  lbl.style.visibility = 'hidden';
  host.appendChild(lbl);
  var lblWidth = lbl.offsetWidth;
  var lblHeight = lbl.offsetHeight;
  lbl.style.visibility = '';

  if (isHorizontal) {
    lbl.style.left = (x + length / 2 - lblWidth / 2) + 'px';
    lbl.style.top = (y - lblHeight - 2) + 'px';
  } else {
    lbl.style.left = (x + 4) + 'px';
    lbl.style.top = (y + length / 2 - lblHeight / 2) + 'px';
  }

  _inspectOverlayEls.push(lbl);
}

function _inspectDrawCap(x, y, w, h) {
  var cap = document.createElement('div');
  cap.style.cssText = [
    'position:fixed',
    'top:' + y + 'px',
    'left:' + x + 'px',
    'width:' + w + 'px',
    'height:' + h + 'px',
    'background:' + INSPECT_LINE_COLOR,
    'pointer-events:none',
    'z-index:2147483646',
  ].join(';');
  host.appendChild(cap);
  _inspectOverlayEls.push(cap);
}

// ── Internal (inset) measurements ────────────────────────────────────────

function _inspectDrawInset(containerRect, childRect) {
  var top = childRect.top - containerRect.top;
  var bottom = containerRect.bottom - childRect.bottom;
  var left = childRect.left - containerRect.left;
  var right = containerRect.right - childRect.right;

  // Top inset
  if (top > 0) {
    var cx = childRect.left + childRect.width / 2;
    _inspectDrawLine(cx, containerRect.top, top, false, Math.round(top));
  }

  // Bottom inset
  if (bottom > 0) {
    var cx2 = childRect.left + childRect.width / 2;
    _inspectDrawLine(cx2, childRect.bottom, bottom, false, Math.round(bottom));
  }

  // Left inset
  if (left > 0) {
    var cy = childRect.top + childRect.height / 2;
    _inspectDrawLine(containerRect.left, cy, left, true, Math.round(left));
  }

  // Right inset
  if (right > 0) {
    var cy2 = childRect.top + childRect.height / 2;
    _inspectDrawLine(childRect.right, cy2, right, true, Math.round(right));
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function _inspectIsInViewport(rect) {
  return rect.bottom > 0 && rect.top < window.innerHeight &&
         rect.right > 0 && rect.left < window.innerWidth;
}
