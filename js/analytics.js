// analytics.js — Privacy-friendly, opt-in analytics via Umami
// Set pr-umami-id and pr-umami-url in localStorage to enable.
// No tracking happens unless explicitly configured by the user.
(function(PR) {
  'use strict';

  PR.initAnalytics = function() {
    var umamiId = localStorage.getItem('pr-umami-id');
    var umamiUrl = localStorage.getItem('pr-umami-url') || 'https://umami.is';

    if (!umamiId) {
      // Auto-generate a random anonymous ID so self-hosted users can opt in
      // without changing code; just set pr-umami-id in localStorage.
      return;
    }

    var script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.setAttribute('data-website-id', umamiId);
    script.setAttribute('data-domains', location.hostname);
    script.src = umamiUrl.replace(/\/+$/, '') + '/script.js';

    // Fallback: if Umami script fails to load, remove the script silently
    script.onerror = function() {
      script.remove();
    };

    document.head.appendChild(script);
    console.log('📊 Analytics enabled (Umami: ' + umamiId + ')');
  };

  // Self-hosted analytics toggle in settings (about tab)
  // Called by ui.js when the about tab renders
  PR.renderAnalyticsConfig = function(container) {
    var umamiId = localStorage.getItem('pr-umami-id') || '';
    var umamiUrl = localStorage.getItem('pr-umami-url') || 'https://umami.is';

    var html =
      '<div class="divider"></div>' +
      '<h3 style="margin-bottom:6px">📊 流量统计（可选）</h3>' +
      '<p style="font-size:11px;color:var(--text-dim);margin-bottom:8px">使用 <a href="https://umami.is" target="_blank" style="color:var(--accent)">Umami</a> 自部署分析，隐私友好，不追踪个人数据。</p>' +
      '<label>Umami Website ID</label>' +
      '<input type="text" id="cfg-umami-id" value="' + PR.esc(umamiId) + '" placeholder="留空则关闭统计">' +
      '<label>Umami 服务器地址</label>' +
      '<input type="text" id="cfg-umami-url" value="' + PR.esc(umamiUrl) + '" placeholder="https://my-umami.example.com">' +
      '<button id="btn-save-umami" style="width:100%;margin-top:6px">保存统计设置</button>';

    container.insertAdjacentHTML('beforeend', html);

    PR.$('#btn-save-umami').addEventListener('click', function() {
      var newId = (PR.$('#cfg-umami-id') ? PR.$('#cfg-umami-id').value.trim() : '') || '';
      var newUrl = (PR.$('#cfg-umami-url') ? PR.$('#cfg-umami-url').value.trim() : '') || 'https://umami.is';
      if (newId) {
        localStorage.setItem('pr-umami-id', newId);
        localStorage.setItem('pr-umami-url', newUrl);
        PR.toast('统计已启用，刷新后生效');
      } else {
        localStorage.removeItem('pr-umami-id');
        localStorage.removeItem('pr-umami-url');
        PR.toast('统计已关闭');
      }
    });
  };

})(window.PR);
