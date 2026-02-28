/**
 * Captura e persistência de GCLID/wbraid/gbraid e UTM para atribuição de conversões
 * Cookie + localStorage, 90 dias, path: /
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'gc_click_attribution';
  var COOKIE_PREFIX = 'gc_';
  var COOKIE_DAYS = 90;
  var COOKIE_PATH = '/';

  function getParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + d.toUTCString();
    }
    var secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=' + COOKIE_PATH + '; SameSite=Lax' + secure;
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
  }

  function getStoredData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function setStoredData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  /**
   * Retorna o melhor click ID (prioridade: gclid > wbraid > gbraid)
   * @returns {{ value: string, type: string } | null}
   */
  function getStoredClickId() {
    var data = getStoredData();
    if (data) {
      if (data.gclid) return { value: data.gclid, type: 'GCLID' };
      if (data.wbraid) return { value: data.wbraid, type: 'WBRAID' };
      if (data.gbraid) return { value: data.gbraid, type: 'GBRAID' };
    }
    try {
      var lsGclid = localStorage.getItem('gclid');
      if (lsGclid) return { value: lsGclid, type: 'GCLID' };
    } catch (e) {}
    var gclid = getCookie(COOKIE_PREFIX + 'gclid');
    if (gclid) return { value: gclid, type: 'GCLID' };
    var wbraid = getCookie(COOKIE_PREFIX + 'wbraid');
    if (wbraid) return { value: wbraid, type: 'WBRAID' };
    var gbraid = getCookie(COOKIE_PREFIX + 'gbraid');
    if (gbraid) return { value: gbraid, type: 'GBRAID' };
    return null;
  }

  function captureFromUrl() {
    var gclid = getParam('gclid');
    var wbraid = getParam('wbraid');
    var gbraid = getParam('gbraid');
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function(k) {
      var v = getParam(k);
      if (v) utm[k] = v;
    });

    var updated = false;
    var data = getStoredData() || { utm: {} };

    if (gclid) {
      data.gclid = gclid;
      data.clickIdType = 'GCLID';
      setCookie(COOKIE_PREFIX + 'gclid', gclid, COOKIE_DAYS);
      try { localStorage.setItem('gclid', gclid); } catch (e) {}
      updated = true;
    }
    if (wbraid) {
      data.wbraid = wbraid;
      if (!data.gclid) data.clickIdType = 'WBRAID';
      setCookie(COOKIE_PREFIX + 'wbraid', wbraid, COOKIE_DAYS);
      updated = true;
    }
    if (gbraid) {
      data.gbraid = gbraid;
      if (!data.gclid && !data.wbraid) data.clickIdType = 'GBRAID';
      setCookie(COOKIE_PREFIX + 'gbraid', gbraid, COOKIE_DAYS);
      updated = true;
    }
    if (Object.keys(utm).length) {
      data.utm = Object.assign(data.utm || {}, utm);
      updated = true;
    }
    if (updated) {
      data.updatedAt = new Date().toISOString();
      setStoredData(data);
    }
  }

  function getGclid() {
    var click = getStoredClickId();
    return click ? click.value : '';
  }

  function attachHiddenGclidToForms() {
    var click = getStoredClickId();
    if (!click) return;
    document.querySelectorAll('form').forEach(function(form) {
      if (!form.querySelector('input[name="gclid"]')) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'gclid';
        input.value = click.value;
        form.appendChild(input);
      }
      if (!form.querySelector('input[name="clickIdType"]')) {
        var typeInput = document.createElement('input');
        typeInput.type = 'hidden';
        typeInput.name = 'clickIdType';
        typeInput.value = click.type;
        form.appendChild(typeInput);
      }
    });
  }

  function __GCLID_DEBUG() {
    var data = getStoredData();
    var click = getStoredClickId();
    return {
      storedData: data,
      getStoredClickId: click,
      cookieGclid: getCookie(COOKIE_PREFIX + 'gclid'),
      cookieWbraid: getCookie(COOKIE_PREFIX + 'wbraid'),
      cookieGbraid: getCookie(COOKIE_PREFIX + 'gbraid'),
      urlParams: {
        gclid: getParam('gclid'),
        wbraid: getParam('wbraid'),
        gbraid: getParam('gbraid')
      }
    };
  }

  function observeNewForms() {
    attachHiddenGclidToForms();
    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function(mutations) {
        var hasNewForm = mutations.some(function(m) {
          return m.addedNodes.length && Array.prototype.some.call(m.addedNodes, function(n) {
            return n.nodeType === 1 && (n.tagName === 'FORM' || n.querySelector && n.querySelector('form'));
          });
        });
        if (hasNewForm) attachHiddenGclidToForms();
      });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }
  }

  captureFromUrl();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      observeNewForms();
      setTimeout(attachHiddenGclidToForms, 500);
      setTimeout(attachHiddenGclidToForms, 2000);
    });
  } else {
    observeNewForms();
    setTimeout(attachHiddenGclidToForms, 500);
    setTimeout(attachHiddenGclidToForms, 2000);
  }

  window.gclidUtils = {
    getParam: getParam,
    setCookie: setCookie,
    getCookie: getCookie,
    getGclid: getGclid,
    getStoredClickId: getStoredClickId,
    attachHiddenGclidToForms: attachHiddenGclidToForms,
    __GCLID_DEBUG: __GCLID_DEBUG
  };
})();
